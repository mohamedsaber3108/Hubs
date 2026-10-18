'use strict';
/**
 * Split into two Jest "projects" so that true unit tests (tests/unit/**)
 * never load tests/setup.js's DB-connecting beforeAll/afterAll. Only
 * integration tests (tests/integration/**) need a reachable MySQL+Redis.
 *
 * Audit finding SEC-07 (docs/audit/SECURITY_AND_PRODUCTION_GAPS.md):
 * previously ALL test files shared one Jest config with
 * setupFilesAfterEnv pointed at tests/setup.js, which calls
 * sequelize.authenticate()/sync() in a global beforeAll. That meant
 * `npm run test:unit` could never pass without a live MySQL instance,
 * even though none of the unit test files (apiError, apiResponse,
 * paginate, security, token, validators) touch Sequelize at all.
 */
module.exports = {
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
      // Env-vars-only setup (JWT secrets), safe to run before the test
      // framework loads since it does no describe/beforeAll/DB calls.
      // Deliberately NOT setupFilesAfterEnv + tests/setup.js -- unit
      // tests must not require a database connection.
      setupFiles: ['<rootDir>/tests/unit/setup.unit.js'],
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    },
  ],
  // testTimeout/maxWorkers are not valid inside individual `projects`
  // entries in this Jest version -- apply them globally instead. 30s is
  // generous enough for both unit (instant) and integration (DB-bound).
  testTimeout: 30000,
  maxWorkers: 1,
  collectCoverageFrom: [
    'src/controllers/**/*.js',
    'src/middleware/**/*.js',
    'src/services/**/*.js',
    'src/utils/**/*.js',
    '!src/config/**',
  ],
  coverageThreshold: {
    global: {
      lines:      40,
      functions:  40,
      branches:   30,
      statements: 40,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
};
