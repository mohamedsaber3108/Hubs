'use strict';
const passport = require('passport');
const ApiError = require('../utils/ApiError');

const authenticate = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err)   return next(err);
    if (!user) return next(ApiError.unauthorized('Please log in to continue'));
    req.user = user;
    next();
  })(req, res, next);
};

const optionalAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (user) req.user = user;
    next();
  })(req, res, next);
};

module.exports = { authenticate, optionalAuth };
