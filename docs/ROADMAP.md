# USAM Hub Roadmap

Backlog organized by the master prompt's parallel workstreams (A-H). Priority: P0 = blocking/foundational, P1 = next, P2 = later. Each item notes real dependencies on other items, not aspirational ones.

## Track A — Baseline + reliability (P0, in progress)

- [x] A1. Fix Jest config so backend tests actually execute (BUG-01) — done, verified against connectivity-only failure.
- [x] A2. Close admin role-authorization gap on system/settings routes (SEC-01) — done, pending live-DB test verification.
- [ ] A3. Get the regression test (`admin.authorization.test.js`) actually running green — needs a reachable MySQL+Redis (local Docker or remote dev DB). **Blocked on**: environment access (see Essential Questions).
- [ ] A4. Decide and fix the admin/user JWT secret sharing (SEC-02).
- [ ] A5. Decide and fix the OAuth token-in-URL exposure (SEC-03).
- [ ] A6. Reconcile `.env.example` drift (SEC-05) — quick, low-risk.
- [ ] A7. Decide sqlite-vs-mysql for test env (SEC-06) and split unit/integration Jest setup (SEC-07).
- [ ] A8. Triage `npm audit` findings on both frontend and backend, package by package (SEC-08).
- [ ] A9. Remove dead code: `frontend/src/services/api.service.ts`, `hooks/useApi.ts`, `services/index.ts` barrel, `lib/mockPhase4Data.ts` — after confirming zero importers one more time at PR time (import graphs can drift).
- [ ] A10. Remove `express-mongo-sanitize`/evaluate `xss-clean` replacement (SEC-09).
- [ ] A11. Verify NomadAI chat history persistence claim (SEC-10) and document actual behavior.
- [ ] A12. Verify `Pricing.tsx` and `Dashboard.tsx`/`Discover.tsx` backend wiring (flagged unverified in FEATURE_MATRIX.md).

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
