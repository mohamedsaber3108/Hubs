'use strict';
const request = require('supertest');
const app     = require('../../src/app');
const { createUserAndLogin, createVerifiedUser, loginUser, createAdmin, loginAdmin } = require('../helpers');
const { Organization } = require('../../src/models');

// End-to-end exercise of the Offers & Perks lifecycle:
// org create -> admin verify -> offer create (draft) -> submit (pending) ->
// admin approve -> appears in public catalog -> user redeems (promo code) ->
// usage limits + eligibility enforced.
describe('Offers & Perks API', () => {
  let owner, ownerToken;     // org owner / manager
  let shopper, shopperToken; // end user who redeems
  let adminToken;
  let orgSlug;
  let offerId;

  beforeAll(async () => {
    ({ user: owner, token: ownerToken } = await createUserAndLogin());
    ({ user: shopper, token: shopperToken } = await createUserAndLogin());
    const admin = await createAdmin();
    adminToken = await loginAdmin(admin.email);
  });

  // ─── Organizations ────────────────────────────────────────────────────────
  describe('Organizations', () => {
    it('requires auth to create an org', async () => {
      const res = await request(app).post('/api/v1/organizations').send({ name: 'Acme' });
      expect(res.status).toBe(401);
    });

    it('creates an org and makes the creator owner', async () => {
      const res = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Acme Perks Co', tagline: 'Deals for devs', website: 'https://acme.example' });
      expect(res.status).toBe(201);
      expect(res.body.data.organization.slug).toBeDefined();
      orgSlug = res.body.data.organization.slug;
    });

    it('lists orgs publicly', async () => {
      const res = await request(app).get('/api/v1/organizations');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('reports the viewer org role on the profile', async () => {
      const res = await request(app)
        .get(`/api/v1/organizations/${orgSlug}`)
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.my_role).toBe('owner');
    });

    it('forbids non-managers from updating the org', async () => {
      const res = await request(app)
        .put(`/api/v1/organizations/${orgSlug}`)
        .set('Authorization', `Bearer ${shopperToken}`)
        .send({ tagline: 'hacked' });
      expect(res.status).toBe(403);
    });
  });

  // ─── Offer creation + approval workflow ─────────────────────────────────────
  describe('Offer lifecycle', () => {
    it('forbids non-managers from creating an offer under the org', async () => {
      const res = await request(app)
        .post(`/api/v1/organizations/${orgSlug}/offers`)
        .set('Authorization', `Bearer ${shopperToken}`)
        .send({ title: 'Nope', description: 'x', redemption_type: 'manual' });
      expect(res.status).toBe(403);
    });

    it('creates an offer as draft', async () => {
      const res = await request(app)
        .post(`/api/v1/organizations/${orgSlug}/offers`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: '50% off Pro plan',
          description: 'Half off the annual Pro subscription for USAM members.',
          category: 'discount',
          discount_type: 'percentage',
          discount_value: 50,
          redemption_type: 'code',
          eligible_personas: ['freelancer'],
          per_user_limit: 1,
          total_limit: 2,
        });
      expect(res.status).toBe(201);
      expect(res.body.data.offer.status).toBe('draft');
      offerId = res.body.data.offer.id;
    });

    it('rejects a percentage discount over 100 at validation', async () => {
      const res = await request(app)
        .post(`/api/v1/organizations/${orgSlug}/offers`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ title: 'bad', description: 'xxxx', discount_type: 'percentage', discount_value: 150 });
      expect(res.status).toBe(400);
    });

    it('blocks submit until the org is verified', async () => {
      const res = await request(app)
        .post(`/api/v1/offers/${offerId}/submit`)
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/verified/i);
    });

    it('admin verifies the org', async () => {
      const org = await Organization.findOne({ where: { slug: orgSlug } });
      const res = await request(app)
        .patch(`/api/v1/admin/organizations/${org.id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ verified: true });
      expect(res.status).toBe(200);
      expect(res.body.data.organization.is_verified).toBe(true);
    });

    it('manager adds a promo code', async () => {
      const res = await request(app)
        .post(`/api/v1/offers/${offerId}/promo-codes`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ code: 'USAM50', max_uses: 5 });
      expect(res.status).toBe(201);
      expect(res.body.data.promo_code.code).toBe('USAM50');
    });

    it('submits the offer for review once verified', async () => {
      const res = await request(app)
        .post(`/api/v1/offers/${offerId}/submit`)
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.offer.status).toBe('pending');
    });

    it('offer is NOT in the public catalog while pending', async () => {
      const res = await request(app).get('/api/v1/offers');
      expect(res.status).toBe(200);
      expect(res.body.data.find((o) => o.id === offerId)).toBeUndefined();
    });

    it('admin approves the offer', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/offers/${offerId}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ decision: 'approved' });
      expect(res.status).toBe(200);
      expect(res.body.data.offer.status).toBe('approved');
    });

    it('approved offer now appears in the public catalog', async () => {
      const res = await request(app).get('/api/v1/offers');
      expect(res.status).toBe(200);
      expect(res.body.data.find((o) => o.id === offerId)).toBeDefined();
    });
  });

  // ─── Redemption + enforcement ───────────────────────────────────────────────
  describe('Redemption', () => {
    let freelancer, freelancerToken; // eligible persona
    let student, studentToken;       // ineligible persona

    beforeAll(async () => {
      freelancer = await createVerifiedUser({ professional_roles: ['freelancer'] });
      freelancerToken = await loginUser(freelancer.email);
      student = await createVerifiedUser({ professional_roles: ['student'] });
      studentToken = await loginUser(student.email);
    });

    it('rejects an ineligible persona with 403', async () => {
      const res = await request(app)
        .post(`/api/v1/offers/${offerId}/redeem`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it('lets an eligible persona redeem and reveals a code', async () => {
      const res = await request(app)
        .post(`/api/v1/offers/${offerId}/redeem`)
        .set('Authorization', `Bearer ${freelancerToken}`);
      expect(res.status).toBe(201);
      expect(res.body.data.code).toBe('USAM50');
      expect(res.body.data.redemption.status).toBe('redeemed');
    });

    it('enforces the per-user limit (second redeem by same user -> 409)', async () => {
      const res = await request(app)
        .post(`/api/v1/offers/${offerId}/redeem`)
        .set('Authorization', `Bearer ${freelancerToken}`);
      expect(res.status).toBe(409);
    });

    it('surfaces the redemption in the user history', async () => {
      const res = await request(app)
        .get('/api/v1/offers/redemptions/me')
        .set('Authorization', `Bearer ${freelancerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].offer.id).toBe(offerId);
    });

    it('enforces the total limit (sold out after cap reached)', async () => {
      // total_limit = 2; one redemption used. A second eligible freelancer
      // takes the last slot, a third is rejected.
      const f2 = await createVerifiedUser({ professional_roles: ['freelancer'] });
      const f2Token = await loginUser(f2.email);
      const ok = await request(app)
        .post(`/api/v1/offers/${offerId}/redeem`)
        .set('Authorization', `Bearer ${f2Token}`);
      expect(ok.status).toBe(201);

      const f3 = await createVerifiedUser({ professional_roles: ['freelancer'] });
      const f3Token = await loginUser(f3.email);
      const soldOut = await request(app)
        .post(`/api/v1/offers/${offerId}/redeem`)
        .set('Authorization', `Bearer ${f3Token}`);
      expect(soldOut.status).toBe(400);
      expect(soldOut.body.message).toMatch(/limit/i);
    });
  });

  // ─── Admin audit ────────────────────────────────────────────────────────────
  describe('Admin audit', () => {
    it('lists redemptions for an offer', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/offers/${offerId}/redemptions`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ─── Manager analytics + promo-code management (no admin privilege) ───────────
  describe('Manager analytics & promo-code management', () => {
    it('forbids a non-manager from viewing analytics', async () => {
      const res = await request(app)
        .get(`/api/v1/offers/${offerId}/analytics`)
        .set('Authorization', `Bearer ${shopperToken}`);
      expect(res.status).toBe(403);
    });

    it('lets the org manager view redemption analytics', async () => {
      const res = await request(app)
        .get(`/api/v1/offers/${offerId}/analytics`)
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.analytics.total_redemptions).toBeGreaterThanOrEqual(2);
      expect(res.body.data.analytics.by_status).toHaveProperty('redeemed');
      expect(Array.isArray(res.body.data.recent)).toBe(true);
      expect(res.body.data.analytics.promo_code_uses).toBeGreaterThanOrEqual(2);
    });

    it('lets the manager deactivate a promo code', async () => {
      const list = await request(app)
        .get(`/api/v1/offers/${offerId}/promo-codes`)
        .set('Authorization', `Bearer ${ownerToken}`);
      const codeId = list.body.data.promo_codes[0].id;
      const res = await request(app)
        .patch(`/api/v1/offers/${offerId}/promo-codes/${codeId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ is_active: false });
      expect(res.status).toBe(200);
      expect(res.body.data.promo_code.is_active).toBe(false);
    });

    it('rich-edits an offer and returns it to draft for re-review', async () => {
      const res = await request(app)
        .put(`/api/v1/offers/${offerId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ title: '50% off Pro plan (updated)', per_user_limit: 2, target_communities: ['freelancespace'] });
      expect(res.status).toBe(200);
      // Editing an approved offer sends it back to draft (re-approval required).
      expect(res.body.data.offer.status).toBe('draft');
    });
  });
});
