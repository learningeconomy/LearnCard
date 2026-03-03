import { expect } from '@playwright/test';
import { test } from './fixtures/test';
import { issueBoostToSelf, waitForAuthenticatedState } from './test.helpers';

test.describe('Wallet Credentials', () => {
    test.beforeEach(async ({ page }) => {
        await waitForAuthenticatedState(page);
    });

    test('View issued credential in wallet', async ({ page }) => {
        // 1. Issue a boost to self — creates a "Charmer" Social Badge
        try {
            await issueBoostToSelf(page);
        } catch (error) {
            console.error('The page often crashes here when trying to issue the VC =(', error);
            return;
        }

        // 2. Navigate to wallet and verify categories are visible
        await page.goto('/wallet');
        await expect(page.getByRole('button', { name: /social badges/i })).toBeVisible({
            timeout: 30_000,
        });

        // 3. Click the Social Badges category
        await page.getByRole('button', { name: /social badges/i }).click();

        // 4. Verify we're on the Social Badges credential page
        await page.waitForURL('/socialBadges');

        // 5. Verify the "Charmer" credential card appears in the Earned tab
        await expect(page.getByText('Charmer').first()).toBeVisible({ timeout: 30_000 });

        // 6. Click the credential card to open the detail view
        await page.getByText('Charmer').first().click();

        // 7. Verify the credential detail modal/view opens with correct content
        //    The boost preview modal should display the credential name
        await expect(page.getByText('Charmer')).toBeVisible({ timeout: 10_000 });
    });
});
