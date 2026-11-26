import { expect } from '@playwright/test';
import { test } from './fixtures/test';

test.describe.skip('credentials', () => {
    // Skipping for now until we add delete functionality as this test will overwhelm the demo
    // account with test credentials
    test('issuing a credential', async ({ page }) => {
        await page.goto('/');

        await page.getByText('Boost', { exact: true }).click();
        await page.getByRole('button', { name: 'New Boost' }).click();
        await page.getByRole('button', { name: 'Achievement' }).click();
        await page.locator('#ion-input-0').fill('Test');
        await page.getByRole('button', { name: 'Certification' }).click();
        await page.getByLabel('/100').fill('__Test Credential__');
        // AppTextarea ids are generated; these were #ion-textarea-1 and -2 (the title is the first).
        await page.locator('textarea').nth(1).fill('This is for testing!');
        await page.locator('textarea').nth(2).fill('I got this for testing!');
        await page.getByText('Next').click();

        const credential = page.getByRole('button', { name: '__Test Credential__' }).first();

        await credential.click();

        await expect(page.getByRole('heading', { name: '__Test Credential__' })).toBeVisible();
    });
});
