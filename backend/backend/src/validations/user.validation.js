'use strict';
const Joi = require('joi');

const updateProfile = Joi.object({
  first_name: Joi.string().trim().min(2).max(100),
  last_name:  Joi.string().trim().min(2).max(100),
  username:   Joi.string().trim().alphanum().min(3).max(50),
  bio:        Joi.string().max(500).allow('', null),
  headline:   Joi.string().max(255).allow('', null),
  location:   Joi.string().max(255).allow('', null),
  website:    Joi.string().uri().max(255).allow('', null),
});

const changePassword = Joi.object({
  current_password: Joi.string().required(),
  new_password:     Joi.string().min(8).max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required(),
});

const addSkill = Joi.object({
  skill: Joi.string().trim().min(2).max(100).required(),
  level: Joi.string().valid('beginner','intermediate','expert').default('intermediate'),
});

const addExperience = Joi.object({
  title:       Joi.string().max(255).required(),
  company:     Joi.string().max(255).required(),
  location:    Joi.string().max(255).allow('', null),
  start_date:  Joi.date().required(),
  end_date:    Joi.date().min(Joi.ref('start_date')).allow(null),
  is_current:  Joi.boolean().default(false),
  description: Joi.string().max(1000).allow('', null),
});

const addEducation = Joi.object({
  institution: Joi.string().max(255).required(),
  degree:      Joi.string().max(100).allow('', null),
  field:       Joi.string().max(100).allow('', null),
  start_year:  Joi.number().integer().min(1950).max(new Date().getFullYear() + 5).allow(null),
  end_year:    Joi.number().integer().min(1950).max(new Date().getFullYear() + 10).allow(null),
  is_current:  Joi.boolean().default(false),
  description: Joi.string().max(1000).allow('', null),
});

module.exports = { updateProfile, changePassword, addSkill, addExperience, addEducation };
