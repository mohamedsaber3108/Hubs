# Open Source Candidate Registry

Evaluated per master prompt Track H. Verdicts: **Adopt** / **Prototype** / **Defer** / **Reject**. None of these are implemented — this is research only, as instructed ("Trial only one integration at a time in an isolated branch, behind a flag").

## Keycloak (SSO / IdP)

- **License**: Apache 2.0.
- **Resource cost**: Minimum 2 GB RAM / 2 CPU cores per DigitalOcean's marketplace docs; a single production pod commonly needs ~1-2 vCPU and 1-1.5 GB RAM for a bounded JVM heap ([skycloak.io](https://skycloak.io/blog/keycloak-production-sizing-ram-cpu-requirements/)), though a full HA cluster with ops support can run $1,250+/month once compliance and incident response are factored in ([skycloak.io](https://skycloak.io/blog/what-is-the-cost-of-self-hosting-keycloak/)).
- **Fit**: On a single EC2 host already running the Express app + Redis, adding a JVM process for Keycloak is a real resource commitment — needs explicit sizing/headroom check on the current instance before adoption, as the master prompt requires ("assess additional EC2 RAM/CPU, availability and ops burden").
- **Verdict**: **Prototype** (only after ADR-001 answers whether a central IdP is even needed yet, and only on a separate instance/sized box, not silently squeezed onto the existing EC2 host).

## OpenFGA (fine-grained authorization)

- **License**: Apache 2.0, CNCF-adjacent, based on Google's Zanzibar design ([openfga.dev](https://openfga.dev/docs/llms-full.txt)).
- **Fit**: Current authorization is simple RBAC (`User.role`, `Admin.role`) with controller-inline checks — adequate for today's feature set. OpenFGA's resource-level fine-grained model ("Alice can edit document-42" vs role-level) becomes relevant once multi-tenancy (ADR-002) and community-scoped permissions are implemented, and especially relevant for the AI-agent tool-permission work in Track E, since OpenFGA has first-class patterns for scoping agent credentials ([openfga.dev](https://openfga.dev/docs/modeling/agents)).
- **Verdict**: **Defer** — current built-in RBAC is sufficient until ADR-002 (tenancy) is decided; revisit if tenant/resource-level permission complexity outgrows controller-inline checks.

## Novu (multi-channel notifications)

- **License**: MIT for the self-hosted "Community" edition ([getbeton.substack.com](https://getbeton.substack.com/blog/novu-pricing-teardown/)); a separate Novu Cloud commercial offering exists but self-hosting avoids it ([docs.novu.co](https://docs.novu.co/community/project-differences)).
- **Resource cost**: Low-traffic self-hosted deployments can run as cheaply as $5-15/month, but a production-grade HA setup with a proper cluster costs meaningfully more ([suprsend.com](https://www.suprsend.com/post/open-source-vs-managed-notification)).
- **Fit**: Current notification handling is a single Sequelize `Notification` model plus email via SES/Nodemailer and presumably in-app via Socket.IO's `/notifications` namespace — not independently traced this pass. Novu would consolidate multi-channel delivery (email/SMS/push/in-app) behind one API, which has real value as the product grows multi-channel, but is a meaningful integration effort against existing working email/notification code.
- **Verdict**: **Defer** — current notification implementation is unverified in detail; investigate what exists today (Track A follow-up) before deciding if Novu solves an actual gap or duplicates working functionality.

## GrowthBook (feature flags / experiments)

- **License**: Open-core — MIT for the core platform, enterprise directories under a separate commercial license ([growthbook.io](https://www.growthbook.io/insights/open-source-feature-flags)).
- **Fit**: The backend already has a `FeatureFlag` Sequelize model and admin endpoints (`GET/PUT /admin/flags`, `PATCH /admin/flags/:name/toggle`, confirmed in `admin.routes.js`) — i.e., **a basic feature-flag system already exists and works**. GrowthBook would add experimentation/analytics on top, not replace a broken system.
- **Verdict**: **Defer** — existing feature-flag model is adequate for simple on/off flags; revisit only if A/B testing or statistical experiment analysis becomes a real product need.

## Chatwoot (customer support, not user-to-user chat)

- **License**: MIT for the core, but the `enterprise/` directory is under a separate source-available commercial license requiring a paid subscription to run certain features in production ([getbeton.substack.com](https://getbeton.substack.com/blog/chatwoot-pricing-teardown/), confirmed via [chatwoot/enterprise/LICENSE on GitHub](https://github.com/chatwoot/chatwoot/blob/develop/enterprise/LICENSE)).
- **Resource cost**: Officially recommended minimum is 4+ CPU cores and 8 GB RAM for production, running Ruby on Rails + Vue + PostgreSQL 16 + Redis 7+ ([chatwoot.com/deploy](https://www.chatwoot.com/deploy)) — this is **not compatible with the single-EC2 constraint** without a dedicated second host, and it also wants PostgreSQL, a second database engine distinct from the project's MySQL.
- **Fit**: Master prompt explicitly notes Chatwoot is "not a replacement for user-to-user chat" — Hub's own Socket.IO-based `/chat` messaging is a different concern (user-to-user DMs, already implemented and working). Chatwoot would only be relevant if USAM needs a support/helpdesk inbox for staff-to-customer tickets, a distinct product need not yet confirmed.
- **Verdict**: **Reject** for now — resource footprint alone (8GB RAM recommended, separate Postgres) doesn't fit the single-EC2 constraint, and there's no confirmed product requirement for a support helpdesk yet. Revisit only if that requirement is explicitly confirmed and a dedicated host is budgeted.

## Summary table

| Candidate | License | Verdict | Blocking reason if deferred/rejected |
|---|---|---|---|
| Keycloak | Apache 2.0 | Prototype | Needs ADR-001 answered + dedicated sizing, not squeezed onto existing EC2 |
| OpenFGA | Apache 2.0 | Defer | Current RBAC sufficient until tenancy (ADR-002) lands |
| Novu | MIT (self-hosted) | Defer | Need to verify what notification code already exists before justifying a swap |
| GrowthBook | Open-core (MIT core) | Defer | A working feature-flag system already exists (`FeatureFlag` model) |
| Chatwoot | MIT core / commercial enterprise dir | Reject | 8GB RAM + separate Postgres incompatible with single-EC2 constraint; no confirmed support-helpdesk requirement |

All verdicts are provisional and should be revisited once the relevant ADRs (SSO, tenancy) are resolved and once Track A's notification/feature-flag code is fully traced.
