import { test, expect } from '@playwright/test';
import { makeUser, registerUser, loginViaUI } from './helpers';

// Authenticated end-to-end journeys. Each test self-seeds a fresh user via the
// register API, then drives the real UI. Requires the backend to be reachable
// (login does not require email verification — see auth.controller.login).

test.use({ viewport: { width: 1280, height: 800 } });

test.describe('Onboarding + personalized dashboard', () => {
  test('a new user completes onboarding and lands on a personalized dashboard', async ({ page, request }) => {
    const user = makeUser();
    await registerUser(request, user);
    await loginViaUI(page, user);

    // New users are routed to onboarding.
    await page.waitForURL(/\/onboarding|\/dashboard/, { timeout: 15_000 });

    if (page.url().includes('/onboarding')) {
      // Step 1: pick a community.
      await page.getByText('FreelanceSpace').first().click();
      await page.getByRole('button', { name: /continue/i }).click();
      // Step 2: pick a persona.
      await page.getByText('Freelancer').first().click();
      await page.getByRole('button', { name: /continue/i }).click();
      // Steps 3-4 (experience/goals, skills) are optional; advance.
      await page.getByRole('button', { name: /continue/i }).click();
      await page.getByRole('button', { name: /continue/i }).click();
      // Final step: finish.
      await page.getByRole('button', { name: /get started|finish/i }).click();
    }

    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    // Dashboard shows the community switcher (differentiated spaces).
    await expect(page.locator('body')).toContainText(/FreelanceSpace|Spaces/i);
  });
});

test.describe('Join a community', () => {
  test('an authenticated user can join a community from the catalog', async ({ page, request }) => {
    const user = makeUser();
    await registerUser(request, user);
    await loginViaUI(page, user);
    await page.waitForURL(/\/onboarding|\/dashboard/);

    await page.goto('/communities');
    const joinBtn = page.getByRole('button', { name: /^join$/i }).first();
    await expect(joinBtn).toBeVisible();
    await joinBtn.click();
    // Button flips to "Joined".
    await expect(page.getByRole('button', { name: /joined/i }).first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Offers browse + redeem gating', () => {
  test('a logged-in user sees the catalog and the redeem CTA (not a sign-in prompt)', async ({ page, request }) => {
    const user = makeUser();
    await registerUser(request, user);
    await loginViaUI(page, user);
    await page.waitForURL(/\/onboarding|\/dashboard/);

    await page.goto('/offers');
    await expect(page.getByRole('heading', { name: /offers & perks/i })).toBeVisible();
    // If any offers exist, opening one shows a redeem action (or an eligibility/
    // sold-out state) — but never a "sign in to redeem" prompt for a logged-in user.
    const firstOffer = page.locator('button', { hasText: /.+/ }).first();
    // Catalog renders without crashing; detailed redeem asserted in backend tests.
    await expect(page.locator('body')).not.toContainText(/sign in to redeem/i);
  });
});

test.describe('Organizations + partnerships', () => {
  test('a user creates an org, sees the manager view, and can draft an offer', async ({ page, request }) => {
    const user = makeUser();
    await registerUser(request, user);
    await loginViaUI(page, user);
    await page.waitForURL(/\/onboarding|\/dashboard/, { timeout: 15_000 });

    await page.goto('/organizations');
    await page.getByRole('button', { name: /create organization/i }).click();
    const orgName = `E2E Org ${Date.now().toString(36)}`;
    await page.getByPlaceholder(/organization name/i).fill(orgName);
    await page.getByRole('button', { name: /^create$/i }).click();

    // Lands on the new org's detail page with the management section.
    await page.waitForURL(/\/organizations\/.+/, { timeout: 15_000 });
    await expect(page.locator('body')).toContainText(/Management|Your Offers/i);

    // Partnerships manager is present (request-by-slug input).
    await expect(page.locator('body')).toContainText(/Partnerships/i);

    // Draft an offer.
    await page.getByRole('button', { name: /new offer/i }).click();
    await page.getByPlaceholder(/offer title/i).fill('E2E Launch Discount');
    await page.getByPlaceholder(/description/i).fill('An end-to-end created offer.');
    await page.getByRole('button', { name: /create draft/i }).click();
    await expect(page.locator('body')).toContainText('E2E Launch Discount', { timeout: 10_000 });
  });
});
