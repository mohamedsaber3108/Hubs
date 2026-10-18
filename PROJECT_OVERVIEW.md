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
6. **18 real bugs found and fixed across two development sessions** (branch `audit/baseline-verification`, all execution-verified against a real local MySQL+Redis via `docker-compose.dev.yml`): a Jest config error that broke 100% of backend tests, a missing admin-role authorization check (any admin role could flush the production Redis cache / toggle maintenance mode / write platform settings), an email-validation bug that rejected the project's own `.hub`-TLD addresses, and 14 column/association/validation bugs across opportunities, mentors, resources, challenges, communities, search, admin dashboard/logs, events, and leaderboard endpoints — most of these made the endpoint's happy path return a raw 500. All fixed; full backend test suite is now 195/195 passing. See `docs/audit/SECURITY_AND_PRODUCTION_GAPS.md` and the git log for exact detail.
7. **This document previously declared "all 7 phases complete per docs."** That claim came from the docs, not from running code. Once the integration test suite was actually executed for the first time (previously blocked on no local DB — resolved via `docs/DEV_ENVIRONMENT_SETUP.md`), it went from never-run to 120/155 passing to 155/155 after fixing the bugs above. The lesson holds: treat any remaining unverified claims in the PHASE_*_SUMMARY.md files with the same skepticism until independently confirmed. See `docs/architecture/CURRENT_STATE_VERIFIED.md` for what has actually been checked against source.
8. **Dependency security**: 2 critical vulnerabilities fixed on each side (backend: `tar` via override; frontend: `tinypool` via override + `react-router-dom` patch bump) without `npm audit fix --force`. Remaining non-critical findings are dev-tooling major-version bumps, deferred to `docs/ROADMAP.md` Track A8 as individually-tested follow-up PRs.

## 7. Setup / run locally

**Full step-by-step guide: `docs/DEV_ENVIRONMENT_SETUP.md`.** Summary:

```powershell
# 1. Start local MySQL + Redis via Docker Compose
cd backend/backend
docker compose -f docker-compose.dev.yml up -d   # MySQL on :3306, Redis on :6380 (not 6379 -- see setup doc)

# 2. Backend — run from m:\HUb_comunites\backend\backend
Copy-Item .env.example .env   # fill in DB_*, JWT_*, REDIS_PORT=6380, AWS_*, OAuth creds, ANTHROPIC_API_KEY
npm install
npm run migrate
npm run seed
npm run dev                    # nodemon src/server.js -> http://localhost:3000, docs at /api/docs

# 3. Frontend — run from m:\HUb_comunites\frontend (separate terminal)
Copy-Item .env.example .env.local
npm install
npm run dev                    # Vite -> http://localhost:5173
```

If Docker Desktop can't be started on your machine, `docs/DEV_ENVIRONMENT_SETUP.md` has a no-Docker fallback (native install / WSL2 / free-tier cloud DB).

Seeded test accounts (confirmed against the real seeder, `seeders/20240101000001-seed-admins.js` and `...005-seed-demo-users.js`):
- Super Admin: `superadmin@gmail.com` / `SuperAdmin@2025!`
- Admin: `admin@gmail.com` / `Admin@2025!`
- Moderator: `moderator@gmail.com` / `Moderator@2025!`
- User: `user@gmail.com` / `User@2025!`

Tests (from `backend/backend`): `npm test` (195 tests, 22 suites, all passing), `npm run test:unit` (36 tests, no DB needed at all), `npm run test:integration` (155 tests, needs the Docker Compose stack running), `npm run test:coverage`.

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

1. Delete the confirmed-dead frontend files (`api.service.ts`, `hooks/useApi.ts`, `services/index.ts`, `lib/mockPhase4Data.ts`) as a quick, safe cleanup PR — re-verify zero importers (including dynamic imports) immediately before deleting.
2. Decide and implement the SES bounce webhook if email bounce handling matters for your use case.
3. Add a real backend ESLint config (currently none exists — `npm run lint` fails outright) and work through the frontend's 81 pre-existing lint issues.
4. Resolve the `Event.type` schema gap (schema accepts it, no column exists to store it — see ROADMAP A14) and the admin/user JWT secret sharing (SEC-02) and OAuth token-in-URL (SEC-03) findings.
5. Answer the essential questions in the master-prompt audit report (central IdP, Jobs/Education/Freelancing integration shape, payment provider) before starting the larger SSO/tenancy/payments work.
6. Pick one feature area at a time to extend rather than broad "edit everything" passes, given the scope of ~400 files already in place.

## 9b. Ecosystem context

USAM Hub (this project) is one of five USAM-family products, each its own repo/stack/domain under `usamif.com`: E-USAM (`edu.usamif.com`, e-learning), USAM for Kids (`kids.usamif.com`), Noventra (`noventra.com`, study-abroad fairs — the misleadingly-named `jobs.usamif` folder), and USAMKO (`usamko.usamif.com`, B2B lead-gen). A verified read-only inspection of all five — stacks, auth systems, databases, domains, duplication, and a proposed unified SSO/shared-services architecture — is in `docs/ecosystem/ECOSYSTEM_ARCHITECTURE_AND_INTEGRATION.md`. Note: whether `hub.usamif.com` is this project's intended domain is **unverified** (its nginx still uses a placeholder); see that report §2.

## 9c. Communities audit & architecture decisions

A source-verified, code-level audit of the four communities (FreelanceSpace, StudentZone, HR Connect, LaunchPad) found the platform is currently **one generic community app with four cosmetic skins** — real/working social core, but no persona differentiation, no opportunity intelligence, no marketplace, and a **broken onboarding flow (HTTP 500, verified live)**. Full findings + a P0/P1/P2 plan:
- `docs/communities/COMMUNITIES_ARCHITECTURE_AND_GAP_REPORT.md`
- `docs/communities/COMMUNITIES_ROADMAP.md`

Five architecture decisions (provider-independent, nothing deployed) are recorded as ADRs:
- `ADR-003` — `hub.usamif.com` is a candidate domain only (no DNS/nginx change)
- `ADR-004` — provider-independent OIDC SSO (Cognito vs Keycloak comparison, not finalized)
- `ADR-005` — E-USAM payments is a candidate shared-billing service pending a suitability audit
- `ADR-006` — global organization identity, product-isolated membership/data (supersedes ADR-002)
- `ADR-007` — opportunities ownership + provider-independent USAM Jobs integration (Noventra is NOT Jobs)

## 10. Full audit trail

A deeper, evidence-based audit was performed on `audit/baseline-verification` branch (Oct 2026) per a master development prompt. See:
- `docs/architecture/CURRENT_STATE_VERIFIED.md` — verified architecture with file:line references
- `docs/audit/FEATURE_MATRIX.md` — route-by-route status
- `docs/audit/SECURITY_AND_PRODUCTION_GAPS.md` — 10 findings (SEC-01 through SEC-10), 2 already fixed
- `docs/ROADMAP.md` — parallel-track backlog
- `docs/OPEN_SOURCE_REGISTRY.md` — Keycloak/OpenFGA/Novu/GrowthBook/Chatwoot evaluated
- `docs/INTEGRATION_CONTRACTS.md`, `docs/TEST_AND_RELEASE_PLAN.md`, `docs/architecture/TARGET_ARCHITECTURE.md`, `docs/architecture/ADR-001-sso-identity.md`, `docs/architecture/ADR-002-tenancy-model.md`
