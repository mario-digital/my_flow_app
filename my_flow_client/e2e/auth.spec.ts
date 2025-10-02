import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display home page without authentication', async ({ page }) => {
    await page.goto('/');

    // Check that home page loads
    await expect(page).toHaveTitle(/Next.js/i);

    // Verify Next.js logo is visible
    const logo = page.getByRole('img', { name: /next\.js logo/i });
    await expect(logo).toBeVisible();
  });

  test('should redirect to login when accessing protected dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to login page
    await page.waitForURL(/\/login/);

    // Verify we're on the login page
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });

  test('should have login link in navigation', async ({ page }) => {
    await page.goto('/');

    // Wait for navigation to load
    await page.waitForSelector('nav');

    // Check for login link
    const loginLink = page.getByRole('link', { name: /sign in/i });
    await expect(loginLink).toBeVisible();
  });

  test('should navigate to login page when clicking login link', async ({ page }) => {
    await page.goto('/');

    // Click login link
    const loginLink = page.getByRole('link', { name: /sign in/i });
    await loginLink.click();

    // Should be on login page
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });
});