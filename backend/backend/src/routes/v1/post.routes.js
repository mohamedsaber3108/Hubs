'use strict';
const router = require('express').Router();
const ctrl   = require('../../controllers/post.controller');
const { authenticate, optionalAuth } = require('../../middleware/auth');
const upload = require('../../middleware/upload');
const { uploadLimiter } = require('../../middleware/rateLimiter');

router.get('/',         optionalAuth, ctrl.getFeed);
router.post('/',        authenticate, uploadLimiter, upload.array('media', 5), ctrl.createPost);
router.get('/:id',      optionalAuth, ctrl.getPost);
router.put('/:id',      authenticate, ctrl.updatePost);
router.delete('/:id',   authenticate, ctrl.deletePost);
router.post('/:id/like', authenticate, ctrl.likePost);
router.post('/:id/comments', authenticate, ctrl.addComment);
router.delete('/:id/comments/:commentId', authenticate, ctrl.deleteComment);

module.exports = router;
