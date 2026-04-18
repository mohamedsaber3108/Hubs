'use strict';
const router = require('express').Router();
const ctrl   = require('../../controllers/leaderboard.controller');
const { authenticate, optionalAuth } = require('../../middleware/auth');
const { cacheMiddleware } = require('../../middleware/cache');

router.get('/',         optionalAuth, cacheMiddleware(60), ctrl.getLeaderboard);
router.get('/me',       authenticate, ctrl.getMyStats);
router.get('/history',  authenticate, ctrl.getPointHistory);

module.exports = router;
