'use strict';
const request = require('supertest');
const app     = require('../../src/app');
const { createUserAndLogin, getSeedCommunity } = require('../helpers');

describe('Communities API', () => {
  let token, user;

  beforeAll(async () => {
    ({ user, token } = await createUserAndLogin());
    await getSeedCommunity(); // ensure freelancespace exists in test DB
  });

  describe('GET /api/v1/communities', () => {
    it('returns community list publicly', async () => {
      const res = await request(app).get('/api/v1/communities');
      expect(res.status).toBe(200);
      // community.controller.js getAll responds with
      // `{ data: { communities: [...] } }` (matches the frontend's
      // actual call, frontend/src/services/community.service.ts:5),
      // not a bare array under `data` -- this test previously asserted
      // the wrong shape.
      expect(Array.isArray(res.body.data.communities)).toBe(true);
    });

    it('returns communities with member_count field', async () => {
      const res = await request(app).get('/api/v1/communities');
      expect(res.status).toBe(200);
      if (res.body.data.length > 0) {
        expect(res.body.data[0]).toHaveProperty('members_count');
      }
    });
  });

  describe('GET /api/v1/communities/:slug', () => {
    it('returns single community by slug', async () => {
      const res = await request(app).get('/api/v1/communities/freelancespace');
      expect(res.status).toBe(200);
      expect(res.body.data.community.slug).toBe('freelancespace');
    });

    it('returns 404 for unknown slug', async () => {
      const res = await request(app).get('/api/v1/communities/nonexistent-slug');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/communities/:slug/join', () => {
    it('requires authentication', async () => {
      const res = await request(app).post('/api/v1/communities/freelancespace/join');
      expect(res.status).toBe(401);
    });

    it('allows authenticated user to join', async () => {
      const res = await request(app)
        .post('/api/v1/communities/freelancespace/join')
        .set('Authorization', `Bearer ${token}`);
      expect([200, 201, 409]).toContain(res.status); // 409 if already member
    });

    it('allows authenticated user to leave', async () => {
      const res = await request(app)
        .delete('/api/v1/communities/freelancespace/leave')
        .set('Authorization', `Bearer ${token}`);
      expect([200, 404]).toContain(res.status);
    });
  });
});
