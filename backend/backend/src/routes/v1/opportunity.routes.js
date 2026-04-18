'use strict';
const router = require('express').Router();
const ctrl   = require('../../controllers/opportunity.controller');
const { authenticate, optionalAuth } = require('../../middleware/auth');
const upload = require('../../middleware/upload');
const { cacheMiddleware } = require('../../middleware/cache');

router.get('/',                           optionalAuth, cacheMiddleware(30), ctrl.listOpportunities);
router.post('/',                          authenticate, ctrl.createOpportunity);
router.get('/:id',                        optionalAuth, ctrl.getOpportunity);
router.put('/:id',                        authenticate, ctrl.updateOpportunity);
router.delete('/:id',                     authenticate, ctrl.deleteOpportunity);
router.post('/:id/apply',                 authenticate, upload.single('resume', 'document'), ctrl.apply);
router.get('/:id/applications',           authenticate, ctrl.getApplications);
router.patch('/:id/applications/:appId',  authenticate, ctrl.updateApplication);
router.post('/:id/save',                  authenticate, ctrl.saveOpportunity);

module.exports = router;
