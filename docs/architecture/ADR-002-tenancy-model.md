# ADR-002: Multi-Tenancy Model — DRAFT, NOT DECIDED

## Status
Draft — blocked on essential questions about organizational structure.

## Context
Master prompt requires organization-aware multi-tenancy with strong data isolation, scoped roles, and tenant audit trails, while platform-level USAM admins govern the ecosystem and tenant admins stay restricted to their tenant.

Current state (verified): `Community` + `CommunityMembership` model community membership (a user can join FreelanceSpace, StudentZone, etc.), not organizational tenancy with data isolation. `Admin.role` is a flat enum (`super_admin`/`admin`/`moderator`) with no tenant scoping at all — every admin role today is platform-wide by construction.

## Decision drivers
- Is a "tenant" the same thing as a "community" (i.e., each of the 4 existing communities becomes a tenant), or is tenancy a new layer above communities (e.g., an organization/company that owns multiple communities)?
- Does data isolation need to be enforced at the database level (e.g., row-level security, separate schemas) or at the application/service layer (scoped Sequelize queries + middleware)?

## Options considered (not yet chosen)

1. **Communities become tenants directly.** Smallest schema change — add tenant-scoping enforcement to existing `community_id` foreign keys across `Post`, `Group`, `Event`, `Challenge`, `Opportunity`, `Resource`, etc. Simplest, but may not match if "organization" is meant to be a company that could span multiple communities.
2. **New `Organization`/`Tenant` model above communities.** More flexible, matches "organization-aware" language in the master prompt more literally, but is a larger schema addition — needs its own migration, and every existing community needs a tenant assignment (backfill migration, no data loss).

## What's needed before deciding
- Essential question: what does "tenant" concretely mean in the USAM ecosystem — a community, a company/employer, or something else?

## Consequences (once decided)
- Every controller touching tenant-scoped models needs a default-deny scoping check added, with IDOR-style tests proving cross-tenant access fails (master prompt acceptance criterion: "No cross-tenant resource read/write even through guessed IDs, jobs, sockets, exports or agent tools").
- `Admin.role` enum likely needs a parallel `tenant_id` (nullable for platform-level admins) rather than a schema replacement.
