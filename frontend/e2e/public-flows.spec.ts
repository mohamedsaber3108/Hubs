import { test, expect } from '@playwright/test';

// Public, unauthenticated flows — navigation reachability, the four
// differentiated communities, the offers catalog, and i18n / RTL. These run
// against a live frontend (backend reachable) with no data fixtures.

test.use({ viewport: { width: 1280, height: 800 } }); // desktop: nav + language toggle visible

test.describe('Navigation reachability', () => {
  // [path, expected body text]. Auth pages have multi-step headings, so they
  // are checked for reachability + a rendered heading only.
  const routes: Array<[string, RegExp | null]> = [
    ['/communities', /communities/i],
    ['/offers', /offers|perks/i],
    ['/organizations', /organizations/i],
    ['/events', /events/i],
    ['/opportunities', /opportunities/i],
    ['/auth/signin', /sign in/i],
    ['/auth/signup', null],
  ];

  for (const [path, re] of routes) {
    test(`loads ${path}`, async ({ page }) => {
      const resp = await page.goto(path);
      expect(resp?.status()).toBeLessThan(400);
      // Page rendered meaningful content (heading somewhere on the page).
      await expect(page.locator('h1, h2').first()).toBeVisible();
      if (re) await expect(page.locator('body')).toContainText(re);
    });
  }

  test('unknown route shows the NotFound page', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    await expect(page.locator('body')).toContainText(/404|not found/i);
  });
});

test.describe('Communities differentiation', () => {
  test('lists the four distinct communities', async ({ page }) => {
    await page.goto('/communities');
    for (const name of ['FreelanceSpace', 'StudentZone', 'HR Connect', 'LaunchPad']) {
      await expect(page.locator('body')).toContainText(name);
    }
  });

  test('all four community feeds are reachable', async ({ page }) => {
    // Reachability of each community's primary surface. (Differentiated content
    // + persona-aware dashboards are asserted in the communities list test and
    // the authenticated dashboard flow; the animated sub-nav internals are not
    // asserted here to avoid timing flakiness.)
    for (const slug of ['freelancespace', 'studentzone', 'hrconnect', 'launchpad']) {
      const resp = await page.goto(`/${slug}/feed`);
      expect(resp?.status(), `${slug}/feed should be reachable`).toBeLessThan(400);
      // The SPA mounted (the app root has content).
      await expect(page.locator('#root')).not.toBeEmpty();
    }
  });
});

test.describe('Offers catalog', () => {
  test('renders the perks catalog with category filters', async ({ page }) => {
    await page.goto('/offers');
    await expect(page.getByRole('heading', { name: /offers & perks/i })).toBeVisible();
    // Category filter chips present.
    await expect(page.getByRole('button', { name: /all perks/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /discounts/i })).toBeVisible();
  });
});

test.describe('Internationalization + RTL', () => {
  test('toggling to Arabic sets dir=rtl and lang=ar on <html>', async ({ page }) => {
    await page.goto('/');
    // Default is LTR English.
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');

    // The language toggle shows "عربي" when currently English.
    await page.getByRole('button', { name: /switch to arabic/i }).click();

    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  });
});

test.describe('Auth gating', () => {
  test('protected route redirects anonymous users to sign in', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth\/signin/);
  });
});
