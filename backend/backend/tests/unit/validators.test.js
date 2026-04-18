'use strict';
const Joi = require('joi');

// Replicate the auth validation schemas inline so we can unit-test them
const registerSchema = Joi.object({
  first_name: Joi.string().min(2).max(50).required(),
  last_name:  Joi.string().min(2).max(50).required(),
  username:   Joi.string().alphanum().min(3).max(30).required(),
  email:      Joi.string().email().required(),
  password:   Joi.string()
    .min(8).max(128)
    .pattern(/[A-Z]/, 'uppercase')
    .pattern(/[a-z]/, 'lowercase')
    .pattern(/[0-9]/, 'number')
    .pattern(/[^A-Za-z0-9]/, 'special')
    .required(),
});

describe('Registration Validation', () => {
  const valid = {
    first_name: 'Ahmed', last_name: 'Hassan',
    username:   'ahmedh', email: 'ahmed@example.com',
    password:   'StrongPass1!',
  };

  it('passes with valid payload', () => {
    const { error } = registerSchema.validate(valid);
    expect(error).toBeUndefined();
  });

  it('rejects short first_name', () => {
    const { error } = registerSchema.validate({ ...valid, first_name: 'A' });
    expect(error).toBeDefined();
  });

  it('rejects invalid email', () => {
    const { error } = registerSchema.validate({ ...valid, email: 'not-an-email' });
    expect(error).toBeDefined();
  });

  it('rejects password without uppercase', () => {
    const { error } = registerSchema.validate({ ...valid, password: 'weakpass1!' });
    expect(error).toBeDefined();
  });

  it('rejects password without special char', () => {
    const { error } = registerSchema.validate({ ...valid, password: 'StrongPass1' });
    expect(error).toBeDefined();
  });

  it('rejects non-alphanumeric username', () => {
    const { error } = registerSchema.validate({ ...valid, username: 'ahmed hassan' });
    expect(error).toBeDefined();
  });

  it('rejects username shorter than 3 chars', () => {
    const { error } = registerSchema.validate({ ...valid, username: 'ab' });
    expect(error).toBeDefined();
  });
});
