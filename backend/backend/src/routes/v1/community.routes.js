'use strict';
const router = require('express').Router();
const ctrl   = require('../../controllers/community.controller');
const { authenticate, optionalAuth } = require('../../middleware/auth');
const { cacheMiddleware } = require('../../middleware/cache');

router.get('/',             optionalAuth, cacheMiddleware(120), ctrl.getAll);
router.get('/:slug',        optionalAuth, cacheMiddleware(60), ctrl.getOne);
router.get('/:slug/members', authenticate, ctrl.getMembers);
router.post('/:slug/join',  authenticate, ctrl.join);
router.delete('/:slug/join', authenticate, ctrl.leave);

module.exports = router;
