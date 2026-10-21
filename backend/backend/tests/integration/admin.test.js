'use strict';
const request = require('supertest');
const bcrypt  = require('bcrypt');
const app     = require('../../src/app');
const { Admin, User } = require('../../src/models');

describe('Admin API', () => {
  let adminToken;
  const adminCreds = { email: 'admin_test@usam.hub', password: 'Admin@Test1234!' };

  beforeAll(async () => {
    const hash = await bcrypt.hash(adminCreds.password, 12);
    await Admin.findOrCreate({
      where: { email: adminCreds.email },
      defaults: { email: adminCreds.email, password_hash: hash, name: 'Test Admin', role: 'super_admin', is_active: true },
    });
  });

  describe('POST /api/v1/admin/auth/login', () => {
    it('logs in admin with valid credentials', async () => {
      const res = await request(app).post('/api/v1/admin/auth/login').send(adminCreds);
      expect(res.status).toBe(200);
      expect(res.body.data.access_token).toBeDefined();
      expect(res.body.data.admin.role).toBe('super_admin');
      adminToken = res.body.data.access_token;
    });

    it('rejects wrong password with 401', async () => {
      const res = await request(app).post('/api/v1/admin/auth/login').send({ ...adminCreds, password: 'wrong' });
      expect(res.status).toBe(401);
    });

    it('rejects inactive admin', async () => {
      const hash = await bcrypt.hash('Pass@1234!', 12);
      await Admin.create({ email: 'inactive@usam.hub', password_hash: hash, name: 'Inactive', role: 'admin', is_active: false });
      const res = await request(app).post('/api/v1/admin/auth/login').send({ email: 'inactive@usam.hub', password: 'Pass@1234!' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/admin/auth/me', () => {
    it('returns admin profile with valid token', async () => {
      const res = await request(app).get('/api/v1/admin/auth/me').set('Authorization', 'Bearer ' + adminToken);
      expect(res.status).toBe(200);
      expect(res.body.data.admin.email).toBe(adminCreds.email);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/v1/admin/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/admin/dashboard/stats', () => {
    it('returns dashboard stats', async () => {
      const res = await request(app).get('/api/v1/admin/dashboard/stats').set('Authorization', 'Bearer ' + adminToken);
      expect(res.status).toBe(200);
      expect(res.body.data.users).toBeDefined();
      expect(res.body.data.content).toBeDefined();
    });
  });

  describe('GET /api/v1/admin/dashboard/charts', () => {
    it('returns chart data', async () => {
      const res = await request(app).get('/api/v1/admin/dashboard/charts?days=7').set('Authorization', 'Bearer ' + adminToken);
      expect(res.status).toBe(200);
      expect(res.body.data.user_registrations).toBeDefined();
    });
  });

  describe('GET /api/v1/admin/users', () => {
    it('returns paginated user list', async () => {
      const res = await request(app).get('/api/v1/admin/users').set('Authorization', 'Bearer ' + adminToken);
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.pagination).toBeDefined();
    });

    it('filters by status', async () => {
      const res = await request(app).get('/api/v1/admin/users?status=active').set('Authorization', 'Bearer ' + adminToken);
      expect(res.status).toBe(200);
    });

    it('supports search', async () => {
      const res = await request(app).get('/api/v1/admin/users?search=test').set('Authorization', 'Bearer ' + adminToken);
      expect(res.status).toBe(200);
    });
  });

  describe('PATCH /api/v1/admin/users/:id/status', () => {
    let testUserId;

    beforeAll(async () => {
      const hash = await bcrypt.hash('User@1234!', 12);
      const user = await User.create({
        first_name: 'Status', last_name: 'Test',
        username: 'statustest_' + Date.now(),
        email: 'statustest' + Date.now() + '@example.com',
        password_hash: hash, email_verified: true,
      });
      testUserId = user.id;
    });

    it('suspends a user', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/users/' + testUserId + '/status')
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ status: 'suspended', reason: 'Test suspension' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('suspended');
    });

    it('reinstates a user', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/users/' + testUserId + '/status')
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ status: 'active' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('active');
    });

    it('rejects invalid status', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/users/' + testUserId + '/status')
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ status: 'invalid_status' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/admin/settings', () => {
    it('returns site settings', async () => {
      const res = await request(app).get('/api/v1/admin/settings').set('Authorization', 'Bearer ' + adminToken);
      expect(res.status).toBe(200);
      expect(res.body.data.settings).toBeDefined();
    });
  });

  describe('PUT /api/v1/admin/settings/:key', () => {
    it('updates a setting', async () => {
      const res = await request(app)
        .put('/api/v1/admin/settings/test_key_' + Date.now())
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ value: 'test_value' });
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/admin/flags', () => {
    it('returns feature flags', async () => {
      const res = await request(app).get('/api/v1/admin/flags').set('Authorization', 'Bearer ' + adminToken);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.flags)).toBe(true);
    });
  });

  describe('GET /api/v1/admin/content/posts', () => {
    it('returns posts list', async () => {
      const res = await request(app).get('/api/v1/admin/content/posts').set('Authorization', 'Bearer ' + adminToken);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/admin/content/communities', () => {
    it('returns communities list', async () => {
      const res = await request(app).get('/api/v1/admin/content/communities').set('Authorization', 'Bearer ' + adminToken);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/admin/analytics/users', () => {
    it('returns user analytics', async () => {
      const res = await request(app).get('/api/v1/admin/analytics/users?period=month').set('Authorization', 'Bearer ' + adminToken);
      expect(res.status).toBe(200);
      expect(res.body.data.total).toBeDefined();
    });
  });

  describe('GET /api/v1/admin/logs', () => {
    it('returns activity logs', async () => {
      const res = await request(app).get('/api/v1/admin/logs').set('Authorization', 'Bearer ' + adminToken);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/admin/system/health', () => {
    it('returns system health', async () => {
      const res = await request(app).get('/api/v1/admin/system/health').set('Authorization', 'Bearer ' + adminToken);
      expect([200, 503]).toContain(res.status);
      expect(res.body.data.process).toBeDefined();
    });
  });

  describe('GET /api/v1/admin/system/maintenance', () => {
    it('returns maintenance status', async () => {
      const res = await request(app).get('/api/v1/admin/system/maintenance').set('Authorization', 'Bearer ' + adminToken);
      expect(res.status).toBe(200);
      expect(res.body.data.maintenance).toBeDefined();
    });
  });

  describe('GET /api/v1/admin/admins', () => {
    it('super_admin can list admins', async () => {
      const res = await request(app).get('/api/v1/admin/admins').set('Authorization', 'Bearer ' + adminToken);
      expect(res.status).toBe(200);
    });
  });

  // SEC-02: admin tokens are signed/verified with ADMIN_JWT_SECRET, which is
  // distinct from JWT_ACCESS_SECRET. An admin-shaped token forged with the USER
  // secret must NOT be accepted by admin endpoints.
  describe('SEC-02 — admin token secret isolation', () => {
    const jwt = require('jsonwebtoken');

    it('rejects an admin-shaped token signed with the USER secret', async () => {
      const forged = jwt.sign({ sub: 1, role: 'super_admin', type: 'admin' }, process.env.JWT_ACCESS_SECRET, { expiresIn: '2h' });
      const res = await request(app).get('/api/v1/admin/auth/me').set('Authorization', 'Bearer ' + forged);
      expect(res.status).toBe(401);
    });

    it('accepts a token signed with the ADMIN secret (control)', async () => {
      // adminToken came from a real login (signed with ADMIN_JWT_SECRET) and works.
      const res = await request(app).get('/api/v1/admin/auth/me').set('Authorization', 'Bearer ' + adminToken);
      expect(res.status).toBe(200);
    });
  });
});
