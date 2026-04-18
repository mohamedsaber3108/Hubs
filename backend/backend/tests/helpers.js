'use strict';
const request = require('supertest');
const app     = require('../src/app');
const { User, Community, Admin } = require('../src/models');
const bcrypt  = require('bcrypt');

const TS = Date.now();

async function createVerifiedUser(overrides = {}) {
  const defaults = {
    first_name: 'Test', last_name: 'User',
    username: 'testuser_' + TS + Math.random().toString(36).slice(2, 6),
    email: `test_${TS}_${Math.random().toString(36).slice(2,6)}@example.com`,
    password_hash: await bcrypt.hash('TestPass123!', 10),
    email_verified: true,
    status: 'active',
    role: 'user',
  };
  return User.create({ ...defaults, ...overrides });
}

async function loginUser(email, password = 'TestPass123!') {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password });
  return res.body.data?.access_token;
}

async function createUserAndLogin(overrides = {}) {
  const user  = await createVerifiedUser(overrides);
  const token = await loginUser(user.email);
  return { user, token };
}

async function getSeedCommunity() {
  const [community] = await Community.findOrCreate({
    where: { slug: 'freelancespace' },
    defaults: {
      slug: 'freelancespace',
      name: 'FreelanceSpace',
      emoji: '💼',
      tagline: 'For freelancers',
      description: 'Test community for freelancers',
      accent_color: '#6366f1',
      is_active: true,
      members_count: 0,
    },
  });
  return community;
}

async function createAdmin(overrides = {}) {
  const defaults = {
    email:         `admin_${TS}_${Math.random().toString(36).slice(2,6)}@usam.hub`,
    password_hash: await bcrypt.hash('AdminPass123!', 10),
    name:          'Admin Test',
    role:          'super_admin',
    is_active:     true,
  };
  return Admin.create({ ...defaults, ...overrides });
}

async function loginAdmin(email, password = 'AdminPass123!') {
  const res = await request(app).post('/api/v1/admin/auth/login').send({ email, password });
  return res.body.data?.access_token;
}

module.exports = { createVerifiedUser, loginUser, createUserAndLogin, getSeedCommunity, createAdmin, loginAdmin };
