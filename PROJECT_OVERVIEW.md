# USAM Hub — Project Overview

> Living reference document. Update this file whenever architecture, features, or setup steps change, so it stays the single source of truth for understanding the project.

## 1. What this project is

**USAM Hub** is a full-stack community/networking platform aimed at Arab professionals. It brings together social feed, communities, groups, events, challenges, job opportunities, learning resources, mentorship, gamification (leaderboard), real-time messaging, and an AI chatbot assistant (NomadAI), plus a fully isolated admin dashboard.

Repo root: `m:\HUb_comunites`
Source: https://github.com/Mahmoud-Elwazeer/hub (private)

## 2. Repository layout

```
m:\HUb_comunites
├── README.md                     # minimal, just "# hub"
├── PROJECT_OVERVIEW.md           # this file
├── frontend\                     # React/Vite app (project root for frontend commands)
│   ├── src\
│   │   ├── pages\                 # 26 route-level pages
│   │   ├── components\            # shared UI, shadcn primitives, NomadAI widget, MobileNav, ProtectedRoute
│   │   ├── services\              # API service layer (per-domain *.service.ts + consolidated api.service.ts — see §6 inconsistencies)
│   │   ├── hooks\api\             # React Query hooks per domain (useAuth, useFeed, useCommunities, ...)
│   │   ├── contexts\              # AuthContext, UserContext
│   │   ├── lib\                   # api.ts (axios), socket.ts, types.ts, queryKeys.ts, env.ts
│   │   ├── i18n\                  # LanguageContext (AR/EN)
│   │   ├── admin\                 # fully separate admin dashboard subtree (own api client/context/types)
│   │   └── test\                  # vitest setup
│   ├── .env.example
│   ├── package.json
│   └── PHASE_5_SUMMARY.md
└── backend\                       # NOTE: contains deploy docs/scripts, NOT the Node project itself
    ├── backend\                   # <-- actual backend project root (run npm commands HERE)
    │   ├── src\
    │   │   ├── app.js              # Express app wiring (helmet, cors, rate limit, swagger, routes)
    │   │   ├── server.js           # HTTP server + Socket.IO (/chat, /notifications) + DB/Redis bootstrap
    │   │   ├── config\              # database.js, redis.js, aws.js, passport.js, swagger.js
    │   │   ├── controllers\        # 25 files (auth, user, community, post, group, event, challenge, opportunity, resource, leaderboard, mentor, message, nomad, onboarding, search, admin.*)
    │   │   ├── routes\v1\           # 19 route files mounted via routes/v1/index.js
    │   │   ├── middleware\          # auth.js, adminAuth.js, role.js, validate.js, rateLimiter.js, cache.js, errorHandler.js, upload.js
    │   │   ├── models\              # 33 Sequelize models
    │   │   ├── services\            # email, S3, Redis, notification services
    │   │   ├── jobs\                # Bull queues + node-cron
    │   │   └── utils\ validations\
    │   ├── migrations\             # 16 files -> 33 tables
    │   ├── seeders\                 # 6 files (admins, communities, settings, pricing, demo users, email templates)
    │   ├── .env.example / .env.test
    │   └── package.json
    ├── deploy\                     # deploy.sh, ec2-setup.sh, nginx.conf, pm2.config.js, rds-init.sql, rollback.sh, ssl-setup.sh
    ├── DEPLOY_CHECKLIST.md         # 13-section AWS production deploy guide
    ├── README.md                   # quick start + seeded test accounts
    └── PHASE_1..4_7_SUMMARY.md      # phase completion docs
```

## 3. Tech stack

**Frontend:** React 18.3, Vite 5.4, TypeScript 5.8, Tailwind CSS 3.4, shadcn/ui + Radix primitives, React Router v6, TanStack React Query v5, Axios, socket.io-client, react-hook-form + zod, next-themes (dark mode), Vitest + Testing Library.

**Backend:** Node.js ≥20, Express 4.18, Sequelize 6.35 (ORM) over MySQL 8, Redis (ioredis) for cache/token-blacklist/queues, Socket.IO (realtime chat + notifications), Bull + node-cron (jobs), Passport (JWT + Google/GitHub/Facebook/LinkedIn OAuth2), bcrypt, speakeasy/qrcode (admin TOTP 2FA), Multer + Sharp + AWS S3 (uploads), AWS SES + Nodemailer (email), Joi (validation), Helmet/CORS/rate-limit/mongo-sanitize/xss-clean (security), Swagger UI (`/api/docs`), Anthropic Claude API (NomadAI chatbot), Jest + Supertest (tests).

**Infra/deploy target:** Single AWS EC2 instance running the Express app under PM2 behind Nginx, MySQL on RDS, Redis on the same EC2 box. Deploy scripts and a detailed checklist live under `backend/deploy/` and `backend/DEPLOY_CHECKLIST.md`.

