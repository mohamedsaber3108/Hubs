'use strict';
const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');

async function get(key) {
  try {
    const val = await getRedisClient().get(key);
    return val ? JSON.parse(val) : null;
  } catch (err) {
    logger.warn('Redis GET error: ' + err.message);
    return null;
  }
}

async function set(key, value, ttl) {
  try {
    const serialized = JSON.stringify(value);
    if (ttl) await getRedisClient().setex(key, ttl, serialized);
    else      await getRedisClient().set(key, serialized);
  } catch (err) {
    logger.warn('Redis SET error: ' + err.message);
  }
}

async function del(key) {
  try {
    await getRedisClient().del(key);
  } catch (err) {
    logger.warn('Redis DEL error: ' + err.message);
  }
}

async function exists(key) {
  try {
    return await getRedisClient().exists(key);
  } catch (err) {
    return 0;
  }
}

async function incr(key, ttl) {
  try {
    const val = await getRedisClient().incr(key);
    if (ttl && val === 1) await getRedisClient().expire(key, ttl);
    return val;
  } catch (err) {
    logger.warn('Redis INCR error: ' + err.message);
    return 0;
  }
}

// Session management
async function saveRefreshToken(userId, tokenHash, ttl) {
  await set('refresh:' + userId + ':' + tokenHash, { userId }, ttl || 7 * 24 * 60 * 60);
}

async function revokeRefreshToken(userId, tokenHash) {
  await del('refresh:' + userId + ':' + tokenHash);
}

async function revokeAllUserTokens(userId) {
  try {
    const keys = await getRedisClient().keys('refresh:' + userId + ':*');
    if (keys.length) await getRedisClient().del(keys);
  } catch (err) {
    logger.warn('Revoke all tokens error: ' + err.message);
  }
}

// Admin token blacklist
async function blacklistToken(jti, ttl) {
  await set('blacklist:' + jti, 1, ttl);
}

async function isTokenBlacklisted(jti) {
  return !!(await exists('blacklist:' + jti));
}

module.exports = {
  get, set, del, exists, incr,
  saveRefreshToken, revokeRefreshToken, revokeAllUserTokens,
  blacklistToken, isTokenBlacklisted,
};
