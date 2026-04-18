'use strict';
const bcrypt = require('bcrypt');
const { Op }  = require('sequelize');
const {
  User, Session, CommunityMembership, ActivityLog,
  Post, Follow, UserSkill, UserExperience, UserEducation,
} = require('../models');
const { enqueuePasswordReset } = require('../jobs/email.job');
const { revokeAllUserTokens }  = require('../services/redis.service');
const { generateRandomToken, hashToken } = require('../utils/token');
const { PasswordReset } = require('../models');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { paginate, paginationMeta } = require('../utils/paginate');
const logger = require('../utils/logger');

async function logAction(adminId, userId, action, req, oldVal, newVal) {
  try {
    await ActivityLog.create({
      admin_id: adminId, user_id: userId, action,
      entity_type: 'user', entity_id: userId,
      old_value: oldVal || null, new_value: newVal || null,
      ip_address: req.ip,
    });
  } catch (e) { logger.warn('Activity log error: ' + e.message); }
}

// ─── List users ───────────────────────────────────────────────────────────────
const listUsers = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { search, role, status, community, sort = 'created_at', order = 'DESC' } = req.query;

    const where = { is_deleted: false };
    if (role)   where.role   = role;
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { first_name: { [Op.like]: '%' + search + '%' } },
        { last_name:  { [Op.like]: '%' + search + '%' } },
        { username:   { [Op.like]: '%' + search + '%' } },
        { email:      { [Op.like]: '%' + search + '%' } },
      ];
    }

    const include = [];
    if (community) {
      const { Community } = require('../models');
      const comm = await Community.findOne({ where: { slug: community } });
      if (comm) {
        include.push({
          model: CommunityMembership, as: 'communities', required: true,
          where: { community_id: comm.id }, attributes: [],
        });
      }
    }

    const allowedSort = ['created_at','last_login','first_name','email','points_total'];
    const sortCol = allowedSort.includes(sort) ? sort : 'created_at';

    const { count, rows } = await User.findAndCountAll({
      where, include, limit, offset,
      attributes: { exclude: ['password_hash', 'provider_id'] },
      order: [[sortCol, order === 'ASC' ? 'ASC' : 'DESC']],
    });

    return ApiResponse.paginated(res, rows, { page, limit, total: count });
  } catch (err) { next(err); }
};

// ─── Get single user ──────────────────────────────────────────────────────────
const getUser = async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { id: req.params.id, is_deleted: false },
      attributes: { exclude: ['password_hash'] },
      include: [
        { model: UserSkill,      as: 'skills' },
        { model: UserExperience, as: 'experiences' },
        { model: UserEducation,  as: 'education' },
        { model: CommunityMembership, as: 'communities' },
      ],
    });
    if (!user) return next(ApiError.notFound('User not found'));

    const [postCount, followerCount, followingCount, sessionCount] = await Promise.all([
      Post.count({ where: { user_id: user.id, is_published: true } }),
      Follow.count({ where: { following_id: user.id } }),
      Follow.count({ where: { follower_id: user.id } }),
      Session.count({ where: { user_id: user.id, is_revoked: false } }),
    ]);

    return ApiResponse.success(res, {
      user, stats: { posts: postCount, followers: followerCount, following: followingCount, active_sessions: sessionCount },
    });
  } catch (err) { next(err); }
};

// ─── Create user ──────────────────────────────────────────────────────────────
const createUser = async (req, res, next) => {
  try {
    const { email, username, password, ...rest } = req.body;
    const [existingEmail, existingUsername] = await Promise.all([
      User.findOne({ where: { email } }),
      User.findOne({ where: { username } }),
    ]);
    if (existingEmail)    return next(ApiError.conflict('Email already exists'));
    if (existingUsername) return next(ApiError.conflict('Username already taken'));

    const password_hash = await bcrypt.hash(password || 'Temp@1234!', 12);
    const user = await User.create({ email, username, password_hash, email_verified: true, ...rest });
    await logAction(req.admin.id, user.id, 'admin_create_user', req, null, { email });
    return ApiResponse.created(res, { user: { id: user.id, email: user.email, username: user.username } });
  } catch (err) { next(err); }
};

