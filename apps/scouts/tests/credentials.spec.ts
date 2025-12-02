import { test, expect } from '@playwright/test';

test.describe('credentials', () => {
    // Skipping for now until we add delete functionality as this test will overwhelm the demo
    // account with test credentials
    test.skip('issuing a credential', async ({ page }) => {
        await page.goto('/');

        await page.getByRole('link', { name: 'Achievements' }).click();
        await page.getByRole('button', { name: /plus-button/i }).click();
        await page.getByRole('listitem', { name: /generic achievement/i }).click();

        await page.getByRole('button', { name: 'Next Step' }).click();
        await page.getByRole('textbox', { name: 'Name' }).fill('__Test Credential__');
        await page.getByRole('textbox', { name: 'Description' }).fill('This is for testing!');
        await page.getByRole('textbox', { name: 'Criteria' }).fill('I got this for testing!');
        await page.getByRole('button', { name: 'Create Credential' }).click();

        const credential = page.getByRole('button', { name: '__Test Credential__' }).first();

        await credential.click();

        await expect(page.getByRole('heading', { name: '__Test Credential__' })).toBeVisible();
    });
});
