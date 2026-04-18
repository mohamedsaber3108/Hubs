'use strict';
const jwt      = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const { Admin } = require('../models');

const authenticateAdmin = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer '))
      return next(ApiError.unauthorized('Admin token required'));

    const token   = header.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    if (payload.type !== 'admin') return next(ApiError.forbidden('Not an admin token'));

    const admin = await Admin.findOne({ where: { id: payload.sub, is_active: true } });
    if (!admin) return next(ApiError.unauthorized('Admin not found'));

    req.admin = admin;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(ApiError.unauthorized('Admin token expired'));
    next(ApiError.unauthorized('Invalid admin token'));
  }
};

module.exports = { authenticateAdmin };
