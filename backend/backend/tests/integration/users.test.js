'use strict';
const request = require('supertest');
const app     = require('../../src/app');
const { createUserAndLogin } = require('../helpers');

describe('Users API', () => {
  let token, user;

  beforeAll(async () => {
    ({ user, token } = await createUserAndLogin());
  });

  describe('GET /api/v1/users/me', () => {
    it('returns own profile when authenticated', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.user.id).toBe(user.id);
      expect(res.body.data.user).not.toHaveProperty('password_hash');
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/v1/users/me');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/v1/users/me', () => {
    it('updates profile fields', async () => {
      const res = await request(app)
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ headline: 'Updated headline', bio: 'Test bio' });
      expect(res.status).toBe(200);
      expect(res.body.data.user.headline).toBe('Updated headline');
    });

    it('does not allow role escalation', async () => {
      const res = await request(app)
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'admin' });
      expect(res.status).not.toBe(200);
    });
  });

  describe('GET /api/v1/profile/:username', () => {
    // Public profile lookup lives on the separate /profile router
    // (src/routes/v1/profile.routes.js), not /users/:username -- this
    // test previously hit a route that doesn't exist (user.routes.js
    // has no GET /:username at all, and its router-level
    // `router.use(authenticate)` meant the request 401'd instead of
    // ever reaching a 404). Matches the frontend's actual call in
    // frontend/src/services/user.service.ts (`getProfile`).
    it('returns public profile by username', async () => {
      const res = await request(app).get(`/api/v1/profile/${user.username}`);
      expect(res.status).toBe(200);
      expect(res.body.data.user.username).toBe(user.username);
    });

    it('returns 404 for nonexistent username', async () => {
      const res = await request(app).get('/api/v1/profile/definitely_no_such_user_xyz');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/users/:id/follow', () => {
    // Follow is by numeric id, not username (see user.controller.js
    // followUser: `parseInt(req.params.id)`), matching the frontend's
    // actual call (`userService.follow(userId: number)`).
    it('follows another user', async () => {
      const { user: user2 } = await createUserAndLogin();
      const res = await request(app)
        .post(`/api/v1/users/${user2.id}/follow`)
        .set('Authorization', `Bearer ${token}`);
      expect([200, 201]).toContain(res.status);
    });

    it('cannot follow self', async () => {
      const res = await request(app)
        .post(`/api/v1/users/${user.id}/follow`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });
  });
});
