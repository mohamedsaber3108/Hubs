# USAM Ecosystem — Architecture and Integration Report

> Verified, evidence-based read-only inspection of five USAM-family projects on this machine, performed from the primary project `M:\HUb_comunites` (USAM Communities / "USAM Hub"). **No other project was modified, no database migrated, no deployment changed.** This report is the basis for integrating USAM Communities with the rest of the ecosystem; it does not itself make any integration changes.
>
> Confidence markers used below: **[verified]** = read directly from that project's source/config; **[unverified]** = could not confirm from code and the network was offline during inspection (flagged, not assumed).

## 0. How this was produced

Each project was inspected read-only (file listings, manifests, settings, auth modules, route maps, deploy configs). The four non-primary projects were profiled via dedicated investigation passes; the primary project's facts come from prior sessions plus its own `backend/deploy/nginx.conf`. Where a project's own docs contradicted its code, the **code** was treated as ground truth and the contradiction noted.

## 1. The five products at a glance

| # | Project (disk path) | Product | Domain | Backend stack | DB | Auth | Status |
|---|---|---|---|---|---|---|---|
| 1 | `M:\HUb_comunites` **(PRIMARY)** | USAM Hub — professional networking / communities | **unassigned** (nginx = placeholder `yourdomain.com`) | Node / Express + Sequelize + Socket.IO | **MySQL 8** | Custom JWT (access in `localStorage`, refresh httpOnly cookie) + 4 OAuth scaffolded | Working; 195 backend tests passing |
| 2 | `M:\E-USAM` | E-USAM — gamified e-learning (cards, AI coach "Masar") | `edu.usamif.com` (+ `eusam.com`) | Django 5.2 + DRF + django-rq | PostgreSQL 15 | Cookie-JWT (dj-rest-auth + simplejwt + allauth); Google/GitHub social + AWS Cognito scaffolded | Deployed (systemd + gunicorn + nginx) |
| 3 | `M:\USAM Learning Worlds` | USAM for Kids — kids learning (ages 8–14, AI char "Azouz") | `kids.usamif.com` | **Active app is frontend-only** (TanStack Start + Vite + React 19 + Bun) on **Cloudflare Workers**; a **detached** NestJS + Prisma backend exists but isn't wired in | PostgreSQL (only in the detached backend) | Active UI uses **mock/placeholder** auth; a real JWT client exists but is underused | Frontend built; backend detached; docs overstate completeness |
| 4 | `M:\jobs.usamif` | "Noventra" (renamed from USAM) — **study-abroad fair platform** (NOT a jobs board) | `noventra.com` | Django 5.0.7 + DRF + Celery | PostgreSQL 16 | JWT (simplejwt, rotate + blacklist) + Google OAuth (allauth) | Active; mid-rebrand (USAM→Noventra partially applied) |
| 5 | `M:\USAMKO` | USAMKO — B2B lead-generation + social-outreach automation | `usamko.usamif.com` | pnpm/turbo monorepo: NestJS 11 API (`:3000`) + Next.js web (`:3001`) + Python scraping service | PostgreSQL 16 (Prisma) | NestJS Passport + JWT dual-token + bcrypt + Google/GitHub OAuth; **multi-tenant** | Deployed (PM2 + nginx); subsystems admittedly siloed |

### Naming traps worth remembering
- **`M:\jobs.usamif` is NOT a jobs product.** The folder name is misleading; the product is **Noventra**, a study-abroad fair platform. [verified: `RENAME_TO_NOVENTRA.md`, `.env.production` → `noventra.com`]
- **`M:\USAMKO`'s `.sln` / .NET desktop story is aspirational** — the runnable code is Node/TS (NestJS + Next.js), not .NET. [verified: `apps/`, `services/`, `prisma/` all JS/TS/Python]
- **E-USAM's `backend/README.md` says "Yumi Ecommerce Store"** — it was scaffolded from an e-commerce template; vestiges remain (JWT cookie names `ecomm-auth`/`ecomm-refresh`, a `UserAddress` model). The authoritative description is the root `README.md`. [verified]

