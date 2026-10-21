'use strict';
const logger = require('../utils/logger');

// SEC-02: admin tokens must be signed/verified with a secret SEPARATE from the
// user JWT secret, so a leak of one does not grant the other's privileges.
// Prefer ADMIN_JWT_SECRET; fall back to JWT_ACCESS_SECRET only when it's unset
// (keeps older envs booting) but refuse that fallback in production.
function getAdminJwtSecret() {
  const dedicated = process.env.ADMIN_JWT_SECRET;
  if (dedicated && dedicated.length > 0) return dedicated;

  if (process.env.NODE_ENV === 'production') {
    // Fail closed: in production a shared admin/user secret is a real privilege
    // escalation risk — don't silently run with it.
    throw new Error('ADMIN_JWT_SECRET is required in production (must differ from JWT_ACCESS_SECRET)');
  }
  logger.warn('ADMIN_JWT_SECRET not set — falling back to JWT_ACCESS_SECRET (dev only). Set a distinct ADMIN_JWT_SECRET.');
  return process.env.JWT_ACCESS_SECRET;
}

module.exports = { getAdminJwtSecret };
