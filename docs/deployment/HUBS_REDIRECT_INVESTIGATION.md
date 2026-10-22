# USAM Hubs — `hubs.usamif.com` → Yuzem Redirect Investigation

> Root-cause analysis + infrastructure audit + migration/repair plan.
> **Status: Phase 1 (repo-side audit) COMPLETE. Server-side evidence PENDING user-run commands.**
> No server, DNS, or production change has been made. Nothing has been pushed/merged/deployed.

---

## A. Verified facts (from provided screenshots + local repository)

### A.1 Servers (from EC2 console screenshots — treated as user-provided evidence)
| Server | Instance ID | Public IP | Private IP | Type | OS | Region |
|---|---|---|---|---|---|---|
| **Hub** (new, dedicated) | i-018467e33cd362c08 | 13.48.137.19 | 172.31.8.10 | t3.medium | Ubuntu 24.04 | eu-north-1 |
| **agent-ai** (existing, shared) | i-02ebdb6000dd6c7fe | 13.49.49.246 | 172.31.34.229 | t3.large | Ubuntu 24.04 | eu-north-1b |

The two Ubuntu login banners the user pasted: one (24.04, priv `172.31.34.239`) and one (26.04, priv `172.31.8.10`). `172.31.8.10` = the new Hub box's private IP → that 26.04 session is the Hub server. These are the USER's shells, not agent-driven.

### A.2 Repository (verified by reading files)
- Git remote: `https://github.com/Mahmoud-Elwazeer/hub.git`; default branch `main`. Current dev work is on `audit/baseline-verification` (NOT merged to main).
- Stack: React/Vite SPA (`frontend/`) + Node/Express/Sequelize API (`backend/backend/`), MySQL 8, Redis, Socket.IO, S3, SES, Anthropic (NomadAI).
- **NomadAI is a stateless call to `api.anthropic.com`** (`backend/backend/src/controllers/nomad.controller.js`) — NOT a self-hosted agent on the agent-ai server. ⇒ **USAM Hub has no runtime dependency on the agent-ai server.** Nothing needs to migrate *from* agent-ai; Hub is self-contained.
- Frontend API base is **relative** `/api/v1` by default (`frontend/src/lib/api.ts`), served same-origin via Nginx. **No hardcoded cross-domain/Yuzem URL** anywhere in the codebase (grep for `yuzem|usamif|agent-ai|13.49|13.48` found only docs references, no code redirect).

### A.3 Deploy kit present (`backend/deploy/`) — but NOT domain-configured
| File | State | Blocker for Hub deploy |
|---|---|---|
| `ec2-setup.sh` | Good bootstrap (Node 20, Nginx, Redis, PM2, Certbot, UFW) | `REPO_URL=YOUR_ORG/usam-hub.git`, `DOMAIN=yourdomain.com`, `requirepass CHANGE_REDIS_PASSWORD` are placeholders. Clones to `/var/www/usam-hub` then `cd $APP_DIR/backend` — **but the backend is nested at `backend/backend/` in the repo**, so paths are off by one dir. |
| `nginx.conf` | Correct structure (HTTP→HTTPS, `/api`+`/socket.io` proxy to `:3000`, SPA static, security headers) | **`server_name yourdomain.com` — NOT `hubs.usamif.com`.** TLS paths point at `/etc/letsencrypt/live/yourdomain.com/`. |
| `ssl-setup.sh` | Correct certbot flow | `DOMAIN=yourdomain.com` placeholder. |
| `pm2.config.js` | Correct (cluster, `usam-hub-api`, SOCKET_CLUSTER_MODE) | `cwd: /var/www/usam-hub/backend` — same off-by-one as above (real path would be `/var/www/usam-hub/backend/backend`). |
| `deploy.sh` / `rollback.sh` | Zero-downtime reload / git-checkout rollback | Same nested-path issue; `rds-init.sql` has `CHANGE_THIS_PASSWORD`. |
| `.env.example` | Complete + documents `ADMIN_JWT_SECRET` (required in prod), CORS, OAuth callbacks | All values are `yourdomain.com`/placeholder. DB config forces TLS (`ssl.rejectUnauthorized:true`) in production ⇒ needs RDS with a CA or `ssl` relaxed for a local MySQL. |

