'use strict';
const request = require('supertest');
const app     = require('../../src/app');
const { User } = require('../../src/models');

describe('Auth Integration', () => {
  const ts = Date.now();
  const testUser = {
    first_name: 'Test', last_name: 'User',
    username: 'tester' + ts,
    email: 'tester' + ts + '@example.com',
    password: 'TestPass123!',
  };
  let accessToken;

  describe('POST /api/v1/auth/register', () => {
    it('registers a new user successfully', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(testUser);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
    });

    it('rejects duplicate email with 409', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(testUser);
      expect(res.status).toBe(409);
    });

    it('rejects weak password with 400', async () => {
      const res = await request(app).post('/api/v1/auth/register')
        .send({ ...testUser, email: 'x@x.com', username: 'xuser', password: 'weak' });
      expect(res.status).toBe(400);
    });

    it('rejects missing required fields', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({ email: 'x@x.com' });
      expect(res.status).toBe(400);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeAll(async () => {
      await User.update({ email_verified: true }, { where: { email: testUser.email } });
    });

    it('logs in with valid credentials', async () => {
      const res = await request(app).post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password });
      expect(res.status).toBe(200);
      expect(res.body.data.access_token).toBeDefined();
      accessToken = res.body.data.access_token;
    });

    it('rejects wrong password with 401', async () => {
      const res = await request(app).post('/api/v1/auth/login')
        .send({ email: testUser.email, password: 'WrongPass999!' });
      expect(res.status).toBe(401);
    });

    it('rejects unknown email with 401', async () => {
      const res = await request(app).post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'TestPass123!' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/users/me', () => {
    it('returns user profile with valid token', async () => {
      const res = await request(app).get('/api/v1/users/me')
        .set('Authorization', 'Bearer ' + accessToken);
      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(testUser.email);
    });

    it('returns 401 without token', async () => {
      expect((await request(app).get('/api/v1/users/me')).status).toBe(401);
    });

    it('returns 401 with invalid token', async () => {
      const res = await request(app).get('/api/v1/users/me').set('Authorization', 'Bearer faketoken');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('returns 200 for unknown email (anti-enumeration)', async () => {
      const res = await request(app).post('/api/v1/auth/forgot-password')
        .send({ email: 'nobody@example.com' });
      expect(res.status).toBe(200);
    });
  });

  describe('Health checks', () => {
    it('GET /health returns 200', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.service).toBe('usam-hub-api');
    });

    it('GET /api/v1/health returns 200', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
    });
  });
});
