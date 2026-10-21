'use strict';
const router = require('express').Router();
const orgCtrl   = require('../../controllers/organization.controller');
const offerCtrl = require('../../controllers/offer.controller');
const { authenticate, optionalAuth } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const schema   = require('../../validations/offer.validation');

// Organizations
router.get ('/',        optionalAuth, orgCtrl.listOrganizations);
router.post('/',        authenticate, validate(schema.createOrganization), orgCtrl.createOrganization);
router.get ('/:slug',   optionalAuth, orgCtrl.getOrganization);
router.put ('/:slug',   authenticate, validate(schema.updateOrganization), orgCtrl.updateOrganization);
router.get ('/:slug/members', authenticate, orgCtrl.getMembers);

// Org-scoped offers (managers)
router.get ('/:slug/offers', authenticate, offerCtrl.listOrgOffers);
router.post('/:slug/offers', authenticate, validate(schema.createOffer), offerCtrl.createOffer);

module.exports = router;
