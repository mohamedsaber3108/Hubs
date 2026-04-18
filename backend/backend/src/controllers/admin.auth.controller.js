'use strict';
const bcrypt    = require('bcrypt');
const jwt       = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode    = require('qrcode');
const { Admin, ActivityLog } = require('../models');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const logger      = require('../utils/logger');

// ─── helpers ─────────────────────────────────────────────────────────────────
function issueAdminToken(admin) {
  return jwt.sign(
    { sub: admin.id, role: admin.role, type: 'admin' },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.ADMIN_JWT_EXPIRES || '2h' }
  );
}

async function logAdminAction(adminId, action, req, extra) {
  try {
    await ActivityLog.create({
      admin_id: adminId, action,
      ip_address: req.ip || req.connection.remoteAddress,
      ...extra,
    });
  } catch (e) { logger.warn('Admin activity log error: ' + e.message); }
}

// ─── login ───────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password, totp_code } = req.body;

    const admin = await Admin.findOne({ where: { email } });
    if (!admin || !admin.is_active)
      return next(ApiError.unauthorized('Invalid credentials'));

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) return next(ApiError.unauthorized('Invalid credentials'));

    // TOTP check
    if (admin.totp_enabled) {
      if (!totp_code) return ApiResponse.success(res, { totp_required: true }, 'TOTP required', 200);
      const ok = speakeasy.totp.verify({
        secret:   admin.totp_secret,
        encoding: 'base32',
        token:    totp_code,
        window:   1,
      });
      if (!ok) return next(ApiError.unauthorized('Invalid TOTP code'));
    }

    await Admin.update({ last_login: new Date() }, { where: { id: admin.id } });
    const token = issueAdminToken(admin);

    await logAdminAction(admin.id, 'admin_login', req);

    return ApiResponse.success(res, {
      access_token: token,
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role, totp_enabled: admin.totp_enabled },
    }, 'Admin login successful');
  } catch (err) { next(err); }
};

// ─── logout ──────────────────────────────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    await logAdminAction(req.admin.id, 'admin_logout', req);
    return ApiResponse.success(res, null, 'Logged out');
  } catch (err) { next(err); }
};

// ─── get current admin ────────────────────────────────────────────────────────
const me = async (req, res, next) => {
  try {
    const admin = await Admin.findByPk(req.admin.id, {
      attributes: { exclude: ['password_hash', 'totp_secret'] },
    });
    return ApiResponse.success(res, { admin });
  } catch (err) { next(err); }
};

// ─── setup TOTP ──────────────────────────────────────────────────────────────
const setupTotp = async (req, res, next) => {
  try {
    const secret = speakeasy.generateSecret({ name: 'USAM Hub Admin (' + req.admin.email + ')' });
    await Admin.update({ totp_secret: secret.base32 }, { where: { id: req.admin.id } });
    const qr = await qrcode.toDataURL(secret.otpauth_url);
    return ApiResponse.success(res, { qr_code: qr, secret: secret.base32 });
  } catch (err) { next(err); }
};

// ─── enable TOTP ─────────────────────────────────────────────────────────────
const enableTotp = async (req, res, next) => {
  try {
    const admin = await Admin.findByPk(req.admin.id);
    const ok = speakeasy.totp.verify({
      secret:   admin.totp_secret,
      encoding: 'base32',
      token:    req.body.code,
      window:   1,
    });
    if (!ok) return next(ApiError.badRequest('Invalid TOTP code'));
    await admin.update({ totp_enabled: true });
    return ApiResponse.success(res, { totp_enabled: true }, '2FA enabled');
  } catch (err) { next(err); }
};

// ─── disable TOTP ────────────────────────────────────────────────────────────
const disableTotp = async (req, res, next) => {
  try {
    const admin = await Admin.findByPk(req.admin.id);
    const valid = await bcrypt.compare(req.body.password, admin.password_hash);
    if (!valid) return next(ApiError.unauthorized('Password incorrect'));
    await admin.update({ totp_enabled: false, totp_secret: null });
    return ApiResponse.success(res, { totp_enabled: false }, '2FA disabled');
  } catch (err) { next(err); }
};

module.exports = { login, logout, me, setupTotp, enableTotp, disableTotp };
