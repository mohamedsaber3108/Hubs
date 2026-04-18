'use strict';
const router = require('express').Router();
const ctrl   = require('../../controllers/nomad.controller');
const { authenticate } = require('../../middleware/auth');
const { apiLimiter } = require('../../middleware/rateLimiter');

router.post('/chat', authenticate, apiLimiter, ctrl.chat);

module.exports = router;
