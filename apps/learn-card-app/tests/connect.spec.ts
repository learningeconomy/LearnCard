import { expect } from '@playwright/test';
import { test } from './fixtures/test';

test.describe('Connect', () => {
    test('Connecting to another user', async ({ page, browser }) => {
        await page.goto('/wallet');
        await page.getByRole('link', { name: 'Contacts' }).click();
        await page.getByLabel('', { exact: true }).click();
        await page.getByLabel('', { exact: true }).fill('test2');
        await page.getByRole('button', { name: 'Request Connection' }).click();
        await page.getByRole('button', { name: 'Confirm' }).click();

        const newContext = await browser.newContext({
            storageState: 'tests/states/test2State.json',
        });
        const page2 = await newContext.newPage();
        await page2.goto('/wallet');

        await page2.getByRole('banner').getByRole('button').first().click();

        await page2.waitForURL('/notifications');

        await page2
            .getByRole('button', {
                name: /accept/i,
            })
            .click();

        await expect(page2.getByText('Accepted')).toBeVisible();

        await page.goto('/wallet');
        await page.getByRole('link', { name: 'Contacts' }).click();
        await expect(page.getByText('test2')).toBeVisible({ timeout: 30_000 });

        await page2.goto('/wallet');
        await page2.getByRole('link', { name: 'Contacts' }).click();
        await expect(page2.getByText('test')).toBeVisible({ timeout: 30_000 });
    });
});
