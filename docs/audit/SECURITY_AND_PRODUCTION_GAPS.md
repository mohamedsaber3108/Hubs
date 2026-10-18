# Security and Production Gaps

Severity scale: **Critical** (exploitable now, broad impact), **High** (exploitable now, scoped impact), **Medium** (hardening/defense-in-depth), **Low** (cleanup/consistency).

## SEC-01 — Admin role authorization bypass on destructive/sensitive routes — **High** — FIXED (not yet execution-verified)

**Where**: `backend/backend/src/routes/v1/admin.routes.js`, controllers `admin.system.controller.js` and `admin.settings.controller.js`.

**Issue**: `requireAdminRole` (`src/middleware/role.js`) was imported into `admin.routes.js` but never applied to any route. The two controllers above have no role checks of any kind — not even an inline one (confirmed via grep for `req.admin.role` across all admin controllers, zero matches in those two files).

**Impact (pre-fix)**: Any authenticated admin, including the lowest `moderator` role, could:
- `DELETE /api/v1/admin/system/cache` — flush the entire Redis cache (`redis.flushdb()`), with no production confirm gate bypassable for non-prod environments and a prod-only soft check already in place but irrelevant to the role gap.
- `PUT /api/v1/admin/system/maintenance` — put the entire site into maintenance mode for all users.
- `POST /api/v1/admin/system/queues/:queue/{pause,resume,clean}` — pause/resume/wipe Bull job queues (email, notifications, cleanup).
- `PUT /api/v1/admin/settings/:key`, `PUT /api/v1/admin/flags/:name/toggle`, `PUT /api/v1/admin/pricing/:id`, `PUT /api/v1/admin/email-templates/:name` — write platform-wide settings, feature flags, pricing plans, and email templates.

**Reproduction (safe, local-only)**: log in as the seeded `moderator@gmail.com` admin account, call `DELETE /api/v1/admin/system/cache` with the resulting Bearer token — pre-fix this returns 200; post-fix it returns 403.

**Fix applied**: added `requireAdminRole('super_admin')` to the destructive system routes, `requireAdminRole('admin', 'super_admin')` to the settings-write routes. Read-only routes (`GET /system/health`, `GET /settings`, etc.) remain open to all admin roles, unchanged.

**Correction to an earlier working note**: the super-admin-only `/admins` CRUD routes (create/update/delete/reset-password of other admin accounts) were initially suspected to be part of this gap too, but direct inspection of `admin.admins.controller.js` showed every one of those functions already has an inline `role !== 'super_admin'` guard. That sub-resource was never actually vulnerable.

**Status**: **Fully fixed and execution-verified.** A local Docker Compose MySQL+Redis dev environment was stood up (`backend/backend/docker-compose.dev.yml`, see `docs/DEV_ENVIRONMENT_SETUP.md`), and `tests/integration/admin.authorization.test.js` now passes 7/7 against a real database — confirming the fix works correctly with no typos or logic errors.

## SEC-02 — Admin and user JWTs share the same signing secret — **Medium**

**Where**: `src/middleware/auth.js` (Passport `jwt` strategy) and `src/middleware/adminAuth.js`.

