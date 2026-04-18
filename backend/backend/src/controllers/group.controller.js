'use strict';
const { Op } = require('sequelize');
const { Group, GroupMember, Community, User, Post } = require('../models');
const { uploadFile } = require('../services/s3.service');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { paginate } = require('../utils/paginate');

const userAttrs = ['id','first_name','last_name','username','avatar_url','headline'];

// GET /groups
const listGroups = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { community, search, type = 'all' } = req.query;
    const where = {};
    if (search) where.name = { [Op.like]: '%' + search + '%' };
    if (type === 'public')  where.type = 'public';
    if (type === 'private') where.type = 'private';
    if (community) {
      const comm = await Community.findOne({ where: { slug: community } });
      if (comm) where.community_id = comm.id;
    }
    const { count, rows } = await Group.findAndCountAll({
      where, limit, offset,
      order: [['member_count','DESC'],['created_at','DESC']],
      include: [
        { model: Community, as: 'community', attributes: ['id','slug','name','emoji'] },
        { model: User, as: 'creator', attributes: userAttrs },
      ],
    });
    // Attach membership status
    const data = req.user ? await Promise.all(rows.map(async (g) => {
      const m = await GroupMember.findOne({ where: { group_id: g.id, user_id: req.user.id } });
      return { ...g.toJSON(), membership: m ? m.status : null };
    })) : rows.map((g) => g.toJSON());
    return ApiResponse.paginated(res, data, { page, limit, total: count });
  } catch (err) { next(err); }
};

// GET /groups/:id
const getGroup = async (req, res, next) => {
  try {
    const group = await Group.findByPk(req.params.id, {
      include: [
        { model: Community, as: 'community', attributes: ['id','slug','name','emoji'] },
        { model: User, as: 'creator', attributes: userAttrs },
      ],
    });
    if (!group) return next(ApiError.notFound('Group not found'));
    if (group.type === 'private') {
      if (!req.user) return next(ApiError.unauthorized('Login required'));
      const m = await GroupMember.findOne({ where: { group_id: group.id, user_id: req.user.id, status: 'approved' } });
      if (!m) return next(ApiError.forbidden('You are not a member of this group'));
    }
    let membership = null;
    if (req.user) {
      membership = await GroupMember.findOne({ where: { group_id: group.id, user_id: req.user.id } });
    }
    return ApiResponse.success(res, { group, membership });
  } catch (err) { next(err); }
};

// POST /groups
const createGroup = async (req, res, next) => {
  try {
    const { name, description, community_slug, visibility, tags } = req.body;
    const community = await Community.findOne({ where: { slug: community_slug } });
    if (!community) return next(ApiError.notFound('Community not found'));

    let cover_image = null;
    if (req.file) {
      const r = await uploadFile(req.file, 'groups');
      cover_image = r.url;
    }
    const group = await Group.create({
      name, description, community_id: community.id,
      created_by: req.user.id, type: visibility || 'public',
      cover_url: cover_image, tags: tags || [],
    });
    await GroupMember.create({ group_id: group.id, user_id: req.user.id, role: 'admin', status: 'approved' });
    await Group.increment('member_count', { where: { id: group.id } });
    return ApiResponse.created(res, { group }, 'Group created');
  } catch (err) { next(err); }
};

// PUT /groups/:id
const updateGroup = async (req, res, next) => {
  try {
    const group = await Group.findByPk(req.params.id);
    if (!group) return next(ApiError.notFound('Group not found'));
    const m = await GroupMember.findOne({ where: { group_id: group.id, user_id: req.user.id, role: 'admin', status: 'approved' } });
    if (!m && req.user.role !== 'admin') return next(ApiError.forbidden('Group admin only'));
    if (req.file) {
      const r = await uploadFile(req.file, 'groups');
      req.body.cover_url = r.url;
    }
    await group.update(req.body);
    return ApiResponse.success(res, { group }, 'Group updated');
  } catch (err) { next(err); }
};

// DELETE /groups/:id
const deleteGroup = async (req, res, next) => {
  try {
    const group = await Group.findByPk(req.params.id);
    if (!group) return next(ApiError.notFound('Group not found'));
    const isCreator = group.created_by === req.user.id;
    if (!isCreator && req.user.role !== 'admin') return next(ApiError.forbidden('Group creator only'));
    await group.destroy();
    return ApiResponse.success(res, null, 'Group deleted');
  } catch (err) { next(err); }
};

