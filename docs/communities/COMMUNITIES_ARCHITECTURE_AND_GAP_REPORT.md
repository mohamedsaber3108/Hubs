# USAM Communities — Architecture & Feature Gap Report

> Source-verified, code-level audit of the four USAM Communities (FreelanceSpace, StudentZone, HR Connect, LaunchPad) plus the Offers/Perks/Services Marketplace, Partnership Management, and opportunity-matching scope. Every claim is backed by a file reference. **This is an audit/design document — no production system was modified, no repository merged, no migration run.** Per instruction, implementation stops here pending architecture review.
>
> Companion documents: `COMMUNITIES_ROADMAP.md` (P0/P1/P2 plan), ADR-003..007 and ADR-006 in `docs/architecture/`, and `docs/ecosystem/ECOSYSTEM_ARCHITECTURE_AND_INTEGRATION.md`.

## 0. Headline conclusion

The platform currently is **one generic community app with four cosmetic skins**, not four genuinely differentiated professional spaces, and it has **no persona-aware experience, no opportunity intelligence, and no marketplace**. The backend scoping and core social CRUD are real and (after prior bug-fix work) solid; everything that would make this a *differentiated professional and opportunity ecosystem* is either display-only text, placeholder mock UI, or entirely absent. One flagship flow — onboarding, the persona-capture entry point — is **outright broken (HTTP 500, verified live)**.

The gap is therefore not "polish the four communities" — it's "build the differentiating layer (personas, org identity, opportunity intelligence, marketplace) on top of a working-but-generic social core."

## 1. What the four communities actually are (verified)

Seeded in `backend/backend/seeders/20240101000002-seed-communities.js`. The four rows differ **only** in cosmetic columns: `slug`, `name`, `emoji`, `tagline`, `description`, `accent_color`, an inflated `members_count` (12.5k/18k/8.2k/15.3k — seeded constants, not real), and a `features` JSON array of **marketing bullet strings**.

The `features` strings (e.g. FreelanceSpace "Gig marketplace & project boards", HR Connect "Salary benchmarking data", LaunchPad "Resume builder & review") are duplicated verbatim in the frontend `frontend/src/lib/communities.ts` and **correspond to zero implemented functionality** — no model, no route, no page, no component. [verified: grep across backend + frontend]

Community membership (`backend/backend/src/models/CommunityMembership.js`) is generic: `user_id`, `community_id`, `role` ∈ {member, moderator, admin}. Community-scoping everywhere is the same one-liner pattern — resolve `slug → community_id`, then `where.community_id = …` — identical across feed (`post.controller.js:15-21`), opportunities, events, challenges, resources, groups, mentors, leaderboard. **There is no per-community behavior anywhere in the backend.**

Communities are created admin-only (`admin.content.controller.js createCommunity`, `admin.routes.js`), which correctly matches the "official communities are administratively controlled" requirement. ✅

## 2. Feature classification (verified)

Legend: **Working** = real, functioning end-to-end. **Partial** = works but with a gap/bug. **Placeholder** = UI/text exists, no real function. **Broken** = errors at runtime. **Missing** = does not exist.

### 2.1 Social core (the genuinely-working layer)
| Feature | Status | Evidence |
|---|---|---|
| Communities list (browse) | Working | `Communities.tsx` → `communityService.list` → `GET /communities` |
| Join/leave community | Working | `community.controller.js join/leave`, `CommunityMembership` |
| Feed (posts, likes, nested comments, media), community-scoped | Working (trending still mocked) | `post.controller.js`; `Feed.tsx:21-30`; `TRENDING_HASHTAGS` mocked `Feed.tsx:14` |
| Groups (public/private/invite, membership) | Working | `group.controller.js`, `Groups.tsx` |
| Events (RSVP, capacity) | Working | `event.controller.js`, `Events.tsx` |
| Challenges (submissions, voting, points) | Working | `challenge.controller.js` |
| Resources (downloads, ratings) | Working | `resource.controller.js` |
| Mentors (requests, sessions) | Working | `mentor.controller.js` |
| Messaging (realtime 1:1, Socket.IO) | Working | `message.controller.js` + `/chat` namespace |
| Leaderboard / gamification | Working | `leaderboard.controller.js` |
| Opportunities CRUD + apply + save | Working | `opportunity.controller.js` (see §3) |
| Admin dashboard | Working | 10 `admin.*` controllers; isolated subtree |
| 195 backend tests | Passing | prior sessions; `npm test` |

