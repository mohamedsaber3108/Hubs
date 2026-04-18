'use strict';
const { Op } = require('sequelize');
const { ActivityLog, User, Admin } = require('../models');
const ApiResponse = require('../utils/ApiResponse');
const { paginate } = require('../utils/paginate');
const ApiError = require('../utils/ApiError');

// ─── List activity logs ───────────────────────────────────────────────────────
const listLogs = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { action, user_id, admin_id, entity_type, start_date, end_date, ip } = req.query;
    const where = {};
    if (action)      where.action      = { [Op.like]: '%' + action + '%' };
    if (user_id)     where.user_id     = user_id;
    if (admin_id)    where.admin_id    = admin_id;
    if (entity_type) where.entity_type = entity_type;
    if (ip)          where.ip_address  = { [Op.like]: '%' + ip + '%' };
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date)   where.created_at[Op.lte] = new Date(end_date);
    }

    const { count, rows } = await ActivityLog.findAndCountAll({
      where, limit, offset, order: [['created_at','DESC']],
      include: [
        { model: User,  as: 'user',  attributes: ['id','first_name','last_name','username'], required: false },
        { model: Admin, as: 'admin', attributes: ['id','name','email','role'], required: false },
      ],
    });
    return ApiResponse.paginated(res, rows, { page, limit, total: count });
  } catch (err) { next(err); }
};

// ─── Get single log ───────────────────────────────────────────────────────────
const getLog = async (req, res, next) => {
  try {
    const log = await ActivityLog.findByPk(req.params.id, {
      include: [
        { model: User,  as: 'user',  attributes: ['id','first_name','last_name','username'], required: false },
        { model: Admin, as: 'admin', attributes: ['id','name','email'], required: false },
      ],
    });
    if (!log) return next(ApiError.notFound('Log not found'));
    return ApiResponse.success(res, { log });
  } catch (err) { next(err); }
};

// ─── Log actions summary ──────────────────────────────────────────────────────
const getLogSummary = async (req, res, next) => {
  try {
    const { fn, col } = require('sequelize');
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const topActions = await ActivityLog.findAll({
      attributes: ['action', [fn('COUNT', col('id')), 'count']],
      where: { created_at: { [Op.gte]: since } },
      group: ['action'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      limit: 20, raw: true,
    });
    const topIps = await ActivityLog.findAll({
      attributes: ['ip_address', [fn('COUNT', col('id')), 'count']],
      where: { created_at: { [Op.gte]: since }, ip_address: { [Op.ne]: null } },
      group: ['ip_address'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      limit: 10, raw: true,
    });
    const total = await ActivityLog.count({ where: { created_at: { [Op.gte]: since } } });
    return ApiResponse.success(res, { total_last_7_days: total, top_actions: topActions, top_ips: topIps });
  } catch (err) { next(err); }
};

// ─── Export logs as CSV ───────────────────────────────────────────────────────
const exportLogs = async (req, res, next) => {
  try {
    const since = req.query.start_date ? new Date(req.query.start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const until = req.query.end_date   ? new Date(req.query.end_date)   : new Date();
    const logs  = await ActivityLog.findAll({
      where: { created_at: { [Op.between]: [since, until] } },
      order: [['created_at','DESC']],
      limit: 10000, raw: true,
    });

    const header = 'id,action,user_id,admin_id,entity_type,entity_id,ip_address,created_at\n';
    const rows   = logs.map((l) =>
      [l.id, l.action, l.user_id || '', l.admin_id || '', l.entity_type || '', l.entity_id || '', l.ip_address || '', l.created_at].join(',')
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="activity_logs_' + Date.now() + '.csv"');
    return res.send(header + rows);
  } catch (err) { next(err); }
};

module.exports = { listLogs, getLog, getLogSummary, exportLogs };