## 2. The `hub.usamif.com` question — explicitly unverified

The screenshot that started this investigation showed a browser tab at `hub.usamif.com`. **None of the five source trees on disk reference `hub.usamif.com`** — confirmed by searching all five. [verified: zero matches across E-USAM, Learning Worlds, Noventra, USAMKO, and HUb_comunites]

What is verified:
- Each of the other four products is wired to its own distinct subdomain (`edu` / `kids` / `usamko` / `noventra.com`). [verified]
- `M:\HUb_comunites`'s nginx config (`backend/deploy/nginx.conf`) still uses the literal placeholder `server_name yourdomain.com www.yourdomain.com` and serves static files from `/var/www/html/usam-hub`. It has **never been assigned a real domain**. [verified]

Two possibilities remain, and I could not decide between them from code (the network was offline, so I could not resolve or `curl` the live site):
1. **`hub.usamif.com` is the intended production domain for THIS project** (`M:\HUb_comunites`) once it's deployed — it fits the `*.usamif.com` subdomain pattern exactly, and the nginx placeholder is consistent with "not yet deployed."
2. **`hub.usamif.com` is served by something not on this machine** (a different repo, a different host, or a newer build).

**Action needed from you:** confirm whether `hub.usamif.com` is meant to be this Communities project's domain. If yes, that's a one-line nginx/env change we make later (not now). If no, point me at whatever actually serves it.

## 3. Per-product technical detail (verified)

### 3.1 USAM Hub — `M:\HUb_comunites` (primary)
Node/Express + Sequelize + **MySQL 8** + Redis + Socket.IO. Custom JWT auth: access token in `localStorage`, refresh token as an httpOnly cookie tracked in a `sessions` table + Redis; `middleware/auth.js` uses Passport-JWT; a separate admin JWT scheme (`type: 'admin'` claim). Four OAuth strategies (Google/GitHub/Facebook/LinkedIn) scaffolded but un-credentialed. 42 Sequelize models, feature set covers feed, communities, groups, events, challenges, opportunities, resources, mentors, messaging, leaderboard, admin, NomadAI (Anthropic). See `docs/architecture/CURRENT_STATE_VERIFIED.md` for the full internal profile. **This is the odd one out on two axes: MySQL (everyone else is Postgres) and Express (everyone else is Django or NestJS).**

### 3.2 E-USAM — `edu.usamif.com`
Django 5.2 + DRF + PostgreSQL 15 + Redis + django-rq. 20 Django apps under `backend/api/`. Auth is **cookie-based JWT** (dj-rest-auth + simplejwt + allauth): custom `users.User` with `USERNAME_FIELD = "email"`, cookies `ecomm-auth`/`ecomm-refresh` (Secure, HttpOnly, SameSite=Lax), 60-min access / 30-day refresh. Google + GitHub social login and an AWS Cognito path are scaffolded but un-credentialed by default. Most ecosystem-relevant apps:
- **`api/payments/`** — deliberately built as a shared commerce foundation: `PLATFORM_CODE` namespacing (default `E`, intended per-product ecosystem letters), EGP base currency with display FX, pluggable gateways (Stripe/Paymob/Fawry/Bank-of-Alexandria/manual), clean `checkout/ orders refunds providers/ webhook/<provider>/ fx/` endpoints. **This is the single most ecosystem-ready component in the whole family.** [verified: `backend/config/settings/base.py` payments block + `api/payments/urls.py`]
- **`api/notifications/`** — notification + email service over a custom AWS SES backend.
- **`api/gamification/`** — XP/badges/streaks/leaderboard/challenges.
- **`api/ai_coach/`, `ai_workspace/`, `admin_ai/`** — AWS Bedrock-backed AI.

Deployed via systemd (`eusam-backend.service`) + gunicorn + nginx (`deploy/nginx-eusam.conf`, backend on `127.0.0.1:8002`); a root `docker-compose.yml` also exists (`eusam-*` containers, backend `:8000`).

