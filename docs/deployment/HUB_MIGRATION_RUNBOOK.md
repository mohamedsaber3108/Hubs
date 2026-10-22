# USAM Hub — Option C Migration Runbook (dedicated EC2 `13.48.137.19`)

> **Scope:** deploy USAM Hub/Communities independently on the dedicated box and cut `hub.usamif.com` over to it.
> **Hard boundary:** E-USAM (`edu.usamif.com`) and every other agent-ai service remain 100% untouched.
> **Status:** PLAN ONLY. Nothing here has been executed. Every step marked **[APPROVAL]** requires explicit go-ahead.
> **Verified source of truth for root cause:** `HUBS_REDIRECT_INVESTIGATION.md` (same folder).

---

## 0. Guardrails (apply to every step)
- **Only two hosts are written to:** the NEW box `13.48.137.19` (freely), and agent-ai `13.49.49.246` **only** for a single read-only `hub_db` `pg_dump` (step 3, [APPROVAL]).
- On agent-ai: **no** apt, **no** nginx reload/restart, **no** Docker action, **no** `/var/www` write, **no** service stop, **no** DNS change. Nothing E-USAM.
- Secrets are referenced by NAME only; never printed or committed.
- Each phase ends with a verification gate; do not proceed past a failed gate.

---

## PHASE A — Baselines & backups (no production change)

### A1. E-USAM baseline (capture NOW, re-verify after every later phase)
From laptop:
```bash
curl -sSI https://edu.usamif.com/ | tee /tmp/edu_before.txt     # expect 200
dig +short edu.usamif.com A                                      # expect 13.49.49.246
echo | openssl s_client -connect edu.usamif.com:443 -servername edu.usamif.com 2>/dev/null | openssl x509 -noout -serial -enddate | tee /tmp/edu_cert_before.txt
```
On agent-ai (read-only):
```bash
docker ps --format '{{.Names}}\t{{.Status}}' | grep -i eusam | tee /tmp/eusam_docker_before.txt
sudo sha256sum /etc/nginx/sites-available/eusam | tee /tmp/eusam_nginx_before.txt
```
**Gate:** record all outputs. These are the "before" side of the non-regression checklist.

### A2. Hub backups (preserve the real data) **[APPROVAL]**
**Pre-check (MANDATORY before any dump) — prove hub_db ≠ E-USAM DB:**
```bash
sudo -u postgres psql -c "\l" | grep -iE 'hub_db|eusam|usam'   # list DBs; confirm hub_db is its own DB
# confirm E-USAM backend does NOT use host hub_db (it uses the eusam-db docker container):
docker inspect eusam-backend --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null | grep -iE 'DB_|DATABASE' | sed -E 's/=.*/=<redacted>/'
```
Only if hub_db is confirmed distinct, dump **hub_db only**:
```bash
pg_dump -U hub_user -h 127.0.0.1 -d hub_db --no-owner --no-privileges -Fc -f ~/hub_db_$(date +%F).dump   # prompts for pw
pg_dump -U hub_user -h 127.0.0.1 -d hub_db --no-owner --no-privileges --data-only --inserts -f ~/hub_db_data_$(date +%F).sql
sha256sum ~/hub_db_*.dump ~/hub_db_data_*.sql
```
Copy both dump files OFF agent-ai (to laptop / S3 backup prefix). **Do not delete anything on agent-ai.**
Also (optional safety): EBS snapshot of agent-ai via AWS console (read-only, no downtime).

---

## PHASE B — Provision the NEW box `13.48.137.19` (isolated; agent-ai untouched)
All commands on the NEW box (prompt `ip-172-31-8-10`).

### B1. Swap + base packages
```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
sudo apt-get update
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx redis-server mysql-client certbot python3-certbot-nginx git build-essential ufw
sudo npm install -g pm2
```

### B2. Redis (local, password-protected) + firewall
```bash
sudo sed -i 's/^# *requirepass .*/requirepass <REDIS_PASSWORD>/' /etc/redis/redis.conf   # set a real value
sudo systemctl enable --now redis-server
sudo ufw allow 22,80,443/tcp && sudo ufw --force enable
```
**Gate:** `redis-cli -a <REDIS_PASSWORD> ping` → PONG; `node -v` → v20.x.

---

## PHASE C — RDS MySQL (managed) **[APPROVAL to create]**
Create (AWS console or CLI), `eu-north-1`, same VPC as the new EC2:
- Engine MySQL 8.0; class `db.t4g.micro` (burstable, sufficient for this load); 20 GB gp3; **Public access: NO**.
- New SG `hub-rds-sg`: inbound 3306 **only** from the NEW EC2's security group (not 0.0.0.0/0, not agent-ai).
- Automated backups ON, 7-day retention; deletion protection ON.
- DB name `usam_hub`; master user + password (store as secret).
**Gate:** from the NEW box `mysql -h <rds-endpoint> -u <user> -p -e 'SELECT VERSION();'` succeeds. (agent-ai has no route to this RDS — intentional isolation.)

