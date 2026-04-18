# USAM Hub — Phase 6 Summary
**Admin Frontend Dashboard — COMPLETE**

---

## Architecture

The admin panel is **fully isolated** from the user frontend:

| Concern | Detail |
|---------|--------|
| JWT token | Separate `admin_access_token` in localStorage |
| Axios instance | `adminApi.ts` — separate base URL, interceptors, 401 handler |
| Auth context | `AdminContext` — independent from user `AuthContext` |
| React Query | Separate `QueryClient` instance — no cache pollution |
| Login | Dedicated `AdminLogin` with TOTP 2FA support |
| Route | `/admin` — loads entire admin shell |

---

## File Structure (20 files)

```
src/admin/
├── adminApi.ts              Axios instance (admin JWT, 401→logout)
├── adminTypes.ts            TypeScript types for all admin responses
├── AdminContext.tsx         Auth state (session restore, login, logout)
│
├── services/ (8 files)
│   ├── adminAuth.service.ts      login, logout, me
│   ├── adminDashboard.service.ts stats, charts (30d), recent activity
│   ├── adminUsers.service.ts     list, get, updateStatus, updateRole, forceReset, delete
│   ├── adminContent.service.ts   posts, events, resources, challenges, communities
│   ├── adminSettings.service.ts  settings, feature flags, pricing plans
│   ├── adminSystem.service.ts    health, queues, cache, maintenance mode
│   ├── adminAnalytics.service.ts users, content, communities, engagement, revenue
│   └── adminLogs.service.ts      list, summary, CSV export
│
├── components/ (2 files)
│   ├── AdminLogin.tsx  Secure login form with TOTP 2FA flow
│   └── AdminLayout.tsx Collapsible sidebar + mobile overlay
│
└── pages/ (7 panels)
    ├── OverviewPanel.tsx   KPI cards + AreaChart + BarChart + recent activity feed
    ├── UsersPanel.tsx      Searchable table, status/role filter, ban/suspend/reset/delete
    ├── ContentPanel.tsx    Posts, Events, Challenges, Resources, Communities tabs
    ├── AnalyticsPanel.tsx  Period selector, 4 charts (user growth, content, community pie, revenue)
    ├── SettingsPanel.tsx   Feature flags toggle, settings key-value editor, pricing plans
    ├── SystemPanel.tsx     DB+Redis health, queue controls (pause/resume/clean), maintenance mode
    └── LogsPanel.tsx       Paginated log table, entity filter, CSV export
```

---

## Panel Details

### Overview Panel
- 4 KPI cards: Total Users (with growth %), New 7d, Total Posts, MRR
- 4 secondary stats: Active Today, Events, Challenges, Subscriptions
- 30-day user registrations AreaChart (Recharts)
- 30-day posts BarChart
- Recent admin activity feed (auto-refreshes every 30s)

### Users Panel
- Search by name/email/username
- Filter by status (active/suspended/banned) and role (user/mod/admin)
- Per-row actions menu: Suspend, Activate, Ban, Force Password Reset, Delete
- Pagination (20/page)

### Content Panel — 5 sub-tabs
- **Posts**: search, pin/unpin, delete
- **Events**: list with status badges
- **Challenges**: list with status/type
- **Resources**: list with rating and download count
- **Communities**: toggle active/inactive per community

### Analytics Panel
- Period selector: 7d / 30d / 90d
- Summary cards: New Users, Posts, Engagement (likes), Revenue
- User registrations AreaChart
- Content creation BarChart
- Community members PieChart
- Revenue LineChart

### Settings Panel — 3 sub-tabs
- **Feature Flags**: toggle switches for all flags, last-updated timestamp
- **Settings**: key-value editor with type-aware rendering (boolean=toggle, text=input)
- **Pricing Plans**: card display with feature list, subscriber count, featured badge

### System Panel
- Maintenance mode toggle with custom message input
- System info cards: Platform, Uptime, Memory, CPU
- Database + Redis status with response times
- Queue controls per queue: pause/resume/clean, waiting/active/failed counts
- Cache flush button

### Logs Panel
- Search across all log fields
- Entity type filter dropdown
- Action-color-coded badges (create=green, delete=red, update=blue, etc.)
- CSV export (downloads directly in browser)
- Pagination (25/page)

---

## Login Flow

```
GET /admin
→ AdminContext reads admin_access_token from localStorage
→ If token: POST /admin/auth/me to validate
→ If valid: show dashboard
→ If invalid/missing: show AdminLogin

POST /admin/auth/login { email, password, totp_code? }
→ On success: store admin_access_token in localStorage
→ On TOTP required: show 2FA input field (auto-detected from error message)
→ On 401 anywhere: dispatch admin:logout event → AdminContext clears state
```

---

## Notes for Deployment

- Default super admin: `superadmin@usam.hub` / `Admin@USAM2024!` — **CHANGE BEFORE DEPLOY**
- Admin routes are protected on the backend by `authenticateAdmin` middleware which verifies `type: 'admin'` in JWT payload
- TOTP 2FA setup: Admin must call `POST /admin/auth/totp/setup` then `POST /admin/auth/totp/enable` from backend tooling or Swagger UI first
