# USAM Hub Roadmap

Backlog organized by the master prompt's parallel workstreams (A-H). Priority: P0 = blocking/foundational, P1 = next, P2 = later. Each item notes real dependencies on other items, not aspirational ones.

## Track A — Baseline + reliability (P0, in progress)

- [x] A1. Fix Jest config so backend tests actually execute (BUG-01) — done, verified.
- [x] A2. Close admin role-authorization gap on system/settings routes (SEC-01) — done, **execution-verified**: `admin.authorization.test.js` passes 7/7 against real MySQL+Redis.
- [x] A3. Get the regression test actually running green — done. Local dev environment stood up via `docker-compose.dev.yml` (MySQL 8.0.37 on :3306, Redis 7.4 on :6380). See `docs/DEV_ENVIRONMENT_SETUP.md`.
- [x] A3b. Split Jest into unit/integration projects (SEC-07) — done. Unit tests (36 tests) now run with zero DB/Redis dependency; verified.
- [x] A3c. Ran the full integration suite for the first time ever — went from never-executed to 155/155 passing, surfacing and fixing 14 real runtime bugs (BUG-03 through BUG-16, see git log on `audit/baseline-verification`) plus 2 test-expectation bugs. Full backend test command: 22 suites, 195 tests, all passing.
- [x] A8 (partial). Triaged and fixed the two **critical** `npm audit` findings on each side without `--force`: backend `tar` (via override, bcrypt stays on 5.1.1), frontend `tinypool` (via override, vitest stays on 3.2.7) + `react-router-dom` patch bump. Backend 44→41 vulnerabilities (0 critical), frontend 37→35 (0 critical). Remaining 41+35 are dev-tooling major-version bumps (jest→30, nodemon→3 replacement, vite/vitest major) deferred — each needs its own compatibility-tested PR, not a blanket `--force`.
- [x] A11. Verified NomadAI chat history persistence claim (SEC-10) — **confirmed false**. `nomad.controller.js` has zero persistence of any kind; the entire conversation history is client-supplied in `req.body.history` and never written to DB or Redis.
- [ ] A4. Decide and fix the admin/user JWT secret sharing (SEC-02) — not started, needs a decision (see Essential Questions in prior report).
- [ ] A5. Decide and fix the OAuth token-in-URL exposure (SEC-03) — not started.
- [ ] A6. Reconcile `.env.example` drift (SEC-05) — not started, quick/low-risk.
- [ ] A7. Decide sqlite-vs-mysql for test env (SEC-06) — superseded in practice by A3 (Docker Compose dev stack makes a real MySQL trivial to get); revisit only if CI needs a lighter-weight option.
- [ ] A8 (remainder). Triage the remaining ~76 non-critical `npm audit` findings (dev-tooling major bumps) as dedicated, individually-tested PRs.
- [ ] A9. Remove dead code: `frontend/src/services/api.service.ts`, `hooks/useApi.ts`, `services/index.ts` barrel, `lib/mockPhase4Data.ts` — still not done. Per updated instruction: verify dynamic imports/future-integration references once more immediately before deleting, don't delete solely because grep shows zero current importers.
- [ ] A10. Remove `express-mongo-sanitize`/evaluate `xss-clean` replacement (SEC-09) — not started.
- [ ] A12. Verify `Pricing.tsx` and `Dashboard.tsx`/`Discover.tsx` backend wiring (flagged unverified in FEATURE_MATRIX.md) — not started.
- [ ] A13 (new). No ESLint config exists for the backend at all (`npm run lint` fails outright: "ESLint couldn't find a configuration file"). Frontend lint runs but reports 81 pre-existing problems (68 errors, mostly `@typescript-eslint/no-explicit-any`, plus one `no-require-imports` in `tailwind.config.ts`) — none introduced this session, needs a dedicated cleanup pass.
- [ ] A14 (new). `Event.type`/`Opportunity` schema gaps found while fixing BUG-11/BUG-13: the event-creation Joi schema accepts a `type` (online/in_person/hybrid) field that is silently dropped on create because no such column exists (only `is_online` boolean). Needs a decision: add a real `type` column via migration, or simplify the schema to match `is_online`.

