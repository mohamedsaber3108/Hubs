'use strict';
const { Op, fn, col, literal } = require('sequelize');
const {
  User, Post, Event, Challenge, Opportunity, Community,
  CommunityMembership, ActivityLog, Subscription, MentorRequest, sequelize,
} = require('../models');
const { cacheMiddleware } = require('../middleware/cache');
const { getRedisClient } = require('../config/redis');
const ApiResponse = require('../utils/ApiResponse');
const logger      = require('../utils/logger');

// ─── KPI Stats ────────────────────────────────────────────────────────────────
const getStats = async (req, res, next) => {
  try {
    const redis     = getRedisClient();
    const cacheKey  = 'admin:dashboard:stats';
    const cached    = await redis.get(cacheKey).catch(() => null);
    if (cached) return res.json(JSON.parse(cached));

    const now     = new Date();
    const today   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const week    = new Date(today - 7  * 24 * 60 * 60 * 1000);
    const month   = new Date(today - 30 * 24 * 60 * 60 * 1000);
    const prevMonth = new Date(today - 60 * 24 * 60 * 60 * 1000);

    const [
      totalUsers, activeToday, newThisMonth, newPrevMonth,
      totalPosts, postsThisMonth,
      totalEvents, totalChallenges, totalOpportunities,
      totalCommunities, activeSubs,
    ] = await Promise.all([
      User.count({ where: { is_deleted: false } }),
      User.count({ where: { last_login: { [Op.gte]: today }, is_deleted: false } }),
      User.count({ where: { created_at: { [Op.gte]: month }, is_deleted: false } }),
      User.count({ where: { created_at: { [Op.between]: [prevMonth, month] }, is_deleted: false } }),
      Post.count({ where: { is_published: true } }),
      Post.count({ where: { created_at: { [Op.gte]: month }, is_published: true } }),
      Event.count(),
      Challenge.count(),
      Opportunity.count({ where: { status: 'open' } }),
      Community.count({ where: { is_active: true } }),
      Subscription.count({ where: { status: 'active' } }).catch(() => 0),
    ]);

    const userGrowth = newPrevMonth > 0
      ? (((newThisMonth - newPrevMonth) / newPrevMonth) * 100).toFixed(1)
      : newThisMonth > 0 ? 100 : 0;

    const stats = {
      users:        { total: totalUsers, active_today: activeToday, new_this_month: newThisMonth, growth_pct: parseFloat(userGrowth) },
      content:      { posts: totalPosts, posts_this_month: postsThisMonth, events: totalEvents, challenges: totalChallenges },
      opportunities:{ open: totalOpportunities },
      communities:  { total: totalCommunities },
      subscriptions:{ active: activeSubs },
      generated_at: now.toISOString(),
    };

    await redis.setex(cacheKey, 300, JSON.stringify({ success: true, data: stats }));
    return ApiResponse.success(res, stats);
  } catch (err) { next(err); }
};

// ─── Chart Data ───────────────────────────────────────────────────────────────
const getCharts = async (req, res, next) => {
  try {
    const days  = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // User registrations per day
    const usersByDay = await User.findAll({
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('COUNT', col('id')), 'count'],
      ],
      where: { created_at: { [Op.gte]: since }, is_deleted: false },
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true,
    });

    // Posts per day
    const postsByDay = await Post.findAll({
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('COUNT', col('id')), 'count'],
      ],
      where: { created_at: { [Op.gte]: since }, is_published: true },
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true,
    });

    // Members per community
    // BUG-10: grouping by the literal string 'Community.id' only works
    // if Sequelize's generated SQL alias matches exactly, which it
    // didn't here (it alias-prefixes included models differently),
    // producing "Unknown column 'Community.id' in 'group statement'"
    // on every GET /admin/dashboard/charts call. Group by the include's
    // actual column path instead.
    const communityStats = await CommunityMembership.findAll({
      attributes: [
        'community_id',
        [fn('COUNT', col('user_id')), 'members'],
      ],
      include: [{ model: Community, as: 'community', attributes: ['name','emoji','slug'] }],
      group: ['community_id', 'community.id', 'community.name', 'community.emoji', 'community.slug'],
      raw: false,
    });

    // User roles distribution
    const rolesDist = await User.findAll({
      attributes: ['role', [fn('COUNT', col('id')), 'count']],
      where: { is_deleted: false },
      group: ['role'],
      raw: true,
    });

    // Content type distribution
    const contentDist = await Post.findAll({
      attributes: ['type', [fn('COUNT', col('id')), 'count']],
      where: { is_published: true },
      group: ['type'],
      raw: true,
    });

    return ApiResponse.success(res, {
      user_registrations: usersByDay,
      posts_per_day:      postsByDay,
      community_members:  communityStats.map((c) => ({
        community: c.community ? { name: c.community.name, emoji: c.community.emoji, slug: c.community.slug } : null,
        members: parseInt(c.get('members')),
      })),
      roles_distribution:   rolesDist,
      content_distribution: contentDist,
      period_days: days,
    });
  } catch (err) { next(err); }
};

// ─── Recent Activity ──────────────────────────────────────────────────────────
const getRecentActivity = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const logs  = await ActivityLog.findAll({
      limit, order: [['created_at', 'DESC']],
      include: [
        { model: User, as: 'user', attributes: ['id','first_name','last_name','username','avatar_url'], required: false },
      ],
    });
    return ApiResponse.success(res, { activities: logs });
  } catch (err) { next(err); }
};

module.exports = { getStats, getCharts, getRecentActivity };
