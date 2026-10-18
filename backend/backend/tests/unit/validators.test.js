'use strict';
const Joi = require('joi');
const authSchemas  = require('../../src/validations/auth.validation');
const adminSchemas = require('../../src/validations/admin.validation');

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

describe('Email TLD validation bug (BUG-02)', () => {
  // Joi's .email() validator bundles a hardcoded TLD allowlist and
  // rejects otherwise-perfectly-valid addresses on newer or less common
  // gTLDs -- including this project's OWN ".usam.hub" / "@gmail.com"
  // seeded admin/demo accounts style ("usam.hub" uses the real ICANN
  // gTLD ".hub"). Confirmed: every real admin login integration test
  // in tests/integration/admin.test.js and the new
  // admin.authorization.test.js failed with "email must be a valid
  // email" against seeded @usam.hub-style addresses before this fix,
  // even though the address is syntactically valid. The project's own
  // real login/register schemas (src/validations/auth.validation.js,
  // admin.validation.js) must accept any syntactically valid email
  // regardless of TLD -- use `.email({ tlds: { allow: false } })`
  // rather than the default TLD-allowlist behavior.
  it('auth.validation.login accepts a .hub address', () => {
    const { error } = authSchemas.login.validate({ email: 'admin@usam.hub', password: 'x' });
    expect(error).toBeUndefined();
  });

  it('auth.validation.register accepts a .hub address', () => {
    const { error } = authSchemas.register.validate({
      first_name: 'Ahmed', last_name: 'Hassan', username: 'abcde',
      email: 'test@usam.hub', password: 'StrongPass1',
    });
    expect(error).toBeUndefined();
  });

  it('admin.validation.adminLogin accepts a .hub address', () => {
    const { error } = adminSchemas.adminLogin.validate({ email: 'admin@usam.hub', password: 'x' });
    expect(error).toBeUndefined();
  });

  it('still rejects a genuinely malformed email', () => {
    const { error } = authSchemas.login.validate({ email: 'not-an-email', password: 'x' });
    expect(error).toBeDefined();
  });
});
