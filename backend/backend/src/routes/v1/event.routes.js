'use strict';
const router = require('express').Router();
const ctrl   = require('../../controllers/event.controller');
const { authenticate, optionalAuth } = require('../../middleware/auth');
const upload = require('../../middleware/upload');
const { cacheMiddleware } = require('../../middleware/cache');

router.get('/',             optionalAuth, cacheMiddleware(30), ctrl.listEvents);
router.post('/',            authenticate, upload.single('cover_image', 'image'), ctrl.createEvent);
router.get('/:id',          optionalAuth, ctrl.getEvent);
router.put('/:id',          authenticate, upload.single('cover_image', 'image'), ctrl.updateEvent);
router.delete('/:id',       authenticate, ctrl.deleteEvent);
router.post('/:id/rsvp',    authenticate, ctrl.rsvp);
router.get('/:id/attendees', optionalAuth, ctrl.getAttendees);

module.exports = router;
