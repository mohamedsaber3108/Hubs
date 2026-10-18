'use strict';
const { Op } = require('sequelize');
const { User, LeaderboardPoint, PointTransaction, Community, CommunityMembership } = require('../models');
const { cacheMiddleware } = require('../middleware/cache');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { paginate } = require('../utils/paginate');
const { fn, col, literal } = require('sequelize');

const userAttrs = ['id','first_name','last_name','username','avatar_url','headline','points_total'];

// GET /leaderboard
const getLeaderboard = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query, 50);
    const { community, period = 'all_time' } = req.query;

    let since = null;
    if (period === 'week')  since = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000);
    if (period === 'month') since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // For all-time: use points_total on User directly (fast)
    if (!community && period === 'all_time') {
      const { count, rows } = await User.findAndCountAll({
        where: { is_deleted: false, status: 'active', points_total: { [Op.gt]: 0 } },
        attributes: userAttrs,
        order: [['points_total','DESC']],
        limit, offset,
      });
      const ranked = rows.map((u, i) => ({ ...u.toJSON(), rank: offset + i + 1 }));
      const myRank = req.user ? ranked.find((u) => u.id === req.user.id) : null;
      return ApiResponse.paginated(res, ranked, { page, limit, total: count, my_rank: myRank });
    }

    // Period-based: aggregate from LeaderboardPoint
    const pointsWhere = {};
    if (since) pointsWhere.created_at = { [Op.gte]: since };

    let userIds = null;
    if (community) {
      const comm = await Community.findOne({ where: { slug: community } });
      if (!comm) return next(ApiError.notFound('Community not found'));
      const members = await CommunityMembership.findAll({ where: { community_id: comm.id }, attributes: ['user_id'] });
      userIds = members.map((m) => m.user_id);
      if (!userIds.length) return ApiResponse.paginated(res, [], { page, limit, total: 0 });
      pointsWhere.user_id = { [Op.in]: userIds };
    }

    const aggregated = await LeaderboardPoint.findAll({
      attributes: ['user_id', [fn('SUM', col('points')), 'total_points']],
      where: pointsWhere,
      group: ['user_id'],
      order: [[fn('SUM', col('points')), 'DESC']],
      limit, offset,
      include: [{ model: User, as: 'user', attributes: userAttrs }],
    });

    const ranked = aggregated.map((row, i) => ({
      ...row.user.toJSON(),
      period_points: parseInt(row.get('total_points')),
      rank: offset + i + 1,
    }));

    return ApiResponse.paginated(res, ranked, { page, limit, total: ranked.length });
  } catch (err) { next(err); }
};

// GET /leaderboard/me
const getMyStats = async (req, res, next) => {
  try {
    const { period = 'all_time' } = req.query;
    let since = null;
    if (period === 'week')  since = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000);
    if (period === 'month') since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const where = { user_id: req.user.id };
    if (since) where.created_at = { [Op.gte]: since };

    // BUG-15: `action` is a real column on PointTransaction, not on
    // LeaderboardPoint (which only has points/rank/period_month/
    // period_year) -- caused GET /leaderboard/me to 500 on its happy
    // path. The per-action breakdown belongs on the PointTransaction
    // log; keep the point *total* sum on LeaderboardPoint as before.
    const [points, byAction, rank] = await Promise.all([
      LeaderboardPoint.sum('points', { where }) || 0,
      PointTransaction.findAll({
        attributes: ['action', [fn('SUM', col('points')), 'total']],
        where, group: ['action'], order: [[fn('SUM', col('points')), 'DESC']], raw: true,
      }),
      User.count({ where: { points_total: { [Op.gt]: req.user.points_total || 0 }, is_deleted: false } }),
    ]);

    return ApiResponse.success(res, {
      total_points: period === 'all_time' ? (req.user.points_total || 0) : points,
      period_points: points,
      rank: rank + 1,
      by_action: byAction,
      period,
    });
  } catch (err) { next(err); }
};

// GET /leaderboard/history
const getPointHistory = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { count, rows } = await LeaderboardPoint.findAndCountAll({
      where: { user_id: req.user.id },
      order: [['created_at','DESC']],
      limit, offset,
    });
    return ApiResponse.paginated(res, rows, { page, limit, total: count });
  } catch (err) { next(err); }
};

module.exports = { getLeaderboard, getMyStats, getPointHistory };