---

## PHASE D — App deploy on the NEW box
Source = **[APPROVAL: which branch]** (recommended: `main` after merging `audit/baseline-verification`; see decisions).

### D1. Clone + env
```bash
sudo mkdir -p /var/www/usam-hub && sudo chown -R ubuntu:ubuntu /var/www/usam-hub
git clone https://github.com/Mahmoud-Elwazeer/hub.git /var/www/usam-hub
cd /var/www/usam-hub && git checkout <chosen-ref>
# backend is nested: /var/www/usam-hub/backend/backend  (deploy-kit path bug noted)
cd /var/www/usam-hub/backend/backend && npm ci --omit=dev
```
Create `/var/www/usam-hub/backend/backend/.env` with REAL values (never printed):
`NODE_ENV=production PORT=3000 APP_URL/FRONTEND_URL=https://hub.usamif.com`, `DB_*`→RDS, `DB_PORT=3306`, `DIALECT mysql` (repo default), `REDIS_*`→local, distinct `JWT_ACCESS_SECRET`+`ADMIN_JWT_SECRET`, `CORS_ALLOWED_ORIGINS=https://hub.usamif.com`, OAuth callbacks → `https://hub.usamif.com/...`, `ANTHROPIC_API_KEY`, SES/S3 (prefer IAM instance role over static keys), `SOCKET_CLUSTER_MODE=true`.

### D2. Schema + data load (data tested in an ISOLATED scratch DB FIRST)
```bash
# 2a. Build correct MySQL schema on RDS from THIS repo's migrations:
NODE_ENV=production npx sequelize-cli db:migrate
# 2b. In a SEPARATE scratch MySQL (NOT RDS), transform+load the ~25 PG rows, validate, THEN apply to RDS.
#     Transform rules: bcrypt hashes verbatim; booleans t/f->1/0; drop PG sequences; DO NOT import fork SequelizeMeta.
# 2c. Structural seed (prod-safe: admin/demo seeders self-skip under NODE_ENV=production):
NODE_ENV=production npx sequelize-cli db:seed:all
# 2d. Provision the super-admin explicitly:
INITIAL_ADMIN_EMAIL=<you> INITIAL_ADMIN_PASSWORD='<strong>' NODE_ENV=production npm run provision:admin
```
**Gate:** RDS row counts match the migrated set (users=5, admins=3, communities=4, memberships=6, + config); a migrated user authenticates against the new API locally.

### D3. Frontend build + PM2
```bash
cd /var/www/usam-hub/frontend && npm ci && VITE_API_URL=/api/v1 npm run build
sudo mkdir -p /var/www/html/usam-hub && sudo cp -r dist/* /var/www/html/usam-hub/
cd /var/www/usam-hub/backend/backend && pm2 start /var/www/usam-hub/deploy/pm2.config.js   # fix cwd to .../backend/backend first
pm2 save && pm2 startup systemd -u ubuntu --hp /home/ubuntu
```
**Gate:** `curl -s localhost:3000/health` → `{"status":"ok","database":"ok","redis":"ok"}`.

