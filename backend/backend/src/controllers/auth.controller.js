'use strict';
const bcrypt   = require('bcrypt');
const crypto   = require('crypto');
const { User, Session, PasswordReset, EmailVerification } = require('../models');
const {
  generateAccessToken, generateRefreshToken,
  verifyRefreshToken, hashToken, generateRandomToken,
} = require('../utils/token');
const { enqueueWelcome, enqueueVerification, enqueuePasswordReset } = require('../jobs/email.job');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const redisService = require('../services/redis.service');
const { ActivityLog } = require('../models');
const logger = require('../utils/logger');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function issueTokens(user, rememberMe) {
  const payload = { sub: user.id, uuid: user.uuid, role: user.role, type: 'user' };
  const access  = generateAccessToken(payload);
  const refresh = generateRefreshToken({ ...payload, remember: rememberMe });
  return { access, refresh };
}

async function logActivity(userId, action, req, extra) {
  try {
    await ActivityLog.create({
      user_id: userId, action,
      ip_address: req.ip || req.connection.remoteAddress,
      ...extra,
    });
  } catch (err) {
    logger.warn('Activity log error: ' + err.message);
  }
}

// ─── Register ────────────────────────────────────────────────────────────────

const register = async (req, res, next) => {
  try {
    const { first_name, last_name, username, email, password } = req.body;

    // Check uniqueness
    const [existingEmail, existingUsername] = await Promise.all([
      User.findOne({ where: { email } }),
      User.findOne({ where: { username } }),
    ]);
    if (existingEmail)    return next(ApiError.conflict('Email already registered'));
    if (existingUsername) return next(ApiError.conflict('Username already taken'));

    const password_hash = await bcrypt.hash(password, 12);
    const user = await User.create({ first_name, last_name, username, email, password_hash });

    // Email verification
    const rawToken   = generateRandomToken();
    const token_hash = hashToken(rawToken);
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await EmailVerification.create({ user_id: user.id, token_hash, expires_at });

    const verifyUrl = (process.env.APP_URL || 'http://localhost:3000') + '/api/v1/auth/verify-email/' + rawToken;
    await enqueueWelcome(user, verifyUrl);

    await logActivity(user.id, 'register', req);

    return ApiResponse.created(res, {
      user: {
        id: user.id, uuid: user.uuid,
        first_name: user.first_name, last_name: user.last_name,
        username: user.username, email: user.email,
        email_verified: false,
      },
    }, 'Registration successful. Please verify your email.');
  } catch (err) {
    next(err);
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────

const login = async (req, res, next) => {
  try {
    const { email, password, remember_me } = req.body;

    const user = await User.findOne({ where: { email, is_deleted: false } });
    if (!user || !user.password_hash)
      return next(ApiError.unauthorized('Invalid email or password'));

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return next(ApiError.unauthorized('Invalid email or password'));

    if (user.status === 'banned')     return next(ApiError.forbidden('Account banned'));
    if (user.status === 'suspended')  return next(ApiError.forbidden('Account suspended'));

    const { access, refresh } = issueTokens(user, remember_me);
    const refreshHash = hashToken(refresh);

    const expiresAt = new Date(Date.now() + (remember_me ? 7 : 1) * 24 * 60 * 60 * 1000);

    await Session.create({
      user_id: user.id, token_hash: hashToken(access),
      refresh_token_hash: refreshHash, expires_at: expiresAt,
      ip_address: req.ip, user_agent: req.headers['user-agent'],
    });

    await User.update({ last_login: new Date() }, { where: { id: user.id } });

    // Store refresh in Redis (short-circuit DB lookup on refresh)
    await redisService.saveRefreshToken(user.id, refreshHash, 7 * 24 * 60 * 60);

    // httpOnly cookie for refresh token
    res.cookie('refresh_token', refresh, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await logActivity(user.id, 'login', req);

    return ApiResponse.success(res, {
      access_token: access,
      user: {
        id: user.id, uuid: user.uuid,
        first_name: user.first_name, last_name: user.last_name,
        username: user.username, email: user.email,
        avatar_url: user.avatar_url, role: user.role,
        email_verified: user.email_verified,
      },
    }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

// ─── Logout ──────────────────────────────────────────────────────────────────

const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refresh_token || req.body.refresh_token;

    if (refreshToken) {
      const hash = hashToken(refreshToken);
      await Session.update({ is_revoked: true }, { where: { refresh_token_hash: hash } });
      await redisService.revokeRefreshToken(req.user.id, hash);
    }

    res.clearCookie('refresh_token');
    await logActivity(req.user.id, 'logout', req);
    return ApiResponse.success(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

// ─── Refresh Token ───────────────────────────────────────────────────────────

const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refresh_token || req.body.refresh_token;
    if (!token) return next(ApiError.unauthorized('Refresh token required'));

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch (err) {
      return next(ApiError.unauthorized('Invalid or expired refresh token'));
    }

    const tokenHash = hashToken(token);
    const session   = await Session.findOne({ where: { refresh_token_hash: tokenHash, is_revoked: false } });
    if (!session || new Date() > session.expires_at)
      return next(ApiError.unauthorized('Refresh token expired or revoked'));

    const user = await User.findOne({ where: { id: payload.sub, is_deleted: false, status: 'active' } });
    if (!user) return next(ApiError.unauthorized('User not found'));

    // Rotate tokens
    const { access, refresh: newRefresh } = issueTokens(user, payload.remember);
    const newHash    = hashToken(newRefresh);
    const expiresAt  = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await session.update({ refresh_token_hash: newHash, token_hash: hashToken(access), expires_at: expiresAt });
    await redisService.revokeRefreshToken(user.id, tokenHash);
    await redisService.saveRefreshToken(user.id, newHash, 7 * 24 * 60 * 60);

    res.cookie('refresh_token', newRefresh, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return ApiResponse.success(res, { access_token: access }, 'Token refreshed');
  } catch (err) {
    next(err);
  }
};

// ─── Verify Email ─────────────────────────────────────────────────────────────

const verifyEmail = async (req, res, next) => {
  try {
    const tokenHash = hashToken(req.params.token);
    const record    = await EmailVerification.findOne({
      where: { token_hash: tokenHash, used: false },
    });

    if (!record || new Date() > record.expires_at)
      return next(ApiError.badRequest('Verification link invalid or expired'));

    await User.update({ email_verified: true }, { where: { id: record.user_id } });
    await record.update({ used: true });

    // Redirect to frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(frontendUrl + '/auth/signin?verified=1');
  } catch (err) {
    next(err);
  }
};

// ─── Resend Verification ─────────────────────────────────────────────────────

const resendVerification = async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { email: req.body.email, is_deleted: false } });
    if (!user || user.email_verified)
      return ApiResponse.success(res, null, 'If the email exists and is unverified, a new link has been sent.');

    const rawToken   = generateRandomToken();
    const token_hash = hashToken(rawToken);
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await EmailVerification.create({ user_id: user.id, token_hash, expires_at });
    const verifyUrl = (process.env.APP_URL || 'http://localhost:3000') + '/api/v1/auth/verify-email/' + rawToken;
    await enqueueVerification(user, verifyUrl);

    return ApiResponse.success(res, null, 'Verification email sent');
  } catch (err) {
    next(err);
  }
};

// ─── Forgot Password ─────────────────────────────────────────────────────────

const forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { email: req.body.email, is_deleted: false } });
    // Always respond the same to prevent enumeration
    if (user) {
      const rawToken   = generateRandomToken();
      const token_hash = hashToken(rawToken);
      const expires_at = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await PasswordReset.create({ email: user.email, token_hash, expires_at });
      const resetUrl = (process.env.FRONTEND_URL || 'http://localhost:5173') + '/auth/reset-password?token=' + rawToken;
      await enqueuePasswordReset(user, resetUrl);
    }

    return ApiResponse.success(res, null, 'If that email is registered, a reset link has been sent.');
  } catch (err) {
    next(err);
  }
};

