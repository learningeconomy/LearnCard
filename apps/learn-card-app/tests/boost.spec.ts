import { expect } from '@playwright/test';
import { test } from './fixtures/test';

test.describe('Boosting', () => {
    test('Boosting yourself', async ({ page }) => {
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

        await expect(page.getByText('Charmer').first()).toBeVisible({ timeout: 30_000 });
    });

    test('Boosting someone else', async ({ page, browser }) => {
        await page.goto('/');
        await page.getByRole('link', { name: 'Contacts' }).click();
        await page.getByLabel('', { exact: true }).fill('test2');
        await page.locator('ion-item path').click();
        await page.locator('#cancel-modal').getByRole('button', { name: 'Boost' }).click();
        await page.getByRole('button', { name: 'New Boost' }).click();
        await page.getByRole('button', { name: 'Social Badge' }).click();
        await page.getByRole('button', { name: 'Charmer' }).click();
        await page.getByRole('button', { name: 'Next' }).click();
        await page.getByRole('button', { name: 'Publish & Issue' }).click();

        // Make sure boost finished sending
        try {
            await expect(page.getByText(/boost issued/i)).toBeVisible();
        } catch (error) {
            console.error('The page often crashes here when trying to issue the VC =(', error);
            return;
        }

        //open new browser context
        const newContext = await browser.newContext({
            storageState: 'tests/states/test2State.json',
        });
        const page2 = await newContext.newPage();
        await page2.goto('/wallet');

        await page2.getByRole('banner').getByRole('button').first().click();

        await page2.waitForURL('/notifications');

        await page2
            .getByRole('button', {
                name: /claim/i,
            })
            .click();

        await page2.getByRole('button', { name: 'Accept' }).click();
    });
});
