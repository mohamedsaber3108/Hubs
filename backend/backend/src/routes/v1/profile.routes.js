'use strict';
const router     = require('express').Router();
const controller = require('../../controllers/user.controller');
const { optionalAuth } = require('../../middleware/auth');
const { cacheMiddleware } = require('../../middleware/cache');

// Public profile — optional auth to determine isFollowing
router.get('/:username', optionalAuth, cacheMiddleware(30), controller.getProfile);

module.exports = router;
