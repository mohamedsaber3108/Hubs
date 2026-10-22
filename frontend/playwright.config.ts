import { defineConfig, devices } from '@playwright/test';

// E2E config for USAM Hub frontend.
//
// Requires the BACKEND API to be running and reachable (the Vite dev server
// proxies /api to it, or VITE_API_URL points at it). Locally, bring up the
// Docker dev stack + `npm run dev` in backend/backend, then run these tests.
// Playwright starts the frontend dev server itself (reused if already running).
//
// E2E is opt-in (not part of `npm run test`, which is vitest unit) so CI and
// local unit runs stay fast and DB-free. Run with: npm run test:e2e
// Vite dev server runs on 8080 (see vite.config server.port), not the Vite
// default 5173. Override via E2E_PORT if your setup differs.
const PORT = Number(process.env.E2E_PORT || 8080);
const BASE_URL = process.env.E2E_BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // Start the frontend dev server for the tests (reuse an already-running one
  // in local dev). The backend is assumed to be up separately.
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
