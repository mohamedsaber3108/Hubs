'use strict';
const router = require('express').Router();
const ctrl   = require('../../controllers/mentor.controller');
const { authenticate, optionalAuth } = require('../../middleware/auth');
const upload = require('../../middleware/upload');
const { cacheMiddleware } = require('../../middleware/cache');

router.get('/',                    optionalAuth, cacheMiddleware(60), ctrl.listMentors);
router.post('/',                   authenticate, ctrl.becomeMentor);
router.put('/me',                  authenticate, upload.single('profile_image', 'image'), ctrl.updateMyProfile);
router.get('/requests',            authenticate, ctrl.getMyRequests);
router.patch('/requests/:id',      authenticate, ctrl.updateRequest);
router.get('/:id',                 optionalAuth, ctrl.getMentor);
router.post('/:id/request',        authenticate, ctrl.requestSession);

module.exports = router;
