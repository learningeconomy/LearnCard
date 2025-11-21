import { test, expect } from '@playwright/test';

test.describe('Social Boosts', () => {
    // Skipping for now until we add delete functionality as this test will overwhelm the demo
    // account with test credentials
    test.skip('Creates, Saves, Deletes Draft', async ({ page }) => {
        await page.goto('https://localhost:3000/wallet');
        await page.reload();
        await page.getByTestId('wallet-btn-socialBadge').click();
        await page.getByRole('button', { name: 'plus-button' }).click();
        await page
            .locator('ion-col')
            .filter({ hasText: /^Adventurer$/ })
            .getByRole('button')
            .click();
        await page.getByRole('textbox', { name: '/100' }).click();
        await page.getByRole('textbox', { name: '/100' }).fill('Test VC');
        await page.getByRole('button', { name: 'Next' }).click();
        await page.getByRole('button', { name: 'Save As Draft' }).click();
        await expect(page.getByText('Test VC').first()).toBeVisible();
        await expect(page.getByRole('button', { name: 'Edit Draft' }).first()).toBeVisible();
        await page.getByRole('img', { name: 'Menu dropdown icon' }).first().click();
        await page.getByRole('listitem').filter({ hasText: 'Delete' }).click();
        await page.getByRole('button', { name: 'Ok' }).click();
        await page.reload();
        await expect(page.getByText('Test VC')).not.toBeVisible();
    });
});
