'use strict';
const router = require('express').Router();
const ctrl   = require('../../controllers/challenge.controller');
const { authenticate, optionalAuth } = require('../../middleware/auth');
const upload = require('../../middleware/upload');
const { uploadLimiter, cacheMiddleware: _ } = require('../../middleware/rateLimiter');
const { cacheMiddleware } = require('../../middleware/cache');

router.get('/',                                  optionalAuth, cacheMiddleware(30), ctrl.listChallenges);
router.post('/',                                 authenticate, upload.single('cover_image', 'image'), ctrl.createChallenge);
router.get('/:id',                               optionalAuth, ctrl.getChallenge);
router.put('/:id',                               authenticate, ctrl.updateChallenge);
router.post('/:id/submit',                       authenticate, upload.array('media', 5), ctrl.submitEntry);
router.get('/:id/submissions',                   optionalAuth, ctrl.getSubmissions);
router.post('/:id/winners',                      authenticate, ctrl.announceWinners);
router.post('/submissions/:submissionId/vote',   authenticate, ctrl.voteSubmission);

module.exports = router;
