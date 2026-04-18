# USAM Hub — Phase 7 Summary
**Full Test Suite + CI/CD + AWS Deploy Checklist — COMPLETE**

---

## Test Suite

### Unit Tests (6 files)
| File | Tests | Covers |
|------|-------|--------|
| `tests/unit/token.test.js` | 4 | generateAccessToken, generateRefreshToken, verifyToken |
| `tests/unit/apiError.test.js` | 7 | ApiError factory methods, status codes, serialisation |
| `tests/unit/apiResponse.test.js` | 4 | success flag logic, data defaults |
| `tests/unit/paginate.test.js` | 4 | page/limit/offset calculation |
| `tests/unit/validators.test.js` | 7 | Joi registration schema edge cases |
| `tests/unit/security.test.js` | 6 | bcrypt hashing, JWT sign/verify/tamper |

### Integration Tests (10 files, ~120 test cases)
| File | Key Scenarios |
|------|---------------|
| `auth.test.js` | Register, duplicate email, login, logout, refresh token |
| `posts.test.js` | CRUD, auth guard, like toggle, comments, pagination |
| `communities.test.js` | List, single by slug, join/leave, 404 |
| `events.test.js` | CRUD, RSVP valid/invalid, capacity, 404 |
| `challenges.test.js` | CRUD, status filter, validation, 404 |
| `opportunities.test.js` | CRUD, filters, save toggle, 404 |
| `resources.test.js` | CRUD, rating (0-5 validation), type filter |
| `groups.test.js` | CRUD, join, community filter |
| `users.test.js` | Me, update, public profile, follow, no-self-follow |
| `leaderboard.test.js` | period filters, community filter, my rank |
| `search.test.js` | auth guard, missing q param, type filter |
| `mentors.test.js` | List, expertise filter, apply |
| `messages.test.js` | Conversations, send message, empty-message guard, no-self-DM |
| `admin.test.js` (existing) | Admin login, user management |
| `admin.extended.test.js` | Dashboard KPIs, users, content, settings, flags, system health, logs, analytics — 28 cases |

### Test Helpers (`tests/helpers.js`)
- `createVerifiedUser(overrides?)` — creates user with email_verified + active status
- `loginUser(email, password?)` — returns JWT access token
- `createUserAndLogin(overrides?)` — combined helper
- `getSeedCommunity()` — returns seeded FreelanceSpace community
- `createAdmin(overrides?)` — creates admin with bcrypt password
- `loginAdmin(email, password?)` — returns admin JWT

---

## CI/CD Pipelines

### `ci.yml` — runs on every push + PR
```
lint → unit-tests (parallel) → integration-tests (MySQL 8 + Redis services)
                                        ↓ (on main only)
                              coverage report → Codecov upload
frontend-build (parallel) → tsc + vite build + artifact upload
security-scan → npm audit (both packages)
```

### `deploy.yml` — runs on push to main + manual dispatch
```
1. npm ci --omit=dev (backend)
2. npm run build (frontend) with production VITE_* env vars
3. SSH to EC2 → git pull → npm ci → db:migrate → pm2 reload
4. rsync dist/ to nginx public folder
5. Health check (curl /api/v1/health) — fails deploy if not 200
6. GitHub commit status update on failure
```

### Required GitHub Secrets
| Secret | Value |
|--------|-------|
| `EC2_HOST` | EC2 Elastic IP |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | .pem private key content |
| `VITE_API_URL` | `https://yourdomain.com/api/v1` |
| `VITE_APP_URL` | `https://yourdomain.com` |
| `VITE_WS_URL` | `wss://yourdomain.com` |

---

## Deploy Checklist (DEPLOY_CHECKLIST.md)

514-line checklist covering 13 sections:

| Section | Coverage |
|---------|----------|
| §1 RDS | Create instance, SG, run migrations, change default password |
| §2 EC2 | Launch, SG rules, setup script, PM2, .env |
| §3 S3 | Buckets, CORS, bucket policy, IAM user + minimum policy |
| §4 SES | Domain verification, sandbox exit, SNS bounce handling |
| §5 Nginx + SSL | Config deploy, certbot, auto-renew |
| §6 DNS | A/CNAME/TXT/MX records for Hostinger, Elastic IP |
| §7 .env Reference | Every variable with description and generation command |
| §8 GitHub Secrets | All 6 required secrets |
| §9 Security Hardening | SSH, Redis password, UFW, Fail2Ban, unattended-upgrades |
| §10 Monitoring | CloudWatch CPU + RDS alarms, PM2 logrotate |
| §11 Post-Deploy Verification | 8 curl/browser smoke tests |
| §12 Rollback | PM2 reload, git checkout, db:migrate:undo |
| §13 Launch Blockers | 15-item checklist — every item must be ✅ before go-live |

---

## Running Tests Locally

```bash
cd backend

# All tests
npm test

# Unit tests only (fast, no DB)
npm run test:unit

# Integration tests (requires MySQL + Redis running)
npm run test:integration

# With coverage report
npm run test:coverage
# → opens coverage/index.html
```

---

## Project Complete — All 7 Phases

| Phase | Deliverable | Status |
|-------|-------------|--------|
| 1 | Database models (33), migrations (16), seeders, AWS configs | ✅ |
| 2 | Express app, middleware, auth controllers, email/S3/Redis services | ✅ |
| 3 | Admin backend (10 controllers, 60+ endpoints) | ✅ |
| 4 | All feature controllers (12), Swagger docs, NomadAI | ✅ |
| 5 | Frontend API integration (15 services, 12 hook modules, 13 pages) | ✅ |
| 6 | Admin frontend dashboard (7 panels, isolated auth, real API) | ✅ |
| 7 | Full test suite (38+ files), GitHub Actions CI/CD, AWS checklist | ✅ |
