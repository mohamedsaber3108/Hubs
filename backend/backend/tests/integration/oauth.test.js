'use strict';
const request = require('supertest');
const jwt     = require('jsonwebtoken');
const app     = require('../../src/app');
const { findOrCreateOAuthUser } = require('../../src/config/passport');
const { User, OAuthAccount } = require('../../src/models');

// Automated OAuth harness using a MOCKED provider (no real credentials).
// The 'oauth-mock' passport strategy + /auth/oauth-mock/callback route exist
// only under NODE_ENV==='test' and run the real findOrCreateOAuthUser +
// oauthCallback pipeline, driven by an x-mock-oauth-profile header.
describe('OAuth (mocked provider) — end-to-end', () => {
  const uniq = () => Math.random().toString(36).slice(2, 8);

  function mockProfile(over = {}) {
    const id = 'mock_' + uniq();
    return {
      id,
      _provider: 'google',
      displayName: 'OAuth User',
      emails: [{ value: `oauth_${id}@example.com` }],
      photos: [{ value: 'https://example.com/a.png' }],
      ...over,
    };
  }

  // ─── findOrCreateOAuthUser (the real provider-verify logic) ─────────────────
  describe('findOrCreateOAuthUser', () => {
    it('creates a new verified user + OAuthAccount link on first login', async () => {
      const profile = mockProfile();
      const user = await findOrCreateOAuthUser(profile, 'google', 'at', 'rt');
      expect(user.email).toBe(profile.emails[0].value);
      expect(user.email_verified).toBe(true);
      const link = await OAuthAccount.findOne({ where: { provider: 'google', provider_id: profile.id } });
      expect(link).toBeTruthy();
    });

    it('reuses the existing link on repeat login (no duplicate user)', async () => {
      const profile = mockProfile();
      const u1 = await findOrCreateOAuthUser(profile, 'google', 'at', 'rt');
      const u2 = await findOrCreateOAuthUser(profile, 'google', 'at2', 'rt2');
      expect(u2.id).toBe(u1.id);
      const count = await User.count({ where: { email: profile.emails[0].value } });
      expect(count).toBe(1);
    });

    it('links OAuth to a pre-existing account with the same email', async () => {
      const email = `pre_${uniq()}@example.com`;
      const existing = await User.create({
        first_name: 'Pre', last_name: 'Existing', username: 'pre_' + uniq(),
        email, password_hash: 'x', email_verified: true, status: 'active',
      });
      const profile = mockProfile({ emails: [{ value: email }] });
      const user = await findOrCreateOAuthUser(profile, 'github', 'at', 'rt');
      expect(user.id).toBe(existing.id);
    });

    it('rejects a profile with no email', async () => {
      await expect(findOrCreateOAuthUser({ id: 'x', emails: [] }, 'google', 'a', 'r'))
        .rejects.toThrow(/missing email/i);
    });
  });

  // ─── Full callback -> cookie exchange -> session restore -> logout ──────────
  describe('callback pipeline', () => {
    it('callback sets an httpOnly refresh cookie and does NOT leak a token in the URL (SEC-03)', async () => {
      const res = await request(app)
        .get('/api/v1/auth/oauth-mock/callback')
        .set('x-mock-oauth-profile', JSON.stringify(mockProfile()));
      expect(res.status).toBe(302);
      // redirect carries no access token
      expect(res.headers.location).toContain('/auth/callback');
      expect(res.headers.location).not.toMatch(/token=/);
      // refresh cookie is set httpOnly
      const cookie = (res.headers['set-cookie'] || []).find((c) => c.startsWith('refresh_token='));
      expect(cookie).toBeDefined();
      expect(cookie.toLowerCase()).toContain('httponly');
    });

    it('exchanges the refresh cookie for an access token, then restores the session via /users/me', async () => {
      const agent = request.agent(app); // persists cookies like a browser
      const cb = await agent
        .get('/api/v1/auth/oauth-mock/callback')
        .set('x-mock-oauth-profile', JSON.stringify(mockProfile({ displayName: 'Jane Doe' })));
      expect(cb.status).toBe(302);

      // Frontend AuthCallback does exactly this: POST /auth/refresh-token with the cookie.
      const refreshed = await agent.post('/api/v1/auth/refresh-token').send({});
      expect(refreshed.status).toBe(200);
      const accessToken = refreshed.body.data.access_token;
      expect(accessToken).toBeTruthy();

      // Session restore: the access token loads the profile.
      const me = await request(app).get('/api/v1/users/me').set('Authorization', `Bearer ${accessToken}`);
      expect(me.status).toBe(200);
      expect(me.body.data.user.first_name).toBe('Jane');
    });

    it('logout revokes the session so the refresh cookie can no longer be exchanged', async () => {
      const agent = request.agent(app);
      await agent.get('/api/v1/auth/oauth-mock/callback').set('x-mock-oauth-profile', JSON.stringify(mockProfile()));
      const refreshed = await agent.post('/api/v1/auth/refresh-token').send({});
      const accessToken = refreshed.body.data.access_token;

      const out = await agent.post('/api/v1/auth/logout').set('Authorization', `Bearer ${accessToken}`).send({});
      expect(out.status).toBe(200);

      // After logout the (revoked) refresh token must not mint a new access token.
      const reuse = await agent.post('/api/v1/auth/refresh-token').send({});
      expect([401, 403]).toContain(reuse.status);
    });

    it('rejects an expired refresh token', async () => {
      // Forge a refresh token that is already expired (signed with the refresh secret).
      const expired = jwt.sign({ sub: 999999, remember: false }, process.env.JWT_REFRESH_SECRET, { expiresIn: '-1s' });
      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', [`refresh_token=${expired}`])
        .send({});
      expect(res.status).toBe(401);
    });

    it('handles provider failure (no profile) by redirecting with an error, no cookie', async () => {
      const res = await request(app).get('/api/v1/auth/oauth-mock/callback'); // no x-mock-oauth-profile header
      expect(res.status).toBe(302);
      expect(res.headers.location).toMatch(/error=oauth_failed/);
      const cookie = (res.headers['set-cookie'] || []).find((c) => c.startsWith('refresh_token='));
      expect(cookie).toBeUndefined();
    });
  });
});
