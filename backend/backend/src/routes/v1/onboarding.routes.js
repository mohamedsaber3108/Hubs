'use strict';
const router = require('express').Router();
const ctrl   = require('../../controllers/onboarding.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);
router.get('/',  ctrl.getStatus);
router.post('/', ctrl.submitOnboarding);

module.exports = router;
