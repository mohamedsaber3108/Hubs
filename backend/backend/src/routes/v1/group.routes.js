'use strict';
const router = require('express').Router();
const ctrl   = require('../../controllers/group.controller');
const { authenticate, optionalAuth } = require('../../middleware/auth');
const upload = require('../../middleware/upload');
const { uploadLimiter } = require('../../middleware/rateLimiter');
const { cacheMiddleware } = require('../../middleware/cache');

router.get('/',                    optionalAuth, cacheMiddleware(30), ctrl.listGroups);
router.post('/',                   authenticate, upload.single('cover_image', 'image'), ctrl.createGroup);
router.get('/:id',                 optionalAuth, ctrl.getGroup);
router.put('/:id',                 authenticate, upload.single('cover_image', 'image'), ctrl.updateGroup);
router.delete('/:id',              authenticate, ctrl.deleteGroup);
router.post('/:id/join',           authenticate, ctrl.joinGroup);
router.delete('/:id/join',         authenticate, ctrl.leaveGroup);
router.get('/:id/members',         optionalAuth, ctrl.getMembers);
router.patch('/:id/members/:userId', authenticate, ctrl.updateMember);
router.delete('/:id/members/:userId', authenticate, ctrl.removeMember);
router.get('/:id/posts',           optionalAuth, ctrl.getGroupPosts);

module.exports = router;
