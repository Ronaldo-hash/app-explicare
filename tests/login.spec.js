// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Explicare Tests', () => {

    test('Login test', async ({ page }) => {
        await page.goto('http://localhost:5173');
        await page.fill('input[type="email"]', 'admin@admin.com');
        await page.fill('input[type="password"]', 'admin951753');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/');
        await expect(page.locator('text=admin@admin.com')).toBeVisible({ timeout: 15000 });
    });

    test('Dashboard test', async ({ page }) => {
        await page.goto('http://localhost:5173');
        await page.fill('input[type="email"]', 'admin@admin.com');
        await page.fill('input[type="password"]', 'admin951753');
        await page.click('button[type="submit"]');
        await page.waitForSelector('text=admin@admin.com', { timeout: 15000 });
        await expect(page.locator('text=Meus Casos')).toBeVisible();
    });

    test('Navigation test', async ({ page }) => {
        await page.goto('http://localhost:5173');
        await page.fill('input[type="email"]', 'admin@admin.com');
        await page.fill('input[type="password"]', 'admin951753');
        await page.click('button[type="submit"]');
        await page.waitForSelector('text=admin@admin.com', { timeout: 15000 });
        await page.click('text=Meus Casos');
        await page.waitForTimeout(1000);
        await expect(page.locator('body')).toBeVisible();
    });

});
