import { expect } from '@playwright/test';
import { test } from './fixtures/test';

test.describe('Sign out', () => {
    test('Signing out', async ({ page }) => {
        await page.goto('/');

        await page.addStyleTag({ content: 'html { scroll-behavior: initial !important; }' });

        await page.getByRole('button', { name: /qr-code-scanner-button/i }).click();

        await page.getByRole('button', { name: /logout/i }).click();

        await expect(page).toHaveURL('/login');
    });
});

test.describe('Signing in with a seed', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('Signing in with a seed', async ({ page }) => {
        await page.goto('/hidden/seed');

        await page.getByRole('textbox').fill('c'.repeat(64));

        await page.getByRole('button', { name: /sign in with seed/i }).click();
        await page.waitForURL(/wallet/);
    });

    test('Signing up for the LCN', async ({ page }) => {
        await page.goto('/hidden/seed');

        await page.getByRole('textbox').fill('abc123'.repeat(30).slice(0, 64));

        await page.getByRole('button', { name: /sign in with seed/i }).click();
        await page.waitForURL(/wallet/);

        await page.getByRole('button', { name: /boost/i }).click();
        await page.locator('#ion-input-2').fill('ididitlol');
        await page.getByRole('button', { name: /let's go/i }).click();

        await page.getByLabel('qr-code-scanner-button').click();
        await page.getByRole('button', { name: 'My Account' }).click();

        await expect(page.getByText(/did:web/)).toBeVisible();
    });
});