### 2.2 Differentiation layer (the gap)
| Feature | Status | Evidence |
|---|---|---|
| Per-community pages / layouts / themes | Missing | `App.tsx:60-91` — every `/:community/X` renders the identical component as `/X`; `:community` is just a `useParams` filter |
| Per-community navigation | Placeholder (illusion) | `Navbar.tsx:20-62` relabels the SAME shared routes per community: FreelanceSpace "Portfolio"→`/discover`, HR "Candidates"→`/discover`, StudentZone "Nomad AI"→`/discover`, LaunchPad "My Journey"→`/leaderboard`. One `/discover` page is shown under three different names. |
| Logged-in Dashboard | Placeholder | `Dashboard.tsx` — four fully hardcoded mock content blocks (`FreelanceContent` etc.), local-state community switch, **ignores the route**, only the user's name/avatar is live data |
| Discover (people) community-scoping | Partial | `Discover.tsx:12` reads `:community` but only to seed the search box; results are NOT community-scoped |
| FreelanceSpace: gig marketplace / portfolio showcase / client mgmt / pricing workshops | Missing | only `features` strings; "gig" is one Opportunity `type`; "Portfolio" nav aliases `/discover` |
| StudentZone: study-group matching / scholarship DB / discount marketplace | Missing | strings only; "scholarship" is one Opportunity `type` |
| HR Connect: talent pipeline / salary benchmarking / recruitment hosting | Missing | strings only; "Candidates" nav aliases `/discover` |
| LaunchPad: resume builder / mock interviews / internship board / incubator | Missing | strings only; "internship" is one Opportunity `type` |
| Community metadata source of truth | Duplicated | backend seed vs hardcoded `frontend/src/lib/communities.ts` (drift risk) |

### 2.3 Persona / role differentiation
| Feature | Status | Evidence |
|---|---|---|
| Persona concept (freelancer/student/recruiter/employer/entrepreneur/jobseeker) | Missing | `User.role` is only `user/moderator/admin` (platform roles); no persona field anywhere; frontend grep for role/persona/employer/jobseeker branching = 0 matches |
| Onboarding (persona capture) | **Broken (500, verified live)** | `onboarding.controller.js:10,33,38` read/write `onboarding_completed`, `communities_joined`, `role_type` (none exist on `User`) and `OnboardingResponse.role`/`.skills` (none exist on that model). `GET /onboarding` returns HTTP 500; server log shows the Sequelize error. No test covers it. |
| Persona-aware UI | Missing | every persona sees identical UI |
| Organization / employer entity | Missing | no `Organization` model; see ADR-006 |

### 2.4 Opportunity intelligence
| Feature | Status | Evidence |
|---|---|---|
| Opportunity discovery ("for you" feed) | Missing | no code |
| Recommendations (skills/persona-based) | Missing | `Opportunity.skills` JSON + `UserSkill` exist as raw ingredients but no join/scoring anywhere; only `created_at DESC` sort (`opportunity.controller.js:51`) |
| Candidate↔opportunity matching | Missing | no scoring/ranking |
| Opportunity discussions / collaboration | Missing | opportunities have no comment/discussion thread |
| External USAM Jobs handoff | Seam only | `apply_url` column exists; no handoff logic (see ADR-007) |

### 2.5 Marketplace / Offers / Perks / Services / Partnerships
**All net-new — nothing exists.** [verified: full backend+frontend grep for marketplace/offer/perk/service/vendor/partner/partnership/discount/deal/booking/order/product/storefront/commerce → only cosmetic seeder strings + mock data]

