'use strict';
const { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken, hashToken, generateRandomToken } = require('../../src/utils/token');

describe('Token Utils', () => {
  test('generateAccessToken returns JWT string', () => {
    const token = generateAccessToken({ sub: 1, role: 'user' });
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  test('verifyAccessToken decodes payload correctly', () => {
    const payload = { sub: 42, uuid: 'abc', role: 'user' };
    const token   = generateAccessToken(payload);
    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe(42);
    expect(decoded.role).toBe('user');
  });

  test('hashToken is deterministic and unique', () => {
    const t = 'some-token-value';
    expect(hashToken(t)).toBe(hashToken(t));
    expect(hashToken(t)).not.toBe(hashToken(t + 'x'));
  });

  test('generateRandomToken returns 64-char hex string', () => {
    const t = generateRandomToken();
    expect(typeof t).toBe('string');
    expect(t).toHaveLength(64);
  });
});
