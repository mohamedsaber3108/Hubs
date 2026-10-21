# USAM Communities — Implementation Roadmap (P0 / P1 / P2)

> Derived from `COMMUNITIES_ARCHITECTURE_AND_GAP_REPORT.md`. Sequenced so each phase stands on a verified foundation. **Nothing here is implemented yet** — this is the proposed plan to review before building. Every item lists scope, key files, DB implications, API contract, tests, and acceptance criteria. All work stays in `M:\HUb_comunites`; no other project is modified; integrations are API-contract-based and provider-independent.

Priority meaning: **P0** = fix broken foundations + close the biggest "generic vs differentiated" gaps that everything else depends on. **P1** = the differentiating product layer (personas, opportunity intelligence, non-transactional offers/perks, org identity). **P2** = transactional marketplace + deep ecosystem SSO/payments, gated on open decisions.

---

## Progress log

- **P0-1 / P0-3 — DONE.** Onboarding fixed (migration `20240101000017`; GET/POST 200), `users.professional_roles` persona field live. Frontend onboarding now captures personas (step 2 of 5) and sends `professional_roles` + a correctly-mapped `experience_level`. Commits incl. `cd55a55`.
- **P1-1 (recommendations portion) — DONE.** `GET /communities/recommended` ranks active communities by the viewer's personas via an explainable `PERSONA_COMMUNITY_AFFINITY` map, annotates membership + a human-readable reason, and falls back to member-count ordering for anonymous/no-persona viewers. Communities page consumes it ("Recommended for you", reason chips, highlight ring); Dashboard defaults the active space to the top recommended community. Backend `66a3e8f`, frontend `cd55a55`. 208 backend tests green, FE build + vitest green. **Still open in P1-1:** replacing the hardcoded `Dashboard.tsx` mock content panels with real persona-filtered data.

---

## P0 — Fix the foundation (no new product surface until these pass)

### P0-1. Fix the broken onboarding / persona-capture flow
- **Why:** `GET/POST /onboarding` return HTTP 500 (verified live). This is the entry point for persona capture — the single most important input to differentiation — and it's completely non-functional.
- **Scope:** reconcile `onboarding.controller.js` with the real schema. Either (a) add the missing columns via migration (`User.onboarding_completed`, a persona/`professional_roles` field; align `OnboardingResponse` with what the controller writes) OR (b) rewrite the controller to use the existing columns. Recommend (a) because persona columns are needed anyway (P0-3).
- **Files:** `backend/backend/src/controllers/onboarding.controller.js`, `src/models/User.js`, `src/models/OnboardingResponse.js`, a new migration, `frontend/src/pages/Onboarding.tsx` (align payload).
- **DB:** additive migration (new nullable columns); no data loss.
- **Tests:** new integration test for onboarding GET + POST (currently zero coverage).
- **Acceptance:** both endpoints 2xx; a new user completes onboarding; persona + goals + communities persist; test green.

### P0-2. Fix the 3 latent opportunity bugs + FE/BE vocabulary mismatch
- **Scope:** (1) `updateApplication` owner check `app.opportunity.user_id` → `posted_by`; (2) remove/relocate the non-existent `notes` write (or add the column via migration if notes are wanted); (3) remove/replace the `location_type` filter in `listOpportunities` with real `is_remote`/`location`; (4) align `frontend/src/pages/Opportunities.tsx` type/location/featured vocabulary with the backend ENUM/columns.
- **Files:** `backend/backend/src/controllers/opportunity.controller.js`, `frontend/src/pages/Opportunities.tsx`, possibly a migration if `notes` is kept.
- **Tests:** new integration tests for the opportunity application-status workflow (currently zero coverage).
- **Acceptance:** a real poster (not just admin) can update application status; no references to non-existent columns; FE renders only fields the API returns; tests green.