// ─── Reset Password ──────────────────────────────────────────────────────────

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const tokenHash = hashToken(token);

    const record = await PasswordReset.findOne({
      where: { token_hash: tokenHash, used: false },
    });

    if (!record || new Date() > record.expires_at)
      return next(ApiError.badRequest('Reset link invalid or expired'));

    const password_hash = await bcrypt.hash(password, 12);
    await User.update({ password_hash }, { where: { email: record.email } });
    await record.update({ used: true });

    // Revoke all active sessions
    const user = await User.findOne({ where: { email: record.email } });
    if (user) {
      await Session.update({ is_revoked: true }, { where: { user_id: user.id } });
      await redisService.revokeAllUserTokens(user.id);
      await logActivity(user.id, 'password_reset', req);
    }

    return ApiResponse.success(res, null, 'Password reset successfully. Please log in.');
  } catch (err) {
    next(err);
  }
};

// ─── OAuth Callback Handler ───────────────────────────────────────────────────

const oauthCallback = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.redirect((process.env.FRONTEND_URL || 'http://localhost:5173') + '/auth/signin?error=oauth_failed');

    const { access, refresh } = issueTokens(user, false);
    const refreshHash = hashToken(refresh);
    const expiresAt   = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await Session.create({
      user_id: user.id, token_hash: hashToken(access),
      refresh_token_hash: refreshHash, expires_at: expiresAt,
      ip_address: req.ip, user_agent: req.headers['user-agent'],
    });

    await User.update({ last_login: new Date() }, { where: { id: user.id } });
    await redisService.saveRefreshToken(user.id, refreshHash, 7 * 24 * 60 * 60);

    res.cookie('refresh_token', refresh, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // SEC-03: do NOT put the access token in the redirect URL — URLs leak via
    // browser history, Referer headers, and server/proxy logs. The refresh
    // token is set as an httpOnly cookie above; the frontend /auth/callback
    // route exchanges that cookie for an access token via POST /auth/refresh-token.
    // `access` is intentionally not sent back here (the exchange re-issues one).
    void access;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(frontendUrl + '/auth/callback?oauth=success');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register, login, logout, refreshToken,
  verifyEmail, resendVerification,
  forgotPassword, resetPassword,
  oauthCallback,
};
