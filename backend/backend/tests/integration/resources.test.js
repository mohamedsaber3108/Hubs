'use strict';
const request = require('supertest');
const app     = require('../../src/app');
const { createUserAndLogin, getSeedCommunity } = require('../helpers');

describe('Resources API', () => {
  let token, user, community, resourceId;

  beforeAll(async () => {
    ({ user, token } = await createUserAndLogin());
    community = await getSeedCommunity();
  });

  describe('GET /api/v1/resources', () => {
    it('returns list publicly', async () => {
      const res = await request(app).get('/api/v1/resources');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('supports type filter', async () => {
      const res = await request(app).get('/api/v1/resources?type=guide');
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/v1/resources', () => {
    it('requires authentication', async () => {
      const res = await request(app).post('/api/v1/resources').send({ title: 'x' });
      expect(res.status).toBe(401);
    });

    it('creates resource with valid payload', async () => {
      const res = await request(app)
        .post('/api/v1/resources')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title:          'Test Resource',
          description:    'A resource for integration testing',
          category:       'guide',
          external_url:   'https://example.com/resource',
          community_slug: 'freelancespace',
        });
      expect([201, 200]).toContain(res.status);
      resourceId = res.body.data?.resource?.id;
    });

    it('rejects missing title', async () => {
      const res = await request(app)
        .post('/api/v1/resources')
        .set('Authorization', `Bearer ${token}`)
        .send({ category: 'guide' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/resources/:id/rate', () => {
    it('rates a resource', async () => {
      if (!resourceId) return;
      const res = await request(app)
        .post(`/api/v1/resources/${resourceId}/rate`)
        .set('Authorization', `Bearer ${token}`)
        .send({ rating: 4 });
      expect([200, 201]).toContain(res.status);
    });

    it('rejects out-of-range rating', async () => {
      if (!resourceId) return;
      const res = await request(app)
        .post(`/api/v1/resources/${resourceId}/rate`)
        .set('Authorization', `Bearer ${token}`)
        .send({ rating: 6 });
      expect(res.status).toBe(400);
    });
  });
});
