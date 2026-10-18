'use strict';
/**
 * Lightweight env-only setup for the "unit" Jest project. Unlike
 * tests/setup.js (used by the "integration" project), this file must
 * NEVER touch the database or Redis -- unit tests have to run with zero
 * external connectivity. It only sets the env vars that utils like
 * src/utils/token.js read directly (JWT secrets), which previously were
 * only set as an incidental side effect of the DB-connecting
 * tests/setup.js before that file's own beforeAll/afterAll could run.
 */
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET  || 'test_access_secret_at_least_32_chars_long_abc';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_at_least_32_chars_long_abc';
process.env.JWT_ACCESS_EXPIRES  = process.env.JWT_ACCESS_EXPIRES  || '15m';
process.env.JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';
