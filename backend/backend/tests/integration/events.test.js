'use strict';
const request = require('supertest');
const app     = require('../../src/app');
const { createUserAndLogin, getSeedCommunity } = require('../helpers');

describe('Events API', () => {
  let token, user, community, createdEventId;

  beforeAll(async () => {
    ({ user, token } = await createUserAndLogin());
    community = await getSeedCommunity();
  });

  describe('GET /api/v1/events', () => {
    it('returns event list publicly', async () => {
      const res = await request(app).get('/api/v1/events');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('supports community filter', async () => {
      const res = await request(app).get('/api/v1/events?community=freelancespace');
      expect(res.status).toBe(200);
    });

    it('supports type filter', async () => {
      const res = await request(app).get('/api/v1/events?type=online');
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/v1/events', () => {
    it('requires authentication', async () => {
      const res = await request(app).post('/api/v1/events').send({ title: 'Test' });
      expect(res.status).toBe(401);
    });

    it('creates an event with valid data', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Integration Test Event',
          description: 'A test event created during integration testing',
          type: 'online',
          community_slug: 'freelancespace',
          start_date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
          end_date:   new Date(Date.now() + 8 * 24 * 3600 * 1000).toISOString(),
        });
      expect(res.status).toBe(201);
      expect(res.body.data.event.title).toBe('Integration Test Event');
      createdEventId = res.body.data.event.id;
    });

    it('rejects missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'No dates' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/events/:id/rsvp', () => {
    it('RSVPs to a created event', async () => {
      if (!createdEventId) return;
      const res = await request(app)
        .post(`/api/v1/events/${createdEventId}/rsvp`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'going' });
      expect([200, 201]).toContain(res.status);
    });

    it('rejects invalid RSVP status', async () => {
      if (!createdEventId) return;
      const res = await request(app)
        .post(`/api/v1/events/${createdEventId}/rsvp`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'invalid_status' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/events/:id', () => {
    it('returns event by id', async () => {
      if (!createdEventId) return;
      const res = await request(app).get(`/api/v1/events/${createdEventId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.event.id).toBe(createdEventId);
    });

    it('returns 404 for nonexistent event', async () => {
      const res = await request(app).get('/api/v1/events/999999');
      expect(res.status).toBe(404);
    });
  });
});
