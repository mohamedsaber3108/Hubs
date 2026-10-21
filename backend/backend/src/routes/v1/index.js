'use strict';
const router = require('express').Router();

router.use('/auth',    require('./auth.routes'));
router.use('/users',   require('./user.routes'));
router.use('/profile', require('./profile.routes'));
router.use('/health',  require('./health.routes'));
router.use('/communities', require('./community.routes'));
router.use('/posts',       require('./post.routes'));
router.use('/groups',      require('./group.routes'));
router.use('/events',      require('./event.routes'));
router.use('/challenges',  require('./challenge.routes'));
router.use('/opportunities', require('./opportunity.routes'));
router.use('/resources',   require('./resource.routes'));
router.use('/organizations', require('./organization.routes'));
router.use('/offers',      require('./offer.routes'));
router.use('/leaderboard', require('./leaderboard.routes'));
router.use('/mentors',     require('./mentor.routes'));
router.use('/messages',    require('./message.routes'));
router.use('/search',      require('./search.routes'));
router.use('/onboarding',  require('./onboarding.routes'));
router.use('/nomad',       require('./nomad.routes'));
router.use('/admin',       require('./admin.routes'));

module.exports = router;
