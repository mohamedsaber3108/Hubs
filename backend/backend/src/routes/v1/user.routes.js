'use strict';
const router     = require('express').Router();
const controller = require('../../controllers/user.controller');
const { authenticate } = require('../../middleware/auth');
const validate   = require('../../middleware/validate');
const upload     = require('../../middleware/upload');
const { uploadLimiter } = require('../../middleware/rateLimiter');
const schema = require('../../validations/user.validation');

// All routes require authentication
router.use(authenticate);

// Profile
router.get('/me',     controller.getMe);
router.put('/me',     validate(schema.updateProfile), controller.updateMe);
router.delete('/me',  controller.deleteMe);
router.post('/me/avatar', uploadLimiter, upload.single('avatar', 'image'), controller.uploadAvatarHandler);
router.put('/me/password', validate(schema.changePassword), controller.changePassword);

// Sessions
router.get('/me/sessions',            controller.getSessions);
router.delete('/me/sessions/:id',     controller.revokeSession);

// Notifications
router.get('/me/notifications',          controller.getNotifications);
router.put('/me/notifications/:id/read', controller.markNotificationRead);
router.delete('/me/notifications',       controller.clearNotifications);

// Skills
router.post('/me/skills',         validate(schema.addSkill),      controller.addSkill);
router.delete('/me/skills/:id',   controller.deleteSkill);

// Experience
router.post('/me/experience',       validate(schema.addExperience),   controller.addExperience);
router.put('/me/experience/:id',    validate(schema.addExperience),   controller.updateExperience);
router.delete('/me/experience/:id', controller.deleteExperience);

// Education
router.post('/me/education',        validate(schema.addEducation), controller.addEducation);
router.delete('/me/education/:id',  controller.deleteEducation);

// Follow
router.post('/:id/follow',   controller.followUser);
router.delete('/:id/follow', controller.unfollowUser);

module.exports = router;