// POST /groups/:id/join
const joinGroup = async (req, res, next) => {
  try {
    const group = await Group.findByPk(req.params.id);
    if (!group) return next(ApiError.notFound('Group not found'));
    const existing = await GroupMember.findOne({ where: { group_id: group.id, user_id: req.user.id } });
    if (existing) return ApiResponse.success(res, { status: existing.status }, 'Already ' + existing.status);
    const status = group.type === 'invite_only' ? 'pending' : 'approved';
    const member = await GroupMember.create({ group_id: group.id, user_id: req.user.id, role: 'member', status });
    if (status === 'approved') await Group.increment('member_count', { where: { id: group.id } });
    return ApiResponse.success(res, { status: member.status }, status === 'approved' ? 'Joined group' : 'Join request sent');
  } catch (err) { next(err); }
};

// DELETE /groups/:id/join
const leaveGroup = async (req, res, next) => {
  try {
    const deleted = await GroupMember.destroy({ where: { group_id: req.params.id, user_id: req.user.id } });
    if (deleted) await Group.decrement('member_count', { where: { id: req.params.id } });
    return ApiResponse.success(res, null, 'Left group');
  } catch (err) { next(err); }
};

// GET /groups/:id/members
const getMembers = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { status = 'approved' } = req.query;
    const { count, rows } = await GroupMember.findAndCountAll({
      where: { group_id: req.params.id, status },
      limit, offset, order: [['role','ASC'],['created_at','ASC']],
      include: [{ model: User, as: 'user', attributes: userAttrs }],
    });
    return ApiResponse.paginated(res, rows, { page, limit, total: count });
  } catch (err) { next(err); }
};

// PATCH /groups/:id/members/:userId
const updateMember = async (req, res, next) => {
  try {
    const group  = await Group.findByPk(req.params.id);
    if (!group) return next(ApiError.notFound('Group not found'));
    const admin  = await GroupMember.findOne({ where: { group_id: group.id, user_id: req.user.id, role: 'admin' } });
    if (!admin && req.user.role !== 'admin') return next(ApiError.forbidden('Group admin only'));
    const member = await GroupMember.findOne({ where: { group_id: group.id, user_id: req.params.userId } });
    if (!member) return next(ApiError.notFound('Member not found'));
    const wasApproved = member.status === 'approved';
    await member.update(req.body);
    if (!wasApproved && member.status === 'approved') await Group.increment('member_count', { where: { id: group.id } });
    if (wasApproved && member.status === 'rejected') await Group.decrement('member_count', { where: { id: group.id } });
    return ApiResponse.success(res, { member }, 'Member updated');
  } catch (err) { next(err); }
};

// DELETE /groups/:id/members/:userId
const removeMember = async (req, res, next) => {
  try {
    const group = await Group.findByPk(req.params.id);
    if (!group) return next(ApiError.notFound('Group not found'));
    const admin = await GroupMember.findOne({ where: { group_id: group.id, user_id: req.user.id, role: 'admin' } });
    if (!admin && req.user.role !== 'admin') return next(ApiError.forbidden('Group admin only'));
    const deleted = await GroupMember.destroy({ where: { group_id: group.id, user_id: req.params.userId } });
    if (deleted) await Group.decrement('member_count', { where: { id: group.id } });
    return ApiResponse.success(res, null, 'Member removed');
  } catch (err) { next(err); }
};

// GET /groups/:id/posts
const getGroupPosts = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { count, rows } = await Post.findAndCountAll({
      where: { group_id: req.params.id, is_published: true },
      include: [{ model: User, as: 'author', attributes: userAttrs }],
      order: [['created_at','DESC']], limit, offset,
    });
    return ApiResponse.paginated(res, rows, { page, limit, total: count });
  } catch (err) { next(err); }
};

module.exports = { listGroups, getGroup, createGroup, updateGroup, deleteGroup, joinGroup, leaveGroup, getMembers, updateMember, removeMember, getGroupPosts };
