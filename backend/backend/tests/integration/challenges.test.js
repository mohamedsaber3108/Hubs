'use strict';
const request = require('supertest');
const app     = require('../../src/app');
const { createUserAndLogin, getSeedCommunity } = require('../helpers');

describe('Challenges API', () => {
  let token, user, community, challengeId;

  beforeAll(async () => {
    // createChallenge requires moderator or admin role
    ({ user, token } = await createUserAndLogin({ role: 'moderator' }));
    community = await getSeedCommunity();
  });

  describe('GET /api/v1/challenges', () => {
    it('returns list publicly', async () => {
      const res = await request(app).get('/api/v1/challenges');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('supports status filter', async () => {
      const res = await request(app).get('/api/v1/challenges?status=open');
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/v1/challenges', () => {
    it('requires authentication', async () => {
      const res = await request(app).post('/api/v1/challenges').send({ title: 'x' });
      expect(res.status).toBe(401);
    });

    it('creates challenge with valid payload', async () => {
      const res = await request(app)
        .post('/api/v1/challenges')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title:          'Test Challenge',
          description:    'Challenge description for integration test',
          type:           'code',
          deadline:       new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
          community_slug: 'freelancespace',
          points_reward:  50,
        });
      expect(res.status).toBe(201);
      challengeId = res.body.data.challenge.id;
    });

    it('rejects missing title', async () => {
      const res = await request(app)
        .post('/api/v1/challenges')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'no title' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/challenges/:id', () => {
    it('returns challenge by id', async () => {
      if (!challengeId) return;
      const res = await request(app).get(`/api/v1/challenges/${challengeId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.challenge.id).toBe(challengeId);
    });

    it('returns 404 for nonexistent id', async () => {
      const res = await request(app).get('/api/v1/challenges/999999');
      expect(res.status).toBe(404);
    });
  });
});
