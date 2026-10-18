# ADR-004: Provider-Independent OIDC SSO (Cognito vs Keycloak comparison, not finalized)

## Status
Proposed — **no identity provider selected, provisioned, or deployed.** This ADR defines the provider-independent interface and the comparison criteria; it does not pick a winner.

## Context
Verified in the ecosystem audit: the five USAM products each run their own user table and login, with **three different JWT implementations** (Django simplejwt ×2, NestJS passport-jwt ×2, Express custom ×1 in this project) and no shared identity. E-USAM already scaffolds (un-credentialed) AWS Cognito; USAMKO wrote an internal shared-JWT SSO design. All products sit under `*.usamif.com`.

USAM Communities (this project) today: custom JWT, access token in `localStorage`, refresh token as httpOnly cookie, Passport-JWT verify (`backend/backend/src/middleware/auth.js`), 4 OAuth strategies scaffolded.

## Decision
Design SSO as a **provider-independent OIDC relying-party integration**. USAM Communities will depend on an abstract `IdentityProvider` seam, not on any specific vendor. The concrete provider (AWS Cognito vs self-hosted Keycloak vs other) is chosen later, after the comparison below is completed against real infrastructure and cost data. **Do not provision or deploy any IdP yet.**

### The provider-independent seam (what we commit to now, in design only)
- The app trusts an OIDC issuer: validates `iss`/`aud`/`exp`/signature via the issuer's JWKS, maps the token `sub` (ecosystem account id) + verified `email` to a **local `User` row used as a profile cache**, not as the authentication source of truth.
- Existing local JWT login stays working behind a feature flag during transition (backward compatible); OIDC is added alongside, not as a rip-and-replace.
- A thin adapter module (e.g. `backend/backend/src/services/identity/` with an `IdentityProvider` interface) isolates all provider specifics (discovery URL, JWKS, token exchange, logout) so swapping Cognito↔Keycloak is a config/adapter change, not a controller rewrite.

### Comparison criteria (to be filled against real data before selecting)
| Criterion | AWS Cognito | Keycloak (self-hosted) |
|---|---|---|
| Already present in ecosystem | Scaffolded in E-USAM (un-credentialed) | Not present |
| Hosting/ops burden | Managed (no servers) | Must run a JVM service; audited at min 2GB RAM / 2 vCPU, realistic prod HA considerably more (see `docs/OPEN_SOURCE_REGISTRY.md`) — a real cost on the single-EC2 constraint |
| Cost model | Per-MAU pricing (verify current tier) | Infra + ops labor |
| AWS-nativeness | Native (fits Bedrock/SES/S3 stack the family already uses) | Neutral |
| Cross-subdomain SSO on `*.usamif.com` | Hosted UI + cookie/domain config | Full control of realm/cookies |
| Vendor lock-in | Higher | Lower (OSS, Apache-2.0) |
| Social/OAuth federation | Built-in (Google/GitHub/etc.) | Built-in |
| Migration of existing per-product accounts | Bulk import / JIT on first login | Realm import / JIT |

**All cells marked "verify" must be filled with real numbers (MAU estimate, EC2 headroom, pricing) before a decision. This ADR does not decide.**

## Consequences
- No code is written against a specific IdP yet; the first SSO implementation step is the abstract `IdentityProvider` seam + OIDC relying-party verification, which is provider-agnostic.
- Because E-USAM already scaffolds Cognito, Cognito is the lower-friction prototype candidate — but prototype ≠ decision.
- Cross-subdomain considerations (cookie `Domain`, SameSite) interact with ADR-003 (domain not yet assigned) and must not be configured until the domain is verified.

## Open questions blocking selection
- Expected ecosystem MAU (drives Cognito cost).
- Available EC2/infra headroom and ops appetite (drives Keycloak feasibility).
- Does any USAM product already have a production IdP the others must federate with?
