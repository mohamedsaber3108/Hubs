# ADR-006: Global Organization Identity, Product-Isolated Membership & Data

## Status
Accepted (direction) — supersedes the earlier draft `ADR-002-tenancy-model.md` for the ecosystem dimension. No schema implemented yet.

## Context
The user's decision: *"Use a global organization identity concept across the ecosystem, while keeping organization memberships, permissions, and product-specific data ownership isolated within each platform."*

Verified current state: USAM Communities has **no organization/company entity at all** — only `User` (role `user/moderator/admin`) and `Community`/`CommunityMembership`. USAMKO is the only product with real multi-tenancy (`User` keyed by `(tenantId, email)`, cascade isolation). So "organization" is net-new for Communities.

## Decision
Model organizations as a **two-layer concept**:

1. **Global organization identity (shared, thin).** An organization has one canonical ecosystem id/record (ideally owned by the same shared identity layer as users — see ADR-004). Its shared attributes are minimal: ecosystem org id, legal/display name, verified domain(s), logo, status. This is the single source of truth for "is this the same company across edu/kids/jobs/communities."

2. **Product-isolated membership, permissions, and data (per-platform).** Each product — including USAM Communities — owns its OWN tables for: which users belong to an org *in that product*, their roles/permissions *in that product*, and all product-specific org data (e.g. a recruiter's job posts in Communities, a university's programs in Noventra). These are NOT shared; one product cannot read another's org membership or data except through that product's versioned API.

### For USAM Communities specifically (net-new, design only)
- Add an `Organization` reference that stores the **global ecosystem org id** (foreign key to the shared identity layer when it exists; a plain nullable column until then — do not block on SSO).
- Add Communities-local `OrganizationMembership` (user ↔ org ↔ role-in-this-product) — distinct from `CommunityMembership` (user ↔ community). An org (e.g. an employer) can post opportunities/offers; its members act on its behalf within Communities only.
- Default-deny cross-org access at the query/service layer; add IDOR-style tests (a user from org A cannot read org B's applicants, offers, etc.).

## Consequences
- "Organization" becomes a first-class concept in Communities for the employer/recruiter/partner personas and for the future offers/services marketplace (a seller/partner is an organization).
- Because membership/permissions/data are product-isolated, there is **no shared organization database** and no cross-product write path — matching the user's constraint and avoiding the MySQL-vs-Postgres divergence problem (API-level integration only).
- The global org id is the join key for ecosystem features ("this employer also runs courses on E-USAM") but each product resolves its own data behind its own API.
- This is additive schema (new tables + a nullable org-id column); it does not change existing `User`/`Community` semantics.

## Open questions
- Where does the global org identity physically live — in the chosen IdP (Cognito/Keycloak groups/orgs), a dedicated ecosystem directory service, or federated by convention until one exists? (Ties to ADR-004.)
- Org verification/claiming flow (how does a company prove it owns `acme.com`)?
