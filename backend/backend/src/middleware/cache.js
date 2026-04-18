'use strict';
const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');

const cacheMiddleware = (ttl, keyFn) => {
  ttl = ttl || 60;
  return async function(req, res, next) {
    if (req.method !== 'GET') return next();
    const redis = getRedisClient();
    const key   = keyFn ? keyFn(req) : 'cache:' + req.originalUrl;
    try {
      const cached = await redis.get(key);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(JSON.parse(cached));
      }
    } catch (err) {
      logger.warn('Redis cache GET error: ' + err.message);
    }
    const originalJson = res.json.bind(res);
    res.json = async function(body) {
      if (res.statusCode === 200 && body && body.success !== false) {
        try {
          await redis.setex(key, ttl, JSON.stringify(body));
          res.setHeader('X-Cache', 'MISS');
        } catch (err) {
          logger.warn('Redis cache SET error: ' + err.message);
        }
      }
      return originalJson(body);
    };
    next();
  };
};

const invalidateCache = async (pattern) => {
  try {
    const redis = getRedisClient();
    const keys  = await redis.keys(pattern);
    if (keys.length) await redis.del(keys);
  } catch (err) {
    logger.warn('Cache invalidation error: ' + err.message);
  }
};

module.exports = { cacheMiddleware, invalidateCache };
