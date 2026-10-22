import { Page, APIRequestContext, expect } from '@playwright/test';

// Base API URL the frontend talks to. In dev the Vite server proxies /api/v1,
// but for direct API seeding we hit the backend origin.
export const API = process.env.E2E_API_URL || 'http://localhost:3000/api/v1';

export interface TestUser {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
}

export function makeUser(): TestUser {
  // username must be alphanumeric (backend Joi .alphanum()) — no underscores.
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return {
    first_name: 'E2E',
    last_name: 'User',
    username: `e2e${id}`,
    email: `e2e_${id}@example.com`,
    password: 'E2ePass123!',
  };
}

// Register a user directly via the API (self-seeding, no DB fixtures needed).
// Returns the user; registration auto-verifies in test-friendly setups, but if
// email verification blocks login the caller should handle it.
export async function registerUser(request: APIRequestContext, user: TestUser) {
  const res = await request.post(`${API}/auth/register`, {
    data: {
      first_name: user.first_name, last_name: user.last_name,
      username: user.username, email: user.email, password: user.password,
    },
  });
  // Surface a bad fixture early rather than failing later at login.
  expect(res.status(), `register failed: ${await res.text()}`).toBeLessThan(400);
  return res;
}

// Log in through the UI so the browser holds the real session/token.
export async function loginViaUI(page: Page, user: TestUser) {
  await page.goto('/auth/signin');
  await page.getByPlaceholder(/email/i).fill(user.email);
  await page.getByPlaceholder(/password/i).first().fill(user.password);
  await page.getByRole('button', { name: /sign in/i }).click();
}

// Inject an access token into localStorage to simulate a logged-in session
// without going through the full login UI (used when registration path needs
// email verification). Token must be obtained from the API by the caller.
export async function setToken(page: Page, token: string) {
  await page.addInitScript((t) => {
    window.localStorage.setItem('access_token', t);
  }, token);
}
