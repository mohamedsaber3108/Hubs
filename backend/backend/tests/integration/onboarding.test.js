'use strict';
/**
 * Regression tests for the onboarding flow (P0-1).
 *
 * Before the fix, GET and POST /api/v1/onboarding both returned HTTP 500
 * because onboarding.controller.js read/wrote columns that didn't exist
 * on the User / OnboardingResponse models. There was ZERO test coverage,
 * which is why the break went unnoticed. These tests pin the corrected
 * behavior and the new persona (professional_roles) capture.
 */
const request = require('supertest');
const app     = require('../../src/app');
const { createUserAndLogin, getSeedCommunity } = require('../helpers');

describe('Onboarding', () => {
  let token;

  beforeAll(async () => {
    ({ token } = await createUserAndLogin());
    await getSeedCommunity(); // ensure 'freelancespace' exists for the join test
  });

  describe('GET /api/v1/onboarding', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/onboarding');
      expect(res.status).toBe(401);
    });

    it('returns onboarding status for a fresh user (not completed)', async () => {
      const res = await request(app)
        .get('/api/v1/onboarding')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.completed).toBe(false);
      expect(Array.isArray(res.body.data.professional_roles)).toBe(true);
    });
  });

  describe('POST /api/v1/onboarding', () => {
    it('completes onboarding, captures persona, and joins communities', async () => {
      const res = await request(app)
        .post('/api/v1/onboarding')
        .set('Authorization', `Bearer ${token}`)
        .send({
          communities: ['freelancespace'],
          professional_roles: ['freelancer', 'mentor'],
          goals: ['find gigs'],
          interests: ['design'],
          skills: ['React', 'Figma'],
          experience_level: 'intermediate',
          headline: 'Senior Designer',
          bio: 'I design things.',
          location: 'Cairo, Egypt',
        });
      expect(res.status).toBe(200);
      expect(res.body.data.completed).toBe(true);
      expect(res.body.data.professional_roles).toEqual(expect.arrayContaining(['freelancer', 'mentor']));
      expect(res.body.data.joined_communities).toContain('freelancespace');
    });

    it('reflects completion + persona on a subsequent GET', async () => {
      const res = await request(app)
        .get('/api/v1/onboarding')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.completed).toBe(true);
      expect(res.body.data.professional_roles).toEqual(expect.arrayContaining(['freelancer', 'mentor']));
      expect(res.body.data.response).not.toBeNull();
      expect(res.body.data.response.skills).toEqual(expect.arrayContaining(['React', 'Figma']));
    });

    it('ignores unknown persona values (sanitizes to the known set)', async () => {
      const { token: token2 } = await createUserAndLogin();
      const res = await request(app)
        .post('/api/v1/onboarding')
        .set('Authorization', `Bearer ${token2}`)
        .send({ professional_roles: ['freelancer', 'wizard', 'ceo'], communities: [] });
      expect(res.status).toBe(200);
      expect(res.body.data.professional_roles).toEqual(['freelancer']);
    });

    it('is idempotent on communities (re-submitting does not double-join)', async () => {
      const res = await request(app)
        .post('/api/v1/onboarding')
        .set('Authorization', `Bearer ${token}`)
        .send({ communities: ['freelancespace'], professional_roles: ['freelancer'] });
      expect(res.status).toBe(200);
      // already a member from the earlier test → still reports the slug, no error
      expect(res.body.data.joined_communities).toContain('freelancespace');
    });
  });
});
