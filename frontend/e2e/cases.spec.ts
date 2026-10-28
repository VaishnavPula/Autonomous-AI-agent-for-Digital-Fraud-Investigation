import { test, expect } from '@playwright/test';

test.describe('Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'adminpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await page.goto('/cases');
  });

  test('should display cases list', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Cases');
    await expect(page.locator('text=Create Case')).toBeVisible();
  });

  test('should open create case modal', async ({ page }) => {
    await page.click('text=Create Case');
    await expect(page.locator('text=Create New Case')).toBeVisible();
    await expect(page.locator('input[name="title"]')).toBeVisible();
    await expect(page.locator('select[name="case_type"]')).toBeVisible();
    await expect(page.locator('select[name="priority"]')).toBeVisible();
  });

  test('should create a new case', async ({ page }) => {
    await page.click('text=Create Case');
    await page.fill('input[name="title"]', 'E2E Test Case');
    await page.fill('textarea[name="description"]', 'Created via E2E test');
    await page.selectOption('select[name="case_type"]', 'fraud');
    await page.selectOption('select[name="priority"]', 'high');
    await page.click('button:has-text("Create Case")');
    
    await expect(page.locator('text=E2E Test Case')).toBeVisible();
  });

  test('should filter cases by status', async ({ page }) => {
    await page.selectOption('select[name="status"]', 'open');
    await expect(page.locator('text=open')).toBeVisible();
  });

  test('should search cases', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Test');
    await expect(page.locator('text=Test')).toBeVisible();
  });

  test('should navigate to case detail', async ({ page }) => {
    await page.click('text=E2E Test Case');
    await expect(page).toHaveURL(/\/cases\/.*/);
    await expect(page.locator('h1')).toContainText('E2E Test Case');
  });
});

test.describe('Case Detail', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'adminpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display case details', async ({ page }) => {
    await page.goto('/cases');
    await page.click('text=E2E Test Case');
    
    await expect(page.locator('text=Case Details')).toBeVisible();
    await expect(page.locator('text=Evidence')).toBeVisible();
    await expect(page.locator('text=Entities')).toBeVisible();
    await expect(page.locator('text=Timeline')).toBeVisible();
  });

  test('should navigate to trace board', async ({ page }) => {
    await page.goto('/cases');
    await page.click('text=E2E Test Case');
    await page.click('text=Trace Board');
    await expect(page).toHaveURL(/\/board/);
    await expect(page.locator('h1')).toContainText('Trace Board');
  });
});