## 4. How frontend and backend connect

- Frontend dev server: Vite on `:5173`. Backend dev server: Express on `:3000` (API docs at `:3000/api/docs`).
- REST base URL: `VITE_API_URL` (default `http://localhost:3000/api/v1`).
- WebSocket base URL: `VITE_WS_URL` (default `http://localhost:3000`), namespaces `/chat` and `/notifications`.
- CORS on backend restricted to `CORS_ALLOWED_ORIGINS` (default `http://localhost:5173`), `credentials: true`.
- Auth: JWT access token (15 min) returned in response body, stored in `localStorage`; JWT refresh token (7 days) set as httpOnly cookie, rotated on refresh, tracked in a `sessions` table + Redis. Frontend's `lib/api.ts` auto-refreshes on 401 with a request queue, and dispatches a global `auth:logout` DOM event on refresh failure.
- Admin auth is entirely separate: its own JWT (`type: 'admin'` claim), own `adminAuth.js` middleware, own `localStorage` key (`admin_access_token`), optional TOTP 2FA. Cannot be mixed with user JWTs.

## 5. Feature inventory (route ↔ controller ↔ page, all confirmed implemented)

| Feature | Backend | Frontend |
|---|---|---|
| Auth (register/login/refresh/forgot-reset/verify + 4 OAuth) | `auth.routes.js` | `SignIn.tsx` / `SignUp.tsx` |
| Users/Profile (avatar, skills, follow, notifications, sessions) | `user.routes.js` + `profile.routes.js` | `Profile.tsx` / `ProfileEdit.tsx` / `Settings.tsx` |
| Communities (FreelanceSpace, StudentZone, HR Connect, LaunchPad) | community routes | `Communities.tsx` |
| Posts/Feed (CRUD, likes, nested comments, media) | post routes | `Feed.tsx` |
| Groups (public/private/invite-only) | group routes | `Groups.tsx` / `GroupDetail.tsx` |
| Events (RSVP, capacity) | event routes | `Events.tsx` / `EventDetail.tsx` |
| Challenges (submissions, voting, points) | challenge routes | `Challenges.tsx` / `ChallengeDetail.tsx` |
| Opportunities (8 types, applications, resume upload) | opportunity routes | `Opportunities.tsx` |
| Resources (downloads, ratings) | resource routes | `Resources.tsx` |
| Leaderboard/gamification | leaderboard routes | `Leaderboard.tsx` |
| Mentors (requests, sessions) | mentor routes | `Mentors.tsx` |
| Messaging (real-time 1:1 chat) | message routes + Socket.IO `/chat` | `Messages.tsx` |
| Search (8 entity types) | search routes | `SearchPage.tsx` |
| Discover (people/communities) | — | `Discover.tsx` |
| Onboarding (multi-step) | onboarding routes | `Onboarding.tsx` |
| NomadAI chatbot (Claude, bilingual) | nomad routes | `NomadAI.tsx` (global widget) |
| Admin dashboard (7 panels) | 10 `admin.*` controllers | `/admin` route, isolated subtree |
| Pricing/Subscriptions | pricing/subscriptions tables | `Pricing.tsx` |
| i18n (AR/EN) | — | `src/i18n/` |

## 6. Known inconsistencies / cleanup flags — VERIFIED (see docs/architecture/CURRENT_STATE_VERIFIED.md for full detail)

1. **Service layer — resolved, not actually duplicated in practice.** `frontend/src/services/api.service.ts` is dead code: its only consumer, `hooks/useApi.ts`, has zero importers anywhere in the live app. Every real page/hook imports the per-domain `frontend/src/services/*.service.ts` files directly. Safe to delete `api.service.ts`, `hooks/useApi.ts`, and the unused `services/index.ts` barrel.
2. **`Index.tsx` vs `Landing.tsx` — CORRECTED, `Landing.tsx` is NOT orphaned.** `Index.tsx` imports and renders `Landing` directly, and `Index` is the component mounted at route `/`. This earlier flag was wrong.
3. **Seed credential mismatch — CONFIRMED.** `backend/README.md`'s `@gmail.com` accounts match the actual seeder (`seeders/20240101000001-seed-admins.js`): `superadmin@gmail.com`/`SuperAdmin@2025!`, `admin@gmail.com`/`Admin@2025!`, `moderator@gmail.com`/`Moderator@2025!`. The `@usam.hub` references in `DEPLOY_CHECKLIST.md`/admin `PHASE_6_SUMMARY.md` are the inaccurate ones.
4. **Nested backend path** — the real Node project is `backend/backend/`, not `backend/`. Easy to run commands in the wrong directory.
5. **One unimplemented endpoint — CONFIRMED.** SES bounce webhook `POST /api/v1/webhooks/ses-bounce` does not exist anywhere in source (grepped `src/`, zero matches, no `/webhooks` router mounted).
6. **Two real bugs found and fixed during the Oct 2026 baseline audit** (branch `audit/baseline-verification`): a Jest config error that broke 100% of backend tests (`setupFiles` vs `setupFilesAfterEnv`), and a missing admin-role authorization check that let any admin role (including `moderator`) flush the production Redis cache, toggle maintenance mode, and write platform settings. See `docs/audit/SECURITY_AND_PRODUCTION_GAPS.md` for full detail — the role-check fix has not yet been execution-verified against a live database.
7. **This document previously declared "all 7 phases complete per docs."** That claim came from the docs, not from running code. The verified baseline audit found the test suite was completely non-functional (bug, not just missing DB) and found one real exploitable authorization gap — treat any remaining unverified claims in the PHASE_*_SUMMARY.md files with the same skepticism until independently confirmed. See `docs/architecture/CURRENT_STATE_VERIFIED.md` for what has actually been checked against source.

