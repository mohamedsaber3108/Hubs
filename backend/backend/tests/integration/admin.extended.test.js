'use strict';
const request = require('supertest');
const app     = require('../../src/app');
const { createAdmin, loginAdmin, createUserAndLogin } = require('../helpers');

describe('Admin API — Extended', () => {
  let adminToken, testAdmin;

  beforeAll(async () => {
    testAdmin  = await createAdmin();
    adminToken = await loginAdmin(testAdmin.email);
  });

  describe('Admin Auth', () => {
    it('returns 401 with invalid credentials', async () => {
      const res = await request(app).post('/api/v1/admin/auth/login')
        .send({ email: testAdmin.email, password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });

    it('GET /admin/auth/me returns admin profile', async () => {
      const res = await request(app)
        .get('/api/v1/admin/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.admin.email).toBe(testAdmin.email);
    });

    it('rejects user JWT on admin route', async () => {
      const { token } = await createUserAndLogin();
      const res = await request(app)
        .get('/api/v1/admin/auth/me')
        .set('Authorization', `Bearer ${token}`);
      // SEC-02: admin tokens are verified with a dedicated ADMIN_JWT_SECRET,
      // so a user token (signed with JWT_ACCESS_SECRET) now fails verification
      // outright (401) instead of passing verification and being rejected by
      // the type/role check (403). Either is a correct rejection.
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('Admin Dashboard', () => {
    it('GET /admin/dashboard/stats returns KPIs', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('users');
      expect(res.body.data).toHaveProperty('content');
    });

    it('GET /admin/dashboard/charts returns chart data', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard/charts')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('user_registrations');
    });

    it('GET /admin/dashboard/activity returns recent activity', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard/activity')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('activities');
    });
  });

  describe('Admin Users', () => {
    let createdUserId;

    it('GET /admin/users returns paginated list', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      if (res.body.data.length > 0) createdUserId = res.body.data[0].id;
    });

    it('supports search param', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users?search=test')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('supports status filter', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users?status=active')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('PATCH /admin/users/:id/status updates status', async () => {
      if (!createdUserId) return;
      const res = await request(app)
        .patch(`/api/v1/admin/users/${createdUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'suspended', reason: 'Integration test suspension' });
      expect([200, 400]).toContain(res.status); // 400 if it's the admin itself
    });
  });

  describe('Admin Content', () => {
    it('GET /admin/content/posts returns posts', async () => {
      const res = await request(app)
        .get('/api/v1/admin/content/posts')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('GET /admin/content/communities returns communities', async () => {
      const res = await request(app)
        .get('/api/v1/admin/content/communities')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('Admin Settings', () => {
    it('GET /admin/settings returns settings list', async () => {
      const res = await request(app)
        .get('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('settings');
    });

    it('GET /admin/flags returns feature flags', async () => {
      const res = await request(app)
        .get('/api/v1/admin/flags')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('flags');
    });

    it('PATCH /admin/flags/:name/toggle flips a flag', async () => {
      const flagsRes = await request(app)
        .get('/api/v1/admin/flags')
        .set('Authorization', `Bearer ${adminToken}`);
      const flag = flagsRes.body.data.flags?.[0];
      if (!flag) return;
      const res = await request(app)
        .patch(`/api/v1/admin/flags/${flag.name}/toggle`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      // Toggle back to restore
      await request(app)
        .patch(`/api/v1/admin/flags/${flag.name}/toggle`)
        .set('Authorization', `Bearer ${adminToken}`);
    });
  });

  describe('Admin System', () => {
    it('GET /admin/system/health returns health data', async () => {
      const res = await request(app)
        .get('/api/v1/admin/system/health')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('database');
    });

    it('GET /admin/system/maintenance returns maintenance state', async () => {
      const res = await request(app)
        .get('/api/v1/admin/system/maintenance')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(typeof res.body.data.maintenance).toBe('boolean');
    });
  });

  describe('Admin Logs', () => {
    it('GET /admin/logs returns paginated logs', async () => {
      const res = await request(app)
        .get('/api/v1/admin/logs')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /admin/logs/summary returns summary', async () => {
      const res = await request(app)
        .get('/api/v1/admin/logs/summary')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('Admin Analytics', () => {
    it('GET /admin/analytics/users returns user analytics', async () => {
      const res = await request(app)
        .get('/api/v1/admin/analytics/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('GET /admin/analytics/content returns content analytics', async () => {
      const res = await request(app)
        .get('/api/v1/admin/analytics/content')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('GET /admin/analytics/revenue returns revenue data', async () => {
      const res = await request(app)
        .get('/api/v1/admin/analytics/revenue')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });
});
