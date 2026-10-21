'use strict';

// Real cross-worker Socket.IO delivery test.
//
// Proves the production-critical guarantee: with the Redis adapter wired, a
// broadcast emitted from one worker reaches a client connected to a DIFFERENT
// worker. We simulate two PM2 cluster workers with two independent Socket.IO
// servers on two ports, both backed by the same Redis pub/sub bus, then verify
// a room broadcast crosses the worker boundary.
//
// Requires a reachable Redis (REDIS_HOST/REDIS_PORT from .env.test). If Redis
// is unavailable the suite fails rather than silently passing — a dead Redis is
// exactly the condition the fail-closed boot contract guards against.

const http = require('http');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');
const Redis = require('ioredis');
const { createAdapter } = require('@socket.io/redis-adapter');

const REDIS_OPTS = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 3,
};

// Spin up one "worker": an HTTP+Socket.IO server on an ephemeral port, wired to
// the Redis adapter, with the same /chat namespace + room semantics as server.js.
async function makeWorker() {
  const httpServer = http.createServer();
  const ioServer = new Server(httpServer, { transports: ['websocket'] });
  const pub = new Redis(REDIS_OPTS);
  const sub = pub.duplicate();
  ioServer.adapter(createAdapter(pub, sub));

  const chat = ioServer.of('/chat');
  chat.on('connection', (socket) => {
    socket.on('join-conversation', (id) => socket.join('conversation:' + id));
  });

  await new Promise((resolve) => httpServer.listen(0, resolve));
  const port = httpServer.address().port;
  return { httpServer, ioServer, pub, sub, chat, port };
}

async function closeWorker(w) {
  if (!w) return;
  await new Promise((r) => w.ioServer.close(() => r()));
  await new Promise((r) => w.httpServer.close(() => r()));
  w.pub.disconnect();
  w.sub.disconnect();
}

describe('Socket.IO Redis adapter — cross-worker delivery', () => {
  let workerA, workerB, client;

  beforeAll(async () => {
    workerA = await makeWorker();
    workerB = await makeWorker();
  });

  afterAll(async () => {
    if (client) client.close();
    await closeWorker(workerA);
    await closeWorker(workerB);
  });

  it('delivers a broadcast emitted on worker B to a client on worker A', async () => {
    const conversationId = 'conv-xworker-1';

    // Connect a client to WORKER A and join the conversation room.
    client = Client(`http://127.0.0.1:${workerA.port}/chat`, { transports: ['websocket'], forceNew: true });
    await new Promise((resolve, reject) => {
      client.on('connect', resolve);
      client.on('connect_error', reject);
      setTimeout(() => reject(new Error('client connect timeout')), 8000);
    });
    client.emit('join-conversation', conversationId);

    // Give the adapter a moment to propagate the room join across the bus.
    await new Promise((r) => setTimeout(r, 300));

    // Wait for the message on the client (connected to A)...
    const received = new Promise((resolve, reject) => {
      client.on('new-message', (msg) => resolve(msg));
      setTimeout(() => reject(new Error('cross-worker message not received')), 8000);
    });

    // ...but emit the broadcast from WORKER B. Only the Redis adapter can carry
    // this to the client on worker A.
    workerB.chat.to('conversation:' + conversationId).emit('new-message', { conversationId, text: 'hello across workers' });

    const msg = await received;
    expect(msg).toBeDefined();
    expect(msg.text).toBe('hello across workers');
    expect(msg.conversationId).toBe(conversationId);
  });
});
