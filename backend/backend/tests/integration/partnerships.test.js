'use strict';
const request = require('supertest');
const app     = require('../../src/app');
const { createUserAndLogin } = require('../helpers');

// Partnership lifecycle between two organizations:
// orgA requests -> orgB sees incoming -> orgB accepts -> either ends.
describe('Organization Partnerships API', () => {
  let ownerA, tokenA, slugA;
  let ownerB, tokenB, slugB;
  let outsider, tokenOut;
  let partnershipId;

  async function createOrg(token, name) {
    const res = await request(app)
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name });
    return res.body.data.organization.slug;
  }

  beforeAll(async () => {
    ({ user: ownerA, token: tokenA } = await createUserAndLogin());
    ({ user: ownerB, token: tokenB } = await createUserAndLogin());
    ({ user: outsider, token: tokenOut } = await createUserAndLogin());
    slugA = await createOrg(tokenA, 'Partner Org A');
    slugB = await createOrg(tokenB, 'Partner Org B');
  });

  it('forbids a non-manager from requesting a partnership', async () => {
    const res = await request(app)
      .post(`/api/v1/organizations/${slugA}/partnerships`)
      .set('Authorization', `Bearer ${tokenOut}`)
      .send({ target_slug: slugB });
    expect(res.status).toBe(403);
  });

  it('rejects a self-partnership', async () => {
    const res = await request(app)
      .post(`/api/v1/organizations/${slugA}/partnerships`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ target_slug: slugA });
    expect(res.status).toBe(400);
  });

  it('lets org A request a partnership with org B', async () => {
    const res = await request(app)
      .post(`/api/v1/organizations/${slugA}/partnerships`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ target_slug: slugB, message: "Let's collaborate" });
    expect(res.status).toBe(201);
    expect(res.body.data.partnership.status).toBe('pending');
    partnershipId = res.body.data.partnership.id;
  });

  it('rejects a duplicate request in either direction', async () => {
    const res = await request(app)
      .post(`/api/v1/organizations/${slugB}/partnerships`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ target_slug: slugA });
    expect(res.status).toBe(409);
  });

  it('shows the request as incoming for org B', async () => {
    const res = await request(app)
      .get(`/api/v1/organizations/${slugB}/partnerships`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(200);
    const pr = res.body.data.partnerships.find((p) => p.id === partnershipId);
    expect(pr).toBeDefined();
    expect(pr.direction).toBe('incoming');
  });

  it('shows the request as outgoing for org A', async () => {
    const res = await request(app)
      .get(`/api/v1/organizations/${slugA}/partnerships`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.data.partnerships[0].direction).toBe('outgoing');
  });

  it('forbids the requester (org A) from accepting its own request', async () => {
    const res = await request(app)
      .patch(`/api/v1/organizations/${slugA}/partnerships/${partnershipId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ action: 'accept' });
    expect(res.status).toBe(403);
  });

  it('lets the recipient (org B) accept the request', async () => {
    const res = await request(app)
      .patch(`/api/v1/organizations/${slugB}/partnerships/${partnershipId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ action: 'accept' });
    expect(res.status).toBe(200);
    expect(res.body.data.partnership.status).toBe('accepted');
  });

  it('lets either party end an accepted partnership', async () => {
    const res = await request(app)
      .patch(`/api/v1/organizations/${slugA}/partnerships/${partnershipId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ action: 'end' });
    expect(res.status).toBe(200);
    expect(res.body.data.partnership.status).toBe('ended');
  });
});
