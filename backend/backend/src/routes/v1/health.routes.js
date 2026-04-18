'use strict';
const router = require('express').Router();
const { sequelize } = require('../../models');
const { getRedisClient } = require('../../config/redis');

router.get('/', async (req, res) => {
  const health = { status: 'ok', timestamp: new Date().toISOString(), service: 'usam-hub-api', uptime: process.uptime() };
  try {
    await sequelize.authenticate();
    health.database = 'ok';
  } catch (err) {
    health.database = 'error';
    health.status   = 'degraded';
  }
  try {
    const redis = getRedisClient();
    await redis.ping();
    health.redis = 'ok';
  } catch (err) {
    health.redis  = 'error';
    health.status = 'degraded';
  }
  const statusCode = health.status === 'ok' ? 200 : 503;
  return res.status(statusCode).json(health);
});

module.exports = router;
