'use strict';
const { Op } = require('sequelize');
const { User, Post, Event, Challenge, Opportunity, Resource, Group, Community, Mentor } = require('../models');
const ApiResponse = require('../utils/ApiResponse');
const ApiError    = require('../utils/ApiError');

// GET /search?q=&type=all|users|posts|events|...
const globalSearch = async (req, res, next) => {
  try {
    const { q, type = 'all', limit = 5 } = req.query;
    if (!q || q.trim().length < 2) return next(ApiError.badRequest('Search query must be at least 2 characters'));
    const maxLimit = Math.min(parseInt(limit), 20);
    const like = { [Op.like]: '%' + q + '%' };

    const results = {};

    if (type === 'all' || type === 'users') {
      results.users = await User.findAll({
        where: { is_deleted: false, status: 'active', [Op.or]: [
          { first_name: like }, { last_name: like }, { username: like }, { headline: like },
        ]},
        attributes: ['id','first_name','last_name','username','avatar_url','headline'],
        limit: maxLimit,
      });
    }

    if (type === 'all' || type === 'posts') {
      results.posts = await Post.findAll({
        where: { is_published: true, content: like },
        attributes: ['id','content','type','likes_count','comments_count','created_at'],
        include: [{ model: User, as: 'author', attributes: ['id','first_name','last_name','username','avatar_url'] }],
        limit: maxLimit,
        order: [['likes_count','DESC']],
      });
    }

    // BUG-08: globalSearch referenced many columns that don't exist on
    // their models (Event.type, Event.cover_image; Group.visibility,
    // Group.cover_image, Group.members_count; Challenge.end_date;
    // Opportunity.location_type, Opportunity.is_featured;
    // Resource.type, Resource.avg_rating, Resource.downloads_count),
    // which made every search request 500. Corrected to the real
    // columns (Event.cover_url, Event.start_date is real; Group.type,
    // Group.cover_url, Group.member_count; Challenge.deadline;
    // Opportunity has neither location_type nor is_featured, dropped;
    // Resource.category, Resource.rating_avg, Resource.download_count).
    if (type === 'all' || type === 'events') {
      results.events = await Event.findAll({
        where: { [Op.or]: [{ title: like }, { description: like }] },
        attributes: ['id','title','start_date','attendees_count','cover_url'],
        include: [{ model: Community, as: 'community', attributes: ['id','slug','name','emoji'] }],
        limit: maxLimit,
        order: [['start_date','ASC']],
      });
    }

    if (type === 'all' || type === 'groups') {
      results.groups = await Group.findAll({
        where: { type: { [Op.ne]: 'private' }, [Op.or]: [{ name: like }, { description: like }] },
        attributes: ['id','name','cover_url','member_count','type'],
        include: [{ model: Community, as: 'community', attributes: ['id','slug','name','emoji'] }],
        limit: maxLimit,
      });
    }

    if (type === 'all' || type === 'challenges') {
      results.challenges = await Challenge.findAll({
        where: { status: { [Op.in]: ['active','upcoming'] }, [Op.or]: [{ title: like }, { description: like }] },
        attributes: ['id','title','type','status','deadline','prizes'],
        limit: maxLimit,
      });
    }

    if (type === 'all' || type === 'opportunities') {
      results.opportunities = await Opportunity.findAll({
        where: { status: 'open', [Op.or]: [{ title: like }, { company: like }, { description: like }] },
        attributes: ['id','title','type','company'],
        limit: maxLimit,
        order: [['created_at','DESC']],
      });
    }

    if (type === 'all' || type === 'resources') {
      results.resources = await Resource.findAll({
        where: { is_approved: true, [Op.or]: [{ title: like }, { description: like }] },
        attributes: ['id','title','category','rating_avg','download_count','is_free'],
        limit: maxLimit,
        order: [['download_count','DESC']],
      });
    }

    if (type === 'all' || type === 'mentors') {
      const matchingUsers = await User.findAll({
        where: { [Op.or]: [{ first_name: like }, { last_name: like }, { username: like }] },
        attributes: ['id'], limit: 50,
      });
      results.mentors = await Mentor.findAll({
        where: {
          is_approved: true,
          [Op.or]: [
            { expertise: like },
            { user_id: { [Op.in]: matchingUsers.map((u) => u.id) } },
          ],
        },
        include: [{ model: User, as: 'user', attributes: ['id','first_name','last_name','username','avatar_url','headline'] }],
        limit: maxLimit,
      });
    }

    // Count total results
    const totalHits = Object.values(results).reduce((sum, arr) => sum + (arr ? arr.length : 0), 0);

    return ApiResponse.success(res, { results, total_hits: totalHits, query: q, type });
  } catch (err) { next(err); }
};

// GET /search/communities — community-scoped search
const searchInCommunity = async (req, res, next) => {
  try {
    const { q, community, type } = req.query;
    if (!q || q.length < 2) return next(ApiError.badRequest('Query too short'));
    const comm = community ? await Community.findOne({ where: { slug: community } }) : null;
    const communityFilter = comm ? { community_id: comm.id } : {};
    const like = { [Op.like]: '%' + q + '%' };
    const results = {};

    results.posts = await Post.findAll({
      where: { is_published: true, ...communityFilter, content: like },
      limit: 10, order: [['created_at','DESC']],
      include: [{ model: User, as: 'author', attributes: ['id','first_name','last_name','username','avatar_url'] }],
    });

    return ApiResponse.success(res, { results, query: q, community });
  } catch (err) { next(err); }
};

module.exports = { globalSearch, searchInCommunity };
