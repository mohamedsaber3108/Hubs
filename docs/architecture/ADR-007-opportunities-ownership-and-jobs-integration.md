# ADR-007: Opportunities Ownership & Provider-Independent USAM Jobs Integration

## Status
Accepted (direction) — no external Jobs integration built; no assumption that Noventra is USAM Jobs.

## Context
The user's decisions:
- *"USAM Hub should provide opportunity discovery, recommendations, discussions, and collaboration features. The actual employment application process should eventually integrate with USAM Jobs."*
- *"Do not treat Noventra as USAM Jobs. Keep a provider-independent Jobs integration until the correct repository is identified."*

Verified: `M:\jobs.usamif` is **Noventra, a study-abroad fair platform — NOT a jobs board** (ecosystem audit §1/§3.4). USAM Communities has a working `Opportunity` feature (8 types, applications, save, poster inbox) but **zero discovery/recommendation/matching** logic (only `created_at DESC`). It has an `apply_url` column that is a clean seam for external handoff.

## Decision
USAM Communities **owns the discovery side** of opportunities and **delegates the formal employment-application process** to an external USAM Jobs product via a provider-independent seam:

1. **Communities owns:** opportunity discovery, personalized recommendations/matching (skills/persona-based), opportunity discussions, collaboration/referrals, saving/bookmarking, and lightweight in-community applications for *community-native* opportunity types (gigs, volunteering, mentorship, collaboration).

2. **USAM Jobs eventually owns:** the formal employment application lifecycle for *job* opportunities (full-time/part-time roles) — ATS-style tracking, structured applications, employer workflows.

3. **Provider-independent Jobs seam (design only).** Introduce an abstract `JobsProvider` interface (e.g. future `backend/backend/src/services/jobs/`) with operations like `isExternallyOwned(opportunity)`, `getApplyHandoff(opportunity, user)` (returns a deep link or a structured handoff payload), and `syncOpportunities()` (optional inbound mirror for discovery). The concrete implementation is **null/stub until the correct USAM Jobs repository is identified** — explicitly NOT Noventra.
   - Natural insertion point verified in code: the `apply()` controller (`backend/backend/src/controllers/opportunity.controller.js`) plus the existing `apply_url` column. Branch there: if an opportunity is externally owned, hand off (deep link / API) instead of creating a local `OpportunityApplication`.
   - Add a `source`/`external_ref` concept to `Opportunity` (design) to distinguish community-native vs Jobs-sourced opportunities.

## Consequences
- No code assumes Noventra is Jobs; the Jobs seam stays a stub returning "not configured" until the real product/repo is confirmed.
- Discovery/recommendations/matching is net-new work owned entirely by Communities (see the gap report's P1 matching-engine item) and does not depend on the external Jobs product.
- The existing local application flow keeps working for community-native opportunity types; only formal "job" applications are earmarked for eventual handoff.
- Avoids duplicating a full ATS inside Communities.

## Open questions
- Where is the real USAM Jobs product/repo? (`jobs.usamif` folder is Noventra; the actual Jobs product was not found on disk during the ecosystem audit.)
- Which opportunity types hand off to Jobs vs stay community-native? (proposed: full-time/part-time → Jobs; gig/internship/volunteer/scholarship/mentorship/collaboration → community-native, revisit per business rules.)
