'use strict';
/**
 * Regression test for an authorization gap found during the baseline audit
 * (docs/audit/SECURITY_AND_PRODUCTION_GAPS.md, finding SEC-01):
 *
 * `requireAdminRole` (src/middleware/role.js) was imported into
 * src/routes/v1/admin.routes.js but never actually applied to any route.
 * As a result, destructive/sensitive admin endpoints — full Redis cache
 * flush, site-wide maintenance mode, Bull queue pause/resume/clean, and
 * platform settings/feature-flag/pricing/email-template writes — were
 * reachable by ANY authenticated admin, including the lowest `moderator`
 * role, not just `admin`/`super_admin`.
 *
 * These tests assert that a `moderator`-role admin receives 403 Forbidden
 * on those routes. Before the fix (see src/routes/v1/admin.routes.js),
 * these would incorrectly return 200/204.
 */
const request = require('supertest');
const bcrypt  = require('bcrypt');
const app     = require('../../src/app');
const { Admin } = require('../../src/models');

describe('Admin role authorization — sensitive routes', () => {
  let moderatorToken;
  let superAdminToken;
  const ts = Date.now();
  const moderatorCreds   = { email: `mod_authz_${ts}@usam.hub`, password: 'ModTest@1234!' };
  const superAdminCreds  = { email: `super_authz_${ts}@usam.hub`, password: 'SuperTest@1234!' };

  beforeAll(async () => {
    const modHash   = await bcrypt.hash(moderatorCreds.password, 12);
    const superHash = await bcrypt.hash(superAdminCreds.password, 12);
    await Admin.create({ email: moderatorCreds.email, password_hash: modHash, name: 'Mod Authz Test', role: 'moderator', is_active: true });
    await Admin.create({ email: superAdminCreds.email, password_hash: superHash, name: 'Super Authz Test', role: 'super_admin', is_active: true });

    let res = await request(app).post('/api/v1/admin/auth/login').send(moderatorCreds);
    if (res.status !== 200) {
      throw new Error('moderator login failed: status=' + res.status + ' body=' + JSON.stringify(res.body));
    }
    moderatorToken = res.body.data.access_token;

    res = await request(app).post('/api/v1/admin/auth/login').send(superAdminCreds);
    if (res.status !== 200) {
      throw new Error('super_admin login failed: status=' + res.status + ' body=' + JSON.stringify(res.body));
    }
    superAdminToken = res.body.data.access_token;
  });

  describe('System routes — destructive/infra actions require super_admin', () => {
    it('moderator CANNOT flush cache', async () => {
      const res = await request(app)
        .delete('/api/v1/admin/system/cache')
        .set('Authorization', 'Bearer ' + moderatorToken);
      expect(res.status).toBe(403);
    });

    it('moderator CANNOT toggle maintenance mode', async () => {
      const res = await request(app)
        .put('/api/v1/admin/system/maintenance')
        .set('Authorization', 'Bearer ' + moderatorToken)
        .send({ enabled: true, message: 'test' });
      expect(res.status).toBe(403);
    });

    it('moderator CANNOT pause a queue', async () => {
      const res = await request(app)
        .post('/api/v1/admin/system/queues/email/pause')
        .set('Authorization', 'Bearer ' + moderatorToken);
      expect(res.status).toBe(403);
    });

    it('super_admin CAN read system health (unaffected by fix)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/system/health')
        .set('Authorization', 'Bearer ' + superAdminToken);
      expect(res.status).toBe(200);
    });
  });

  describe('Settings routes — writes require admin or super_admin (not moderator)', () => {
    it('moderator CANNOT update a setting', async () => {
      const res = await request(app)
        .put('/api/v1/admin/settings/some_key')
        .set('Authorization', 'Bearer ' + moderatorToken)
        .send({ value: 'x' });
      expect(res.status).toBe(403);
    });

    it('moderator CANNOT toggle a feature flag', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/flags/some_flag/toggle')
        .set('Authorization', 'Bearer ' + moderatorToken);
      expect(res.status).toBe(403);
    });

    it('moderator CAN still read settings (unaffected by fix)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/settings')
        .set('Authorization', 'Bearer ' + moderatorToken);
      expect(res.status).toBe(200);
    });
  });
});
