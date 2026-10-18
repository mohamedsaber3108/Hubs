'use strict';
const request = require('supertest');
const app     = require('../../src/app');
const { createUserAndLogin, getSeedCommunity } = require('../helpers');

describe('Leaderboard API', () => {
  let token;

  beforeAll(async () => {
    ({ token } = await createUserAndLogin());
    // The community filter test below needs 'freelancespace' to
    // actually exist in this test run's (freshly sync'd) DB --
    // every other test file that filters by community calls this too.
    await getSeedCommunity();
  });

  describe('GET /api/v1/leaderboard', () => {
    it('returns leaderboard publicly', async () => {
      const res = await request(app).get('/api/v1/leaderboard');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('supports period=week filter', async () => {
      const res = await request(app).get('/api/v1/leaderboard?period=week');
      expect(res.status).toBe(200);
    });

    it('supports period=month filter', async () => {
      const res = await request(app).get('/api/v1/leaderboard?period=month');
      expect(res.status).toBe(200);
    });

    it('supports community filter', async () => {
      const res = await request(app).get('/api/v1/leaderboard?community=freelancespace');
      expect(res.status).toBe(200);
    });

    it('returns my rank when authenticated', async () => {
      const res = await request(app)
        .get('/api/v1/leaderboard/me')
        .set('Authorization', `Bearer ${token}`);
      expect([200, 404]).toContain(res.status); // 404 if no points yet
    });
  });
});
