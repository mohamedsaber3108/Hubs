# Target Architecture (draft — pending ADR approval)

This document sketches where the architecture needs to go per the master prompt's mandatory product decisions. Nothing here is implemented yet; it exists to make tradeoffs visible before any ADR is approved and before any shared interface (auth, tenancy, DB schema) is changed.

## Current architecture (verified, see CURRENT_STATE_VERIFIED.md)

Modular monolith: single Express app, single MySQL database, single Redis instance, Socket.IO on the same process. Two independent JWT schemes (user, admin) sharing one secret. No tenant concept beyond `Community`/`CommunityMembership` (which models community *membership*, not organizational multi-tenancy with data isolation).

## Target direction (per master prompt mandatory decisions)

1. **SSO across USAM products** — requires an external or embedded identity provider (IdP). Current JWT-only scheme would need to become an OIDC relying party (Authorization Code + PKCE), with Hub's `User` table becoming a local profile cache keyed by a central account ID rather than the source of truth for authentication. This is a **breaking change to the auth flow** and needs an ADR + migration plan for existing sessions before any code changes (per master prompt: "Write an architecture decision record before replacing auth").

2. **Multi-tenancy with data isolation** — `Community` currently has no tenant-boundary enforcement at the query layer (not verified this pass whether queries are implicitly scoped — needs a dedicated audit). Moving to true tenant isolation means every model with a `community_id`-equivalent foreign key needs enforced scoping at the service layer, plus IDOR-style tests proving cross-tenant reads/writes fail by default.

3. **NomadAI as multi-agent orchestrator** — today it's one controller making one direct Anthropic API call with no persistence model found. Becoming an orchestration layer with tool permissions, audit logs, and cross-product knowledge retrieval is a from-scratch build, not an extension of existing code.

4. **Jobs ownership moves to USAM Jobs** — Hub currently has no job-application code of its own (confirmed: `Opportunity`/`OpportunityApplication` models exist and are Hub-native, not Jobs-sourced). If Jobs is meant to own applications going forward, the relationship between Hub's existing `Opportunity` feature and the external Jobs product needs clarifying — are opportunities migrating out of Hub, or is Hub keeping a lighter "opportunities" feature distinct from formal "Jobs applications"? This needs a decision (see Essential Questions in the final report).

## What should NOT change without an ADR

- The 42-model schema and its migrations — any tenant/SSO change must be additive and backward-compatible per the master prompt's non-negotiable rules.
- The existing admin role model (`super_admin`/`admin`/`moderator`) — extending it for tenant-admin needs careful mapping, not a replacement.
- The single EC2 + RDS + on-host-Redis infrastructure constraint — stated as a hard constraint in the master prompt, not up for revision without explicit approval.

## Next step

Write ADR-001 (SSO/identity) and ADR-002 (tenancy model) once the essential questions (central IdP, if any; organizational structure of the "multi-product USAM ecosystem") are answered. No further architecture work should proceed blind on these two topics.
