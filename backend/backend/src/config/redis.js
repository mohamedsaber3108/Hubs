'use strict';
const Redis = require('ioredis');
const logger = require('../utils/logger');

let client;

const getRedisClient = () => {
  if (client) return client;

  client = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
  });

  client.on('connect', () => logger.info('Redis connected'));
  client.on('error', (err) => logger.error('Redis error:', err));
  client.on('ready', () => logger.info('Redis ready'));

  return client;
};

module.exports = { getRedisClient };
