'use strict';
const request = require('supertest');
const app     = require('../../src/app');
const { createUserAndLogin } = require('../helpers');

describe('Mentors API', () => {
  let token, user, mentorToken, mentorUser;

  beforeAll(async () => {
    ({ user, token } = await createUserAndLogin());
    ({ user: mentorUser, token: mentorToken } = await createUserAndLogin());
  });

  describe('GET /api/v1/mentors', () => {
    it('returns mentor list publicly', async () => {
      const res = await request(app).get('/api/v1/mentors');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('supports expertise filter', async () => {
      const res = await request(app).get('/api/v1/mentors?expertise=engineering');
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/v1/mentors', () => {
    it('requires authentication', async () => {
      const res = await request(app).post('/api/v1/mentors');
      expect(res.status).toBe(401);
    });

    it('submits mentor application', async () => {
      const res = await request(app)
        .post('/api/v1/mentors')
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({
          expertise:   ['engineering', 'startup'],
          bio:         'Experienced mentor with 10 years in tech',
          availability: 'weekends',
          max_mentees:  3,
        });
      expect([200, 201, 409]).toContain(res.status); // 409 if already applied
    });
  });
});
