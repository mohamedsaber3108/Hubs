# ADR-008: AWS is the Final Infrastructure Platform for USAM Hub

## Status
**Accepted — final.** This decision is explicitly stated by the product owner as final and not to be revisited. Vercel, serverless, Next.js, PostgreSQL, and Cloudflare are **out of scope** for this project.

## Context
Earlier exploration briefly considered a Vercel deployment. That is withdrawn. The confirmed decision is to host the entire USAM Hub / Communities application on **AWS**, using the existing codebase as its foundation, with no change to the application stack.

## Decision
The confirmed, final architecture:

| Concern | Choice | Notes |
|---|---|---|
| Frontend | React + Vite SPA, built and served as static files through **Nginx on EC2** | existing `frontend/` (Vite), unchanged |
| Backend | **Node.js + Express on EC2** (PM2 cluster) | existing `backend/backend/`, long-running stateful server |
| Database | **MySQL on AWS RDS** | existing Sequelize models/migrations; RDS SSL enforced in `config/database.js` |
| Cache / queues / rate-limit | **Redis on EC2** | existing ioredis + Bull; see readiness BLOCKER-1 for the Socket.IO adapter gap |
| Real-time | **Socket.IO** (`/chat`, `/notifications`) | existing |
| File/document storage | **AWS S3** | existing `s3.service.js` + `config/aws.js` |
| Email | **AWS SES** (SMTP fallback) | existing `email.service.js` |
| AI | existing **NomadAI** (Anthropic), **AWS Bedrock evaluated where appropriate** | ties to the NomadAI multi-agent track |
| Reverse proxy / SSL | **Nginx + Let's Encrypt HTTPS** | existing `deploy/nginx.conf`, `ssl-setup.sh` |
| Deployment | **AWS-based CI/CD** with health checks, backups, monitoring, rollback | CI/CD pipeline is currently MISSING — see readiness BLOCKER-3 |
| Auth / RBAC | existing JWT + Passport; ecosystem SSO via provider-independent OIDC seam (ADR-004) | unchanged stack; SSO is additive/future |

## Rationale
- Preserves the entire existing, working stack (React/Vite + Express/Sequelize/MySQL/Redis/Socket.IO/S3/SES) — no risky re-platform, no MySQL→Postgres migration, no serverless rewrite of a stateful server.
- AWS fits the already-present dependencies (S3, SES, optional Bedrock) and the already-written deploy assets (`backend/deploy/*`, `DEPLOY_CHECKLIST.md`) which target exactly EC2 + RDS + Redis + Nginx + PM2.
- Keeps the application aligned with the broader USAM ecosystem, which is AWS-centric (E-USAM, Noventra, USAMKO, Kids all use AWS services).

## Consequences
- All deployment planning targets AWS only. The `docs/deployment/AWS_PRODUCTION_READINESS.md` assessment supersedes any prior platform analysis.
- Platform is decided; **domain is still unverified** (ADR-003 — `hub.usamif.com` remains a candidate; this ADR does not assign or change any domain/DNS).
- The readiness assessment's blockers (Socket.IO Redis adapter, PM2 naming, CI/CD, prod-safe seeding, onboarding fix) are the concrete path to production.
- No deployment, DNS change, production change, or destructive DB operation happens without explicit approval.

## Non-goals (explicitly rejected)
Vercel, Next.js, serverless functions, PostgreSQL, Cloudflare Workers/D1/R2. These are not to be reintroduced for this project.
