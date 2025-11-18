import { test, expect } from '@playwright/test';

test.describe('Sign out', () => {
    // Skipping for now because this will sign out the demo user and cause other tests to fail
    test.skip('Signing out', async ({ page }) => {
        await page.goto('/');

        await page.addStyleTag({ content: 'html { scroll-behavior: initial !important; }' });

        await page.getByRole('button', { name: /qr-code-scanner-button/i }).click();

        await page.getByRole('button', { name: /logout/i }).click();

        await expect(page).toHaveURL('/login');
    });
});
