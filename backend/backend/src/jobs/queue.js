'use strict';
const Bull   = require('bull');
const logger = require('../utils/logger');

const redisConfig = {
  host:     process.env.REDIS_HOST || '127.0.0.1',
  port:     parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

const emailQueue = new Bull('email', { redis: redisConfig, defaultJobOptions: {
  removeOnComplete: 100, removeOnFail: 50, attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
}});

const notificationQueue = new Bull('notification', { redis: redisConfig });
const cleanupQueue      = new Bull('cleanup',      { redis: redisConfig });

// Log queue events
[emailQueue, notificationQueue, cleanupQueue].forEach((q) => {
  q.on('failed',    (job, err) => logger.error(q.name + ' job failed: ' + err.message, { jobId: job.id }));
  q.on('completed', (job)      => logger.info(q.name  + ' job done: '  + job.id));
  q.on('error',     (err)      => logger.error(q.name + ' queue error: ' + err.message));
});

module.exports = { emailQueue, notificationQueue, cleanupQueue };
