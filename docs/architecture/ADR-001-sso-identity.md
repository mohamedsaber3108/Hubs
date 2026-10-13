# ADR-001: SSO / Identity Strategy — DRAFT, NOT DECIDED

## Status
Draft — blocked on essential questions. No implementation should begin until this is resolved and approved.

## Context
The master prompt mandates USAM Hub join a multi-product ecosystem (Hub, Education, Career/Jobs, Freelancing) with single sign-on, shared identity, and consistent user profiles. Today, Hub has its own independent JWT-based auth (verified in `CURRENT_STATE_VERIFIED.md` §3): local `User`/`Admin` tables, Passport JWT + 4 OAuth strategies, access token in response body, refresh token as httpOnly cookie tracked in `sessions` + Redis.

## Decision drivers
- Whether other USAM products already have a central IdP in production, or whether Hub would be first.
- Whether existing Hub user accounts/sessions must be preserved without forcing re-registration (master prompt requires this: "preserve existing user data... authentication sessions... or document compatible migration").
- Operational cost on the single-EC2 constraint — self-hosting an IdP (e.g. Keycloak) has real RAM/CPU overhead that must be budgeted against the existing app + Redis on the same box.

## Options considered (not yet chosen)

1. **OIDC Authorization Code + PKCE against a central IdP** (master prompt's stated preference). Hub becomes a relying party; local `User` table becomes a profile cache keyed by a central subject ID.
2. **Keycloak**, self-hosted. Adds a Java process to the single EC2 host — real memory/ops cost, needs explicit sizing before adoption (see OPEN_SOURCE_REGISTRY.md).
3. **Managed IdP** (e.g. AWS Cognito, Auth0) — avoids hosting overhead but adds a recurring external cost and vendor dependency; master prompt doesn't rule this out but doesn't mention it either.
4. **Status quo + federation shim** — keep Hub's JWT scheme, add a thin SSO bridge that issues Hub-compatible tokens after validating against the central IdP. Lower migration risk, but doesn't give other USAM products a first-class view of Hub identity.

## What's needed before deciding
- Essential question: does a central USAM IdP already exist (and if so, which protocol/vendor)?
- Essential question: is Hub the first product being built, or are Education/Jobs/Freelancing already live with their own auth that Hub needs to join?

## Consequences (once decided)
- Existing `sessions` table and Redis refresh-token tracking will need a compatibility/migration plan — cannot be dropped without preserving active sessions or a documented forced-logout window.
- `middleware/auth.js`'s Passport JWT strategy would need to validate tokens issued by the chosen IdP instead of (or in addition to) locally-issued ones during a transition period.
