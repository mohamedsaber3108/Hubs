'use strict';
const bcrypt = require('bcrypt');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../../src/utils/token');

describe('Security — Password Hashing', () => {
  it('bcrypt hash differs from plain text', async () => {
    const plain = 'MyPassword123!';
    const hash  = await bcrypt.hash(plain, 10);
    expect(hash).not.toBe(plain);
    expect(hash.length).toBeGreaterThan(20);
  });

  it('bcrypt compare returns true for matching password', async () => {
    const plain = 'MyPassword123!';
    const hash  = await bcrypt.hash(plain, 10);
    expect(await bcrypt.compare(plain, hash)).toBe(true);
  });

  it('bcrypt compare returns false for wrong password', async () => {
    const hash = await bcrypt.hash('correct', 10);
    expect(await bcrypt.compare('wrong', hash)).toBe(false);
  });

  it('two hashes of same string differ (salt randomness)', async () => {
    const h1 = await bcrypt.hash('same', 10);
    const h2 = await bcrypt.hash('same', 10);
    expect(h1).not.toBe(h2);
  });
});

describe('Security — JWT', () => {
  const payload = { sub: 42, email: 'test@example.com', role: 'user', type: 'user' };

  it('generates a non-empty access token', () => {
    const t = generateAccessToken(payload);
    expect(typeof t).toBe('string');
    expect(t.split('.').length).toBe(3);
  });

  it('generates a non-empty refresh token', () => {
    const t = generateRefreshToken(payload);
    expect(typeof t).toBe('string');
    expect(t.split('.').length).toBe(3);
  });

  it('access and refresh tokens differ', () => {
    expect(generateAccessToken(payload)).not.toBe(generateRefreshToken(payload));
  });

  it('verifies a valid token', () => {
    const t = generateAccessToken(payload);
    const decoded = verifyToken(t, process.env.JWT_ACCESS_SECRET);
    expect(decoded.sub).toBe(42);
    expect(decoded.email).toBe('test@example.com');
  });

  it('throws on tampered token', () => {
    const t = generateAccessToken(payload);
    const tampered = t.slice(0, -5) + 'XXXXX';
    expect(() => verifyToken(tampered, process.env.JWT_ACCESS_SECRET)).toThrow();
  });

  it('throws when verifying a token signed with a different secret', () => {
    // verifyToken (= verifyAccessToken) intentionally always verifies
    // against process.env.JWT_ACCESS_SECRET and takes no secret
    // parameter -- letting a caller supply an arbitrary verification
    // secret would be a key-confusion vulnerability. So to prove
    // mismatched-secret tokens are rejected, sign with a different
    // secret directly via jsonwebtoken, not via a (nonexistent) second
    // argument to verifyToken.
    const jwt = require('jsonwebtoken');
    const foreignToken = jwt.sign(payload, 'a_completely_different_secret_value', { expiresIn: '15m' });
    expect(() => verifyToken(foreignToken, process.env.JWT_ACCESS_SECRET)).toThrow();
  });
});
