import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'adminpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display dashboard with stats cards', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    await expect(page.locator('text=Total Cases')).toBeVisible();
    await expect(page.locator('text=Active Investigations')).toBeVisible();
    await expect(page.locator('text=Total Evidence')).toBeVisible();
    await expect(page.locator('text=Total Entities')).toBeVisible();
  });

  test('should display alerts section', async ({ page }) => {
    await expect(page.locator('text=Alerts')).toBeVisible();
  });

  test('should navigate to cases tab', async ({ page }) => {
    await page.click('text=Cases');
    await expect(page.locator('text=Case Statistics')).toBeVisible();
  });

  test('should navigate to entities tab', async ({ page }) => {
    await page.click('text=Entities');
    await expect(page.locator('text=Entity Statistics')).toBeVisible();
  });

  test('should navigate to evidence tab', async ({ page }) => {
    await page.click('text=Evidence');
    await expect(page.locator('text=Evidence Statistics')).toBeVisible();
  });

  test('should navigate to transactions tab', async ({ page }) => {
    await page.click('text=Transactions');
    await expect(page.locator('text=Transaction Statistics')).toBeVisible();
  });

  test('should navigate to timeline tab', async ({ page }) => {
    await page.click('text=Timeline');
    await expect(page.locator('text=Timeline Statistics')).toBeVisible();
  });

  test('should navigate to risk tab', async ({ page }) => {
    await page.click('text=Risk');
    await expect(page.locator('text=Risk Statistics')).toBeVisible();
  });
});