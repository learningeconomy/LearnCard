import { expect } from '@playwright/test';
import { test } from './fixtures/test';
import { issueBoostToSelf, TEST_BOOST_TITLE, waitForAuthenticatedState } from './test.helpers';

test.describe('Wallet Credentials', () => {
    test.beforeEach(async ({ page }) => {
        await waitForAuthenticatedState(page);
    });

    test('View issued credential in wallet', async ({ page }) => {
        // 1. Issue a boost to self via the UI
        await issueBoostToSelf(page);

        // 2. Navigate to passport and verify the credential appears
        await page.goto('/passport');
        await expect(page.getByText(TEST_BOOST_TITLE).first()).toBeVisible({
            timeout: 30_000,
        });
    });
});
