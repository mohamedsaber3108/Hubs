'use strict';
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  globalSetup:    undefined,
  globalTeardown: undefined,
  // IMPORTANT: must be setupFilesAfterEnv, not setupFiles. `setupFiles` runs
  // before Jest's test framework (describe/it/beforeAll/afterAll) is
  // installed, so tests/setup.js's top-level beforeAll()/afterAll() calls
  // threw "ReferenceError: beforeAll is not defined" and every suite failed
  // to even load. setupFilesAfterEnv runs after the framework is ready.
  // (Audit finding, see docs/audit/SECURITY_AND_PRODUCTION_GAPS.md BUG-01.)
  setupFilesAfterEnv: ['./tests/setup.js'],
  // Run sequentially to avoid DB race conditions
  maxWorkers: 1,
  testTimeout: 30000,
  // Coverage settings
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
