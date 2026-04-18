'use strict';
const os      = require('os');
const process = require('process');
const { sequelize } = require('../models');
const { getRedisClient } = require('../config/redis');
const { emailQueue, notificationQueue, cleanupQueue } = require('../jobs/queue');
const ApiResponse = require('../utils/ApiResponse');
const ApiError    = require('../utils/ApiError');
const logger = require('../utils/logger');

// ─── System health ────────────────────────────────────────────────────────────
const getSystemHealth = async (req, res, next) => {
  try {
    const status = { overall: 'ok', timestamp: new Date().toISOString() };

    // DB
    try { await sequelize.authenticate(); status.database = { status: 'ok' }; }
    catch (err) { status.database = { status: 'error', error: err.message }; status.overall = 'degraded'; }

    // Redis
    try {
      const redis = getRedisClient();
      const pong  = await redis.ping();
      const info  = await redis.info('memory');
      const memMatch = info.match(/used_memory_human:(.+)/);
      status.redis = { status: pong === 'PONG' ? 'ok' : 'error', memory: memMatch ? memMatch[1].trim() : 'unknown' };
    } catch (err) { status.redis = { status: 'error', error: err.message }; status.overall = 'degraded'; }

    // Queue health
    try {
      const [emailCounts, notifCounts] = await Promise.all([
        emailQueue.getJobCounts(),
        notificationQueue.getJobCounts(),
      ]);
      status.queues = { email: emailCounts, notifications: notifCounts };
    } catch (err) { status.queues = { status: 'error', error: err.message }; }

    // Process info
    const memUsage = process.memoryUsage();
    status.process = {
      pid:    process.pid,
      uptime: Math.round(process.uptime()),
      memory: {
        rss:        Math.round(memUsage.rss       / 1024 / 1024) + 'MB',
        heapUsed:   Math.round(memUsage.heapUsed  / 1024 / 1024) + 'MB',
        heapTotal:  Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      },
      version: process.version,
      env:     process.env.NODE_ENV || 'development',
    };

    // OS info
    status.os = {
      platform:    os.platform(),
      arch:        os.arch(),
      hostname:    os.hostname(),
      cpus:        os.cpus().length,
      load_avg:    os.loadavg(),
      total_mem:   Math.round(os.totalmem()  / 1024 / 1024) + 'MB',
      free_mem:    Math.round(os.freemem()   / 1024 / 1024) + 'MB',
    };

    const code = status.overall === 'ok' ? 200 : 503;
    return res.status(code).json({ success: true, data: status });
  } catch (err) { next(err); }
};

// ─── Queue management ─────────────────────────────────────────────────────────
const getQueueStats = async (req, res, next) => {
  try {
    const [emailCounts, notifCounts, cleanupCounts] = await Promise.all([
      emailQueue.getJobCounts(),
      notificationQueue.getJobCounts(),
      cleanupQueue.getJobCounts(),
    ]);
    return ApiResponse.success(res, {
      email:        { ...emailCounts, name: 'email' },
      notifications:{ ...notifCounts, name: 'notifications' },
      cleanup:      { ...cleanupCounts, name: 'cleanup' },
    });
  } catch (err) { next(err); }
};

const pauseQueue = async (req, res, next) => {
  try {
    const { queue } = req.params;
    const queueMap  = { email: emailQueue, notification: notificationQueue, cleanup: cleanupQueue };
    if (!queueMap[queue]) return next(ApiError.notFound('Queue not found'));
    await queueMap[queue].pause();
    logger.info('Queue ' + queue + ' paused by admin ' + req.admin.id);
    return ApiResponse.success(res, { queue, status: 'paused' });
  } catch (err) { next(err); }
};

const resumeQueue = async (req, res, next) => {
  try {
    const { queue } = req.params;
    const queueMap  = { email: emailQueue, notification: notificationQueue, cleanup: cleanupQueue };
    if (!queueMap[queue]) return next(ApiError.notFound('Queue not found'));
    await queueMap[queue].resume();
    logger.info('Queue ' + queue + ' resumed by admin ' + req.admin.id);
    return ApiResponse.success(res, { queue, status: 'active' });
  } catch (err) { next(err); }
};

const cleanQueue = async (req, res, next) => {
  try {
    const { queue } = req.params;
    const queueMap  = { email: emailQueue, notification: notificationQueue, cleanup: cleanupQueue };
    if (!queueMap[queue]) return next(ApiError.notFound('Queue not found'));
    await queueMap[queue].clean(0, 'completed');
    await queueMap[queue].clean(0, 'failed');
    return ApiResponse.success(res, null, 'Queue cleaned');
  } catch (err) { next(err); }
};

// ─── Cache management ─────────────────────────────────────────────────────────
const getCacheStats = async (req, res, next) => {
  try {
    const redis = getRedisClient();
    const info  = await redis.info();
    const dbSize = await redis.dbsize();

    const extract = (key) => {
      const match = info.match(new RegExp(key + ':(.+)'));
      return match ? match[1].trim() : 'N/A';
    };

    return ApiResponse.success(res, {
      db_size:       dbSize,
      used_memory:   extract('used_memory_human'),
      uptime_secs:   extract('uptime_in_seconds'),
      connected_clients: extract('connected_clients'),
      hit_rate:      extract('keyspace_hits') + ' hits / ' + extract('keyspace_misses') + ' misses',
    });
  } catch (err) { next(err); }
};

const flushCache = async (req, res, next) => {
  try {
    const { pattern } = req.query;
    const redis = getRedisClient();
    if (pattern) {
      const keys = await redis.keys(pattern);
      if (keys.length) await redis.del(keys);
      return ApiResponse.success(res, { deleted: keys.length }, keys.length + ' keys deleted');
    }
    // Full flush — only allowed in non-production without explicit flag
    if (process.env.NODE_ENV === 'production' && !req.body.confirm)
      return ApiResponse.success(res, null, 'Pass confirm=true to flush all cache in production', 400);
    await redis.flushdb();
    logger.warn('Cache fully flushed by admin ' + req.admin.id);
    return ApiResponse.success(res, null, 'Cache flushed');
  } catch (err) { next(err); }
};

// ─── Maintenance mode ─────────────────────────────────────────────────────────
const setMaintenanceMode = async (req, res, next) => {
  try {
    const { enabled, message } = req.body;
    const redis = getRedisClient();
    if (enabled) {
      await redis.set('maintenance:enabled', '1');
      await redis.set('maintenance:message', message || 'USAM Hub is under maintenance. Back soon!');
      logger.warn('Maintenance mode ENABLED by admin ' + req.admin.id);
    } else {
      await redis.del('maintenance:enabled');
      await redis.del('maintenance:message');
      logger.info('Maintenance mode DISABLED by admin ' + req.admin.id);
    }
    return ApiResponse.success(res, { maintenance: enabled }, enabled ? 'Maintenance mode ON' : 'Maintenance mode OFF');
  } catch (err) { next(err); }
};

const getMaintenanceStatus = async (req, res, next) => {
  try {
    const redis   = getRedisClient();
    const enabled = await redis.get('maintenance:enabled');
    const message = await redis.get('maintenance:message');
    return ApiResponse.success(res, { maintenance: !!enabled, message: message || null });
  } catch (err) { next(err); }
};

module.exports = {
  getSystemHealth,
  getQueueStats, pauseQueue, resumeQueue, cleanQueue,
  getCacheStats, flushCache,
  setMaintenanceMode, getMaintenanceStatus,
};
