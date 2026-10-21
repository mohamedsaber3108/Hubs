'use strict';
const { isClusterMode } = require('../../src/utils/clusterMode');

describe('isClusterMode (Socket.IO fail-closed detection)', () => {
  test('false for an empty / single-worker environment', () => {
    expect(isClusterMode({})).toBe(false);
  });

  test('true when SOCKET_CLUSTER_MODE=true (explicit, set by PM2 config)', () => {
    expect(isClusterMode({ SOCKET_CLUSTER_MODE: 'true' })).toBe(true);
    expect(isClusterMode({ SOCKET_CLUSTER_MODE: 'TRUE' })).toBe(true);
  });

  test('false when SOCKET_CLUSTER_MODE is any non-true value', () => {
    expect(isClusterMode({ SOCKET_CLUSTER_MODE: 'false' })).toBe(false);
    expect(isClusterMode({ SOCKET_CLUSTER_MODE: '1' })).toBe(false);
  });

  test('true when PM2 reports exec_mode cluster_mode', () => {
    expect(isClusterMode({ exec_mode: 'cluster_mode' })).toBe(true);
  });

  test('true when NODE_APP_INSTANCE index proves a 2nd worker (>= 1)', () => {
    expect(isClusterMode({ NODE_APP_INSTANCE: '1' })).toBe(true);
    expect(isClusterMode({ NODE_APP_INSTANCE: '3' })).toBe(true);
  });

  test('false for worker index 0 alone (could be a single-instance launch)', () => {
    expect(isClusterMode({ NODE_APP_INSTANCE: '0' })).toBe(false);
  });
});