**Repo deployment-readiness verdict:** The application code is production-ready (264 backend tests, builds green). The *deploy kit is a template that has never been bound to the real domain* — consistent with ADR-003, which explicitly froze `hub.usamif.com` as a "candidate only, change nothing" until verified. So the live deployment does **not** match this repo's deploy config.

### A.4 Ecosystem context (verified in `docs/ecosystem/...`)
- USAM Hub is 1 of 5 products under `*.usamif.com`. "Yuzem" is not one of the 5 documented names here — it may be a rebrand/alias of one of them or a separate site on agent-ai. **Server evidence (vhosts/cert SANs) is needed to identify what "Yuzem" actually is.**

---

## ROOT CAUSE — CONFIRMED (round 2 evidence)

**`hub.usamif.com` (singular) resolves to the agent-ai box `13.49.49.246`, whose `/var/www/hub` static root is a STALE "USAM — Jobs Aggregator" SPA build (what the user calls "Yuzem"). There is no redirect — agent-ai serves the wrong static frontend directly, HTTP/2 200.**

Evidence:
- `dig +short hub.usamif.com A` → `13.49.49.246` (agent-ai, shared box).
- `curl -L https://hub.usamif.com/` → `HTTP/2 200`, `<title>USAM — Jobs Aggregator | One search. Every opportunity.</title>`.
- agent-ai `/var/www/hub/index.html` title = "USAM — Jobs Aggregator" (built 2026-08-01). The `hub.usamif.com` vhost: `root /var/www/hub` + `proxy_pass 127.0.0.1:3010` for /api.
- A node process DOES listen on `:3010` on agent-ai (pid 2338709 = PM2 `hub-backend`).
- `hubs.usamif.com` (PLURAL) has NO DNS record → the browser-visible "redirect" for the plural typo is a browser search fallback, unrelated to server config.
- **New dedicated box 13.48.137.19 / 172.31.8.10 is EFFECTIVELY EMPTY**: no nginx, no node, no npm, no mysql, no redis, no code in /home/ubuntu, nothing on any web port. (Earlier PM2 "hub-backend online" was stale; node isn't installed there now.)
- `marketplace.usamif.com` title = "USAM — Jobs Aggregator" too; `/var/www/usam` = 1.1G. `/var/www/hub` = 6.7M (an SPA build). agent-ai disk 88% (50G/58G).

### CORRECTION (round 3) — the real Hub IS deployed on agent-ai, but misconfigured
Round-2 said `/var/www/hub` was "the Jobs Aggregator / not this repo." Round-3 evidence corrects that:
- PM2 `hub-backend`: `script /home/ubuntu/hub/backend/backend/src/server.js`, `cwd /home/ubuntu/hub/backend/backend`, online on `:3010`. That nested `backend/backend` path IS this repo. The Communities API is live on agent-ai.
- `/home/ubuntu/hub/backend/backend/package.json` + `/home/ubuntu/hub/frontend/package.json` present → full repo checked out on agent-ai.
- The Communities keyword grep matched `/var/www/hub/assets/index-*.js|.css` → **`/var/www/hub` IS the Communities SPA bundle**, NOT the Jobs Aggregator.
- BUT `/var/www/hub/index.html` `<title>` still says "USAM — Jobs Aggregator" (last-modified Aug 1) → stale/mismatched index.html over a Communities asset bundle (half-replaced build), OR a wrong index.html copied in.

### The actual defects (this is the "rot")
1. **Wrong DB dialect**: backend-error log shows Sequelize **PostgreSQL** warnings ("PostgresSQL does not support BIGINT with LENGTH/UNSIGNED"). This repo is **MySQL** (UNSIGNED PKs throughout). The deployed backend is pointed at Postgres — wrong dialect, silent data-type divergence.
2. **Redis instability**: repeated `ECONNREFUSED 127.0.0.1:6379`, 15 PM2 restarts.
3. **Stale/mismatched frontend** in `/var/www/hub` (Jobs-Aggregator title).

### What "Yuzem"/"Jobs Aggregator" is
The title string "USAM — Jobs Aggregator" is a **stale index.html** (and the same title appears on `marketplace.usamif.com`). It is cosmetic/leftover, not a separate app being proxied. The fix is a correct rebuild+redeploy of THIS repo, not "removing a redirect" (there is none).

### FINAL ROOT CAUSE (round 4 — fully evidenced)
Two independent defects, both on agent-ai:

**(1) The deployed backend is a DIVERGED FORK that was rewritten to PostgreSQL.**
- agent-ai `/home/ubuntu/hub` is on branch `deploy`, commit `30d5754 "deploy: switch to PostgreSQL, fix migrations, add production env config"`, on top of `903889f "communities"` (= origin/main).
- `.env`: `DB_PORT=5432`, `DB_NAME=hub_db`; `src/config/database.js` `dialect: 'postgres'` (×3).
- This repo (local) is MySQL (`main` + `audit/baseline-verification`); the `deploy` branch is NOT in the local/origin repo. Someone forked it server-side and converted MySQL→Postgres. This is why the logs show Sequelize Postgres warnings + instability (15 restarts).

**(2) The served frontend is the WRONG product's build.**
- `/var/www/hub/index.html` `<title>` = **"E-USAM | Gamified E-Learning Platform"** (product #2, the Django e-learning app), NOT USAM Communities. Earlier the title also showed "USAM — Jobs Aggregator". ⇒ `/var/www/hub` has been overwritten repeatedly with different products' builds. It is not a clean Hub deployment.

**Net:** `hub.usamif.com` serves a mismatched stack — E-USAM's static frontend over a Postgres-converted fork of the Hub backend. No redirect anywhere; the wrong builds were deployed into the hub slot.

### Decisions locked (user, round 5)
- DB target: **AWS RDS MySQL** (do NOT provision/migrate yet).
- Existing data: **treat as production — preserve, do not reset/discard** until verified.
- Hostname: **`hub.usamif.com`** (singular; cert + DNS record already exist).
- Target server: `13.48.137.19` (dedicated). agent-ai + its 13 sites stay unchanged during prep.

### THREE DIVERGENT CODE LINEAGES (verified — critical for source + migration)
| Lineage | Location | DB | Migrations | Notes |
|---|---|---|---|---|
| `origin/main` `903889f` | GitHub | MySQL | **16** | lacks 17 (personas/onboarding), 18 (offers/orgs), 19 (partnerships) |
| `audit/baseline-verification` `0fde8ae` | LOCAL ONLY (unpushed) | MySQL | **19** | newest; 264 tests; all features + SEC-02/03, socket adapter, dev-proxy/feed fixes; **31 commits ahead of main** |
| server `deploy` `30d5754` | agent-ai only | **Postgres** | fork-rewritten | live but misconfigured; built on 903889f then converted MySQL→PG |

Implications:
- "Latest verified repo" = the LOCAL `audit/baseline-verification` branch, which is **not on GitHub**. Deployment source decision needed: push/merge that branch to `main` first (recommended — it's the tested, feature-complete MySQL version), OR deploy `origin/main` (older, missing offers/orgs/personas).
- Production schema is a **Postgres fork of the OLDEST lineage (16 migrations)**. A Postgres→RDS-MySQL data migration must reconcile: PG schema (16 migrations, fork-modified) → target MySQL schema (16 or 19 migrations). Record counts + schema diff required before designing the transform. This is why §MIGRATION below is gated on the round-5 dumps.

### Correction discipline (per user)
- Historical PG log lines ≠ current runtime dialect. MUST verify the LIVE process's effective config/connection (round-5 Block R1).
- Communities substrings in JS ≠ coherent working frontend. MUST verify served index.html + referenced assets + actual rendered app + commit (round-5 Block R2).
- PM2 restarts / Redis ECONNREFUSED: distinguish historical vs currently-active (round-5 Block R3).

---

## B. Earlier round-1 notes (superseded by ROOT CAUSE above)

### B.0 The domain is `hub.usamif.com` (singular), NOT `hubs.usamif.com`
- `dig +short hubs.usamif.com A` → **empty**. `curl https://hubs.usamif.com` → `curl: (6) Could not resolve host`. **`hubs.usamif.com` has NO DNS record and does not exist.**
- The agent-ai Nginx has a real vhost `server_name hub.usamif.com;` (singular) at `nginx -T` line 1055, with a valid LE cert (`hub.usamif.com`, expires 2027-01-14). ⇒ The provisioned Hub domain is **`hub.usamif.com`**. The browser "redirect to Yuzem" happens because `hubs.usamif.com` doesn't resolve, so the browser search-redirects / the user is actually on a different hostname.

### B.1 Topology (both sessions correlated)
- **New "Hub" box** (13.48.137.19 / 172.31.8.10, Ubuntu 26.04): **NO nginx installed**, nothing on 80/443, `/var/www` absent — BUT **PM2 `hub-backend` is online** (restarted 15×). So the new box runs ONLY the Hub API under PM2; no web server, no frontend, no TLS, and the API port is not yet confirmed.
- **agent-ai box** (13.49.49.246 / 172.31.34.239, Ubuntu 24.04, **disk 87% full**): the real multi-tenant Nginx host. ~13 vhosts incl. `hub.usamif.com`, `jobs/edu/flowly/marketplace/raise/shv/teamx.usamif.com`, `clinic/n8n.devstudiocraft.com`, `erp.pilot100.de`, `agro/openclaw.elwazeer.site`, `*.dns.devstudiocraft.com`, frappe ERP. Many Docker stacks (clinic, eusam, spicy-*). Listening: 80,443 (nginx), 3000 (docker-proxy→spicy-blocker), 8000/8001/8002/8006/8007 (gunicorn), 8081/8082 (docker).
- **`hub.usamif.com` vhost on agent-ai (line 1055–1107): `proxy_pass http://127.0.0.1:3010`. But NOTHING listens on 3010 on agent-ai** (not in `ss -ltnp`). ⇒ `hub.usamif.com` on agent-ai proxies to a dead port. The live Hub backend is on the NEW box, not reachable at agent-ai:3010.

### B.2 Why the user sees "Yuzem"
"Yuzem" is not a literal string in Nginx. The most probable mechanisms (to confirm in round 2):
1. The user typed/bookmarked `hubs.usamif.com` (plural) → no DNS → browser falls back to a search or a previously-cached site ("Yuzem" likely = the USAM `marketplace.usamif.com` storefront at `/var/www/usam/frontend/dist`, the only `http2` SPA vhost, proxy `:8000`).
2. OR `hub.usamif.com` DNS currently points at agent-ai, whose `hub.usamif.com` vhost proxies to dead `:3010`, producing 502/placeholder — need `dig hub.usamif.com` to confirm where it points.

### B.3 jobs.usamif.com cert EXPIRED (2026-10-16) — separate pre-existing issue, noted not fixed.

**Still needed to fully nail B.2:** `dig hub.usamif.com` (where it points), the full `hub.usamif.com` vhost body, and what `/var/www/hub` + PM2 `:3010` actually are. See round-2 commands in chat.

---

## C. Server/DNS evidence required (read-only — run these and paste output)

See the chat message for the grouped, copy-paste command blocks (DNS from your laptop, then agent-ai, then Hub). All are read-only; none modify services.

---

## D. Options (to finalize after §C evidence)

- **Option A — Repair config on agent-ai** (if Hub is actually deployed/intended there). Lowest effort but keeps Hub coupled to the shared box.
- **Option B — Migrate running deployment agent-ai → Hub.** Only if Hub is currently live on agent-ai; otherwise N/A.
- **Option C — Clean redeploy from GitHub to the dedicated Hub server (13.48.137.19), point DNS at it, issue a cert for `hubs.usamif.com`, leave agent-ai/Yuzem untouched.** Matches the user's preferred end-state and the repo's AWS-native design. **Provisionally recommended** pending §C.

---

## E. What stays vs moves (verified)
- **Stays on agent-ai:** Yuzem and anything else hosted there. Hub has zero code dependency on it.
- **Moves/deploys to Hub box:** frontend build + backend API + Redis (local) + env/secrets; MySQL either local on the box or a separate RDS (decision in final plan).
- **External SaaS (unchanged, used by Hub directly):** Anthropic (NomadAI), AWS S3/SES.

---

## ROUND 5 — LIVE verification settled (corrections applied)
- **DB is genuinely PostgreSQL NOW** (not just old logs): PG 16.15 listening on :5432, live env `DB_PORT=5432 DB_NAME=hub_db`, `/health`→200 `database:ok,redis:ok`. dialect `postgres` x3.
- **Production data (real but tiny)**, approx rows: users=5, community_memberships=6, communities=4, admins=3, settings=10, feature_flags=7, email_templates=4, pricing_plans=3; **ALL other tables = 0**. Prod `SequelizeMeta` = **16 migrations** (no offers/orgs/partnerships/personas tables exist).
- **Served frontend is E-USAM, conclusively**: index.html title/og:url/desc all E-USAM (edu.usamif.com); referenced bundle index-Ylj6pzPx.js greps 38x E-USAM, 33x Masar, 0 Communities. `/var/www/hub` = an E-USAM build wrongly placed in the hub slot (mixed www-data/root asset ownership = layered overwrites).
- **PM2/Redis = historical, not active**: restarts=15 but uptime=2 months, unstable_restarts=0; all ECONNREFUSED:6379 lines timestamped 2026-10-21 06:46 (one transient blip, recovered); now redis PONG + active; newest logs routine cron. Backend STABLE now.
- **Uploads = S3** (`s3.service.js`), not local => no local file store to migrate.
- Deployed fork migrations = 16 (same names as origin/main); fork only changed dialect, not schema features.

### CORRECTION LEDGER (earlier wrong reads, fixed by evidence)
- WRONG (r2): "/var/www/hub = Jobs Aggregator / not this repo" => it's **E-USAM**; the *backend* checkout IS hub (fork).
- WRONG (r3): "/var/www/hub bundle IS Communities" => bundle is **E-USAM** (0 Communities terms); r3 grep hit a stale leftover file.
- The DB is **live Postgres right now** (user was right to force the check).
- The 15 restarts/Redis errors are **historical**; backend stable 2 months.

### OUTSTANDING: new-box capacity NOT yet verified
R6 was accidentally run in the agent-ai shell (output = 13.49.49.246 + 13 /var/www dirs). The NEW box (13.48.137.19) must be re-checked in ITS OWN shell — Block R6b.

---

## ROUND 6 — NEW BOX (13.48.137.19) VERIFIED (finally on the correct host)
Confirmed `hostname=ip-172-31-8-10`, `checkip=13.48.137.19`.
- node/npm: **not installed**. mysql local: none. redis local: none. pm2: none. `/home/ubuntu`: empty (dotfiles only). No `.env`.
- Per launch banner (same host): Ubuntu 26.04, **2 vCPU, ~3.7 GB RAM, 18 GB disk (~15% used), 0 swap**.
- Verdict: **pristine clean slate** — nothing to back up/clobber on the new box.
- Access resolved: a working interactive shell exists on the new box (reached as `ubuntu@ip-172-31-8-10`). NOTE: agent-ai's key was NOT authorized (`Permission denied (publickey)` on the hop); the working session is via the Hub key/path the user used. Direct laptop SSH should be confirmed before cutover so the new box isn't access-dependent on agent-ai.

### Capacity note for runbook
3.7 GB RAM + 0 swap → add a 2 GB swapfile as step 1 to avoid OOM during `npm run build`. 2 vCPU + 18 GB disk adequate (MySQL→RDS, files→S3).

## INVESTIGATION COMPLETE — root cause fully evidenced; only execution decisions remain.

---

## NON-NEGOTIABLE CONSTRAINT (user, round 7): E-USAM must remain 100% untouched
**edu.usamif.com on agent-ai (13.49.49.246) stays exactly as-is.** No migration, redeploy, reconfigure, stop, delete, overwrite, or modification of E-USAM's frontend/backend/DB/nginx/SSL/PM2/Docker/files/auth/env/DNS. The `edu` A-record is NOT to be changed.

### How Option C already honors this (by design)
- 100% of Hub deployment happens on the NEW box 13.48.137.19. agent-ai gets ZERO install/build/config changes.
- The ONLY Hub action on agent-ai is a **read-only `pg_dump` of `hub_db`** (~25 Hub rows), approval-gated. No E-USAM DB/app/nginx touched.
- "Disable old hub vhost / stop :3010 fork" is DEFERRED and separately approval-gated; nothing on agent-ai is disabled during the Hub build/verify/cutover.

### SHARED-DEPENDENCY RISK to verify BEFORE any dump (stop-and-confirm)
agent-ai runs multiple Postgres instances/containers: host `postgresql` on :5432 (the Hub fork connects here, DB `hub_db`), plus Docker `eusam-db` (postgres:15) and `spicy-portal-db`/`clinic` (postgres:16). The served `/var/www/hub` is literally an E-USAM frontend build. Therefore, before ANY pg_dump/psql:
1. Confirm `hub_db` is a DISTINCT database from E-USAM's DB (list databases; confirm names differ; confirm E-USAM's backend uses a different DB/host — likely the `eusam-db` Docker container, not host :5432).
2. Scope every psql/pg_dump to `-d hub_db` ONLY; never touch `eusam*` DBs or the Docker DB containers.
3. Any Hub step that would read/modify a shared resource => STOP + explicit approval.

### E-USAM non-regression checklist (run BEFORE and AFTER Hub cutover)
Baseline now + re-check after each phase; all must be identical/healthy:
- `curl -sSI https://edu.usamif.com/` → 200 (record headers/title).
- `edu` DNS A-record unchanged (still 13.49.49.246).
- `edu.usamif.com` cert unchanged (serial/expiry identical).
- Docker `eusam-backend`/`eusam-db`/`eusam-redis` → Up (healthy) with SAME container IDs + uptime (not restarted).
- agent-ai nginx config for `edu` byte-identical (sha256 of its vhost before/after).
- No change to `/var/www/eusam`, `/var/www/e-usam`, or E-USAM Docker volumes.

### Isolation guarantees baked into the runbook
- No command on agent-ai except: read-only inspection + the scoped `hub_db` pg_dump (approval-gated). No restarts, no apt, no nginx reload, no Docker actions, no `/var/www` writes on agent-ai.
- New box is exclusively Hub. Its own RDS, Redis, S3 prefix, env, PM2, nginx, cert.
- Rollback = single `hub` DNS revert; `edu` + 11 other sites never in scope.

---

## PHASE A1 RESULTS (read-only baselines captured) — 2026-10-22

### hub_db isolation: PROVEN SAFE
Host Postgres `\l` shows TWO distinct DBs: `eusam_db` (owner eusam_user) and `hub_db` (owner hub_user). E-USAM backend runs in its OWN Docker container `eusam-db` (5d47ec649b85, healthy) via POSTGRES_* env — does NOT use host hub_db. => `pg_dump -d hub_db` cannot affect E-USAM (different DB, owner, and instance). Point-6 safeguard satisfied.

### E-USAM baseline (frozen for non-regression compare)
- edu.usamif.com: HTTP/2 200, last-modified 2026-10-18 (active).
- edu A -> 13.49.49.246. cert serial 053A3A5C...716F, notAfter Nov 26 2026.
- Containers: eusam-backend 00da22dd1c27 (Up 7wk, "unhealthy" — PRE-EXISTING stale healthcheck, edu serves 200, OUT OF SCOPE, will not touch), eusam-db 5d47ec649b85 (healthy), eusam-redis 0e7b457a69d4 (healthy).
- eusam nginx vhost sha256 = 954cf5ac56830b870fae3c276d83718f2549f86e2b5685aa01d19443876acfe7.
- hub (today): HTTP/2 200, last-modified 2026-08-01 (the E-USAM build in /var/www/hub); hub A -> 13.49.49.246.

### New box (13.48.137.19 / ip-172-31-8-10) confirmed specs
2 vCPU, 3.7 GB RAM, 0 swap, 19 GB disk (15% used), Ubuntu 26.04. node/nginx/mysql/redis/certbot absent (clean). github 200, rds.eu-north-1 DNS resolves. => swap 2 GB mandatory; PM2 instances=2; build in CI (not on box); RDS reachable via private SG once created.

### Release candidate pinned
`audit/baseline-verification` @ `0fde8ae47c7685f43944bbe7cfa2c52b279a4511` (31 commits ahead of origin/main; MySQL; 19 migrations; 264+18+17 tests). NOT pushed to GitHub yet — deploy-source delivery method still to be decided (push branch vs tarball).