| Capability | Status |
|---|---|
| Offers / Perks | Missing (net-new) |
| Services Marketplace (sellable services) | Missing (net-new) |
| Vendor / seller / partner entity | Missing (net-new) |
| Partnership management | Missing (net-new) |
| Discounts / deals / coupons | Missing (net-new) |
| Booking / orders / transactions | Missing (net-new) |
| Billing / payments | Dormant schema only — `PricingPlan`+`Subscription` models exist, admin read/edit only, **never written by any code**, no checkout/webhook/provider. See ADR-005. |

## 3. Opportunities feature — detail & bugs (the base for intelligence work)

`Opportunity` (`models/Opportunity.js`): 8 types (`gig`, `full-time`, `part-time`, `internship`, `volunteer`, `scholarship`, `mentorship`, `collaboration`), `company`, `location` + `is_remote`, `salary_range`, `skills` (JSON), `deadline`, `apply_url`, `status`. Applications (`OpportunityApplication`: cover_letter/resume_url/status) and saves (`SavedOpportunity`) work; `apply()` uploads résumé to S3, dedupes, guards deadline/status, notifies poster. This is a **solid CRUD base** to build discovery/matching on top of.

**Three latent bugs found (not yet fixed — flagged for the P0 batch):**
1. `updateApplication` (`opportunity.controller.js:~190`) checks `app.opportunity.user_id`, but the owner column is `posted_by` → `user_id` is `undefined` → legitimate posters get a wrong 403 (only admins can update application status today). **No test covers this path.**
2. `updateApplication` writes a `notes` field that doesn't exist on the `OpportunityApplication` model or its migration.
3. `listOpportunities` filters on `location_type`, a column that doesn't exist (model has `location` + `is_remote`) → that filter is a no-op/error.
4. Frontend/backend vocabulary mismatch: `Opportunities.tsx:10-11` hardcodes `TYPES = [job, internship, freelance, scholarship, fellowship, grant]` and `location_type`/`is_featured` — none of which match the backend ENUM/columns. The opportunities page renders fields the API never returns.

## 4. Differentiated persona journeys — target vs reality

The user wants differentiated journeys for **entrepreneurs, freelancers, students, recruiters, employers, job seekers**. Verified reality: **none exist** — there is no persona model, onboarding is broken, and the frontend never branches by persona. This is the single biggest conceptual gap between "four generic discussion communities" (what exists) and "a genuinely integrated professional and opportunity ecosystem" (the goal).

Proposed persona model (design, see roadmap P0/P1):
- Add a `persona`/`professional_role` concept to the user profile (multi-select, since one person can be e.g. student + freelancer), captured during a **fixed** onboarding flow.
- Drive differentiation off persona + community membership together, rather than hardcoding per-community UI. E.g. a recruiter in HR Connect sees candidate discovery + opportunity-posting; a student in StudentZone sees scholarships + study groups; a freelancer in FreelanceSpace sees gigs + a services storefront.
- Employer/recruiter personas tie to the `Organization` concept (ADR-006).

## 5. Unified Offers / Perks / Services Marketplace + Partnerships — proposed design (net-new)

Nothing exists, so this is greenfield. Proposed shape (design only; depends on ADR-005 payments audit and ADR-006 org identity):

**Core entities (new models/migrations):**
- `Listing` (polymorphic by `kind`: `service` | `offer` | `perk` | `product`), owned by a `User` or an `Organization` (ADR-006), with `community_id` scoping, title/description/media, pricing (nullable for free perks), status, category.
- `Partnership` / `Partner` (an `Organization` with a partnership agreement; perks/offers can be partner-provided).
- `Order` / `Booking` (buyer, listing, amount, status, payment ref) — the transactional record, gated on the ADR-005 payments decision.
- `Review`/`Rating` on listings (reuse the existing `ResourceRating` pattern as a template).

**API surface (new, versioned under `/api/v1/marketplace/…`):** listings CRUD + search/filter, offers/perks redemption, partner management (admin + partner self-service), orders/bookings (payment-gated), reviews.

