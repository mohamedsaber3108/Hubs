'use strict';
const { Op, fn, col } = require('sequelize');
const {
  Post, PostComment, Community, Event, Challenge,
  ChallengeSubmission, Opportunity, Resource, Group,
  User, ActivityLog,
} = require('../models');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { paginate } = require('../utils/paginate');
const logger = require('../utils/logger');

async function logAction(adminId, action, req, extra) {
  try { await ActivityLog.create({ admin_id: adminId, action, ip_address: req.ip, ...extra }); }
  catch (e) { logger.warn('Log error: ' + e.message); }
}

// ─── Posts ────────────────────────────────────────────────────────────────────
const listPosts = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { search, community, status = 'all', type } = req.query;
    const where = {};
    if (status === 'published')   where.is_published = true;
    if (status === 'unpublished') where.is_published = false;
    if (type)      where.type = type;
    if (community) {
      const comm = await Community.findOne({ where: { slug: community } });
      if (comm) where.community_id = comm.id;
    }
    if (search) where[Op.or] = [{ content: { [Op.like]: '%' + search + '%' } }];

    const { count, rows } = await Post.findAndCountAll({
      where, limit, offset, order: [['created_at', 'DESC']],
      include: [
        { model: User, as: 'author', attributes: ['id','first_name','last_name','username','avatar_url'] },
        { model: Community, as: 'community', attributes: ['id','slug','name','emoji'] },
      ],
    });
    return ApiResponse.paginated(res, rows, { page, limit, total: count });
  } catch (err) { next(err); }
};

const getPost = async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [
        { model: User, as: 'author', attributes: ['id','first_name','last_name','username'] },
        { model: Community, as: 'community', attributes: ['id','slug','name'] },
        { model: PostComment, as: 'comments', where: { is_deleted: false }, required: false,
          include: [{ model: User, as: 'author', attributes: ['id','first_name','last_name','username'] }] },
      ],
    });
    if (!post) return next(ApiError.notFound('Post not found'));
    return ApiResponse.success(res, { post });
  } catch (err) { next(err); }
};

const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return next(ApiError.notFound('Post not found'));
    const old = { is_published: post.is_published, is_pinned: post.is_pinned };
    await post.update(req.body);
    await logAction(req.admin.id, 'admin_update_post', req, { entity_type: 'post', entity_id: post.id, old_value: old, new_value: req.body });
    return ApiResponse.success(res, { post }, 'Post updated');
  } catch (err) { next(err); }
};

const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return next(ApiError.notFound('Post not found'));
    await post.update({ is_published: false });
    await logAction(req.admin.id, 'admin_delete_post', req, { entity_type: 'post', entity_id: post.id });
    return ApiResponse.success(res, null, 'Post removed');
  } catch (err) { next(err); }
};

const pinPost = async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return next(ApiError.notFound('Post not found'));
    await post.update({ is_pinned: !post.is_pinned });
    return ApiResponse.success(res, { is_pinned: post.is_pinned }, post.is_pinned ? 'Post pinned' : 'Post unpinned');
  } catch (err) { next(err); }
};

const deleteComment = async (req, res, next) => {
  try {
    const comment = await PostComment.findByPk(req.params.id);
    if (!comment) return next(ApiError.notFound('Comment not found'));
    await comment.update({ is_deleted: true });
    await logAction(req.admin.id, 'admin_delete_comment', req, { entity_type: 'comment', entity_id: comment.id });
    return ApiResponse.success(res, null, 'Comment removed');
  } catch (err) { next(err); }
};

// ─── Communities ──────────────────────────────────────────────────────────────
const listCommunities = async (req, res, next) => {
  try {
    const communities = await Community.findAll({ order: [['sort_order','ASC'],['id','ASC']] });
    return ApiResponse.success(res, { communities });
  } catch (err) { next(err); }
};

const createCommunity = async (req, res, next) => {
  try {
    const existing = await Community.findOne({ where: { slug: req.body.slug } });
    if (existing) return next(ApiError.conflict('Slug already in use'));
    const community = await Community.create(req.body);
    await logAction(req.admin.id, 'admin_create_community', req, { entity_type: 'community', entity_id: community.id, new_value: { slug: community.slug } });
    return ApiResponse.created(res, { community }, 'Community created');
  } catch (err) { next(err); }
};

const updateCommunity = async (req, res, next) => {
  try {
    const community = await Community.findByPk(req.params.id);
    if (!community) return next(ApiError.notFound('Community not found'));
    await community.update(req.body);
    await logAction(req.admin.id, 'admin_update_community', req, { entity_type: 'community', entity_id: community.id });
    return ApiResponse.success(res, { community }, 'Community updated');
  } catch (err) { next(err); }
};

const toggleCommunity = async (req, res, next) => {
  try {
    const community = await Community.findByPk(req.params.id);
    if (!community) return next(ApiError.notFound('Community not found'));
    await community.update({ is_active: !community.is_active });
    return ApiResponse.success(res, { is_active: community.is_active }, community.is_active ? 'Community enabled' : 'Community disabled');
  } catch (err) { next(err); }
};

// ─── Events (admin view) ──────────────────────────────────────────────────────
const listEvents = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { status, search } = req.query;
    const where = {};
    if (status) where.status = status;
    if (search) where.title = { [Op.like]: '%' + search + '%' };
    const { count, rows } = await Event.findAndCountAll({
      where, limit, offset, order: [['created_at','DESC']],
      include: [{ model: User, as: 'organizer', attributes: ['id','first_name','last_name','username'] }],
    });
    return ApiResponse.paginated(res, rows, { page, limit, total: count });
  } catch (err) { next(err); }
};

