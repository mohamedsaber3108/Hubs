'use strict';
const router     = require('express').Router();
const passport   = require('passport');
const controller = require('../../controllers/auth.controller');
const validate   = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { authLimiter } = require('../../middleware/rateLimiter');
const schema = require('../../validations/auth.validation');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

// Public auth routes
router.post('/register', authLimiter, validate(schema.register), controller.register);
router.post('/login',    authLimiter, validate(schema.login),    controller.login);
router.post('/logout',   authenticate, controller.logout);
router.post('/refresh-token', controller.refreshToken);

router.post('/forgot-password', authLimiter, validate(schema.forgotPassword), controller.forgotPassword);
router.post('/reset-password',  authLimiter, validate(schema.resetPassword),  controller.resetPassword);

router.get('/verify-email/:token',  controller.verifyEmail);
router.post('/resend-verification', authLimiter, controller.resendVerification);

// OAuth routes
router.get('/google',   passport.authenticate('google',   { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', passport.authenticate('google',   { session: false, failureRedirect: '/auth/signin?error=google' }), controller.oauthCallback);

router.get('/github',   passport.authenticate('github',   { scope: ['user:email'], session: false }));
router.get('/github/callback', passport.authenticate('github',   { session: false, failureRedirect: '/auth/signin?error=github' }), controller.oauthCallback);

router.get('/facebook', passport.authenticate('facebook', { scope: ['email'], session: false }));
router.get('/facebook/callback', passport.authenticate('facebook', { session: false, failureRedirect: '/auth/signin?error=facebook' }), controller.oauthCallback);

router.get('/linkedin', passport.authenticate('linkedin', { session: false }));
router.get('/linkedin/callback', passport.authenticate('linkedin', { session: false, failureRedirect: '/auth/signin?error=linkedin' }), controller.oauthCallback);

// TEST-ONLY OAuth harness route. Mirrors the real provider callbacks (same
// failureRedirect + oauthCallback controller) but drives the 'oauth-mock'
// strategy, which is only registered when NODE_ENV==='test'. Lets the OAuth
// integration tests exercise the full callback -> token issue -> refresh-cookie
// pipeline without real credentials. Never mounted in production.
if (process.env.NODE_ENV === 'test') {
  router.get(
    '/oauth-mock/callback',
    passport.authenticate('oauth-mock', { session: false, failureRedirect: '/auth/signin?error=oauth_failed' }),
    controller.oauthCallback,
  );
}

module.exports = router;
