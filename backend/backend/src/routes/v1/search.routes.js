'use strict';
const router = require('express').Router();
const ctrl   = require('../../controllers/search.controller');
const { optionalAuth } = require('../../middleware/auth');

router.get('/',            optionalAuth, ctrl.globalSearch);
router.get('/community',   optionalAuth, ctrl.searchInCommunity);

module.exports = router;
