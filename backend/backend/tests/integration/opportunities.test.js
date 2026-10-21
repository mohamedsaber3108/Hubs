'use strict';
const request = require('supertest');
const app     = require('../../src/app');
const { createUserAndLogin, getSeedCommunity } = require('../helpers');

describe('Opportunities API', () => {
  let token, user, oppId;

  beforeAll(async () => {
    ({ user, token } = await createUserAndLogin());
    await getSeedCommunity(); // ensure freelancespace exists
  });

  describe('GET /api/v1/opportunities', () => {
    it('returns list publicly', async () => {
      const res = await request(app).get('/api/v1/opportunities');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('supports type filter', async () => {
      const res = await request(app).get('/api/v1/opportunities?type=gig');
      expect(res.status).toBe(200);
    });

    it('supports is_remote filter', async () => {
      const res = await request(app).get('/api/v1/opportunities?is_remote=true');
      expect(res.status).toBe(200);
    });

    it('supports pagination', async () => {
      const res = await request(app).get('/api/v1/opportunities?page=1&limit=5');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('POST /api/v1/opportunities', () => {
    it('requires authentication', async () => {
      const res = await request(app).post('/api/v1/opportunities').send({ title: 'x' });
      expect(res.status).toBe(401);
    });

    it('creates opportunity with valid payload', async () => {
      const res = await request(app)
        .post('/api/v1/opportunities')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title:          'Senior Node.js Developer',
          description:    'Full-stack opportunity for integration test',
          type:           'gig',
          company:        'Test Corp',
          is_remote:      true,
          community_slug: 'freelancespace',
          deadline:       new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        });
      expect(res.status).toBe(201);
      oppId = res.body.data.opportunity.id;
    });

    it('rejects missing title', async () => {
      const res = await request(app)
        .post('/api/v1/opportunities')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'no title', type: 'gig' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/opportunities/:id/save', () => {
    it('toggles save on opportunity', async () => {
      if (!oppId) return;
      const res = await request(app)
        .post(`/api/v1/opportunities/${oppId}/save`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(typeof res.body.data.saved).toBe('boolean');
    });
  });

  describe('GET /api/v1/opportunities/:id', () => {
    it('returns opportunity by id', async () => {
      if (!oppId) return;
      const res = await request(app).get(`/api/v1/opportunities/${oppId}`);
      expect(res.status).toBe(200);
    });

    it('returns 404 for missing id', async () => {
      const res = await request(app).get('/api/v1/opportunities/999999');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/opportunities?location_type=remote (BUG-fix: is_remote mapping)', () => {
    it('does not 500 on the location filter (previously queried a nonexistent column)', async () => {
      const res = await request(app).get('/api/v1/opportunities?location_type=remote');
      expect(res.status).toBe(200);
    });
  });

  describe('Application status workflow (BUG-fix: poster owner check uses posted_by)', () => {
    // Regression for the bug where updateApplication checked
    // app.opportunity.user_id (undefined) instead of posted_by, so a real
    // poster got 403 and only admins could update application status.
    let posterToken, applicantToken, oppId2, appId;

    beforeAll(async () => {
      ({ token: posterToken } = await createUserAndLogin());
      ({ token: applicantToken } = await createUserAndLogin());

      // poster creates an opportunity
      const created = await request(app)
        .post('/api/v1/opportunities')
        .set('Authorization', `Bearer ${posterToken}`)
        .send({
          title: 'Workflow Test Role',
          description: 'Opportunity for the application-status workflow test',
          type: 'gig',
          community_slug: 'freelancespace',
        });
      oppId2 = created.body.data?.opportunity?.id;

      // applicant applies
      const applied = await request(app)
        .post(`/api/v1/opportunities/${oppId2}/apply`)
        .set('Authorization', `Bearer ${applicantToken}`)
        .field('cover_letter', 'Please consider me');
      // applications are listed by the poster to get the id
      const apps = await request(app)
        .get(`/api/v1/opportunities/${oppId2}/applications`)
        .set('Authorization', `Bearer ${posterToken}`);
      appId = apps.body.data?.[0]?.id;
    });

    it('lets the real poster (not just admin) update application status', async () => {
      if (!appId) return;
      const res = await request(app)
        .patch(`/api/v1/opportunities/${oppId2}/applications/${appId}`)
        .set('Authorization', `Bearer ${posterToken}`)
        .send({ status: 'shortlisted' });
      expect(res.status).toBe(200);
      expect(res.body.data.application.status).toBe('shortlisted');
    });

    it('forbids a non-owner from updating application status', async () => {
      if (!appId) return;
      const res = await request(app)
        .patch(`/api/v1/opportunities/${oppId2}/applications/${appId}`)
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({ status: 'accepted' });
      expect(res.status).toBe(403);
    });
  });
});
