'use strict';
const ApiError = require('../utils/ApiError');
const logger   = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors ? err.errors.map((e) => ({ field: e.path, message: e.message })) : [];
    const msg = err.name === 'SequelizeUniqueConstraintError'
      ? ((err.errors && err.errors[0] && err.errors[0].path) || 'Field') + ' already exists'
      : 'Validation failed';
    error = ApiError.badRequest(msg, errors);
  }

  if (err.name === 'JsonWebTokenError') error = ApiError.unauthorized('Invalid token');
  if (err.name === 'TokenExpiredError')  error = ApiError.unauthorized('Token expired');
  if (err.code === 'LIMIT_FILE_SIZE')    error = ApiError.badRequest('File too large');
  if (err.code === 'LIMIT_UNEXPECTED_FILE') error = ApiError.badRequest('Unexpected file field');

  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    logger.error(req.method + ' ' + req.path + ' -- ' + statusCode, {
      error: err.message, stack: err.stack, ip: req.ip,
    });
  }

  return res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal server error',
    errors:  error.errors  || [],
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
