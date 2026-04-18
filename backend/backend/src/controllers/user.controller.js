'use strict';
const bcrypt  = require('bcrypt');
const { User, Session, Notification, UserSkill, UserExperience, UserEducation, Follow, OAuthAccount } = require('../models');
const { uploadAvatar } = require('../services/s3.service');
const { revokeAllUserTokens } = require('../services/redis.service');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { paginate, paginationMeta } = require('../utils/paginate');

// GET /users/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { id: req.user.id },
      attributes: { exclude: ['password_hash'] },
      include: [
        { model: UserSkill,      as: 'skills' },
        { model: UserExperience, as: 'experiences' },
        { model: UserEducation,  as: 'education' },
        { model: OAuthAccount,   as: 'oauthAccounts', attributes: ['provider'] },
      ],
    });
    return ApiResponse.success(res, { user });
  } catch (err) { next(err); }
};

// PUT /users/me
const updateMe = async (req, res, next) => {
  try {
    const { username } = req.body;
    if (username) {
      const taken = await User.findOne({ where: { username } });
      if (taken && taken.id !== req.user.id) return next(ApiError.conflict('Username already taken'));
    }
    // Whitelist only safe fields — never allow role, status, email_verified, is_deleted, etc.
    const allowed = [
      'first_name', 'last_name', 'username', 'bio', 'headline',
      'location', 'website', 'avatar_url', 'cover_url',
    ];
    const updates = {};
    allowed.forEach((key) => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });
    if (Object.keys(updates).length === 0) return next(ApiError.badRequest('No valid fields to update'));
    await User.update(updates, { where: { id: req.user.id } });
    const updated = await User.findByPk(req.user.id, { attributes: { exclude: ['password_hash'] } });
    return ApiResponse.success(res, { user: updated }, 'Profile updated');
  } catch (err) { next(err); }
};

// DELETE /users/me
const deleteMe = async (req, res, next) => {
  try {
    await User.update({
      is_deleted: true, deleted_at: new Date(),
      email: 'deleted_' + req.user.id + '@deleted.usam',
    }, { where: { id: req.user.id } });
    await Session.update({ is_revoked: true }, { where: { user_id: req.user.id } });
    await revokeAllUserTokens(req.user.id);
    res.clearCookie('refresh_token');
    return ApiResponse.success(res, null, 'Account scheduled for deletion');
  } catch (err) { next(err); }
};

// POST /users/me/avatar
const uploadAvatarHandler = async (req, res, next) => {
  try {
    if (!req.file) return next(ApiError.badRequest('No file uploaded'));
    const result = await uploadAvatar(req.file, req.user.id);
    await User.update({ avatar_url: result.url }, { where: { id: req.user.id } });
    return ApiResponse.success(res, { avatar_url: result.url }, 'Avatar updated');
  } catch (err) { next(err); }
};

// PUT /users/me/password
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user.password_hash) return next(ApiError.badRequest('No password set — use OAuth'));
    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) return next(ApiError.badRequest('Current password incorrect'));
    const hash = await bcrypt.hash(new_password, 12);
    await user.update({ password_hash: hash });
    await Session.update({ is_revoked: true }, { where: { user_id: user.id } });
    await revokeAllUserTokens(user.id);
    res.clearCookie('refresh_token');
    return ApiResponse.success(res, null, 'Password changed. Please log in again.');
  } catch (err) { next(err); }
};

// GET /users/me/sessions
const getSessions = async (req, res, next) => {
  try {
    const sessions = await Session.findAll({
      where: { user_id: req.user.id, is_revoked: false },
      attributes: ['id', 'ip_address', 'user_agent', 'created_at', 'expires_at'],
      order: [['created_at', 'DESC']],
    });
    return ApiResponse.success(res, { sessions });
  } catch (err) { next(err); }
};

// DELETE /users/me/sessions/:id
const revokeSession = async (req, res, next) => {
  try {
    const session = await Session.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!session) return next(ApiError.notFound('Session not found'));
    await session.update({ is_revoked: true });
    return ApiResponse.success(res, null, 'Session revoked');
  } catch (err) { next(err); }
};

// GET /users/me/notifications
const getNotifications = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { count, rows } = await Notification.findAndCountAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit, offset,
    });
    return ApiResponse.paginated(res, rows, { page, limit, total: count });
  } catch (err) { next(err); }
};

// PUT /users/me/notifications/:id/read
const markNotificationRead = async (req, res, next) => {
  try {
    const notif = await Notification.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!notif) return next(ApiError.notFound('Notification not found'));
    await notif.update({ is_read: true });
    return ApiResponse.success(res, null, 'Notification marked as read');
  } catch (err) { next(err); }
};