// ─── Update user ──────────────────────────────────────────────────────────────
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id, is_deleted: false } });
    if (!user) return next(ApiError.notFound('User not found'));
    const old = user.toJSON();
    await user.update(req.body);
    await logAction(req.admin.id, user.id, 'admin_update_user', req, old, req.body);
    return ApiResponse.success(res, { user }, 'User updated');
  } catch (err) { next(err); }
};

// ─── Delete user ──────────────────────────────────────────────────────────────
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id, is_deleted: false } });
    if (!user) return next(ApiError.notFound('User not found'));
    await user.update({
      is_deleted: true, deleted_at: new Date(),
      email: 'deleted_admin_' + user.id + '_' + Date.now() + '@deleted.usam',
    });
    await Session.update({ is_revoked: true }, { where: { user_id: user.id } });
    await revokeAllUserTokens(user.id);
    await logAction(req.admin.id, user.id, 'admin_delete_user', req, { email: user.email }, null);
    return ApiResponse.success(res, null, 'User deleted');
  } catch (err) { next(err); }
};

// ─── Update status ────────────────────────────────────────────────────────────
const updateStatus = async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id, is_deleted: false } });
    if (!user) return next(ApiError.notFound('User not found'));
    const old = { status: user.status };
    await user.update({ status: req.body.status });
    if (req.body.status !== 'active') {
      await Session.update({ is_revoked: true }, { where: { user_id: user.id } });
      await revokeAllUserTokens(user.id);
    }
    await logAction(req.admin.id, user.id, 'admin_update_status', req, old, { status: req.body.status });
    return ApiResponse.success(res, { status: req.body.status }, 'Status updated');
  } catch (err) { next(err); }
};

// ─── Update role ──────────────────────────────────────────────────────────────
const updateRole = async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id, is_deleted: false } });
    if (!user) return next(ApiError.notFound('User not found'));
    const old = { role: user.role };
    await user.update({ role: req.body.role });
    await logAction(req.admin.id, user.id, 'admin_update_role', req, old, { role: req.body.role });
    return ApiResponse.success(res, { role: req.body.role }, 'Role updated');
  } catch (err) { next(err); }
};

// ─── Force password reset ─────────────────────────────────────────────────────
const forcePasswordReset = async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id, is_deleted: false } });
    if (!user) return next(ApiError.notFound('User not found'));

    const rawToken   = generateRandomToken();
    const token_hash = hashToken(rawToken);
    const expires_at = new Date(Date.now() + 60 * 60 * 1000);

    await PasswordReset.create({ email: user.email, token_hash, expires_at });
    const resetUrl = (process.env.FRONTEND_URL || 'http://localhost:5173') + '/auth/reset-password?token=' + rawToken;
    await enqueuePasswordReset(user, resetUrl);

    await Session.update({ is_revoked: true }, { where: { user_id: user.id } });
    await revokeAllUserTokens(user.id);

    await logAction(req.admin.id, user.id, 'admin_force_password_reset', req, null, { email: user.email });
    return ApiResponse.success(res, null, 'Password reset email sent');
  } catch (err) { next(err); }
};

// ─── User activity ────────────────────────────────────────────────────────────
const getUserActivity = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { count, rows } = await ActivityLog.findAndCountAll({
      where: { user_id: req.params.id },
      order: [['created_at', 'DESC']],
      limit, offset,
    });
    return ApiResponse.paginated(res, rows, { page, limit, total: count });
  } catch (err) { next(err); }
};

module.exports = {
  listUsers, getUser, createUser, updateUser, deleteUser,
  updateStatus, updateRole, forcePasswordReset, getUserActivity,
};
