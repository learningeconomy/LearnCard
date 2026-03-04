import { expect } from '@playwright/test';
import { test } from './fixtures/test';
import { issueBoostToSelf, TEST_BOOST_TITLE, waitForAuthenticatedState } from './test.helpers';

test.describe('Wallet Credentials', () => {
    test.beforeEach(async ({ page }) => {
        await waitForAuthenticatedState(page);
    });

    test('Issue a boost to self', async ({ page }) => {
        await issueBoostToSelf(page);
    });

    test('View issued credential in wallet', async ({ page }) => {
        // Issue a boost first, then verify it appears in the wallet
        await issueBoostToSelf(page);

        await page.goto('/socialBadges');
        await expect(page.getByText(TEST_BOOST_TITLE).first()).toBeVisible({
            timeout: 30_000,
        });
    });
});