### D4. Nginx vhost for hub.usamif.com (on the NEW box only)
Use the repo `deploy/nginx.conf` with `server_name hub.usamif.com;`, root `/var/www/html/usam-hub`, proxy `/api` + `/socket.io` → `127.0.0.1:3000`.
```bash
sudo cp /var/www/usam-hub/backend/deploy/nginx.conf /etc/nginx/sites-available/hub.usamif.com
# edit server_name -> hub.usamif.com; TLS paths -> /etc/letsencrypt/live/hub.usamif.com/
sudo ln -sf /etc/nginx/sites-available/hub.usamif.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### D5. TLS cert for hub.usamif.com (NEW box) — HTTP-01, pre-DNS-safe method
Because `hub` DNS still points at agent-ai, use `--webroot` **after** cutover, OR issue now via a temporary DNS-01/`--preferred-challenges`? → Simplest safe order: **issue the cert AFTER DNS cutover** (step E) so HTTP-01 validates against the new box. Until then, serve a self-signed/placeholder so nginx starts.

---

## PHASE E — Verify BEFORE DNS, then cut over

### E1. Verify the new box over its IP (DNS still on agent-ai — zero user impact)
From laptop:
```bash
curl -sS -D - -o /dev/null --resolve hub.usamif.com:443:13.48.137.19 https://hub.usamif.com/   # may warn on cert pre-issue; check app via IP/host header
curl -sS --resolve hub.usamif.com:443:13.48.137.19 https://hub.usamif.com/api/v1/health --insecure
```
Full checklist: SPA loads (Communities, NOT E-USAM title), `/api/health` ok, login as a migrated user, sockets connect, NomadAI replies.
**Re-run A1 E-USAM baseline — must be unchanged.**

### E2. DNS cutover **[APPROVAL]**
Change `hub` A-record `13.49.49.246 → 13.48.137.19` (TTL 300). **Do NOT touch `edu` or any other record.**

### E3. Issue TLS on the new box (now HTTP-01 validates there)
```bash
sudo certbot --nginx -d hub.usamif.com --non-interactive --agree-tos -m <email> --redirect
```

### E4. Post-cutover verification (public domain)
```bash
dig +short hub.usamif.com A                  # 13.48.137.19
curl -sSI https://hub.usamif.com/            # 200, Communities
curl -sS https://hub.usamif.com/api/v1/health
```
Full user-flow checklist again. **Re-run A1 E-USAM checklist — must be identical.**

---

## PHASE F — Persistence & monitoring (NEW box)
- `pm2 save` + verify `pm2 resurrect` after a reboot (`sudo reboot`, then re-check).
- certbot auto-renew timer active; CloudWatch agent or basic disk/mem alarms.
- Confirm Socket.IO Redis adapter active (cluster mode) in logs.

## PHASE G — Decommission-safe (DEFERRED) **[APPROVAL, separate sign-off]**
ONLY after you confirm Hub is healthy for N days AND no other app uses agent-ai's `hub` vhost/`:3010`:
- Disable (rename, not delete) agent-ai `hub.usamif.com` vhost symlink; `pm2 stop hub-backend` (the fork). Keep `/var/www/hub`, `/home/ubuntu/hub`, `hub_db` intact as rollback.
- **E-USAM, `edu` DNS, eusam Docker, and all other sites: NOT in scope, NOT touched.**

---

## Rollback (any failure)
- Pre-cutover: nothing to roll back (DNS still on agent-ai; old Hub keeps serving as today).
- Post-cutover: revert `hub` A-record → `13.49.49.246` (TTL 300, ~5 min). agent-ai still serves the old build; no data lost (RDS and PG both intact). `edu` untouched throughout.

## E-USAM non-regression checklist (BEFORE and AFTER cutover)
1. `https://edu.usamif.com/` → 200, same title. 2. `edu` A → 13.49.49.246 (unchanged). 3. `edu` cert serial/expiry unchanged. 4. `eusam-backend/db/redis` containers Up, SAME IDs/uptime. 5. `sha256sum` of `eusam` nginx vhost unchanged. 6. No writes to `/var/www/eusam`, `/var/www/e-usam`, eusam volumes. 7. No agent-ai nginx reload performed at all.

## Open decisions (block runbook execution)
1. Deployment source: merge `audit/baseline-verification`→`main` then deploy `main` (recommended) vs deploy `origin/main` as-is.
2. RDS: approve creation params above.
3. Secrets/IAM: confirm you set real secrets on the box; use IAM instance role for S3/SES (recommended).

---

## EXECUTION LOG — Phase B COMPLETE (new box 13.48.137.19, 2026-10-22)
Verified gate:
- node v20.20.2, npm 10.8.2, pm2 7.1.0
- nginx 1.28.3 — active
- redis-server 8.0.5 — active, AOF on, requirepass set (PONG with auth)
- mysql client 8.4.11 (Ubuntu 26.04 pkg `mysql-client-core`; wire-compatible with RDS MySQL 8.0)
- certbot 5.8.0 (snap)
- swap 2G active; UFW active (22/80/443 only)
Env note: box is **Ubuntu 26.04** ("resolute") — pkg name was `mysql-client-core` (NOT `mysql-client-core-8.0`). Kernel upgrade pending → planned reboot test before app deploy.
Boundary: all on new box; agent-ai + E-USAM untouched. REDIS_PASSWORD held by user (never printed); goes into app .env as REDIS_PASSWORD.

### NEXT (all gated on user approval)
1. Planned reboot test of the new box (kernel pending) → confirm swap+nginx+redis come back.
2. Code delivery for `0fde8ae` (push branch vs tarball) — REQUIRED before Phase D.
3. RDS MySQL create (Phase C) — paid, [APPROVAL].
4. IAM instance role (S3/SES least-priv) — [APPROVAL].
5. pg_dump hub_db (proven isolated) — [APPROVAL].
