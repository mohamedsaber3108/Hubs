'use strict';
const cron = require('node-cron');
const { Op }  = require('sequelize');
const { Session, PasswordReset, EmailVerification, ActivityLog } = require('../models');
const logger = require('../utils/logger');

// Run every day at 2am — delete expired sessions
cron.schedule('0 2 * * *', async () => {
  try {
    const deleted = await Session.destroy({ where: { expires_at: { [Op.lt]: new Date() } } });
    logger.info('Cleanup: removed ' + deleted + ' expired sessions');
  } catch (err) {
    logger.error('Session cleanup error: ' + err.message);
  }
});

// Every day at 3am — clean expired password resets
cron.schedule('0 3 * * *', async () => {
  try {
    await PasswordReset.destroy({ where: { expires_at: { [Op.lt]: new Date() } } });
    await EmailVerification.destroy({ where: { expires_at: { [Op.lt]: new Date() } } });
    logger.info('Cleanup: expired tokens removed');
  } catch (err) {
    logger.error('Token cleanup error: ' + err.message);
  }
});

// Every Sunday at 4am — archive old activity logs (keep 90 days)
cron.schedule('0 4 * * 0', async () => {
  try {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const deleted = await ActivityLog.destroy({ where: { created_at: { [Op.lt]: ninetyDaysAgo } } });
    logger.info('Cleanup: removed ' + deleted + ' old activity logs');
  } catch (err) {
    logger.error('Activity log cleanup error: ' + err.message);
  }
});

logger.info('Cleanup cron jobs registered');
module.exports = {};
