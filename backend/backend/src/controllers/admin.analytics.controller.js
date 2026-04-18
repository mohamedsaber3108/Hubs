'use strict';
const { Op, fn, col, literal } = require('sequelize');
const {
  User, Post, Event, Challenge, ChallengeSubmission,
  Opportunity, OpportunityApplication, Resource,
  CommunityMembership, Community, LeaderboardPoint,
  MentorRequest, Subscription,
} = require('../models');
const ApiResponse = require('../utils/ApiResponse');

const buildDateRange = (req) => {
  const period = req.query.period || 'month';
  const now    = new Date();
  let since;
  if (period === 'day')   since = new Date(now - 1  * 24 * 60 * 60 * 1000);
  if (period === 'week')  since = new Date(now - 7  * 24 * 60 * 60 * 1000);
  if (period === 'month') since = new Date(now - 30 * 24 * 60 * 60 * 1000);
  if (period === 'year')  since = new Date(now - 365 * 24 * 60 * 60 * 1000);
  if (req.query.start_date) since = new Date(req.query.start_date);
  const until = req.query.end_date ? new Date(req.query.end_date) : now;
  return { since, until };
};

// ─── User analytics ───────────────────────────────────────────────────────────
const getUserAnalytics = async (req, res, next) => {
  try {
    const { since, until } = buildDateRange(req);

    const [
      total, newUsers, verified, byRole, byStatus, topCountries,
    ] = await Promise.all([
      User.count({ where: { is_deleted: false } }),
      User.count({ where: { created_at: { [Op.between]: [since, until] }, is_deleted: false } }),
      User.count({ where: { email_verified: true, is_deleted: false } }),
      User.findAll({ attributes: ['role', [fn('COUNT', col('id')), 'count']], where: { is_deleted: false }, group: ['role'], raw: true }),
      User.findAll({ attributes: ['status', [fn('COUNT', col('id')), 'count']], where: { is_deleted: false }, group: ['status'], raw: true }),
      User.findAll({ attributes: ['location', [fn('COUNT', col('id')), 'count']], where: { is_deleted: false, location: { [Op.ne]: null } }, group: ['location'], order: [[fn('COUNT', col('id')), 'DESC']], limit: 10, raw: true }),
    ]);

    const registrations_over_time = await User.findAll({
      attributes: [[fn('DATE', col('created_at')), 'date'], [fn('COUNT', col('id')), 'count']],
      where: { created_at: { [Op.between]: [since, until] }, is_deleted: false },
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true,
    });

    return ApiResponse.success(res, {
      total, new_in_period: newUsers, verified_pct: total > 0 ? ((verified/total)*100).toFixed(1) : 0,
      by_role: byRole, by_status: byStatus, top_locations: topCountries,
      registrations_over_time, period: req.query.period || 'month',
    });
  } catch (err) { next(err); }
};

// ─── Content analytics ────────────────────────────────────────────────────────
const getContentAnalytics = async (req, res, next) => {
  try {
    const { since, until } = buildDateRange(req);
    const dateFilter = { created_at: { [Op.between]: [since, until] } };

    const [
      totalPosts, newPosts, totalEvents, totalChallenges,
      totalOpportunities, totalResources, byPostType,
      postsOverTime,
    ] = await Promise.all([
      Post.count({ where: { is_published: true } }),
      Post.count({ where: { ...dateFilter, is_published: true } }),
      Event.count(),
      Challenge.count(),
      Opportunity.count(),
      Resource.count(),
      Post.findAll({ attributes: ['type', [fn('COUNT', col('id')), 'count']], where: { is_published: true }, group: ['type'], raw: true }),
      Post.findAll({
        attributes: [[fn('DATE', col('created_at')), 'date'], [fn('COUNT', col('id')), 'count']],
        where: { ...dateFilter, is_published: true },
        group: [fn('DATE', col('created_at'))],
        order: [[fn('DATE', col('created_at')), 'ASC']],
        raw: true,
      }),
    ]);

    return ApiResponse.success(res, {
      totals: { posts: totalPosts, events: totalEvents, challenges: totalChallenges, opportunities: totalOpportunities, resources: totalResources },
      new_in_period: { posts: newPosts },
      post_types: byPostType,
      posts_over_time: postsOverTime,
      period: req.query.period || 'month',
    });
  } catch (err) { next(err); }
};

