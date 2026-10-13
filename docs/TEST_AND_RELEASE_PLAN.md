# Test and Release Plan

## Current state (verified this pass)

- Frontend: Vitest configured and working. Only one trivial placeholder test exists (`src/test/example.test.ts`) — effectively zero real test coverage today.
- Backend: Jest configured; was completely broken (BUG-01, now fixed) due to a `setupFiles`/`setupFilesAfterEnv` misconfiguration. 6 unit test files + 15 integration test files exist and are reasonably thorough in scope (auth, admin, communities, posts, groups, events, challenges, mentors, messages, opportunities, resources, search, leaderboard, users) — but **none were executed successfully this pass** because no local MySQL/Redis was reachable and the Docker daemon could not be started in this environment.
- No CI pipeline was verified this pass — `backend/PHASE_7_SUMMARY.md` claims `ci.yml`/`deploy.yml` exist under `.github/workflows/`, but this was not directly opened/confirmed. **Needs verification before trusting that claim.**

## Test pyramid (target)

1. **Unit** (fast, no DB/network): currently blocked by SEC-07 (unit tests coupled to the DB-connecting global setup). Fix: split Jest config so unit tests get no `setupFilesAfterEnv`.
2. **Integration** (real MySQL+Redis, in-process Express app via Supertest): 15 files already exist and look substantive — once a reachable test DB exists (local Docker or CI service container), these should be run and triaged for actual pass/fail, not assumed passing.
3. **E2E** (browser-level): not found in either frontend or backend. Master prompt requires RTL/responsive E2E smoke tests (Track F) — need Playwright or similar, net-new setup.

## CI gates (target, once G1 is verified/built)

- Lint (frontend `eslint .`, backend `eslint src/ --ext .js`)
- Typecheck (frontend `tsc` via `tsconfig.json`, not currently a separate script — needs adding)
- Unit tests (both sides)
- Integration tests (backend, against a service-container MySQL+Redis in CI)
- Security scan (`npm audit`, triaged not just run)
- Build (`vite build` for frontend; backend has no build step, it's plain Node)

## Rollback / release notes

Infrastructure is a single EC2 host behind PM2/Nginx per `backend/deploy/`. No staging environment was confirmed to exist (not verified this pass). Per master prompt: no production deploy, irreversible DB operation, or live charge should happen without explicit user approval — this plan does not authorize any of that, it only describes what *should* exist before such a deploy is safe.

## Immediate next step

Get a reachable MySQL+Redis instance (local Docker once available, or a remote dev DB) so that:
1. The new `admin.authorization.test.js` regression test can actually run red/green.
2. The existing 15 integration test files can be run for the first time this audit pass and their real pass/fail status recorded (currently unverified).
