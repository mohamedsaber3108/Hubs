# USAM Hub

Professional ecosystem platform for Arab professionals — built with Node.js + Express + MySQL + React.

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/YOUR_ORG/usam-hub.git
cd usam-hub

# 2. Backend setup
cd backend
cp .env.example .env
# Fill in all values in .env (see Environment Variables section below)
npm install
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all

# 3. Start backend
node src/server.js
# Expected output:
#   ✓ Server running on port 3000
#   ✓ Database connected
#   ✓ Redis connected

# 4. Frontend setup (separate terminal)
cd ../frontend   # (or usam-frontend)
cp .env.example .env.local
npm install
npm run dev
# Expected: VITE ready at http://localhost:5173

# 5. Open browser
open http://localhost:5173
```

---

## Test Accounts

| Role        | Email                  | Password          |
|-------------|------------------------|-------------------|
| Super Admin | superadmin@gmail.com   | SuperAdmin@2025!  |
| Admin       | admin@gmail.com        | Admin@2025!       |
| Moderator   | moderator@gmail.com    | Moderator@2025!   |
| User        | user@gmail.com         | User@2025!        |

**Admin portal:** http://localhost:5173/admin  
**API docs (Swagger):** http://localhost:3000/api/docs  
**Health check:** http://localhost:3000/health

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Browser (React 18 + Vite + Axios)  :5173               │
│  - Auth via JWT (localStorage) + refresh cookie         │
│  - Socket.IO for real-time messages + notifications     │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS / WSS
┌────────────────────▼────────────────────────────────────┐
│  Nginx (reverse proxy + SSL)                            │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  Node.js + Express (PM2)  :3000                         │
│  - 19 route files, 25 controllers                       │
│  - JWT auth (15m access + 7d refresh httpOnly cookie)   │
│  - Separate admin JWT (type: 'admin')                   │
│  - Bull queues: email, notifications, cleanup           │
└──────┬─────────────┬──────────────┬─────────────────────┘
       │             │              │
  MySQL (RDS)    Redis (EC2)    AWS S3 / SES
```

---

## Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Backend   | Node.js v20, Express 4, Sequelize 6    |
| Database  | MySQL 8 (AWS RDS)                       |
| Cache     | Redis 7 (EC2-hosted)                    |
| Auth      | JWT access (15m) + refresh httpOnly (7d)|
| Frontend  | React 18, Vite, TypeScript, Tailwind    |
| Files     | AWS S3 + Multer                         |
| Email     | AWS SES / Nodemailer (SMTP fallback)    |
| Realtime  | Socket.IO (/chat + /notifications)      |
| AI        | Anthropic Claude (NomadAI chatbot)      |
| Deploy    | PM2 + Nginx + AWS EC2 (34.228.69.89)   |

---

## Key API Endpoints

```
POST   /api/v1/auth/register            Register new user
POST   /api/v1/auth/login               User login → access_token + refresh cookie
POST   /api/v1/auth/logout              Logout (revokes session)
POST   /api/v1/auth/refresh-token       Refresh access token via cookie
POST   /api/v1/auth/forgot-password     Send reset email
GET    /api/v1/users/me                 Get own profile (auth required)
PUT    /api/v1/users/me                 Update profile
GET    /api/v1/communities              List communities
GET    /api/v1/posts                    Paginated feed
POST   /api/v1/posts                    Create post
GET    /api/v1/events                   List events
GET    /api/v1/challenges               List challenges
GET    /api/v1/opportunities            List opportunities
GET    /api/v1/leaderboard              Global leaderboard
GET    /api/v1/search?q=&type=          Global search
POST   /api/v1/nomad/chat               NomadAI chatbot

POST   /api/v1/admin/auth/login         Admin login → admin JWT
GET    /api/v1/admin/dashboard/stats    Platform KPIs
GET    /api/v1/admin/users              User management
GET    /api/v1/admin/system/health      System health
```

---

## Running Tests

```bash
cd backend

# All tests
npm test

# Unit tests only (no DB required)
npm run test:unit

# Integration tests (requires MySQL + Redis)
npm run test:integration

# Coverage report
npm run test:coverage
```

---

## Deployment

See `DEPLOY_CHECKLIST.md` for the complete 13-section AWS deployment guide covering:
- RDS, EC2, S3, SES setup
- Nginx + SSL (Let's Encrypt)
- DNS configuration (Hostinger)
- Security hardening (SSH, Redis, UFW, Fail2Ban)
- GitHub Actions CI/CD (`ci.yml` + `deploy.yml`)
- Post-deploy smoke tests
- Rollback procedure

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill every value.
Key variables:

```bash
DB_HOST=<RDS endpoint>
JWT_ACCESS_SECRET=<64+ char random>
JWT_REFRESH_SECRET=<64+ char random>
ANTHROPIC_API_KEY=<from console.anthropic.com>
AWS_S3_BUCKET=usam-hub-storage
AWS_SES_FROM=noreply@yourdomain.com
REDIS_HOST=127.0.0.1
FRONTEND_URL=https://yourdomain.com
```

---

## Project Structure

```
usam-hub/
├── backend/
│   ├── src/
│   │   ├── controllers/    25 controllers
│   │   ├── models/         33 Sequelize models
│   │   ├── routes/v1/      19 route files
│   │   ├── middleware/      8 middleware files
│   │   ├── services/        email, S3, Redis, notification
│   │   ├── utils/           ApiError, ApiResponse, token, paginate
│   │   └── config/          database, redis, passport, swagger
│   ├── migrations/         16 migrations
│   ├── seeders/             6 seeders
│   └── tests/
│       ├── unit/            6 test files
│       └── integration/    15 test files (~130 cases)
├── frontend/              (usam-frontend)
│   └── src/
│       ├── pages/          26 pages
│       ├── components/     shared UI components
│       ├── hooks/api/      12 React Query hook modules
│       ├── services/       15 API service modules
│       ├── contexts/       AuthContext, AdminContext
│       └── admin/          7-panel admin dashboard
├── .github/workflows/
│   ├── ci.yml             lint → unit → integration → coverage → build
│   └── deploy.yml         build → SSH deploy → health check
├── DEPLOY_CHECKLIST.md    514-line AWS deploy guide
└── README.md              this file
```