## 7. Setup / run locally

```powershell
# Backend — run from m:\HUb_comunites\backend\backend
Copy-Item .env.example .env   # fill in DB_*, JWT_*, REDIS_*, AWS_*, OAuth creds, ANTHROPIC_API_KEY
npm install
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
npm run dev                    # nodemon src/server.js -> http://localhost:3000, docs at /api/docs

# Frontend — run from m:\HUb_comunites\frontend (separate terminal)
Copy-Item .env.example .env.local
npm install
npm run dev                    # Vite -> http://localhost:5173
```

Prerequisites: a running **MySQL 8** instance and a running **Redis** instance — `server.js` retries 5x with backoff then exits if either is unreachable.

Seeded test accounts (per `backend/README.md` — verify against seeder, see §6.3):
- Super Admin: `superadmin@gmail.com` / `SuperAdmin@2025!`
- Admin: `admin@gmail.com` / `Admin@2025!`
- Moderator: `moderator@gmail.com` / `Moderator@2025!`
- User: `user@gmail.com` / `User@2025!`

Tests (from `backend/backend`): `npm test`, `npm run test:unit` (no DB), `npm run test:integration` (needs MySQL+Redis), `npm run test:coverage`.

## 8. Launch blockers (pre-production, from DEPLOY_CHECKLIST.md)

- Replace placeholder domain (`yourdomain.com`) across `nginx.conf`, `ssl-setup.sh`, `.env.example`, `ec2-setup.sh`
- Set real GitHub repo URL in `ec2-setup.sh`
- Change default super-admin credentials before going live
- Generate real JWT secrets (64+ chars), Redis password, RDS password
- Create OAuth apps (Google/GitHub/Facebook/LinkedIn) — strategies skip silently if env vars absent
- Verify AWS SES domain, exit SES sandbox
- Create S3 buckets (`usam-hub-storage`, `usam-hub-private`)
- Implement SES bounce webhook (see §6.5)

## 9. Suggested next steps to continue building

1. Get a reachable MySQL + Redis instance (local Docker once available, or a remote dev DB) so the backend test suite — now fixed, previously 100% broken — can actually run and the new regression test can be verified red/green.
2. Delete the confirmed-dead frontend files (`api.service.ts`, `hooks/useApi.ts`, `services/index.ts`, `lib/mockPhase4Data.ts`) as a quick, safe cleanup PR.
3. Decide and implement the SES bounce webhook if email bounce handling matters for your use case.
4. Answer the essential questions in the master-prompt audit report (central IdP, Jobs/Education/Freelancing integration shape, payment provider) before starting the larger SSO/tenancy/payments work.
5. Pick one feature area at a time to extend rather than broad "edit everything" passes, given the scope of ~400 files already in place.

## 10. Full audit trail

A deeper, evidence-based audit was performed on `audit/baseline-verification` branch (Oct 2026) per a master development prompt. See:
- `docs/architecture/CURRENT_STATE_VERIFIED.md` — verified architecture with file:line references
- `docs/audit/FEATURE_MATRIX.md` — route-by-route status
- `docs/audit/SECURITY_AND_PRODUCTION_GAPS.md` — 10 findings (SEC-01 through SEC-10), 2 already fixed
- `docs/ROADMAP.md` — parallel-track backlog
- `docs/OPEN_SOURCE_REGISTRY.md` — Keycloak/OpenFGA/Novu/GrowthBook/Chatwoot evaluated
- `docs/INTEGRATION_CONTRACTS.md`, `docs/TEST_AND_RELEASE_PLAN.md`, `docs/architecture/TARGET_ARCHITECTURE.md`, `docs/architecture/ADR-001-sso-identity.md`, `docs/architecture/ADR-002-tenancy-model.md`
