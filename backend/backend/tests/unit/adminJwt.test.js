'use strict';

// SEC-02: admin JWT secret resolution must (a) prefer ADMIN_JWT_SECRET,
// (b) FAIL CLOSED in production when it's unset, (c) fall back to
// JWT_ACCESS_SECRET only in non-production (dev convenience).
describe('getAdminJwtSecret (SEC-02 fail-closed)', () => {
  const ORIG = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIG };
    jest.resetModules();
  });

  function load() {
    jest.resetModules();
    return require('../../src/config/adminJwt').getAdminJwtSecret;
  }

  test('returns the dedicated ADMIN_JWT_SECRET when set', () => {
    process.env.ADMIN_JWT_SECRET = 'dedicated-admin-secret';
    process.env.JWT_ACCESS_SECRET = 'user-secret';
    expect(load()()).toBe('dedicated-admin-secret');
  });

  test('THROWS in production when ADMIN_JWT_SECRET is unset (fail closed)', () => {
    delete process.env.ADMIN_JWT_SECRET;
    process.env.NODE_ENV = 'production';
    process.env.JWT_ACCESS_SECRET = 'user-secret';
    expect(() => load()()).toThrow(/ADMIN_JWT_SECRET is required in production/);
  });

  test('falls back to JWT_ACCESS_SECRET in non-production when unset (dev only)', () => {
    delete process.env.ADMIN_JWT_SECRET;
    process.env.NODE_ENV = 'development';
    process.env.JWT_ACCESS_SECRET = 'user-secret';
    expect(load()()).toBe('user-secret');
  });

  test('prod-set admin secret is distinct from the user secret (isolation)', () => {
    process.env.NODE_ENV = 'production';
    process.env.ADMIN_JWT_SECRET = 'admin-only-secret';
    process.env.JWT_ACCESS_SECRET = 'user-only-secret';
    const secret = load()();
    expect(secret).toBe('admin-only-secret');
    expect(secret).not.toBe(process.env.JWT_ACCESS_SECRET);
  });
});
