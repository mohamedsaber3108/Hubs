# USAM Hub — AWS Production Readiness Assessment

> Evidence-based assessment of the repository's readiness to deploy on the **confirmed, final AWS architecture** (EC2 + Nginx + PM2 + RDS MySQL + Redis-on-EC2 + S3 + SES + Socket.IO). Vercel/serverless/Postgres/Next.js are explicitly **out of scope** (see `docs/architecture/ADR-008-aws-infrastructure.md`). Every finding cites a real file. **No deployment, DNS change, production change, or destructive DB operation has been performed.**
>
> Verdict scale: **READY** = correct and complete for production as written. **NEEDS-CONFIG** = code/script is correct but requires real values/provisioning before launch (expected). **BLOCKER** = a code/script defect or missing piece that will cause failure or a security problem and must be fixed before go-live.

## 0. Overall verdict

The deployment story is **well-architected and matches the confirmed stack exactly** — the deploy scripts, Nginx config, PM2 config, RDS SSL config, graceful shutdown, and the 13-section `DEPLOY_CHECKLIST.md` are a genuinely strong foundation, not boilerplate. **It is NOT production-ready today.** There is one real architecture-level BLOCKER (Socket.IO under PM2 cluster has no Redis adapter), a missing CI/CD pipeline (contradicting the "AWS-based CI/CD" requirement and the phase docs), several script/config defects, and the expected set of credential/provisioning items. None are large; all are enumerated below with exact fixes.

## 1. Component-by-component readiness

