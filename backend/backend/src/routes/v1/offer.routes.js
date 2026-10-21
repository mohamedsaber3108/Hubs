'use strict';
const router = require('express').Router();
const ctrl   = require('../../controllers/offer.controller');
const { authenticate, optionalAuth } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const schema   = require('../../validations/offer.validation');

// Public catalog
router.get('/', optionalAuth, ctrl.listOffers);
// Current user's redemption history — declared BEFORE '/:id' so 'redemptions'
// isn't captured as an offer id.
router.get('/redemptions/me', authenticate, ctrl.myRedemptions);
router.get('/:id', optionalAuth, ctrl.getOffer);

// Management (org managers / platform admin)
router.put   ('/:id',             authenticate, validate(schema.updateOffer), ctrl.updateOffer);
router.delete('/:id',             authenticate, ctrl.archiveOffer);
router.post  ('/:id/submit',      authenticate, ctrl.submitOffer);
router.get   ('/:id/analytics',   authenticate, ctrl.offerAnalytics);
router.get   ('/:id/promo-codes', authenticate, ctrl.listPromoCodes);
router.post  ('/:id/promo-codes', authenticate, validate(schema.createPromoCode), ctrl.addPromoCode);
router.patch ('/:id/promo-codes/:codeId', authenticate, ctrl.updatePromoCode);

// Redemption (end users)
router.post('/:id/redeem', authenticate, ctrl.redeemOffer);

module.exports = router;
