# USAM Hub — Current State (Verified)

> Everything in this document was confirmed by reading source code directly (not by trusting PHASE_*_SUMMARY.md claims). File:line references are given where useful. Generated during the baseline audit on branch `audit/baseline-verification`.

## 1. Repository layout (verified)

```
m:\HUb_comunites
├── frontend\                      — React app, project root for frontend commands
└── backend\
    ├── backend\                   — ACTUAL Node project root (package.json, src/, migrations/, tests/)
    └── deploy\                    — AWS EC2/RDS/Nginx deploy scripts, not part of the app itself
```
`backend/` (one level above `backend/backend/`) contains only docs and deploy scripts — all `npm` commands must run from `backend/backend`.

## 2. Frontend — verified structure

- Stack: React 18.3, Vite 5.4, TypeScript 5.8, Tailwind 3.4, shadcn/ui + Radix, React Router v6.30, TanStack React Query v5.83, Axios 1.7.9, socket.io-client 4.8.1, react-hook-form+zod, Vitest 3.2.4 + Testing Library.
- `src/App.tsx` (112 lines): single `BrowserRouter`, 26 pages, provider nesting `QueryClientProvider → TooltipProvider → LanguageProvider → BrowserRouter → AuthProvider → Routes`. Full route table in `docs/audit/FEATURE_MATRIX.md`.
- **Service layer — resolved, not duplicated in practice.** `src/services/api.service.ts` (254 lines, 15 service objects) is imported by exactly one file, `src/hooks/useApi.ts` — which itself has zero importers anywhere in the live app. The real app runs entirely on per-domain `src/services/*.service.ts` files, confirmed by grepping every page/hook import statement. `api.service.ts`, `hooks/useApi.ts`, and the `src/services/index.ts` barrel are dead code.
- **`src/pages/Landing.tsx` is NOT dead code.** It is imported by `src/pages/Index.tsx:2` and rendered inside `Index`, which is mounted at route `/` (`App.tsx:66`). An earlier draft of `PROJECT_OVERVIEW.md` incorrectly flagged it as possibly orphaned — corrected here.
- **Mock data files**: `src/lib/mockData.ts` (narrow use: `SKILL_TAGS` in `ProfileEdit.tsx:6`) and `src/lib/mockFeedData.ts` (narrow use: `TRENDING_HASHTAGS` in `Feed.tsx:12`, with an inline comment acknowledging it's intentionally still mocked) are each used for cosmetic UI chrome only, not core data. `src/lib/mockPhase4Data.ts` has **zero importers anywhere** — fully dead code.
- **Admin subtree (`src/admin/`) is fully isolated** from the main app: separate axios client (`adminApi.ts`, baseURL + `/admin`, no `withCredentials`), separate `localStorage` key `admin_access_token`, separate `AdminContext`/`useAdminAuth`, separate nested `QueryClient` created in `pages/Admin.tsx:16-19`.
- **Auth token storage**: access token lives in `localStorage['access_token']` (`src/lib/api.ts:15-17`), attached via request interceptor, refreshed via 401-retry queue (`api.ts:29-64`), cleared + `auth:logout` event dispatched on refresh failure. Refresh token is an httpOnly cookie (`withCredentials: true` on the refresh call).
- **i18n/RTL**: `src/i18n/LanguageContext.tsx` correctly sets `dir`/`lang` attributes on `document.documentElement` (`<html>`, not `<body>`) and persists locale in `localStorage['usam-lang']`.
- Scripts (`package.json`): `dev` (vite), `build`, `build:dev`, `lint`, `preview`, `test` (`vitest run`), `test:watch`.

## 3. Backend — verified structure

- Stack: Node ≥20, Express 4.18.2, Sequelize 6.35.2 over MySQL 8 (`mysql2` 3.6.5), ioredis 5.3.2, Socket.IO 4.6.2, Bull 4.12.2 + node-cron, Passport (JWT + 4 OAuth strategies), bcrypt, speakeasy/qrcode (admin TOTP), Multer+Sharp+AWS S3, AWS SES+Nodemailer, Joi, Helmet/CORS/rate-limit, Swagger UI, Anthropic Claude API, Jest 29.7.0 + Supertest.
- `src/routes/v1/index.js` mounts 17 routers (no `/webhooks` router exists — the SES bounce webhook described in deploy docs is **not implemented anywhere in source**).
- `src/models/index.js`: 42 Sequelize models, all associations defined and cross-checked against 16 migration files — **no model/migration mismatches found**. One unmodeled relationship: `Mentor`↔`Community` is a loose JSON field, not a real association.
- `src/app.js` global middleware order: helmet → cors → trust proxy → json/urlencoded(10mb) → cookie-parser → mongo-sanitize → xss-clean → compression → response-time → morgan→winston → global rate limiter → passport.initialize → `/health` → `/api/v1` router → swagger `/api/docs` → 404 → error handler. Note: `express-mongo-sanitize` and `xss-clean` are leftover boilerplate — this project uses MySQL, not MongoDB.
- **Auth**: user JWT via Passport `jwt` strategy (`middleware/auth.js`), verified against `JWT_ACCESS_SECRET`, looks up `User` by `payload.sub`. Admin JWT via manual `jsonwebtoken.verify` (`middleware/adminAuth.js`) against the **same** `JWT_ACCESS_SECRET`, differentiated only by a `type: 'admin'` claim that the user-side Passport strategy never checks (see `docs/audit/SECURITY_AND_PRODUCTION_GAPS.md` SEC-02).
- Access tokens are returned in the response body (`auth.controller.js:132`) and in a URL query string on OAuth callback (`:322`); refresh tokens are httpOnly cookies tracked in the `sessions` table + Redis.
- Seeded accounts (local dev only, from `seeders/`): `superadmin@gmail.com`/`SuperAdmin@2025!`, `admin@gmail.com`/`Admin@2025!`, `moderator@gmail.com`/`Moderator@2025!`, `user@gmail.com`/`User@2025!` (primary test account), plus 4 demo users at `@demo.usam.hub`/`Demo@2025!`. This corrects a mismatch in other docs that reference `@usam.hub` admin credentials — the actual seeded value is `@gmail.com`.
- Scripts (`package.json`): `start`, `dev` (nodemon), `test`/`test:unit`/`test:integration`/`test:coverage` (jest), `migrate`/`migrate:undo`, `seed`/`seed:undo`, `lint`/`lint:fix`.

## 4. Verified bugs fixed during this audit pass

| ID | File | Bug | Fix |
|---|---|---|---|
| BUG-01 | `backend/backend/jest.config.js` | `setupFiles` used instead of `setupFilesAfterEnv` — ran before Jest's test framework loaded, so every `beforeAll`/`afterAll` in `tests/setup.js` threw `ReferenceError`, failing all 6 unit suites with 0 tests executed. Also a duplicate invalid `setupFilesAfterFramework` key and a misnamed `coverageThresholds` key. | Changed to `setupFilesAfterEnv`, removed the invalid key, renamed to `coverageThreshold`. Verified: re-run went from 0 tests executed to 36 tests executed (now blocked only by local MySQL unavailability, confirmed via `ECONNREFUSED 127.0.0.1:3306`). |
| SEC-01 | `backend/backend/src/routes/v1/admin.routes.js` | `requireAdminRole` middleware was imported but never applied to any route. `admin.settings.controller.js` and `admin.system.controller.js` had zero role checks of any kind (not even inline), so any authenticated admin — including the lowest `moderator` role — could flush the entire Redis cache, toggle site-wide maintenance mode, pause/resume/clean Bull queues, and write platform settings/feature-flags/pricing/email-templates. | Added `requireAdminRole('super_admin')` to the destructive system routes and `requireAdminRole('admin','super_admin')` to settings-write routes; reads remain open to all admin roles. Regression test added at `tests/integration/admin.authorization.test.js`, **not yet execution-verified against a live DB** (Docker daemon unavailable in this environment — see §5). |

Note: `admin.admins.controller.js` (the super-admin-only `/admins` CRUD) already had inline `role !== 'super_admin'` checks in every controller function — it was **not** actually vulnerable, correcting an earlier overclaim made mid-audit before the controller was read directly.

## 5. Verification limitations (explicit, not glossed over)

- No local MySQL or Redis instance was available (`Test-NetConnection localhost -Port 3306/6379` both returned `False`). Docker CLI is installed (v29.5.3) but the Docker daemon/service is not running, and starting it requires interactive/elevated permissions not available in this session.
- As a result: backend integration tests, full server boot (`npm run dev`), and the new `admin.authorization.test.js` regression test have **not been executed against a live database**. The jest.config.js fix was verified indirectly (failure mode changed from a config error to a pure connectivity error). The admin authorization fix was verified by code review only (confirmed no other role-check path exists, confirmed the pattern matches the one already used and tested in `admin.admins.controller.js`).
- Recommended next step: either (a) get Docker Desktop running interactively on this machine so I can spin up disposable MySQL+Redis containers for real red/green test verification, or (b) point me at a reachable dev MySQL/Redis (local service, remote dev DB, etc.).