| Component | Verdict | Evidence / detail |
|---|---|---|
| **EC2 bootstrap** (`deploy/ec2-setup.sh`) | NEEDS-CONFIG + minor BLOCKER | Installs Node 20, PM2, Nginx, Redis, Certbot, UFW correctly. Placeholders `REPO_URL="…/YOUR_ORG/usam-hub.git"` and `DOMAIN="yourdomain.com"` must be filled. Redis password is `sed` to the literal `CHANGE_REDIS_PASSWORD` — must be a real secret. Runs `db:seed:all`, which seeds **demo users + a weak default admin into production** — see BLOCKER-4. |
| **Zero-downtime deploy** (`deploy/deploy.sh`) | READY (minor) | `git pull` → `npm install --production` → migrate → frontend build+copy → `pm2 reload usam-hub-api` → `nginx -t && reload`. Correct. Uses `npm install`; `DEPLOY_CHECKLIST §2.4` uses `npm ci --omit=dev` — harmonize on `npm ci` for reproducible installs. |
| **PM2 process config** (`deploy/pm2.config.js`) | NEEDS-CONFIG + BLOCKER-2 | Cluster mode `instances:'max'`, `max_memory_restart:500M`, autorestart, log files — good. App name is `usam-hub-api`. **BLOCKER-2**: `DEPLOY_CHECKLIST.md §2.6/§12` tell the operator to run `pm2 start ecosystem.config.js` and `pm2 reload usam-hub-backend` — a non-existent filename and a wrong app name; those documented commands will fail. |
| **Rollback** (`deploy/rollback.sh`) | READY (minor) | Interactive `git checkout` + `npm install` + `pm2 reload usam-hub-api` (correct name). `migrate:undo` is commented out — intentional (manual). Harmonize `npm install`→`npm ci`. |
| **RDS init** (`deploy/rds-init.sql`) | NEEDS-CONFIG | Creates `usam_hub` + `usam_hub_test`, `usam_user@'%'` with migration-capable grants. Password literal `CHANGE_THIS_PASSWORD` must be replaced. Grants include DROP/ALTER (needed for `sequelize-cli` migrations; acceptable). |
| **SSL** (`deploy/ssl-setup.sh`) | NEEDS-CONFIG | `certbot --nginx` for domain + www, auto-renew cron — correct. `DOMAIN`/`EMAIL` placeholders. |
| **Nginx** (`deploy/nginx.conf`) | NEEDS-CONFIG | Proxies `/api/`, `/socket.io/`, `/health`, `/api/docs` → `127.0.0.1:3000`; serves SPA from `/var/www/html/usam-hub`; HSTS/CSP/gzip; `client_max_body_size 20M` (≥ app's 10MB upload cap — consistent). Only `server_name yourdomain.com` placeholder blocks it. |
| **App bootstrap** (`src/server.js`) | READY | HTTP + Socket.IO (`/chat`, `/notifications`), `connectWithRetry` (5×) for MySQL+Redis, job registration, graceful shutdown (SIGTERM/SIGINT + 30s force), uncaught/unhandled handlers. Solid. |
| **RDS connectivity** (`src/config/database.js`) | READY | Production block sets `dialectOptions.ssl = { rejectUnauthorized: true }` — TLS to RDS enforced; pool min2/max10. Correct. |
| **Redis** (`src/config/redis.js`) | READY (see BLOCKER-1) | ioredis with retry strategy; backs cache + Bull queues. Fine as a client; the cluster-broadcast gap is BLOCKER-1, not a redis-config fault. |
| **S3/SES** (`src/config/aws.js`) | READY (recommendation) | S3Client + SESClient from env credentials. Works. Recommendation: on EC2 prefer an **IAM instance role** over static `AWS_ACCESS_KEY_ID`/`SECRET` (removes long-lived keys from `.env`). |
| **Health check** (`src/app.js` `/health`) | READY | Checks `sequelize.authenticate()` + Redis ping. Adequate for ALB/uptime probes; could split liveness vs readiness later. |
| **Security middleware** (`src/app.js`) | READY (minor) | helmet, CORS allow-list, rate limiting, compression. Note `express-mongo-sanitize` + `xss-clean` are dead weight on a MySQL stack (SEC-09, low). |
| **CI/CD pipeline** | **BLOCKER-3** | **No `.github/` directory and no workflow files exist anywhere in the repo** (verified). `DEPLOY_CHECKLIST §8` lists GitHub Actions secrets for pipelines that don't exist, and `PHASE_7_SUMMARY.md`'s claim of `ci.yml`/`deploy.yml` is false. The confirmed architecture requires "AWS-based CI/CD with health checks, backups, monitoring, rollback" — the pipeline is missing. |
| **Monitoring / backup / alerting** | NEEDS-CONFIG | `DEPLOY_CHECKLIST §10` documents CloudWatch alarms + PM2 logrotate as procedures; nothing is codified in the repo. RDS automated backups are an AWS-console setting (documented, not in code). Acceptable as runbook items, but none are automated. |

## 2. Blockers (must fix before go-live)

### BLOCKER-1 (High) — Socket.IO has no Redis adapter under PM2 cluster — ✅ RESOLVED (commit 388978c)
Original finding: `pm2.config.js` runs `exec_mode: 'cluster'` with `instances: 'max'`; `src/server.js` attached Socket.IO with no `@socket.io/redis-adapter`, so broadcasts never crossed workers.
- **Resolution:** `@socket.io/redis-adapter` is now a hard `dependency` (lockfile synced; `npm ci` deterministic). `setupSocketAdapter()` wires `io.adapter(createAdapter(pub, sub))` with a bounded boot-time Redis reachability check. Verified: the server boots with the adapter enabled against real Redis.
- **Fail-closed:** in multi-worker cluster mode (detected via `SOCKET_CLUSTER_MODE=true` set in `pm2.config.js`, PM2 `exec_mode=cluster_mode`, or `NODE_APP_INSTANCE>=1` — see `src/utils/clusterMode.js`), a missing/unreachable adapter now **refuses to boot** (`process.exit(1)`) rather than silently degrading. Single-worker/dev still degrades gracefully.
- **Proven, not asserted:** `tests/integration/socket-cluster.test.js` runs two Socket.IO servers on a shared Redis bus and asserts a broadcast from worker B reaches a client on worker A (real cross-worker delivery). `tests/unit/clusterMode.test.js` covers the fail-closed detection matrix. Full backend suite 236 passing / 26 suites.

### BLOCKER-2 (Medium) — PM2 app-name / filename inconsistency in the checklist
`DEPLOY_CHECKLIST.md §2.6` says `pm2 start ecosystem.config.js --env production` and §12 says `pm2 reload usam-hub-backend`, but the actual file is `deploy/pm2.config.js` and the actual app name is `usam-hub-api`. An operator following the checklist verbatim gets "file not found" / "process not found" and a failed deploy or rollback.
- **Fix:** correct the checklist to `pm2 start deploy/pm2.config.js` and `pm2 reload usam-hub-api` (or rename the file to `ecosystem.config.js` and the app to match — pick one and make all of `deploy.sh`, `rollback.sh`, `pm2.config.js`, and the checklist agree).

### BLOCKER-3 (Medium) — no CI/CD pipeline exists
No `.github/workflows`. The "AWS-based CI/CD with health checks, backups, monitoring and rollback" requirement is unmet. Deploys today are manual SSH + `deploy.sh`.
- **Fix:** add a GitHub Actions workflow that runs lint + typecheck + `npm test` (unit always; integration against a service-container MySQL+Redis) + frontend build, and a deploy workflow (SSH to EC2 → `deploy.sh`) gated on green checks. The checklist already lists the required secrets.

### BLOCKER-4 (Medium, security) — production bootstrap seeds demo data + weak default admin
`ec2-setup.sh` runs `npx sequelize-cli db:seed:all`, which includes `seed-demo-users` (demo accounts with known passwords) and a default admin. Seeding demo users into production is a data/security problem, and the default admin credentials are well-known.
- **Fix:** in production, seed only the structural seeders (admins placeholder, communities, settings, pricing, email-templates) — not demo users — and force an admin-password change on first login (the checklist already flags the password change at §1.4/§9, but the demo-users seed should simply not run in prod).

### BLOCKER-5 (Medium, security) — onboarding endpoint returns 500 (product defect, also a launch blocker)
`GET/POST /api/v1/onboarding` return HTTP 500 (reproduced live earlier this session) because `onboarding.controller.js` reads/writes columns that don't exist. A new user cannot complete onboarding → cannot be properly placed into communities. This is both a product bug and a go-live blocker. **Fixed in this same work batch** (see the commit for P0-1); listed here so the readiness picture is complete.

## 3. Needs-config (expected pre-launch provisioning — not defects)

These are the normal "fill in real values / provision AWS resources" items, already well-documented in `DEPLOY_CHECKLIST.md`. Tracked here so nothing is missed:
- Real domain in `nginx.conf`, `ssl-setup.sh`, `ec2-setup.sh` (replaces `yourdomain.com`) — **gated on ADR-003 domain verification.**
- Real GitHub repo URL in `ec2-setup.sh` (`YOUR_ORG`).
- Real secrets in `.env` (64+ char JWT secrets, RDS password, Redis password) — never placeholders.
- `.env.example` drift (SEC-05): add `ADMIN_JWT_EXPIRES`, `MAX_FILE_SIZE_MB`, `SMTP_*`; remove or document unused `AWS_S3_BUCKET_PRIVATE`/`AWS_SES_REPLY_TO`.
- Provision: RDS MySQL 8 (SSL on), Elastic IP, S3 buckets (`usam-hub-storage` public-read-prefix + `usam-hub-private`) with CORS/bucket policy, SES domain verification + sandbox exit, IAM app user (or instance role).
- OAuth apps (Google/GitHub/Facebook/LinkedIn) — strategies skip silently if env absent.
- CloudWatch alarms + RDS automated backups + PM2 logrotate (runbook items).

## 4. Carried-over security findings still relevant on AWS

From `docs/audit/SECURITY_AND_PRODUCTION_GAPS.md` (unchanged by the platform decision):
- **SEC-02** admin and user JWTs share `JWT_ACCESS_SECRET` (wire up the already-referenced `ADMIN_JWT_SECRET`).
- **SEC-03** OAuth callback leaks the access token in a URL query string.
- **SES bounce webhook** (`POST /api/v1/webhooks/ses-bounce`) still unimplemented — matters for SES reputation/sandbox-exit.
- **Dependency vulns**: criticals already fixed; dev-tooling majors remain (track A8).

## 5. Go-live checklist (AWS, condensed — full procedure in DEPLOY_CHECKLIST.md)

Ordered, with the blockers folded in:
1. **Code fixes first** (this repo, before any infra): BLOCKER-1 Socket.IO Redis adapter, BLOCKER-2 PM2 naming, BLOCKER-4 prod-safe seeding, BLOCKER-5 onboarding (done), add CI/CD (BLOCKER-3). All with tests; keep the 195 green.
2. **Provision AWS** (needs-config §3): RDS, EC2 + Elastic IP, security groups (3306 EC2-SG-only, 3000 never public), S3, SES, IAM.
3. **Secrets**: generate JWT/Redis/RDS secrets; fill `.env`; never commit.
4. **Bootstrap**: run `ec2-setup.sh` (with real repo URL + domain), structural seed only, change admin password.
5. **SSL + DNS**: `ssl-setup.sh`, Elastic IP, DNS records — **gated on ADR-003 domain confirmation.**
6. **Verify**: `DEPLOY_CHECKLIST §11` post-deploy checks (health, auth, admin login, swagger, WS smoke test, email, S3 upload, NomadAI).
7. **Rollback ready**: confirm `rollback.sh` app name matches; test a rollback in staging before relying on it.

## 6. What's genuinely good (so this isn't all negatives)
- The stack-to-deploy mapping is correct and coherent (no architecture surprise).
- RDS SSL is enforced in the prod DB config.
- Graceful shutdown + connect-with-retry are properly implemented.
- Nginx security headers, CSP, gzip, and body-size limits are sensible.
- The 13-section deploy checklist is thorough and covers RDS/EC2/S3/SES/SSL/DNS/security/monitoring/rollback.
- 195 backend tests pass; the dev environment is reproducible via Docker Compose.

## 7. Verification status of this assessment
Every verdict above was derived from reading the actual file named in the "Evidence" column. The absence of CI/CD was verified by directory inspection (no `.github/` anywhere). The onboarding 500 and the opportunity bugs were reproduced/confirmed earlier this session. The Socket.IO-cluster finding is from reading `server.js` (no adapter) + `pm2.config.js` (`instances:'max'`) together — it is a correct-by-construction conclusion, not yet reproduced under a live two-worker cluster. Nothing here was deployed or changed in production.
