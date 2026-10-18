'use strict';
const Joi = require('joi');

// BUG-14 (docs/audit/SECURITY_AND_PRODUCTION_GAPS.md): createGroup,
// createChallenge, createOpportunity, and createResource all looked up
// `Community.findOne({ where: { slug: req.body.community_slug } })`
// before validating anything, so a request missing `community_slug`
// (or any other required field) threw a raw Sequelize error
// ("WHERE parameter \"slug\" has invalid \"undefined\" value" or a
// notNull Violation) as an uncaught 500 instead of a clean 400. These
// schemas, applied via the `validate` middleware (same pattern already
// used by auth/admin/user routes), close that gap for these four
// previously-unvalidated domains.

const createGroup = Joi.object({
  name:           Joi.string().trim().min(2).max(100).required(),
  description:    Joi.string().max(2000).allow('', null),
  community_slug: Joi.string().required(),
  visibility:     Joi.string().valid('public','private','invite_only').default('public'),
  tags:           Joi.array().items(Joi.string()).default([]),
});

const createChallenge = Joi.object({
  title:          Joi.string().trim().min(2).max(255).required(),
  description:    Joi.string().max(5000).required(),
  community_slug: Joi.string().required(),
  type:           Joi.string().valid('design','code','writing','video','business','other').default('other'),
  deadline:       Joi.date().iso().required(),
  prizes:         Joi.array().items(Joi.any()).default([]),
  tags:           Joi.array().items(Joi.string()).default([]),
  rules:          Joi.string().max(5000).allow('', null),
  points_reward:  Joi.number().integer().min(0).default(0),
});

const createOpportunity = Joi.object({
  title:           Joi.string().trim().min(2).max(255).required(),
  description:     Joi.string().max(5000).required(),
  community_slug:  Joi.string().required(),
  type:            Joi.string().valid('gig','full-time','part-time','internship','volunteer','scholarship','mentorship','collaboration').required(),
  company:         Joi.string().max(255).allow('', null),
  location:        Joi.string().max(255).allow('', null),
  is_remote:       Joi.boolean().default(false),
  salary_range:    Joi.string().max(100).allow('', null),
  skills:          Joi.array().items(Joi.string()).default([]),
  deadline:        Joi.date().iso().allow(null),
  apply_url:       Joi.string().uri().allow('', null),
});

const createResource = Joi.object({
  title:          Joi.string().trim().min(2).max(255).required(),
  description:    Joi.string().max(2000).allow('', null),
  community_slug: Joi.string().required(),
  category:       Joi.string().valid('template','guide','tool','calculator','case-study','toolkit','other').default('other'),
  external_url:   Joi.string().uri().allow('', null),
  tags:           Joi.array().items(Joi.string()).default([]),
  is_free:        Joi.boolean().default(true),
});

module.exports = { createGroup, createChallenge, createOpportunity, createResource };