### 3.3 USAM Learning Worlds — `kids.usamif.com`
The **active** application is a **frontend-only** TanStack Start + Vite + React 19 + Bun app deployed to **Cloudflare Workers** (confirmed by generated `.output/server/wrangler.json`). It runs on **mock data** — `src/services/index.ts` exposes an explicit placeholder `authService` and the UI behaves as always-authenticated. A real JWT client exists (`src/services/api.ts`, bearer token in `localStorage`, base `VITE_API_URL` default `http://localhost:3000/api`) but is lightly wired. A **separate, detached** NestJS 10 + Prisma + PostgreSQL backend lives in `backend/` with real JWT/Passport/bcrypt auth, but the frontend does not import it. Intended production domain `kids.usamif.com` [verified: `backend/prisma/seed-full.js`]. **Caveat: this project's markdown docs significantly overstate completeness; trust the code, not the PHASE_*/STATUS docs.**

### 3.4 Noventra (`M:\jobs.usamif`) — `noventra.com`
Study-abroad fair platform. Django 5.0.7 + DRF + PostgreSQL 16 + Celery + Redis. Auth: JWT (simplejwt, `ROTATE_REFRESH_TOKENS` + `BLACKLIST_AFTER_ROTATION`) + Google OAuth (allauth); custom `accounts.User` with `USERNAME_FIELD = 'email'`, UUID external id, and a `role` field (`student` / `university_rep` / `organizer` / `owner`) — a genuine role model. Rich `StudentProfile` with a `calculate_profile_score()` completeness metric. API groups under `/api/v1/`: `auth universities programs scholarships applications documents events booths sessions meetings ai-advisor notifications analytics opportunities`. AI advisor via AWS Bedrock. Active frontend `noventra-launchpad/` (React 19 / TanStack Start / Vite / axios). **Note the `opportunities` app — this overlaps conceptually with USAM Hub's own opportunities feature.**

### 3.5 USAMKO — `usamko.usamif.com`
B2B lead-generation + social-outreach automation. pnpm/turbo monorepo: `apps/api` (NestJS 11, `:3000`), `apps/web` (Next.js, `:3001`), `services/scrapling` (Python), plus `linkout/` (standalone Next.js), and Chrome extensions that relay captured session tokens over a **raw WebSocket** gateway (`token-capture`). Auth: NestJS Passport + JWT **dual-token** + bcrypt + Google/GitHub OAuth. **Multi-tenant by design** — `User` keyed by compound unique `(tenantId, email)`, and nearly all ~28 Prisma models carry `tenantId` with cascade isolation. Secrets in an AES-256-GCM `CredentialVault`. **Its `INTEGRATION_MASTER_PLAN.md` already proposes a shared-JWT + shared-Redis SSO scheme across its own silos — the closest thing to an ecosystem SSO design that exists today, though it's design-only and scoped to USAMKO's internal subsystems.**

## 4. Cross-cutting analysis

### 4.1 Shared-identity requirement (the central integration problem)
Every product has its own user table and its own login. A user who exists on `edu.usamif.com` is a completely separate account from the "same" person on `usamko.usamif.com` or USAM Hub. For a true ecosystem, **one identity must work across all products** — this is the master prompt's SSO mandate, now grounded in concrete evidence.

What makes it tractable:
- 4 of 5 products already use **JWT**; three already use **email as the username**.
- E-USAM has an **AWS Cognito** integration already scaffolded (un-credentialed).
- USAMKO already wrote a **shared-JWT SSO design**.
- All products live under one parent domain **`usamif.com`**, which enables cookie/session sharing strategies scoped to `.usamif.com`.

What makes it hard:
- **Three different auth implementations** (Django simplejwt ×2, NestJS passport-jwt ×2, Express custom ×1) with different token shapes, lifetimes, cookie-vs-bearer conventions, and secrets.
- E-USAM uses **cookie-JWT** (`ecomm-auth`, SameSite=Lax, single-origin tuned); USAM Hub and the others use **bearer tokens in localStorage**. These don't interoperate without a deliberate bridge.
- **No shared user-id space** — each DB auto-increments its own ids; USAMKO additionally scopes identity by `tenantId`.

