'use strict';
require('dotenv').config();

const express        = require('express');
const helmet         = require('helmet');
const cors           = require('cors');
const compression    = require('compression');
const morgan         = require('morgan');
const cookieParser   = require('cookie-parser');
const responseTime   = require('response-time');
const mongoSanitize  = require('express-mongo-sanitize');
const xss            = require('xss-clean');
const swaggerUi      = require('swagger-ui-express');
const swaggerSpec    = require('./config/swagger');
const { globalLimiter } = require('./middleware/rateLimiter');
const errorHandler   = require('./middleware/errorHandler');
const logger         = require('./utils/logger');

const app = express();

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',').map((o) => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    logger.warn('CORS blocked: ' + origin);
    cb(new Error('CORS not allowed'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
}));

app.set('trust proxy', 1);

// ─── Body / Cookie ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Sanitization ─────────────────────────────────────────────────────────────
app.use(mongoSanitize());
app.use(xss());

// ─── Compression & Response Time ──────────────────────────────────────────────
app.use(compression());
app.use(responseTime((req, res, time) => {
  res.setHeader('X-Response-Time', time.toFixed(2) + 'ms');
}));

// ─── HTTP Logging ─────────────────────────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
  skip: (req) => req.url === '/health' || req.url === '/api/v1/health',
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use(globalLimiter);

// ─── Passport ─────────────────────────────────────────────────────────────────
const passport = require('./config/passport');
app.use(passport.initialize());

// ─── Health Checks ────────────────────────────────────────────────────────────
const healthRouter = require('./routes/v1/health.routes');
app.get('/health', (req, res, next) => {
  req.url = '/';
  healthRouter(req, res, next);
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/v1', require('./routes/v1/index'));

// ─── Swagger UI ───────────────────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'USAM Hub API Docs',
  customCss: '.swagger-ui .topbar { background-color: #6366f1 }',
}));

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found: ' + req.originalUrl });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