// DELETE /users/me/notifications
const clearNotifications = async (req, res, next) => {
  try {
    await Notification.update({ is_read: true }, { where: { user_id: req.user.id } });
    return ApiResponse.success(res, null, 'All notifications marked as read');
  } catch (err) { next(err); }
};

// GET /profile/:username
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { username: req.params.username, is_deleted: false },
      attributes: { exclude: ['password_hash', 'email', 'provider_id'] },
      include: [
        { model: UserSkill,      as: 'skills' },
        { model: UserExperience, as: 'experiences', order: [['start_date', 'DESC']] },
        { model: UserEducation,  as: 'education' },
      ],
    });
    if (!user) return next(ApiError.notFound('User not found'));

    let isFollowing = false;
    if (req.user) {
      const follow = await Follow.findOne({ where: { follower_id: req.user.id, following_id: user.id } });
      isFollowing = !!follow;
    }

    return ApiResponse.success(res, { user, isFollowing });
  } catch (err) { next(err); }
};

// POST /users/:id/follow
const followUser = async (req, res, next) => {
  try {
    const targetId = parseInt(req.params.id);
    if (targetId === req.user.id) return next(ApiError.badRequest('Cannot follow yourself'));

    const target = await User.findOne({ where: { id: targetId, is_deleted: false } });
    if (!target) return next(ApiError.notFound('User not found'));

    const [, created] = await Follow.findOrCreate({ where: { follower_id: req.user.id, following_id: targetId } });
    if (created) {
      await User.increment('followers_count', { where: { id: targetId } });
      await User.increment('following_count', { where: { id: req.user.id } });
    }

    return ApiResponse.success(res, { following: true }, created ? 'Now following' : 'Already following');
  } catch (err) { next(err); }
};

// DELETE /users/:id/follow
const unfollowUser = async (req, res, next) => {
  try {
    const targetId = parseInt(req.params.id);
    const deleted  = await Follow.destroy({ where: { follower_id: req.user.id, following_id: targetId } });
    if (deleted) {
      await User.decrement('followers_count', { where: { id: targetId } });
      await User.decrement('following_count', { where: { id: req.user.id } });
    }
    return ApiResponse.success(res, { following: false }, 'Unfollowed');
  } catch (err) { next(err); }
};

// Skills
const addSkill = async (req, res, next) => {
  try {
    const skill = await UserSkill.create({ user_id: req.user.id, ...req.body });
    return ApiResponse.created(res, { skill });
  } catch (err) { next(err); }
};

const deleteSkill = async (req, res, next) => {
  try {
    const skill = await UserSkill.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!skill) return next(ApiError.notFound('Skill not found'));
    await skill.destroy();
    return ApiResponse.success(res, null, 'Skill removed');
  } catch (err) { next(err); }
};

// Experience
const addExperience = async (req, res, next) => {
  try {
    const exp = await UserExperience.create({ user_id: req.user.id, ...req.body });
    return ApiResponse.created(res, { experience: exp });
  } catch (err) { next(err); }
};

const updateExperience = async (req, res, next) => {
  try {
    const exp = await UserExperience.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!exp) return next(ApiError.notFound('Experience not found'));
    await exp.update(req.body);
    return ApiResponse.success(res, { experience: exp });
  } catch (err) { next(err); }
};

const deleteExperience = async (req, res, next) => {
  try {
    const exp = await UserExperience.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!exp) return next(ApiError.notFound('Experience not found'));
    await exp.destroy();
    return ApiResponse.success(res, null, 'Experience removed');
  } catch (err) { next(err); }
};

// Education
const addEducation = async (req, res, next) => {
  try {
    const edu = await UserEducation.create({ user_id: req.user.id, ...req.body });
    return ApiResponse.created(res, { education: edu });
  } catch (err) { next(err); }
};

const deleteEducation = async (req, res, next) => {
  try {
    const edu = await UserEducation.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!edu) return next(ApiError.notFound('Education not found'));
    await edu.destroy();
    return ApiResponse.success(res, null, 'Education removed');
  } catch (err) { next(err); }
};

module.exports = {
  getMe, updateMe, deleteMe, uploadAvatarHandler, changePassword,
  getSessions, revokeSession,
  getNotifications, markNotificationRead, clearNotifications,
  getProfile, followUser, unfollowUser,
  addSkill, deleteSkill,
  addExperience, updateExperience, deleteExperience,
  addEducation, deleteEducation,
};