## Track B — Ecosystem SSO and multi-tenancy (P0 architecture, gated rollout)

**Blocked on essential questions** (central IdP choice, whether Keycloak or similar is already used by other USAM products). No code changes until an ADR is written and approved.

- [ ] B1. ADR: identity strategy (OIDC Authorization Code + PKCE vs current JWT-only scheme), account linking plan from existing Hub credentials.
- [ ] B2. ADR: tenant/organization model — map onto existing `Community`/`CommunityMembership` or introduce a new `Tenant` concept above communities.
- [ ] B3. Default-deny cross-tenant access tests (IDOR-style) once B2 is decided.
- [ ] B4. Platform admin vs tenant admin vs moderator role model — extends the existing `Admin.role` enum (`super_admin`/`admin`/`moderator`) which today has no tenant scoping at all.

## Track C — Social and communities (P1)

- [ ] C1. Feed ranking — currently chronological per `Post` model ordering (confirm exact `order` clause); explainable-ranking work is additive, not a rewrite.
- [ ] C2. Content moderation/spam controls — not found in current controllers; needs design.
- [ ] C3. Block/mute/report flows — `Follow` model exists; no `Block`/`Report` model found among the 42 — net-new schema + migration needed.
- [ ] C4. Community admin-only creation — already enforced? Needs direct verification of `community.controller.js` create logic (not traced this pass).
- [ ] C5. Privacy/account export and deletion flows — `User.is_deleted`/soft-delete pattern exists; GDPR-style export not found, needs design.

## Track D — Events, payments and freemium (P1, live charging gated)

**Blocked on essential questions** (payment provider, legal entity, supported countries/currencies).

- [ ] D1. Audit current `Event`/`EventAttendee` RSVP+capacity logic in detail (only confirmed existence this pass, not full logic).
- [ ] D2. Ticket types / paid events — `PricingPlan`/`Subscription` models exist for platform tiers, but no event-ticket-specific schema found; needs new models.
- [ ] D3. Payment provider selection ADR — do not implement until answered.
- [ ] D4. Idempotent checkout + webhook verification + ledger — downstream of D3.

## Track E — NomadAI multi-agent (P1 architecture; permissions P0)

- [ ] E1. Verify current `nomad.controller.js` prompt/contract in full (only confirmed it calls Anthropic directly, `fetch` to `api.anthropic.com`, no model persistence found — see SEC-10).
- [ ] E2. Permission gateway / tool registry design — net new, nothing like this exists today.
- [ ] E3. Multi-agent orchestration — explicitly P1 architecture per master prompt; no code until ADR approved.

## Track F — UX, localization and accessibility (P1)

- [ ] F1. i18n is already wired correctly (RTL/LTR confirmed working, see CURRENT_STATE_VERIFIED.md §2) — extend `src/i18n/translations.ts` coverage rather than re-architect.
- [ ] F2. Accessibility audit (contrast, keyboard nav, focus) — not performed this pass; full WCAG validation requires manual testing with assistive tech, cannot be fully automated.
- [ ] F3. Mobile responsiveness audit — `MobileNav.tsx` exists; needs viewport-size E2E pass.

## Track G — Production and observability (P0)

- [ ] G1. GitHub Actions CI — `backend/PHASE_7_SUMMARY.md` claims `ci.yml`/`deploy.yml` exist; needs direct verification (not opened this pass).
- [ ] G2. Backup/restore drill, RDS retention — infra-level, needs real AWS access, not actioned without approval.
- [ ] G3. SES deliverability + bounce/complaint handling — ties into the unimplemented webhook (confirmed absent, see FEATURE_MATRIX.md).

## Track H — Open-source evaluation (continuous)

See `docs/OPEN_SOURCE_REGISTRY.md`.

## Sequencing notes

- Track A should finish (or at least the P0 items) before starting B/C/D/E in earnest, since several of A's findings (JWT secret sharing, role model gaps) directly affect how B's tenant/role model should be designed.
- Track G's CI work (G1) should happen early so every subsequent PR gets automated test/lint feedback instead of relying on manual runs like this audit pass did.