**Issue**: Both user access tokens and admin access tokens are signed/verified with `process.env.JWT_ACCESS_SECRET`. They're distinguished only by a `type: 'admin'` claim. The user-facing Passport JWT strategy (`config/passport.js`) never checks `payload.type`, so a token carrying `type: 'admin'` and `sub` = some admin's id would still pass user-side `authenticate()` if a `User` row happens to exist with that same numeric id (admins and users are separate tables with independent auto-increment ids, so an id collision is plausible, especially early in the dataset's life).

**Impact**: Low likelihood (requires an id collision) but the consequence (an admin token being accepted as a user session for a different account) would be a cross-privilege-boundary bug, not just a cosmetic one.

**Status**: Not fixed this pass — recommend either (a) using a separate `ADMIN_JWT_SECRET` (which is already referenced in `.env.test`/deploy docs but currently dead code — see SEC-04), or (b) having the user-side strategy explicitly reject tokens with `type: 'admin'`. Needs a decision before implementing (minor behavior change to auth, flagged per the master prompt's "ask before changing shared interfaces" rule).

## SEC-03 — OAuth access token leaked via URL query string — **Medium**

**Where**: `src/controllers/auth.controller.js:322`, OAuth callback redirects to `'/auth/callback?token=' + access`.

**Issue**: Unlike the standard login flow (token in response body), the OAuth callback puts the raw access token in a URL query parameter. Query strings land in browser history, referrer headers (if the frontend callback page makes any further outbound request before clearing the URL), and server access logs.

**Impact**: Increases exposure surface for the access token specifically for OAuth logins.

**Status**: Not fixed this pass — recommend switching to a short-lived one-time code exchanged for the token via a POST request, or at minimum ensuring the frontend immediately strips the query string via `history.replaceState` after reading it (needs frontend trace to confirm current behavior before changing).

## SEC-04 — `ADMIN_JWT_SECRET` referenced in docs/test env but dead in code — **Low**

**Where**: `.env.test`, `DEPLOY_CHECKLIST.md` reference `ADMIN_JWT_SECRET`; actual code (`admin.auth.controller.js`) signs admin tokens with `JWT_ACCESS_SECRET`.

**Impact**: Documentation/implementation drift only — no functional impact today, but see SEC-02 for why wiring this up for real would help.

**Status**: Not fixed — flagged for the SEC-02 decision.

## SEC-05 — Env var drift between `.env.example` and actual code — **Low**

**Where**: `backend/backend/.env.example` vs `process.env.X` usage across `src/`.

- Declared in `.env.example` but unused anywhere in code: `AWS_S3_BUCKET_PRIVATE`, `AWS_SES_REPLY_TO`.
- Used in code but missing from `.env.example`: `ADMIN_JWT_EXPIRES`, `MAX_FILE_SIZE_MB`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`.

**Impact**: Anyone provisioning a new environment from `.env.example` alone would be missing working SMTP fallback config and the admin token TTL override, and would be confused by two unused AWS vars.

**Status**: Not fixed — low-risk doc/config cleanup, good candidate for a quick follow-up PR.

## SEC-06 — Test environment config does not match stated intent — **Low/Medium (blocks CI if unaddressed)**

**Where**: `.env.test` sets `DB_DIALECT=sqlite` / `DB_STORAGE=:memory:` with the comment "SQLite for tests (no MySQL needed)", but `src/config/database.js`'s `test` block hardcodes `dialect: 'mysql'` and never reads `DB_DIALECT`/`DB_STORAGE`. There is also no `sqlite3` package in `package.json` dependencies.

**Impact**: Running `npm run test:integration` (or `test:unit`, since `tests/setup.js`'s DB-connecting `beforeAll` currently applies globally — see SEC-07) requires a real reachable MySQL test database, contradicting the stated no-MySQL-needed intent. This is exactly what blocked full test execution in this audit pass.

**Status**: Not fixed — fixing properly means a decision: either (a) add `sqlite3` as a dependency and wire `config/database.js` to read `DB_DIALECT`/`DB_STORAGE` for the test env, or (b) drop the sqlite aspiration and document that integration tests require a real (ideally disposable/dockerized) MySQL instance. Per the master prompt's dependency-review rule, I did not add `sqlite3` unilaterally.

## SEC-07 — Unit tests are coupled to a DB-connecting global setup — **Low (test design issue)**

**Where**: `tests/unit/*.test.js` (apiError, apiResponse, paginate, security, token, validators) never import Sequelize models themselves, but `jest.config.js` applies `tests/setup.js` (which calls `sequelize.authenticate()` in a top-level `beforeAll`) to **all** test files via `setupFilesAfterEnv`, unit and integration alike.

**Impact**: True unit tests cannot run standalone without a DB connection, which defeats their purpose as a fast, dependency-free test tier. This is why `npm run test:unit` failed this pass even after fixing BUG-01 — not because the config was still broken, but because the shared setup file genuinely needs a DB.

**Status**: Not fixed — recommend splitting Jest config into two projects (unit: no setup file; integration: current setup file), or using Jest's `projects` config array. Flagged in the roadmap.

## SEC-08 — Dependency vulnerabilities (npm audit) — **Needs review, not auto-fixed**

- Frontend: 37 vulnerabilities (7 moderate, 28 high, 2 critical) per `npm install` output.
- Backend: 44 vulnerabilities (9 moderate, 34 high, 1 critical) per `npm install` output.

**Status**: Not auto-fixed with `npm audit fix --force` — that flag applies breaking-change upgrades without review, against the master prompt's dependency-review rule. Needs `npm audit` (full report) reviewed and triaged package-by-package, ideally as its own tracked PR with test coverage to catch breaking changes.

## SEC-09 — Boilerplate MongoDB-oriented middleware on a MySQL project — **Low**

**Where**: `src/app.js` applies `express-mongo-sanitize` and `xss-clean` globally, despite the project using MySQL/Sequelize exclusively, no MongoDB anywhere. `xss-clean` is also unmaintained upstream (confirmed via npm deprecation warning during install: "Package no longer supported").

**Impact**: No functional harm (sanitizing req body/query that will never contain Mongo operators is harmless), but it's dead weight and `xss-clean`'s unmaintained status means it won't receive security patches if a bypass is found.

**Status**: Not fixed — recommend removing `express-mongo-sanitize` and evaluating a maintained alternative to `xss-clean` (e.g. explicit output encoding at render time, or a maintained sanitization library) as a follow-up, low-risk PR.

## SEC-10 — NomadAI chat history persistence claim — **Confirmed false, not fixed**

**Where**: `src/controllers/nomad.controller.js`.

**Finding**: Phase docs claim NomadAI has "persisted history." Direct read of the full controller confirms this is **false** — there is no database model, no Redis call, nothing. The entire conversation history is passed in from the client as `req.body.history` on every request and capped to the last 10 messages (`history.slice(-10)`); nothing is ever written server-side.

**Impact**: Chat history is lost on page reload / device switch / any client-side state loss. Not a security issue, but a real functional gap behind an inaccurate doc claim.

**Status**: Not fixed — needs a design decision (persist to a new `NomadMessage`-style table? Redis with a TTL? neither, and just document the client-only behavior?) before implementing, per Track E in the roadmap (NomadAI multi-agent work).

## BUG-02 through BUG-16 — see git log on `audit/baseline-verification`

14 real runtime bugs (column/association mismatches, missing-validation gaps, wrong-model stats queries) and 2 test-expectation bugs were found and fixed by actually executing the full backend integration suite for the first time (previously blocked on no local MySQL/Redis, now resolved — see `docs/DEV_ENVIRONMENT_SETUP.md`). Full detail in the commit message for "fix: 16 real API bugs found by actually running the integration suite (BUG-03..16)". Verified: 195/195 backend tests passing (`npm test`).
