'use strict';
const { Community, CommunityMembership, User } = require('../models');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

const getAll = async (req, res, next) => {
  try {
    const communities = await Community.findAll({ where: { is_active: true }, order: [['sort_order', 'ASC'], ['id', 'ASC']] });
    return ApiResponse.success(res, { communities });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const community = await Community.findOne({ where: { slug: req.params.slug, is_active: true } });
    if (!community) return next(ApiError.notFound('Community not found'));
    let membership = null;
    if (req.user) {
      membership = await CommunityMembership.findOne({ where: { user_id: req.user.id, community_id: community.id } });
    }
    return ApiResponse.success(res, { community, membership });
  } catch (err) { next(err); }
};

const join = async (req, res, next) => {
  try {
    const community = await Community.findOne({ where: { slug: req.params.slug } });
    if (!community) return next(ApiError.notFound('Community not found'));
    const [, created] = await CommunityMembership.findOrCreate({
      where: { user_id: req.user.id, community_id: community.id },
      defaults: { role: 'member' },
    });
    if (created) await Community.increment('members_count', { where: { id: community.id } });
    return ApiResponse.success(res, { joined: true }, created ? 'Joined community' : 'Already a member');
  } catch (err) { next(err); }
};

const leave = async (req, res, next) => {
  try {
    const community = await Community.findOne({ where: { slug: req.params.slug } });
    if (!community) return next(ApiError.notFound('Community not found'));
    const deleted = await CommunityMembership.destroy({ where: { user_id: req.user.id, community_id: community.id } });
    if (deleted) await Community.decrement('members_count', { where: { id: community.id } });
    return ApiResponse.success(res, { joined: false }, 'Left community');
  } catch (err) { next(err); }
};

const getMembers = async (req, res, next) => {
  try {
    const community = await Community.findOne({ where: { slug: req.params.slug } });
    if (!community) return next(ApiError.notFound('Community not found'));
    const members = await CommunityMembership.findAll({
      where: { community_id: community.id },
      include: [{ model: User, as: 'user', attributes: ['id','first_name','last_name','username','avatar_url','headline'] }],
      limit: 20, offset: 0,
    });
    return ApiResponse.success(res, { members: members.map((m) => ({ ...m.user.toJSON(), role: m.role })) });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, join, leave, getMembers };