**Reuse opportunities (don't rebuild):**
- The `apply`/listing lifecycle can mirror the proven `Opportunity`+`OpportunityApplication` pattern.
- Ratings can mirror `ResourceRating`.
- Billing must go through the provider-independent `PaymentService` seam (ADR-005), candidate backend E-USAM payments — explicitly **not** a new gateway integration until that audit passes.
- Media uploads reuse the existing `s3.service.js`.

**Hard dependency:** a real marketplace needs **multi-party payments** (platform fee + seller payout) and **org identity** (sellers/partners are organizations). Both are open (ADR-005 Q, ADR-006). So the marketplace is **P2-gated** behind payments + org identity, with a non-transactional "offers/perks catalog" (display + redemption-code, no money movement) as a safe **P1** first slice.

## 6. Ecosystem integration (realistic, versioned-API based)

Per ADR-004/005/006/007 and the ecosystem report, integration is **API-contract based**, never shared-DB (Communities is MySQL; the others are Postgres). Realistic, non-duplicating integrations:
- **Shared identity** (ADR-004): become an OIDC relying party; stop being the auth source of truth. Unblocks everything else.
- **Opportunities → USAM Jobs** (ADR-007): discovery/recommendations owned here; formal job applications hand off via a provider-independent `JobsProvider` stub (not Noventra).
- **Billing → E-USAM payments** (ADR-005): behind a `PaymentService` seam, after the suitability audit.
- **Surface, don't duplicate:** show E-USAM courses / other products' content in the Communities feed/profile via their existing `/api/v1/` endpoints + deep links.
- **AI assistance:** route NomadAI through a shared Bedrock gateway (ties to the existing NomadAI work).

Do **not** assume any undocumented ecosystem API exists — every integration above targets an endpoint verified in the ecosystem report or a seam we define.

## 7. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Building persona/marketplace on top of a broken onboarding + unverified flows | High | Fix onboarding (P0) + add tests before layering features |
| MySQL (Communities) vs Postgres (rest of ecosystem) blocks shared-data shortcuts | Medium | API-only integration (already the plan); never share a DB |
| Marketplace without multi-party payments = can't actually pay sellers | High | Gate transactional marketplace on ADR-005; ship non-transactional offers/perks catalog first |
| Frontend metadata duplication (`lib/communities.ts` vs backend seed) drifts | Medium | Make backend the single source; frontend fetches it |
| Persona hardcoding (like current per-community mock Dashboard) doesn't scale | Medium | Drive differentiation from data (persona + membership), not hardcoded components |
| Doing all tracks at once | High | Strict P0→P1→P2 sequencing; stop-for-review gates |

## 8. Acceptance criteria (what "done" means per area)

- **Onboarding fixed:** `GET /onboarding` and `POST /onboarding` return 2xx; persona + goals + communities persist to columns that actually exist; regression test covers both; a new user completes onboarding end-to-end.
- **Persona model:** a user has one or more personas; the API returns them; at least one real UI branch keys off persona (not community-hardcoded).
- **Opportunity bugs fixed:** `updateApplication` works for the real poster (not just admin); no reference to non-existent `notes`/`location_type`/`is_featured`; FE and BE opportunity vocabularies match; regression tests cover the application-status workflow.
- **Discovery/matching:** opportunities can be ranked by skill overlap with the viewer; a "recommended for you" list returns non-chronological, relevance-ordered results; covered by tests.
- **Offers/perks catalog (non-transactional):** admins/partners can publish offers/perks; members can view and redeem (code-based); scoped per community/org; tested.
- **Marketplace (transactional):** gated — only after ADR-005 payments audit passes and ADR-006 org identity exists.
- **No regressions:** the 195 existing backend tests stay green; no production/other-project changes.

## 9. Verification status of this report
Every "Working/Broken/Missing" classification above was derived from reading the actual source (file refs inline) and, for the onboarding bug, from a **live 500 reproduced against the Docker dev database**. Items I did not execute end-to-end (e.g. every social-core flow) are marked from code reading, not runtime proof, and the test suite (195 passing) is the backing evidence for the social core. Nothing in this report was implemented.
