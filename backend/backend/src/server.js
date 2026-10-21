'use strict';
require('dotenv').config();
const http   = require('http');
const app    = require('./app');
const { Server: SocketServer } = require('socket.io');
const { sequelize } = require('./models');
const { getRedisClient } = require('./config/redis');
const logger = require('./utils/logger');

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
// messages and notifications silently fail to deliver in production. The Redis
// adapter puts every worker on a shared Redis pub/sub bus so broadcasts fan out
// across all workers. Implemented defensively: if the adapter package or Redis
// is unavailable, we log loudly and continue in single-process mode rather than
// crash — correct degradation (sockets still work within one worker).
async function setupSocketAdapter() {
  try {
    const Redis = require('ioredis');
    const { createAdapter } = require('@socket.io/redis-adapter');
    const redisOpts = {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB) || 0,
    };
    const pubClient = new Redis(redisOpts);
    const subClient = pubClient.duplicate();
    // Don't let adapter client errors take the process down — log and keep serving.
    pubClient.on('error', (e) => logger.error('Socket.IO Redis pub client error: ' + e.message));
    subClient.on('error', (e) => logger.error('Socket.IO Redis sub client error: ' + e.message));
    await Promise.all([
      pubClient.status === 'ready' ? Promise.resolve() : new Promise((res) => pubClient.once('ready', res)),
      subClient.status === 'ready' ? Promise.resolve() : new Promise((res) => subClient.once('ready', res)),
    ]);
    io.adapter(createAdapter(pubClient, subClient));
    logger.info('Socket.IO Redis adapter enabled (multi-worker broadcast active)');
  } catch (err) {
    logger.warn(
      'Socket.IO Redis adapter NOT enabled (' + err.message + '). ' +
      'Running single-process socket mode — safe for a single PM2 worker, but ' +
      'broadcasts will NOT cross workers under cluster mode. Install ' +
      '@socket.io/redis-adapter and ensure Redis is reachable for production clustering.',
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
