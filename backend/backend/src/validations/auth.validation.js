'use strict';
const Joi = require('joi');

// BUG-02 (docs/audit/SECURITY_AND_PRODUCTION_GAPS.md): Joi's default
// .email() validator checks the TLD against a hardcoded internal
// allowlist that lags behind ICANN's actual gTLD registry (e.g. it
// rejects ".hub" -- the very TLD this project's own seeded accounts
// and branding use, "usam.hub"). { tlds: { allow: false } } disables
// that allowlist check while still validating RFC-compliant email
// *syntax*, which is what we actually want here. Without this, every
// login/register call with a .hub (or any other TLD Joi hasn't heard
// of) address fails with a false-positive "must be a valid email".
const emailSchema = () => Joi.string().email({ tlds: { allow: false } });

const register = Joi.object({
  first_name: Joi.string().trim().min(2).max(100).required(),
  last_name:  Joi.string().trim().min(2).max(100).required(),
  username:   Joi.string().trim().alphanum().min(3).max(50).required(),
  email:      emailSchema().lowercase().required(),
  password:   Joi.string().min(8).max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({ 'string.pattern.base': 'Password must contain uppercase, lowercase, and a number' }),
});

const login = Joi.object({
  email:       emailSchema().lowercase().required(),
  password:    Joi.string().required(),
  remember_me: Joi.boolean().default(false),
});

const forgotPassword = Joi.object({
  email: emailSchema().lowercase().required(),
});

const resetPassword = Joi.object({
  token:    Joi.string().required(),
  password: Joi.string().min(8).max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required(),
});

const refreshToken = Joi.object({
  refresh_token: Joi.string().required(),
});

module.exports = { register, login, forgotPassword, resetPassword, refreshToken };
