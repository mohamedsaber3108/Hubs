# USAM Hub — Phase 2 Summary
**Backend Core — COMPLETE**

---

## ✅ What Was Completed

### Express App (`src/app.js`)
- helmet.js — all security headers
- CORS — ENV-driven whitelist with credentials support
- express.json + urlencoded (10MB limit)
- cookie-parser
- express-mongo-sanitize — NoSQL injection protection
- compression (gzip)
- response-time middleware (returns `X-Response-Time` header)
- Morgan HTTP logging → Winston
- Global rate limiter
- Passport.js initialization
- Swagger UI at `/api/docs`
- Global 404 + error handler

### Entry Point (`src/server.js`)
- HTTP server creation
- Socket.io with 2 namespaces: `/chat` + `/notifications`
- DB + Redis connection with retry logic (5 attempts, exponential backoff)
- PM2 cluster-compatible
- Graceful shutdown (SIGTERM/SIGINT) — closes DB + Redis cleanly
- Uncaught exception + unhandled rejection handlers

### Passport OAuth (`src/config/passport.js`)
- JWT strategy — validates access token, loads user
- Google OAuth 2.0
- GitHub OAuth
- Facebook OAuth
- LinkedIn OAuth
- `findOrCreateOAuthUser` helper — handles new + returning users
- All OAuth strategies are conditionally loaded (only if ENV vars set)

### Middleware Stack
| File | Purpose |
|------|---------|
| `errorHandler.js` | Global error handler — normalizes Sequelize, JWT, Multer errors → clean JSON |
| `auth.js` | `authenticate` + `optionalAuth` guards |
| `role.js` | `requireRole()` + `requireAdminRole()` |
| `validate.js` | Joi schema validation wrapper |
| `rateLimiter.js` | `globalLimiter`, `authLimiter` (10/15min), `uploadLimiter`, `apiLimiter` |
| `cache.js` | Redis GET/SET cache middleware + `invalidateCache()` |
| `upload.js` | Multer memory storage — image/document/all type filters |
| `adminAuth.js` | Separate JWT validation for admin routes |

### Services
| File | Purpose |
|------|---------|
| `email.service.js` | AWS SES + Nodemailer SMTP fallback, template rendering, 4 email types |
| `s3.service.js` | Upload, delete, presigned URLs, avatar upload with Sharp resize |
| `redis.service.js` | get/set/del/exists/incr + refresh token management + token blacklist |
| `notification.service.js` | In-app notifications — follow, like, comment, message |

### Job Queues (`src/jobs/`)
| File | Purpose |
|------|---------|
| `queue.js` | Bull queues: `email`, `notification`, `cleanup` with Redis config |
| `email.job.js` | Processors: welcome, verify-email, reset-password, notification |
| `cleanup.job.js` | node-cron: expired sessions (2am), expired tokens (3am), old logs (Sunday 4am) |

### Utilities
| File | Purpose |
|------|---------|
| `logger.js` | Winston — console + file (error.log + combined.log) |
| `ApiError.js` | Custom error class — badRequest/unauthorized/forbidden/notFound/conflict/internal |
| `ApiResponse.js` | `success()`, `created()`, `paginated()` helpers |
| `paginate.js` | `paginate(query)` + `paginationMeta()` |
| `token.js` | `generateAccessToken/RefreshToken`, `verifyAccessToken/RefreshToken`, `hashToken`, `generateRandomToken` |

### Validations (Joi)
- `auth.validation.js` — register, login, forgotPassword, resetPassword, refreshToken
- `user.validation.js` — updateProfile, changePassword, addSkill, addExperience, addEducation

### Controllers
| File | Key Endpoints |
|------|--------------|
| `auth.controller.js` | register, login, logout, refreshToken, verifyEmail, resendVerification, forgotPassword, resetPassword, oauthCallback |
| `user.controller.js` | getMe, updateMe, deleteMe, uploadAvatar, changePassword, sessions, notifications, profile, follow/unfollow, skills, experience, education |
| `community.controller.js` | getAll, getOne, join, leave, getMembers |
| `post.controller.js` | getFeed, createPost, getPost, updatePost, deletePost, likePost, addComment, deleteComment |

### Routes
| Prefix | File | Status |
|--------|------|--------|
| `/api/v1/auth` | `auth.routes.js` | ✅ Complete |
| `/api/v1/users` | `user.routes.js` | ✅ Complete |
| `/api/v1/profile` | `profile.routes.js` | ✅ Complete |
| `/api/v1/communities` | `community.routes.js` | ✅ Complete |
| `/api/v1/posts` | `post.routes.js` | ✅ Complete |
| `/api/v1/health` | `health.routes.js` | ✅ Complete |
| All others | `*.routes.js` | Stub (→ Phase 4) |
| `/api/v1/admin` | `admin.routes.js` | Stub (→ Phase 3) |
| `/api/docs` | Swagger UI | ✅ Active |

### Tests
- `tests/setup.js` — test DB sync
- `tests/unit/token.test.js` — 4 unit tests
- `tests/unit/apiError.test.js` — 7 unit tests
- `tests/unit/paginate.test.js` — 4 unit tests
- `tests/integration/auth.test.js` — 12 integration tests (register, login, JWT guards, health)

---

## Auth Flow (Complete)

```
Register → Email queued → Verify link → email_verified=true
Login    → access (15m) + refresh (7d httpOnly cookie) + session row
Refresh  → Token rotation (old refresh revoked, new issued)
Logout   → Session revoked + Redis cleared + cookie cleared
OAuth    → findOrCreate user → same token flow
```

**Security implemented:**
- bcrypt 12 rounds
- JWT httpOnly cookie for refresh token
- Token hash stored in DB (never raw token)
- Session tracking with IP + User Agent
- Anti-enumeration on forgot-password
- Soft-delete users (never hard-delete)
- Rate limiting on all auth endpoints

---

## What Remains

| Phase | Status |
|-------|--------|
| Phase 3 — Admin Backend | Next |
| Phase 4 — Feature APIs (posts/groups/events/challenges/opportunities/resources/leaderboard/mentors/messages) | After Phase 3 |
| Phase 5 — User Frontend integration | After Phase 4 |
| Phase 6 — Admin Frontend | After Phase 5 |
| Phase 7 — Full tests + AWS deploy checklist | Final |

---

## No Blockers

All Phase 2 code is complete. Ready for Phase 3 — Admin Backend.

To run locally after filling `.env`:
```bash
npm run migrate && npm run seed && npm run dev
```

Visit: http://localhost:3000/api/docs
