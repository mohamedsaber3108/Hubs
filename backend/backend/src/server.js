'use strict';
require('dotenv').config();
const http   = require('http');
const app    = require('./app');
const { Server: SocketServer } = require('socket.io');
const { sequelize } = require('./models');
const { getRedisClient } = require('./config/redis');
const logger = require('./utils/logger');
const { isClusterMode } = require('./utils/clusterMode');

const PORT = parseInt(process.env.PORT) || 3000;

// ─── HTTP Server ──────────────────────────────────────────────────────────────
const server = http.createServer(app);

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new SocketServer(server, {
  cors: {
    origin: (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:5173').split(',').map((o) => o.trim()),
    methods: ['GET','POST'],
    credentials: true,
  },
  transports: ['websocket','polling'],
});

// Attach io to app for use in controllers
app.set('io', io);

// ─── Socket.io Redis adapter (multi-worker fan-out) ─────────────────────────────
// Under PM2 cluster mode (deploy/pm2.config.js: instances:'max') each worker is
// a separate process with its own in-memory socket registry. Without a shared
// adapter, a broadcast from worker A never reaches clients on worker B, so chat
// messages and notifications silently fail to deliver. The Redis adapter puts
// every worker on a shared Redis pub/sub bus so broadcasts fan out across all
// workers.
//
// FAIL-CLOSED CONTRACT (per production-safety requirement):
//   When the deployment is a multi-worker cluster, a missing adapter means
//   silent, partial message loss — the worst kind of production bug. So in
//   cluster mode we REFUSE TO BOOT unless the adapter is wired to a reachable
//   Redis. We never silently degrade a cluster to single-process mode.
//   In single-worker / dev mode, degrading (log + continue) is correct and safe.
//
// Cluster mode is detected explicitly via SOCKET_CLUSTER_MODE=true (set by
// deploy/pm2.config.js), and defensively via PM2's own cluster signals — see
// src/utils/clusterMode.js (extracted so the fail-closed decision is unit-tested).

async function setupSocketAdapter() {
  const clusterMode = isClusterMode();
  try {
    const Redis = require('ioredis');
    const { createAdapter } = require('@socket.io/redis-adapter');
    const redisOpts = {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB) || 0,
      // Bounded, explicit connection attempt so a dead Redis fails fast instead
      // of ioredis retrying forever and hanging boot.
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => (times > 5 ? null : Math.min(times * 200, 1000)),
    };
    const pubClient = new Redis(redisOpts);
    const subClient = pubClient.duplicate();
    // Don't let transient adapter client errors take the process down AFTER it's
    // wired — log and keep serving. (Boot-time reachability is enforced below.)
    pubClient.on('error', (e) => logger.error('Socket.IO Redis pub client error: ' + e.message));
    subClient.on('error', (e) => logger.error('Socket.IO Redis sub client error: ' + e.message));

    // Require both clients to actually reach Redis within a bounded window,
    // otherwise treat as a hard failure (don't wire a dead adapter).
    const ready = (client) => new Promise((resolve, reject) => {
      if (client.status === 'ready') return resolve();
      const timer = setTimeout(() => reject(new Error('Redis connection timed out')), 10000);
      client.once('ready', () => { clearTimeout(timer); resolve(); });
      client.once('end', () => { clearTimeout(timer); reject(new Error('Redis connection closed')); });
    });
    await Promise.all([ready(pubClient), ready(subClient)]);

    io.adapter(createAdapter(pubClient, subClient));
    logger.info('Socket.IO Redis adapter enabled (multi-worker broadcast active)');
  } catch (err) {
    if (clusterMode) {
      // FAIL CLOSED: a cluster without a working adapter silently drops
      // cross-worker broadcasts. Refuse to start rather than serve a broken,
      // data-losing socket layer in production.
      logger.error(
        'FATAL: Socket.IO Redis adapter could not be initialized in cluster mode (' +
        err.message + '). Refusing to start — a multi-worker cluster without the ' +
        'Redis adapter silently loses cross-worker broadcasts (chat/notifications). ' +
        'Ensure @socket.io/redis-adapter is installed and Redis is reachable, or run ' +
        'a single worker (unset SOCKET_CLUSTER_MODE / instances:1).',
      );
      throw err; // propagates to start()'s catch -> process.exit(1)
    }
    logger.warn(
      'Socket.IO Redis adapter NOT enabled (' + err.message + '). ' +
      'Running single-process socket mode — safe for a single worker. ' +
      'Broadcasts will NOT cross workers; do not enable cluster mode without Redis.',
    );
  }
}

// Socket.io namespaces
const chatNS         = io.of('/chat');
const notificationNS = io.of('/notifications');

chatNS.on('connection', (socket) => {
  logger.info('Socket connected (chat): ' + socket.id);

  socket.on('join-conversation', (conversationId) => {
    socket.join('conversation:' + conversationId);
  });

  socket.on('send-message', (data) => {
    chatNS.to('conversation:' + data.conversationId).emit('new-message', data);
  });

  socket.on('typing', (data) => {
    socket.to('conversation:' + data.conversationId).emit('user-typing', data);
  });

  socket.on('disconnect', () => {
    logger.info('Socket disconnected (chat): ' + socket.id);
  });
});

notificationNS.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) socket.join('user:' + userId);

  socket.on('disconnect', () => {
    logger.info('Socket disconnected (notifications): ' + socket.id);
  });
});

// ─── DB + Redis Connection ────────────────────────────────────────────────────
async function connectWithRetry(fn, name, retries) {
  retries = retries || 5;
  for (let i = 0; i < retries; i++) {
    try {
      await fn();
      logger.info(name + ' connected');
      return;
    } catch (err) {
      logger.warn(name + ' connection attempt ' + (i + 1) + '/' + retries + ' failed: ' + err.message);
      if (i < retries - 1) await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
  throw new Error(name + ' failed to connect after ' + retries + ' attempts');
}

// ─── Start Server ─────────────────────────────────────────────────────────────
async function start() {
  try {
    await connectWithRetry(() => sequelize.authenticate(), 'MySQL');
    await connectWithRetry(() => getRedisClient().ping(), 'Redis');

    // Wire the Socket.IO Redis adapter now that Redis is confirmed reachable.
    await setupSocketAdapter();

    // Register background jobs
    require('./jobs/email.job');
    require('./jobs/cleanup.job');

    server.listen(PORT, () => {
      logger.info('═══════════════════════════════════════');
      logger.info('  USAM Hub API running on port ' + PORT);
      logger.info('  ENV: ' + (process.env.NODE_ENV || 'development'));
      logger.info('  Docs: http://localhost:' + PORT + '/api/docs');
      logger.info('═══════════════════════════════════════');
    });
  } catch (err) {
    logger.error('Failed to start server: ' + err.message);
    process.exit(1);
  }
}

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const shutdown = async (signal) => {
  logger.info('Received ' + signal + '. Graceful shutdown started...');
  server.close(async () => {
    try {
      await sequelize.close();
      await getRedisClient().quit();
      logger.info('Server shut down cleanly');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown: ' + err.message);
      process.exit(1);
    }
  });
  setTimeout(() => { logger.error('Forced shutdown'); process.exit(1); }, 30000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('uncaughtException',  (err) => { logger.error('Uncaught exception:', err); process.exit(1); });
process.on('unhandledRejection', (err) => { logger.error('Unhandled rejection:', err); process.exit(1); });

start();
