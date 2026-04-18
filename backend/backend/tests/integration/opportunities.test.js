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
});
