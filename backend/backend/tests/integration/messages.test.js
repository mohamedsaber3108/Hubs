'use strict';
const request = require('supertest');
const app     = require('../../src/app');
const { createUserAndLogin } = require('../helpers');

describe('Messages API', () => {
  let token, user, token2, user2, conversationId;

  beforeAll(async () => {
    ({ user, token }   = await createUserAndLogin());
    ({ user: user2, token: token2 } = await createUserAndLogin());
  });

  describe('GET /api/v1/messages', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/messages');
      expect(res.status).toBe(401);
    });

    it('returns empty conversation list for new user', async () => {
      const res = await request(app)
        .get('/api/v1/messages')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/messages', () => {
    it('creates a conversation with another user', async () => {
      const res = await request(app)
        .post('/api/v1/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({ user_id: user2.id, message: 'Hello!' });
      expect([200, 201]).toContain(res.status);
      conversationId = res.body.data.conversation?.id;
    });

    it('rejects starting conversation with self', async () => {
      const res = await request(app)
        .post('/api/v1/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({ user_id: user.id, message: 'Hi me' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/messages/:id', () => {
    it('sends a message in the conversation', async () => {
      if (!conversationId) return;
      const res = await request(app)
        .post(`/api/v1/messages/${conversationId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Hello from integration test!' });
      expect(res.status).toBe(201);
      expect(res.body.data.message.content).toBe('Hello from integration test!');
    });

    it('rejects empty message', async () => {
      if (!conversationId) return;
      const res = await request(app)
        .post(`/api/v1/messages/${conversationId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: '' });
      expect(res.status).toBe(400);
    });
  });
});