const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return next(ApiError.notFound('Event not found'));
    await event.update(req.body);
    await logAction(req.admin.id, 'admin_update_event', req, { entity_type: 'event', entity_id: event.id });
    return ApiResponse.success(res, { event }, 'Event updated');
  } catch (err) { next(err); }
};

const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return next(ApiError.notFound('Event not found'));
    await event.update({ status: 'cancelled' });
    await logAction(req.admin.id, 'admin_cancel_event', req, { entity_type: 'event', entity_id: event.id });
    return ApiResponse.success(res, null, 'Event cancelled');
  } catch (err) { next(err); }
};

// ─── Challenges ───────────────────────────────────────────────────────────────
const listChallenges = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { status } = req.query;
    const where = status ? { status } : {};
    const { count, rows } = await Challenge.findAndCountAll({
      where, limit, offset, order: [['created_at','DESC']],
    });
    return ApiResponse.paginated(res, rows, { page, limit, total: count });
  } catch (err) { next(err); }
};

const updateChallenge = async (req, res, next) => {
  try {
    const challenge = await Challenge.findByPk(req.params.id);
    if (!challenge) return next(ApiError.notFound('Challenge not found'));
    await challenge.update(req.body);
    await logAction(req.admin.id, 'admin_update_challenge', req, { entity_type: 'challenge', entity_id: challenge.id });
    return ApiResponse.success(res, { challenge }, 'Challenge updated');
  } catch (err) { next(err); }
};

// ─── Opportunities ────────────────────────────────────────────────────────────
const listOpportunities = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { status, type } = req.query;
    const where = {};
    if (status) where.status = status;
    if (type)   where.type   = type;
    const { count, rows } = await Opportunity.findAndCountAll({
      where, limit, offset, order: [['created_at','DESC']],
      include: [{ model: User, as: 'poster', attributes: ['id','first_name','last_name','username'] }],
    });
    return ApiResponse.paginated(res, rows, { page, limit, total: count });
  } catch (err) { next(err); }
};

const updateOpportunity = async (req, res, next) => {
  try {
    const opp = await Opportunity.findByPk(req.params.id);
    if (!opp) return next(ApiError.notFound('Opportunity not found'));
    await opp.update(req.body);
    await logAction(req.admin.id, 'admin_update_opportunity', req, { entity_type: 'opportunity', entity_id: opp.id });
    return ApiResponse.success(res, { opportunity: opp }, 'Opportunity updated');
  } catch (err) { next(err); }
};

// ─── Resources ────────────────────────────────────────────────────────────────
const listResources = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { type, is_approved } = req.query;
    const where = {};
    if (type)        where.type = type;
    if (is_approved !== undefined) where.is_approved = is_approved === 'true';
    const { count, rows } = await Resource.findAndCountAll({
      where, limit, offset, order: [['created_at','DESC']],
      include: [{ model: User, as: 'uploader', attributes: ['id','first_name','last_name','username'] }],
    });
    return ApiResponse.paginated(res, rows, { page, limit, total: count });
  } catch (err) { next(err); }
};

const approveResource = async (req, res, next) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    if (!resource) return next(ApiError.notFound('Resource not found'));
    await resource.update({ is_approved: true });
    await logAction(req.admin.id, 'admin_approve_resource', req, { entity_type: 'resource', entity_id: resource.id });
    return ApiResponse.success(res, { is_approved: true }, 'Resource approved');
  } catch (err) { next(err); }
};

const deleteResource = async (req, res, next) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    if (!resource) return next(ApiError.notFound('Resource not found'));
    await resource.destroy();
    await logAction(req.admin.id, 'admin_delete_resource', req, { entity_type: 'resource', entity_id: resource.id });
    return ApiResponse.success(res, null, 'Resource deleted');
  } catch (err) { next(err); }
};

// ─── Groups ───────────────────────────────────────────────────────────────────
const listGroups = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { search, community } = req.query;
    const where = {};
    if (search) where.name = { [Op.like]: '%' + search + '%' };
    if (community) {
      const comm = await Community.findOne({ where: { slug: community } });
      if (comm) where.community_id = comm.id;
    }
    const { count, rows } = await Group.findAndCountAll({
      where, limit, offset, order: [['member_count','DESC']],
      include: [
        { model: Community, as: 'community', attributes: ['id','slug','name','emoji'] },
        { model: User, as: 'creator', attributes: ['id','first_name','last_name','username'] },
      ],
    });
    return ApiResponse.paginated(res, rows, { page, limit, total: count });
  } catch (err) { next(err); }
};

const updateGroup = async (req, res, next) => {
  try {
    const group = await Group.findByPk(req.params.id);
    if (!group) return next(ApiError.notFound('Group not found'));
    await group.update(req.body);
    await logAction(req.admin.id, 'admin_update_group', req, { entity_type: 'group', entity_id: group.id });
    return ApiResponse.success(res, { group }, 'Group updated');
  } catch (err) { next(err); }
};

const deleteGroup = async (req, res, next) => {
  try {
    const group = await Group.findByPk(req.params.id);
    if (!group) return next(ApiError.notFound('Group not found'));
    await group.destroy();
    await logAction(req.admin.id, 'admin_delete_group', req, { entity_type: 'group', entity_id: group.id });
    return ApiResponse.success(res, null, 'Group deleted');
  } catch (err) { next(err); }
};

module.exports = {
  listPosts, getPost, updatePost, deletePost, pinPost, deleteComment,
  listCommunities, createCommunity, updateCommunity, toggleCommunity,
  listEvents, updateEvent, deleteEvent,
  listChallenges, updateChallenge,
  listOpportunities, updateOpportunity,
  listResources, approveResource, deleteResource,
  listGroups, updateGroup, deleteGroup,
};