### 4.2 Database divergence
Four products on **PostgreSQL**, USAM Hub alone on **MySQL**. This is a real conflict for any future shared-data or shared-schema ambitions. It does **not** block API-level integration (which is the recommended path anyway), but it does mean "just share a database" is off the table, and any shared-identity store should be its own service, not any one product's DB.

### 4.3 Duplicated functionality (consolidation candidates)
| Capability | Where it's duplicated | Consolidation opportunity |
|---|---|---|
| Auth / user accounts | all 5 | Central identity provider (see §5) |
| Gamification (XP/badges/streaks/leaderboard) | E-USAM, USAM Hub | Shared gamification service, or Hub consumes E-USAM's |
| AI via AWS Bedrock | E-USAM, Noventra (+ USAMKO, Learning Worlds-backend) | Shared AI gateway with per-product prompts/budgets |
| Email / notifications (AWS SES) | E-USAM, Noventra (SES); Hub (SES/SMTP) | Shared notification service |
| Payments / billing | E-USAM (purpose-built shareable) | Adopt E-USAM payments as the ecosystem billing service |
| Media / file storage (AWS S3) | E-USAM, Noventra, USAMKO, Learning Worlds-backend, Hub | Shared S3 bucket conventions / media service |
| "Opportunities" | USAM Hub, Noventra | Clarify ownership (Hub surfaces vs Noventra owns) — mirrors the Jobs decision in the master prompt |

