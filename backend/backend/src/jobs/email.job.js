'use strict';
const { emailQueue } = require('./queue');
const emailService   = require('../services/email.service');
const logger         = require('../utils/logger');

// Register processors
emailQueue.process('welcome', async (job) => {
  const { user, verifyUrl } = job.data;
  await emailService.sendWelcome(user, verifyUrl);
});

emailQueue.process('verify-email', async (job) => {
  const { user, verifyUrl } = job.data;
  await emailService.sendVerificationEmail(user, verifyUrl);
});

emailQueue.process('reset-password', async (job) => {
  const { user, resetUrl } = job.data;
  await emailService.sendPasswordResetEmail(user, resetUrl);
});

emailQueue.process('notification', async (job) => {
  const { user, title, message, actionUrl } = job.data;
  await emailService.sendNotificationEmail(user, title, message, actionUrl);
});

// Queue helpers
const enqueueWelcome = (user, verifyUrl) =>
  emailQueue.add('welcome', { user, verifyUrl }, { delay: 1000 });

const enqueueVerification = (user, verifyUrl) =>
  emailQueue.add('verify-email', { user, verifyUrl });

const enqueuePasswordReset = (user, resetUrl) =>
  emailQueue.add('reset-password', { user, resetUrl });

const enqueueNotification = (user, title, message, actionUrl) =>
  emailQueue.add('notification', { user, title, message, actionUrl });

logger.info('Email job processors registered');

module.exports = { enqueueWelcome, enqueueVerification, enqueuePasswordReset, enqueueNotification };
