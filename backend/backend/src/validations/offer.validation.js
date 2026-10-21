'use strict';
const Joi = require('joi');

// Persona slugs eligible-list values must come from (mirror of backend
// VALID_ROLES in onboarding.controller.js).
const PERSONAS = ['freelancer', 'student', 'recruiter', 'employer', 'entrepreneur', 'job_seeker', 'mentor'];

// ─── Organizations ────────────────────────────────────────────────────────────
const createOrganization = Joi.object({
  name:        Joi.string().trim().min(2).max(150).required(),
  tagline:     Joi.string().max(255).allow('', null),
  description: Joi.string().max(5000).allow('', null),
  logo_url:    Joi.string().uri().allow('', null),
  website:     Joi.string().uri().allow('', null),
  industry:    Joi.string().max(100).allow('', null),
});

const updateOrganization = Joi.object({
  name:        Joi.string().trim().min(2).max(150),
  tagline:     Joi.string().max(255).allow('', null),
  description: Joi.string().max(5000).allow('', null),
  logo_url:    Joi.string().uri().allow('', null),
  website:     Joi.string().uri().allow('', null),
  industry:    Joi.string().max(100).allow('', null),
}).min(1);

// ─── Offers ─────────────────────────────────────────────────────────────────
const createOffer = Joi.object({
  title:           Joi.string().trim().min(2).max(255).required(),
  description:     Joi.string().max(10000).required(),
  category:        Joi.string().valid('discount','freebie','trial','cashback','service','event','course','other').default('discount'),
  discount_type:   Joi.string().valid('percentage','fixed','bogo','none').default('percentage'),
  discount_value:  Joi.number().min(0).allow(null),
  currency:        Joi.string().length(3).uppercase().default('USD'),
  redemption_type: Joi.string().valid('code','url','manual').default('code'),
  redemption_url:  Joi.string().uri().allow('', null),
  redemption_instructions: Joi.string().max(5000).allow('', null),
  eligible_personas:  Joi.array().items(Joi.string().valid(...PERSONAS)).default([]),
  target_communities: Joi.array().items(Joi.string()).default([]),
  total_limit:     Joi.number().integer().min(1).allow(null),
  per_user_limit:  Joi.number().integer().min(1).default(1),
  starts_at:       Joi.date().iso().allow(null),
  expires_at:      Joi.date().iso().allow(null),
})
  // A percentage discount must not exceed 100.
  .custom((value, helpers) => {
    if (value.discount_type === 'percentage' && value.discount_value != null && value.discount_value > 100) {
      return helpers.error('any.invalid', { message: 'percentage discount cannot exceed 100' });
    }
    if (value.starts_at && value.expires_at && new Date(value.expires_at) <= new Date(value.starts_at)) {
      return helpers.error('any.invalid', { message: 'expires_at must be after starts_at' });
    }
    return value;
  });

const updateOffer = Joi.object({
  title:           Joi.string().trim().min(2).max(255),
  description:     Joi.string().max(10000),
  category:        Joi.string().valid('discount','freebie','trial','cashback','service','event','course','other'),
  discount_type:   Joi.string().valid('percentage','fixed','bogo','none'),
  discount_value:  Joi.number().min(0).allow(null),
  currency:        Joi.string().length(3).uppercase(),
  redemption_type: Joi.string().valid('code','url','manual'),
  redemption_url:  Joi.string().uri().allow('', null),
  redemption_instructions: Joi.string().max(5000).allow('', null),
  eligible_personas:  Joi.array().items(Joi.string().valid(...PERSONAS)),
  target_communities: Joi.array().items(Joi.string()),
  total_limit:     Joi.number().integer().min(1).allow(null),
  per_user_limit:  Joi.number().integer().min(1),
  starts_at:       Joi.date().iso().allow(null),
  expires_at:      Joi.date().iso().allow(null),
}).min(1);

// ─── Promo codes ──────────────────────────────────────────────────────────────
const createPromoCode = Joi.object({
  code:       Joi.string().trim().min(2).max(64).uppercase().required(),
  max_uses:   Joi.number().integer().min(1).allow(null),
  expires_at: Joi.date().iso().allow(null),
});

// ─── Admin review ─────────────────────────────────────────────────────────────
const reviewOffer = Joi.object({
  decision: Joi.string().valid('approved', 'rejected').required(),
  reason:   Joi.when('decision', { is: 'rejected', then: Joi.string().max(500).required(), otherwise: Joi.string().max(500).allow('', null) }),
});

module.exports = {
  PERSONAS,
  createOrganization, updateOrganization,
  createOffer, updateOffer, createPromoCode, reviewOffer,
};