### P0-3. Introduce the persona concept (data model only)
- **Why:** differentiation must be driven by data (persona + community membership), not hardcoded per-community UI (the current anti-pattern in `Dashboard.tsx`).
- **Scope:** add a `professional_roles`/`persona` field (multi-value: freelancer, student, recruiter, employer, entrepreneur, job_seeker, mentor) to the user profile; expose it in the profile + onboarding API. No UI branching yet (that's P1).
- **Files:** migration, `src/models/User.js` or a `UserPersona` join table, `profile`/`user` controllers + validation, `frontend` types.
- **DB:** additive.
- **Tests:** persona round-trips through profile + onboarding APIs.
- **Acceptance:** a user can have ≥1 persona; API returns it; covered by tests.

### P0-4. Single source of truth for community metadata
- **Scope:** make the backend the source; have the frontend consume `GET /communities` everywhere instead of the hardcoded `frontend/src/lib/communities.ts` duplicate (keep a thin typed fallback only).
- **Files:** `frontend/src/lib/communities.ts`, `Onboarding.tsx`, `Dashboard.tsx`, `Groups.tsx`, `Navbar.tsx`.
- **Acceptance:** editing a community in admin reflects in the frontend without a code change; no drift.

**P0 exit gate:** onboarding works, opportunity workflow is correct + tested, persona data exists, community metadata is single-sourced, all 195 existing tests still green. **Stop for review before P1.**

---

## P1 — The differentiating product layer

### P1-1. Persona-aware experience (replace cosmetic skins with real differentiation)
- **Scope:** drive dashboard/nav/feed emphasis off `persona + community membership`, not hardcoded mock components. Replace the static `Dashboard.tsx` mock blocks with real data (user's actual opportunities/events/groups) filtered by persona + community.
- **Acceptance:** a recruiter and a student in the same community see genuinely different, data-backed home experiences; no hardcoded mock content remains; `Dashboard.tsx` is route/persona-aware.

### P1-2. Opportunity discovery, recommendations & matching
- **Scope:** a recommendation/matching service that scores opportunities against the viewer's `UserSkill` + persona (skill-overlap first, expand later). Add a "recommended for you" endpoint and opportunity discussion threads (reuse the post-comment pattern) and lightweight collaboration/referrals.
- **Files:** new `services/opportunityMatching.service.js`, extend `opportunity.controller.js`/routes, FE Opportunities page.
- **DB:** possibly a cached match-score table; `skills` JSON + `UserSkill` already exist as inputs.
- **Acceptance:** `/opportunities/recommended` returns relevance-ordered (not chronological) results; discussion threads work; tested.

### P1-3. Offers / Perks catalog (NON-transactional first slice)
- **Scope:** `Listing` model (kind = offer/perk), admin + (future) partner-published, community/org-scoped, with code-based redemption — **no money movement** (sidesteps the payments decision). This is the safe first marketplace slice.
- **Files:** new model/migration/controller/routes `/api/v1/marketplace/offers`, FE page.
- **Acceptance:** admins publish offers/perks; members view + redeem via code; scoped correctly; tested.

### P1-4. Organization identity (local, per ADR-006)
- **Scope:** add the global-org-id reference + Communities-local `Organization` and `OrganizationMembership` tables (nullable global id until SSO exists). Enables the employer/recruiter personas and partner/seller entities. Default-deny cross-org access + IDOR tests.
- **Acceptance:** an org can exist, have members with product-local roles, and own opportunities/offers; cross-org access is denied and tested.

### P1-5. OIDC relying-party seam (provider-independent, per ADR-004)
- **Scope:** add the abstract `IdentityProvider` seam + OIDC token verification path alongside the existing local JWT (feature-flagged, backward compatible). No specific provider wired until ADR-004 selection.
- **Acceptance:** app can validate an OIDC token from a configured issuer and map it to a local profile-cache user; local login still works; no provider committed.

**P1 exit gate:** personas drive real UX, opportunity intelligence works, a non-transactional offers/perks catalog ships, org identity exists locally, and the SSO seam is in place. **Stop for review before P2.**

---

## P2 — Transactional marketplace + deep ecosystem integration (decision-gated)

### P2-1. Transactional Services Marketplace
- **Gated on:** ADR-005 payments audit passing + ADR-006 org identity (P1-4) + a decision on multi-party payouts.
- **Scope:** `Listing` (service/product) + `Order`/`Booking` + reviews, with checkout through the provider-independent `PaymentService` seam (candidate: E-USAM payments). Platform-fee + seller-payout if multi-party is approved.
- **Acceptance:** a buyer can purchase a service from a seller org; funds route correctly (test mode first); refunds work; no live charges without explicit approval.

### P2-2. Partnership management
- **Scope:** partner onboarding/agreements; partner-provided perks/offers; partner analytics.

### P2-3. USAM Jobs handoff (per ADR-007)
- **Gated on:** identifying the real USAM Jobs repo (NOT Noventra).
- **Scope:** implement the `JobsProvider` seam's handoff for formal job applications; keep community-native opportunity types local.

### P2-4. Ecosystem SSO cutover + shared services
- **Gated on:** ADR-004 provider selection, ADR-003 domain verification.
- **Scope:** make OIDC the primary auth; route billing to E-USAM payments; surface other products' content via their APIs; shared Bedrock AI gateway for NomadAI.

---

## Cross-cutting (every phase)
- Keep the 195 backend tests green; add tests with each feature (TDD for bug fixes).
- No production deploys, no DB migrations on production, no other-project modifications, no repository merges.
- Each phase ends with a **stop-for-review gate** before the next begins, per the user's directive.
- Integrations stay provider-independent and target only verified/defined API contracts.