// ─── Community analytics ──────────────────────────────────────────────────────
const getCommunityAnalytics = async (req, res, next) => {
  try {
    const { since, until } = buildDateRange(req);
    const communities = await Community.findAll({ where: { is_active: true } });

    const stats = await Promise.all(communities.map(async (c) => {
      const [totalMembers, newMembers, posts] = await Promise.all([
        CommunityMembership.count({ where: { community_id: c.id } }),
        CommunityMembership.count({ where: { community_id: c.id, created_at: { [Op.between]: [since, until] } } }),
        Post.count({ where: { community_id: c.id, is_published: true, created_at: { [Op.between]: [since, until] } } }),
      ]);
      return { community: { id: c.id, slug: c.slug, name: c.name, emoji: c.emoji }, total_members: totalMembers, new_members: newMembers, posts_in_period: posts };
    }));

    return ApiResponse.success(res, { communities: stats, period: req.query.period || 'month' });
  } catch (err) { next(err); }
};

// ─── Engagement analytics ─────────────────────────────────────────────────────
const getEngagementAnalytics = async (req, res, next) => {
  try {
    const { since, until } = buildDateRange(req);
    const dateFilter = { created_at: { [Op.between]: [since, until] } };

    const [
      challengeSubmissions, opportunityApplications,
      mentorRequests, subscriptions,
    ] = await Promise.all([
      ChallengeSubmission.count({ where: dateFilter }).catch(() => 0),
      OpportunityApplication.count({ where: dateFilter }).catch(() => 0),
      MentorRequest.count({ where: dateFilter }).catch(() => 0),
      Subscription.count({ where: { ...dateFilter, status: 'active' } }).catch(() => 0),
    ]);

    // Top engaged users by points
    const topUsers = await LeaderboardPoint.findAll({
      attributes: ['user_id', [fn('SUM', col('points')), 'total']],
      where: dateFilter,
      group: ['user_id'],
      order: [[fn('SUM', col('points')), 'DESC']],
      limit: 10,
      include: [{ model: User, as: 'user', attributes: ['id','first_name','last_name','username','avatar_url'] }],
    }).catch(() => []);

    return ApiResponse.success(res, {
      challenge_submissions: challengeSubmissions,
      opportunity_applications: opportunityApplications,
      mentor_requests: mentorRequests,
      new_subscriptions: subscriptions,
      top_users: topUsers,
      period: req.query.period || 'month',
    });
  } catch (err) { next(err); }
};

// ─── Revenue analytics ────────────────────────────────────────────────────────
const getRevenueAnalytics = async (req, res, next) => {
  try {
    const { since, until } = buildDateRange(req);

    const [totalActive, byPlan] = await Promise.all([
      Subscription.count({ where: { status: 'active' } }).catch(() => 0),
      Subscription.findAll({
        attributes: ['plan_id', [fn('COUNT', col('Subscription.id')), 'count']],
        where: { status: 'active' },
        group: ['plan_id'],
        include: [{ model: require('../models').PricingPlan, as: 'plan', attributes: ['name','price_monthly'] }],
        raw: false,
      }).catch(() => []),
    ]);

    const newSubs = await Subscription.count({
      where: { created_at: { [Op.between]: [since, until] }, status: 'active' },
    }).catch(() => 0);

    return ApiResponse.success(res, {
      active_subscriptions: totalActive,
      new_in_period: newSubs,
      by_plan: byPlan,
      period: req.query.period || 'month',
    });
  } catch (err) { next(err); }
};

module.exports = {
  getUserAnalytics, getContentAnalytics,
  getCommunityAnalytics, getEngagementAnalytics, getRevenueAnalytics,
};
