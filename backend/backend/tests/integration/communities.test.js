'use strict';
const request = require('supertest');
const app     = require('../../src/app');
const { createUserAndLogin, getSeedCommunity, getSeedCommunities, createVerifiedUser, loginUser } = require('../helpers');

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

  describe('GET /api/v1/communities/recommended', () => {
    beforeAll(async () => {
      await getSeedCommunities(); // ensure all four product communities exist
    });

    it('works anonymously and returns communities (non-personalized)', async () => {
      const res = await request(app).get('/api/v1/communities/recommended');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.communities)).toBe(true);
      expect(res.body.data.communities.length).toBeGreaterThan(0);
      expect(res.body.data.personalized).toBe(false);
      // every community carries recommendation annotations
      const first = res.body.data.communities[0];
      expect(first).toHaveProperty('is_member');
      expect(first).toHaveProperty('match_score');
      expect(first).toHaveProperty('matched_personas');
    });

    it('does not capture "recommended" as a community slug', async () => {
      // Guards the route-ordering: /recommended must resolve to the
      // recommendations handler, not getOne looking up a slug named
      // "recommended" (which would 404).
      const res = await request(app).get('/api/v1/communities/recommended');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('personalized');
    });

    it('personalizes ranking for a user with personas', async () => {
      const personaUser = await createVerifiedUser({ professional_roles: ['student'] });
      const personaToken = await loginUser(personaUser.email);

      const res = await request(app)
        .get('/api/v1/communities/recommended')
        .set('Authorization', `Bearer ${personaToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.personalized).toBe(true);
      expect(res.body.data.personas).toContain('student');

      // studentzone should rank first for a student persona (affinity 3),
      // ahead of communities with no affinity for this persona.
      const top = res.body.data.communities[0];
      expect(top.slug).toBe('studentzone');
      expect(top.match_score).toBeGreaterThan(0);
      expect(top.matched_personas).toContain('student');
      expect(top.reason).toMatch(/student/i);
    });

    it('annotates membership state in recommendations', async () => {
      const u = await createVerifiedUser({ professional_roles: ['freelancer'] });
      const t = await loginUser(u.email);
      await request(app)
        .post('/api/v1/communities/freelancespace/join')
        .set('Authorization', `Bearer ${t}`);

      const res = await request(app)
        .get('/api/v1/communities/recommended')
        .set('Authorization', `Bearer ${t}`);

      expect(res.status).toBe(200);
      const fs = res.body.data.communities.find((c) => c.slug === 'freelancespace');
      expect(fs).toBeDefined();
      expect(fs.is_member).toBe(true);
    });
  });
});