### 4.4 Technical conflicts to respect
1. **Stack heterogeneity** — Express/MySQL (Hub) vs Django/Postgres (E-USAM, Noventra) vs NestJS/Postgres (USAMKO, Kids-backend). Integration must be **API-contract based**, not code-sharing.
2. **Cookie-JWT vs bearer-JWT** — bridging E-USAM's cookie auth with the others needs an explicit token-exchange step.
3. **Multi-tenancy only in USAMKO** — the ecosystem identity model must decide whether "tenant" is a global concept or USAMKO-local. (Mirrors ADR-002 in this repo's existing docs.)
4. **Learning Worlds' active app has no real backend wired in** — treating it as an API peer requires first connecting its detached NestJS backend (or building against mocks).
5. **Secrets/credential conventions differ** per product; a shared IdP must not assume any one product's token signing key.

## 5. Proposed unified architecture (direction, not an implementation)

The recommended shape is a **federated ecosystem behind a shared identity provider**, with each product staying its own deployable service and talking to shared capabilities over versioned HTTP APIs. Nothing here is built by this report — these are decisions to ratify first.

```
                         ┌─────────────────────────────┐
                         │   USAM Identity Provider      │  (OIDC/OAuth2 + PKCE)
                         │   issues ecosystem tokens      │
                         │   candidate: AWS Cognito        │
                         │   (already scaffolded in E-USAM)│
                         └──────────────┬──────────────┘
                                        │ ecosystem JWT / OIDC
   ┌──────────────┬───────────────┬────┴─────────┬───────────────┬──────────────┐
   │ USAM Hub      │ E-USAM         │ Noventra      │ USAMKO         │ USAM Kids     │
   │ (Communities) │ edu.usamif.com │ noventra.com  │ usamko.usamif  │ kids.usamif   │
   │ hub.usamif?   │                │               │                │               │
   └──────┬────────┴──────┬─────────┴───────┬───────┴──────┬─────────┴──────┬───────┘
          │               │                 │              │                │
          └───────────────┴── shared capability APIs ──────┴────────────────┘
                 Payments (E-USAM) · Notifications/SES · AI/Bedrock gateway · Media/S3
```

### 5.1 Identity / SSO — the first and highest-leverage decision
- **Preferred:** a central OIDC provider that every product trusts, with email as the stable subject and an ecosystem-wide account id. **AWS Cognito is the pragmatic front-runner** because E-USAM already scaffolds it and the whole family is AWS-centric (Bedrock, SES, S3). Keycloak remains the self-hosted alternative (evaluated in this repo's `docs/OPEN_SOURCE_REGISTRY.md`).
- Each product becomes a **relying party**: it keeps its local user row as a profile cache keyed by the ecosystem subject id, and stops being the source of truth for authentication.
- **For USAM Hub specifically** (this repo), that aligns exactly with the existing draft `docs/architecture/ADR-001-sso-identity.md` — this report supplies the missing real-world input that ADR was blocked on (there IS a usamif.com family; E-USAM already has Cognito scaffolded; no central IdP is live yet).
- Account linking: existing per-product accounts link by verified email on first ecosystem login; document a migration/forced-relink window per product.

### 5.2 Shared capability services (adopt, don't rebuild)
- **Payments → adopt E-USAM's payments app** as the ecosystem billing service. Its `PLATFORM_CODE` namespacing was explicitly designed for this. USAM Hub's pricing/subscriptions would call it rather than reimplement gateways.
- **Notifications/email → one SES-backed notification service** (E-USAM's or Noventra's is the template).
- **AI → one Bedrock gateway** with per-product system prompts, tool scoping, and cost budgets (ties to USAM Hub's Track E / NomadAI multi-agent plan).
- **Media → shared S3 bucket conventions** (per-product prefixes) rather than per-product buckets with divergent policies.

### 5.3 Where USAM Hub (Communities) fits
USAM Hub is the natural **social graph + activity layer** of the ecosystem: profiles, connections, feed, communities, groups, events, messaging. Integration targets, in dependency order:
1. **Consume ecosystem identity** (become an OIDC relying party) — unblocks everything else.
2. **Surface, don't duplicate**: show E-USAM courses, Noventra opportunities, etc. in the Hub feed/profile via their APIs + deep links (mirrors the "Jobs belongs to Jobs" principle already in this repo's docs).
3. **Call shared services** (payments, notifications, AI) instead of its own where overlap exists.
4. **Resolve the MySQL-vs-Postgres divergence** only if/when shared-data needs demand it — not required for API integration.

## 6. Phased integration plan (proposal — nothing executed)

Each phase is gated on explicit approval and does not change any other project without sign-off.

- **Phase 0 — Decisions (no code).** Confirm `hub.usamif.com` ownership; pick the IdP (Cognito vs Keycloak); confirm payments/notifications/AI consolidation targets; decide the tenant model. Produce ADRs in this repo.
- **Phase 1 — Identity foundation in USAM Hub.** Add an OIDC relying-party path alongside the existing JWT (feature-flagged, backward compatible). No other project touched yet. Account-linking by email.
- **Phase 2 — Read-only surfacing.** Hub pulls and displays data from E-USAM / Noventra via their existing `/api/v1/` endpoints (deep links first, then richer embeds). Pure consumer; no writes to other systems.
- **Phase 3 — Shared services.** Point Hub's billing at E-USAM payments; route Hub email/notifications through the shared SES service; route NomadAI through the shared Bedrock gateway.
- **Phase 4 — Reciprocal integration & ecosystem rollout.** Other products consume Hub's social/community APIs; coordinate the IdP cutover across products.

## 7. Open questions for you (blocking the above)

1. **Is `hub.usamif.com` this Communities project's intended domain?** (§2) — the one fact I could not verify from code.
2. **Which identity provider** for the ecosystem — AWS Cognito (already scaffolded in E-USAM, AWS-native) or self-hosted Keycloak?
3. **Is E-USAM's payments app the sanctioned ecosystem billing service**, or is billing owned elsewhere?
4. **Tenant model** — is "tenant/organization" a global ecosystem concept (as USAMKO assumes) or product-local?
5. **"Opportunities" ownership** — does Hub own community opportunities, or surface Noventra's? (and separately, is there a real "USAM Jobs" product beyond Noventra, which despite its folder name is study-abroad, not jobs?)

---

### Constraints honored by this report
Read-only inspection only. No repository merged, no database migrated, no other project modified, no production/deployment changed, primary project unchanged (`M:\HUb_comunites`). This document is the sole artifact produced, and it lives inside the primary project's `docs/`.
