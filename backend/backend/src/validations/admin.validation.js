'use strict';
const Joi = require('joi');

// BUG-02: see src/validations/auth.validation.js -- Joi's default
// .email() TLD allowlist rejects valid addresses like "@usam.hub".
const emailSchema = () => Joi.string().email({ tlds: { allow: false } });

const adminLogin = Joi.object({
  email:    emailSchema().lowercase().required(),
  password: Joi.string().required(),
  totp_code: Joi.string().length(6).pattern(/^\d{6}$/).optional(),
});

const createAdmin = Joi.object({
  email:    emailSchema().lowercase().required(),
  password: Joi.string().min(10).max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .required()
    .messages({ 'string.pattern.base': 'Password needs uppercase, lowercase, number, and special character' }),
  name:        Joi.string().trim().min(2).max(255).required(),
  role:        Joi.string().valid('admin','moderator').default('admin'),
  permissions: Joi.object().default({}),
});

const updateAdmin = Joi.object({
  name:        Joi.string().trim().min(2).max(255),
  role:        Joi.string().valid('admin','moderator'),
  permissions: Joi.object(),
  is_active:   Joi.boolean(),
});

const updateUserAdmin = Joi.object({
  first_name: Joi.string().trim().min(2).max(100),
  last_name:  Joi.string().trim().min(2).max(100),
  username:   Joi.string().trim().alphanum().min(3).max(50),
  email:      emailSchema().lowercase(),
  role:       Joi.string().valid('user','moderator','admin'),
  status:     Joi.string().valid('active','suspended','banned'),
  headline:   Joi.string().max(255).allow('', null),
  bio:        Joi.string().max(500).allow('', null),
});

const updateUserStatus = Joi.object({
  status: Joi.string().valid('active','suspended','banned').required(),
  reason: Joi.string().max(500).optional(),
});

const updateUserRole = Joi.object({
  role: Joi.string().valid('user','moderator','admin').required(),
});

const updateSetting = Joi.object({
  value: Joi.any().required(),
});

const bulkUpdateSettings = Joi.object().pattern(
  Joi.string(), Joi.any()
);

const updateFeatureFlag = Joi.object({
  is_enabled:  Joi.boolean().required(),
  description: Joi.string().max(500).optional(),
});

const analyticsQuery = Joi.object({
  start_date: Joi.date().iso().optional(),
  end_date:   Joi.date().iso().min(Joi.ref('start_date')).optional(),
  period:     Joi.string().valid('day','week','month','year').default('month'),
  community:  Joi.string().optional(),
});

const createCommunity = Joi.object({
  slug:        Joi.string().alphanum().min(3).max(50).required(),
  name:        Joi.string().min(2).max(100).required(),
  emoji:       Joi.string().max(10).optional(),
  tagline:     Joi.string().max(255).optional(),
  description: Joi.string().max(2000).optional(),
  accent_color:Joi.string().max(20).optional(),
  features:    Joi.array().items(Joi.string()).default([]),
});

module.exports = {
  adminLogin, createAdmin, updateAdmin,
  updateUserAdmin, updateUserStatus, updateUserRole,
  updateSetting, bulkUpdateSettings, updateFeatureFlag,
  analyticsQuery, createCommunity,
};
