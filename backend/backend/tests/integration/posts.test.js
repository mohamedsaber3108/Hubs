'use strict';
const request = require('supertest');
const app     = require('../../src/app');
const { createUserAndLogin, getSeedCommunity } = require('../helpers');

describe('Posts / Feed API', () => {
  let token, user, community;

  beforeAll(async () => {
    ({ user, token } = await createUserAndLogin());
    community = await getSeedCommunity();
  });

  // ── GET feed ───────────────────────────────────────────────────────────────
  describe('GET /api/v1/posts', () => {
    it('returns paginated feed without auth', async () => {
      const res = await request(app).get('/api/v1/posts');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });

    it('supports community filter', async () => {
      const res = await request(app).get('/api/v1/posts?community=freelancespace');
      expect(res.status).toBe(200);
    });

    it('supports type filter', async () => {
      const res = await request(app).get('/api/v1/posts?type=text');
      expect(res.status).toBe(200);
    });

    it('supports pagination params', async () => {
      const res = await request(app).get('/api/v1/posts?page=1&limit=5');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  // ── POST create ────────────────────────────────────────────────────────────
  let createdPostId;
  describe('POST /api/v1/posts', () => {
    it('requires authentication', async () => {
      const res = await request(app).post('/api/v1/posts').send({ content: 'Hello' });
      expect(res.status).toBe(401);
    });

    it('creates a text post', async () => {
      const res = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${token}`)
        .field('content', 'Test post content #testing')
        .field('type', 'text')
        .field('community_slug', 'freelancespace');
      expect(res.status).toBe(201);
      expect(res.body.data.post.content).toBe('Test post content #testing');
      createdPostId = res.body.data.post.id;
    });

    it('rejects empty content', async () => {
      const res = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${token}`)
        .field('content', '');
      expect(res.status).toBe(400);
    });
  });

  // ── GET single post ────────────────────────────────────────────────────────
  describe('GET /api/v1/posts/:id', () => {
    it('returns a post by id', async () => {
      if (!createdPostId) return;
      const res = await request(app).get(`/api/v1/posts/${createdPostId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.post.id).toBe(createdPostId);
    });

    it('returns 404 for nonexistent post', async () => {
      const res = await request(app).get('/api/v1/posts/999999');
      expect(res.status).toBe(404);
    });
  });

  // ── Like toggle ────────────────────────────────────────────────────────────
  describe('POST /api/v1/posts/:id/like', () => {
    it('requires auth', async () => {
      const res = await request(app).post(`/api/v1/posts/${createdPostId}/like`);
      expect(res.status).toBe(401);
    });

    it('toggles like on own post', async () => {
      if (!createdPostId) return;
      const res = await request(app)
        .post(`/api/v1/posts/${createdPostId}/like`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(typeof res.body.data.liked).toBe('boolean');
    });
  });

  // ── Comments ───────────────────────────────────────────────────────────────
  let commentId;
  describe('POST /api/v1/posts/:id/comments', () => {
    it('adds a comment', async () => {
      if (!createdPostId) return;
      const res = await request(app)
        .post(`/api/v1/posts/${createdPostId}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Great post!' });
      expect(res.status).toBe(201);
      commentId = res.body.data.comment.id;
    });

    it('rejects empty comment', async () => {
      if (!createdPostId) return;
      const res = await request(app)
        .post(`/api/v1/posts/${createdPostId}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: '' });
      expect(res.status).toBe(400);
    });
  });

  // ── Delete ─────────────────────────────────────────────────────────────────
  describe('DELETE /api/v1/posts/:id', () => {
    it('requires auth', async () => {
      const res = await request(app).delete(`/api/v1/posts/${createdPostId}`);
      expect(res.status).toBe(401);
    });

    it('deletes own post', async () => {
      if (!createdPostId) return;
      const res = await request(app)
        .delete(`/api/v1/posts/${createdPostId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });
});
