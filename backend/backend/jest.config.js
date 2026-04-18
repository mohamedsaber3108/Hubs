'use strict';
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterFramework: [],
  globalSetup:    undefined,
  globalTeardown: undefined,
  setupFilesAfterFramework: [],
  // Each test file gets its own setup
  setupFiles: ['./tests/setup.js'],
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
  coverageThresholds: {
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
