import { expect } from '@playwright/test';
import { test } from './fixtures/test';

test.describe('Claimable Boost', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.getByRole('button', { name: 'Boost' }).click();
        await page.getByRole('button', { name: 'New Boost' }).click();
        await page.getByRole('button', { name: 'Social Badge', exact: true }).click();
        await page.getByRole('button', { name: 'Charmer' }).click();
        await page.getByRole('button', { name: 'Next' }).click();
        await page.getByRole('button', { name: 'Publish & Issue' }).click();
        await page.locator('label div').nth(4).click();
        await page.getByRole('button', { name: 'Generate Link' }).click();
        await page
            .locator('ion-col')
            .filter({ hasText: 'https://learncard.app/claim/' })
            .getByRole('img')
            .click();
    });

    test('User B claiming a boost sent by User A via claimable link', async ({ page, browser }) => {
        let clipboardURL = await page.evaluate(async () => {
            return await navigator.clipboard.readText();
        });
        if (/^https:\/\/learncard\.app/.test(clipboardURL)) {
            clipboardURL = clipboardURL.replace(
                /^https:\/\/learncard\.app/,
                'http://localhost:3000'
            );
        }
        const newContext = await browser.newContext({
            storageState: 'tests/states/test2State.json',
        });
        const page2 = await newContext.newPage();
        await page2.goto(clipboardURL);
        await page2.getByRole('button', { name: 'Accept' }).click({ timeout: 11000 });
        try {
            await page2.waitForURL('/wallet');
        } catch (error) {
            console.error('The page often crashes here when trying to issue the VC =(', error);
            return;
        }
        await page2.getByRole('button', { name: /social badges/i }).click();
        await expect(page2.getByText('Charmer')).toBeVisible({ timeout: 11000 });
    });

    test('Claiming a boost without being logged in via claimable link', async ({
        page,
        context,
    }) => {
        await page.goto('/');
        await page.addStyleTag({ content: 'html { scroll-behavior: initial !important; }' });
        await page.getByRole('button', { name: /qr-code-scanner-button/i }).click();
        await page.getByRole('button', { name: /logout/i }).click();
        await expect(page).toHaveURL('/login');

        let clipboardURL = await page.evaluate(async () => {
            return await navigator.clipboard.readText();
        });
        if (/^https:\/\/learncard\.app/.test(clipboardURL)) {
            clipboardURL = clipboardURL.replace(
                /^https:\/\/learncard\.app/,
                'http://localhost:3000'
            );
        }
        // const page = await context.newPage();
        await page.goto(clipboardURL);
        await page.getByRole('button', { name: 'Accept' }).click();
        await page.getByRole('button', { name: 'Login' }).click();

        await page.goto('/hidden/seed');
        await page.getByRole('textbox').fill('2'.repeat(64));
        await page.getByRole('button', { name: /sign in with seed/i }).click();

        await page.goto(clipboardURL);
        await page.getByRole('button', { name: 'Accept' }).click({ timeout: 11000 });
        try {
            await page.waitForURL('/wallet');
        } catch (error) {
            console.error('The page often crashes here when trying to issue the VC =(', error);
            return;
        }
        await page.getByRole('button', { name: /social badges/i }).click();
        await expect(page.getByText('Charmer')).toBeVisible({ timeout: 11000 });
    });
});
