import { expect } from '@playwright/test';
import { test } from '../fixtures/test';

test.describe('Show network prompt', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('Prompts the user to join the network, when getProfile request fail', async ({ page }) => {
        await page.goto('/hidden/seed');

        await page.getByRole('textbox').fill('123abc'.repeat(30).slice(0, 64));

        await page.getByRole('button', { name: /sign in with seed/i }).click();
        await page.waitForURL(/wallet/);

        // Intercept the request and simulate a network failure
        await page.route('**/trpc/profile.getProfile?batch=1&input=%7B%7D', route => {
            route.abort('failed'); // This will simulate a network failure
        });

        await page.getByRole('button', { name: 'Boost' }).click();

        // confirm the user is prompted to join the network
        await expect(page.getByText(/join the learncard network/i)).toBeVisible();
    });
});

test.describe('Do not show network prompt', () => {
    test('Does not prompt the user to join the network', async ({ page }) => {
        await page.goto('wallet');

        // confirm the user is not prompted to join the network
        await expect(page).toHaveURL('http://localhost:3000/wallet');
    });
});
