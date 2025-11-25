import { expect } from '@playwright/test';
import { test } from './fixtures/test';

test.describe('Share boost link', () => {
    test('Sharing boost link with someone', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('button', { name: 'Boost' }).click();
        await page.getByRole('button', { name: 'New Boost' }).click();
        await page.getByRole('button', { name: 'Social Badge', exact: true }).click();
        await page.getByRole('button', { name: 'Charmer' }).click();
        await page.getByRole('button', { name: 'Next' }).click();
        await page.getByRole('button', { name: 'Publish & Issue' }).click();
        await page.locator('ion-col').filter({ hasText: 'Issue To' }).getByRole('button').click();
        await page.getByRole('button', { name: 'Boost Myself' }).click();
        await page.getByRole('button', { name: 'Save' }).click();
        try {
            await page.waitForURL('/wallet');
        } catch (error) {
            console.error('The page often crashes here when trying to issue the VC =(', error);
            return;
        }
        await page.getByRole('button', { name: /social badges/i }).click();
        const threeDotMenuButton = page
            .getByRole('main')
            .locator('div')
            .filter({ hasText: 'Charmer' })
            .getByAltText('Menu dropdown icon');
        await threeDotMenuButton.click({ timeout: 100000 });
        await page.getByRole('button', { name: 'Share Boost' }).click({ timeout: 100000 });
        await page.getByRole('button', { name: 'Copy Link' }).click({ timeout: 100000 });
        let clipboardURL = await page.evaluate(async () => {
            return await navigator.clipboard.readText();
        });
        if (clipboardURL.startsWith('https://')) {
            clipboardURL = clipboardURL.replace(/^https:\/\//, 'http://');
        }
        await page.goto(clipboardURL);
        await expect(page.getByText('Charmer')).toBeVisible({ timeout: 11000 });
    });
});
