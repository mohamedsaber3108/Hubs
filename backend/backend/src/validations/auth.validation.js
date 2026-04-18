'use strict';
const Joi = require('joi');

const register = Joi.object({
  first_name: Joi.string().trim().min(2).max(100).required(),
  last_name:  Joi.string().trim().min(2).max(100).required(),
  username:   Joi.string().trim().alphanum().min(3).max(50).required(),
  email:      Joi.string().email().lowercase().required(),
  password:   Joi.string().min(8).max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({ 'string.pattern.base': 'Password must contain uppercase, lowercase, and a number' }),
});

const login = Joi.object({
  email:       Joi.string().email().lowercase().required(),
  password:    Joi.string().required(),
  remember_me: Joi.boolean().default(false),
});

const forgotPassword = Joi.object({
  email: Joi.string().email().lowercase().required(),
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
