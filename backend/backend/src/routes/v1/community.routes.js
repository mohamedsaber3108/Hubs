'use strict';
const router = require('express').Router();
const ctrl   = require('../../controllers/community.controller');
const { authenticate, optionalAuth } = require('../../middleware/auth');
const { cacheMiddleware } = require('../../middleware/cache');

router.get('/',             optionalAuth, cacheMiddleware(120), ctrl.getAll);
// Persona-aware recommendations — must be declared BEFORE '/:slug' so the
// literal 'recommended' path isn't captured as a slug. Not cached: the result
// is per-user (depends on the viewer's personas + memberships).
router.get('/recommended', optionalAuth, ctrl.getRecommended);
router.get('/:slug',        optionalAuth, cacheMiddleware(60), ctrl.getOne);
router.get('/:slug/members', authenticate, ctrl.getMembers);
router.post('/:slug/join',  authenticate, ctrl.join);
router.delete('/:slug/join', authenticate, ctrl.leave);

module.exports = router;
