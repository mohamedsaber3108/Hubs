'use strict';
const router = require('express').Router();
const ctrl   = require('../../controllers/resource.controller');
const { authenticate, optionalAuth } = require('../../middleware/auth');
const upload = require('../../middleware/upload');
const { cacheMiddleware } = require('../../middleware/cache');

router.get('/',            optionalAuth, cacheMiddleware(60), ctrl.listResources);
router.post('/',           authenticate, upload.single('file'), ctrl.createResource);
router.get('/:id',         optionalAuth, ctrl.getResource);
router.put('/:id',         authenticate, ctrl.updateResource);
router.delete('/:id',      authenticate, ctrl.deleteResource);
router.post('/:id/download', authenticate, ctrl.downloadResource);
router.post('/:id/rate',    authenticate, ctrl.rateResource);

module.exports = router;
