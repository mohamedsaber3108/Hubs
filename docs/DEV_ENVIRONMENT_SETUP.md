# Local Development Environment Setup

## Prerequisites

- Node.js ≥ 20 (confirmed installed: v26.7.0)
- Docker Desktop (or any Docker Engine) — for MySQL + Redis. If unavailable, see "No-Docker fallback" below.

## 1. Start MySQL + Redis (Docker Compose)

```powershell
cd backend/backend
docker compose -f docker-compose.dev.yml up -d
```

This starts:
- **MySQL 8.0.37** on `localhost:3306` with two schemas: `usam_hub_dev` (for `npm run dev`) and `usam_hub_test` (for `npm run test:integration`), both owned by user `usam_dev`/`devpass` (root password `devroot`). The `usam_hub_test` schema is created automatically on first boot via `docker/mysql-init/01-create-test-db.sql`.
- **Redis 7.4** on `localhost:6380` (not the default 6379 — this machine already had an unrelated project's Redis container bound to 6379; set `REDIS_PORT=6380` in `.env` to match), no password.

Check both are healthy:
```powershell
docker compose -f docker-compose.dev.yml ps
```
Wait for `healthy` status on both services (first MySQL boot takes ~20-30s).

Stop later with `docker compose -f docker-compose.dev.yml down` (keeps data) or add `-v` to wipe the volumes and start fresh.

## 2. Configure environment files

```powershell
# Backend
cd backend/backend
Copy-Item .env.example .env
```
Edit `.env` and set at minimum (everything else can stay as placeholder for local dev — OAuth/AWS/Anthropic features will simply no-op or be skipped if their vars are absent, per `config/passport.js`'s conditional strategy loading):
```
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=usam_hub_dev
DB_USER=usam_dev
DB_PASSWORD=devpass
DB_NAME_TEST=usam_hub_test
JWT_ACCESS_SECRET=<any random 64-char string for local dev>
JWT_REFRESH_SECRET=<any random 64-char string for local dev>
REDIS_HOST=127.0.0.1
REDIS_PORT=6380
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

`.env.test` already matches these dev container defaults for `DB_USER`/`DB_PASSWORD` — double check it still points at `127.0.0.1:3306`/`usam_hub_test` if you edit it.

```powershell
# Frontend
cd frontend
Copy-Item .env.example .env.local
```
Defaults (`VITE_API_URL=http://localhost:3000/api/v1`, etc.) work as-is against the backend dev server below.

## 3. Run migrations + seed data

```powershell
cd backend/backend
npm run migrate
npm run seed
```

## 4. Run the apps

```powershell
# Terminal 1 — backend
cd backend/backend
npm run dev          # http://localhost:3000, API docs at /api/docs

# Terminal 2 — frontend
cd frontend
npm run dev           # http://localhost:5173
```

## 5. Run tests

```powershell
cd backend/backend
npm run test:unit          # no DB/Redis needed at all (see jest.config.js projects split)
npm run test:integration   # needs the Docker Compose stack running (uses usam_hub_test schema)
npm run test                # both

cd frontend
npm run test                # vitest
```

## No-Docker fallback

If Docker Desktop cannot be started on this machine (observed in this environment: `Start-Service -Name "com.docker.service"` fails without elevated/interactive permissions), install MySQL 8 and Redis natively instead:

- **Windows native MySQL**: install MySQL Community Server 8.0 via the official MSI installer, create the `usam_hub_dev`/`usam_hub_test` databases and `usam_dev` user matching the credentials above (or just update `.env`/`.env.test` to match whatever root credentials the installer sets).
- **Windows native Redis**: Redis doesn't ship an official Windows build; use either WSL2 (`sudo apt install redis-server`) or the `redis-windows` community port (memurai is a Redis-API-compatible Windows-native alternative, free for dev use).
- Alternatively, use a cloud-hosted free-tier MySQL + Redis for local development only (e.g., a free Aiven/PlanetScale MySQL instance, a free Upstash Redis instance) — point `.env` at those instead of `127.0.0.1`. Never point `.env.test`/dev `.env` at any production resource.

This repository's `docker-compose.dev.yml` is the recommended path since it requires no native installs and is fully disposable.
