'use strict';
const rateLimit = require('express-rate-limit');

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;

const globalLimiter = rateLimit({
  windowMs, max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please try again in 15 minutes.' },
  skipSuccessfulRequests: true,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, max: 10,
  message: { success: false, message: 'Too many uploads, slow down.' },
});

const apiLimiter = rateLimit({
  windowMs, max: 300,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Rate limit exceeded.' },
});

module.exports = { globalLimiter, authLimiter, uploadLimiter, apiLimiter };
