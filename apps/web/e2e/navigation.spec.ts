import { test, expect } from '@playwright/test';

test.describe('ReelFlow Dashboard Application', () => {

    test('Landing page loads and displays brand', async ({ page }) => {
        // Note: Assuming app is running on localhost:3000
        await page.goto('http://localhost:3000/');

        // Expect a title "to contain" a substring.
        await expect(page).toHaveTitle(/ReelFlow/i);

        // Expect brand heading to be visible
        const heading = page.getByRole('heading', { name: 'ReelFlow' });
        await expect(heading).toBeVisible();

        // Expect form elements
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
        await expect(page.locator('button', { hasText: 'Sign In to Dashboard' })).toBeVisible();
    });

    test('Dashboard overview renders correctly', async ({ page }) => {
        await page.goto('http://localhost:3000/dashboard');

        // Check navigation sidebar
        await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Scraper' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Queue' })).toBeVisible();

        // Check main stats
        await expect(page.getByText('Pipeline Overview')).toBeVisible();
        await expect(page.getByText('Total Discovered')).toBeVisible();
    });

    test('Scraper page requires both inputs to submit', async ({ page }) => {
        await page.goto('http://localhost:3000/scraper');

        const submitButton = page.locator('button', { hasText: 'Start Scraping Job' });

        // Initially disabled because username is empty
        await expect(submitButton).toBeDisabled();

        // Fill out the username
        await page.locator('input[id="target-username"]').fill('test_user');

        // Now it should be enabled
        await expect(submitButton).toBeEnabled();
    });
});
