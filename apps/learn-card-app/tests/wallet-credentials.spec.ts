import { expect } from '@playwright/test';
import { test } from './fixtures/test';
import { issueBoostToSelf, TEST_BOOST_TITLE, waitForAuthenticatedState } from './test.helpers';

test.describe('Wallet Credentials', () => {
    test.beforeEach(async ({ page }) => {
        await waitForAuthenticatedState(page);
    });

    test('Issue a boost to self and view it in wallet', async ({ page }) => {
        await issueBoostToSelf(page);

        // Assert boost was issued — navigates to socialBadges and toast appears
        await page.waitForURL(/socialBadges/, { timeout: 30_000 });

        // Assert credential appears in wallet
        await expect(page.getByText(TEST_BOOST_TITLE).first()).toBeVisible({
            timeout: 30_000,
        });
    });
});
