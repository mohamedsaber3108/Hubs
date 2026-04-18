'use strict';
const ApiError = require('../utils/ApiError');

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) return next(ApiError.forbidden('Insufficient permissions'));
  next();
};

const requireAdminRole = (...roles) => (req, res, next) => {
  if (!req.admin) return next(ApiError.unauthorized('Admin access required'));
  if (roles.length && !roles.includes(req.admin.role))
    return next(ApiError.forbidden('Insufficient admin permissions'));
  next();
};

module.exports = { requireRole, requireAdminRole };
