'use strict';
const request = require('supertest');
const app     = require('../../src/app');
const { createUserAndLogin, getSeedCommunity } = require('../helpers');

describe('Groups API', () => {
  let token, user, community, groupId;

  beforeAll(async () => {
    ({ user, token } = await createUserAndLogin());
    community = await getSeedCommunity();
  });

  describe('GET /api/v1/groups', () => {
    it('returns group list publicly', async () => {
      const res = await request(app).get('/api/v1/groups');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('supports community filter', async () => {
      const res = await request(app).get('/api/v1/groups?community=freelancespace');
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/v1/groups', () => {
    it('requires authentication', async () => {
      const res = await request(app).post('/api/v1/groups').send({ name: 'x' });
      expect(res.status).toBe(401);
    });

    it('creates group with valid payload', async () => {
      const res = await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name:           'Test Group ' + Date.now(),
          description:    'A group for integration testing',
          visibility:     'public',
          community_slug: 'freelancespace',
        });
      expect(res.status).toBe(201);
      groupId = res.body.data.group.id;
    });

    it('rejects missing name', async () => {
      const res = await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'no name', community_id: community.id });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/groups/:id/join', () => {
    it('joins a public group', async () => {
      if (!groupId) return;
      const { token: token2 } = await createUserAndLogin();
      const res = await request(app)
        .post(`/api/v1/groups/${groupId}/join`)
        .set('Authorization', `Bearer ${token2}`);
      expect([200, 201]).toContain(res.status);
    });
  });

  describe('GET /api/v1/groups/:id', () => {
    it('returns group by id', async () => {
      if (!groupId) return;
      const res = await request(app).get(`/api/v1/groups/${groupId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.group.id).toBe(groupId);
    });
  });
});
