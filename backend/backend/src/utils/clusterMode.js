'use strict';

// Detects whether this process is part of a multi-worker Socket.IO cluster.
// Used by server.js to decide whether a missing/failed Redis adapter is fatal
// (cluster -> fail closed) or an acceptable single-process degrade (dev).
//
// Signals, in order:
//   - SOCKET_CLUSTER_MODE=true  (explicit; set by deploy/pm2.config.js)
//   - exec_mode === 'cluster_mode'  (PM2 sets this in cluster mode)
//   - NODE_APP_INSTANCE >= 1  (PM2's 0-based worker index; >=1 proves a 2nd worker)
//
// `env` is injectable for testing.
function isClusterMode(env = process.env) {
  if (String(env.SOCKET_CLUSTER_MODE).toLowerCase() === 'true') return true;
  if (env.exec_mode === 'cluster_mode') return true;
  const instance = parseInt(env.NODE_APP_INSTANCE, 10);
  if (!Number.isNaN(instance) && instance >= 1) return true;
  return false;
}

module.exports = { isClusterMode };
