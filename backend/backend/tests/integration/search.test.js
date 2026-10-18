'use strict';
const request = require('supertest');
const app     = require('../../src/app');
const { createUserAndLogin } = require('../helpers');

describe('Search API', () => {
  let token;

  beforeAll(async () => {
    ({ token } = await createUserAndLogin());
  });

  describe('GET /api/v1/search', () => {
    it('works without authentication (public, like other list endpoints)', async () => {
      // search.routes.js intentionally uses optionalAuth (same pattern
      // as communities/resources/mentors/etc.) -- this test previously
      // asserted a 401 that the route was never designed to return.
      const res = await request(app).get('/api/v1/search?q=test');
      expect(res.status).toBe(200);
    });

    it('returns multi-type results', async () => {
      const res = await request(app)
        .get('/api/v1/search?q=test')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it('rejects missing query param', async () => {
      const res = await request(app)
        .get('/api/v1/search')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it('supports type filter', async () => {
      const res = await request(app)
        .get('/api/v1/search?q=test&type=users')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });
});
