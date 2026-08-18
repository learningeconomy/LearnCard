import { expect } from '@playwright/test';
import { test } from './fixtures/test';
import {
    issueBadgeToSelf,
    openBoostAFriendBadgePicker,
    personalizeTestBadge,
    TEST_CREDENTIAL_TITLE,
    waitForAuthenticatedState,
} from './test.helpers';
import { TEST_USER_2_SEED, TEST_USER_PROFILE_ID, TEST_USER_2_PROFILE_ID } from './constants';
import { mockDidKitWasmForContext } from './route.helpers';

import { getLogger } from 'learn-card-base/src/logging/logger';
const log = getLogger('wallet-credentials.spec');

test.describe('Wallet Credentials', () => {
    test.beforeEach(async ({ page }) => {
        // Create a network profile so the LCN gate lets the boost flow open
        // instead of OnboardingContainer.
        await waitForAuthenticatedState(page, { profileId: TEST_USER_PROFILE_ID });
    });

    test('Issue a badge to yourself', async ({ page }) => {
        await issueBadgeToSelf(page);

        await expect(page.getByText(TEST_CREDENTIAL_TITLE).first()).toBeVisible({
            timeout: 30_000,
        });
    });

    test('Issue a badge to someone else', async ({ page, browser }) => {
        // Capture console errors for debugging
        const consoleErrors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') consoleErrors.push(msg.text());
        });

        // User 1: Re-authenticate with a network profile
        await waitForAuthenticatedState(page, { profileId: TEST_USER_PROFILE_ID });

        // User 2: Authenticate and join the network
        const context2 = await browser.newContext({ ignoreHTTPSErrors: true });
        await mockDidKitWasmForContext(context2);
        const page2 = await context2.newPage();
        await waitForAuthenticatedState(page2, {
            seed: TEST_USER_2_SEED,
            profileId: TEST_USER_2_PROFILE_ID,
        });

        // User 1: Create a peer badge and send it to user 2.
        await openBoostAFriendBadgePicker(page);
        await personalizeTestBadge(page);

        await page.getByPlaceholder('Search people...').fill(TEST_USER_2_PROFILE_ID);
        const recipientResult = page
            .getByRole('button')
            .filter({ hasText: TEST_USER_2_PROFILE_ID })
            .first();
        await expect(recipientResult).toBeVisible({ timeout: 30_000 });
        await recipientResult.click();

        const sendBadgeButton = page.getByRole('button', { name: 'Send Badge', exact: true });
        await expect(sendBadgeButton).toBeEnabled();
        await sendBadgeButton.click();
        await expect(page.getByRole('heading', { name: 'Badge sent!' })).toBeVisible({
            timeout: 60_000,
        });

        // Log any console errors for debugging if the test fails later
        if (consoleErrors.length > 0) {
            log.info('Console errors during badge issuance:', consoleErrors);
        }

        // User 2: Navigate to notifications and claim the peer badge. The LC-1921
        // nav redesign removed the "Alerts" nav link — notifications now live at
        // the /notifications route (reached via the NotificationButton icon).
        await page2.goto('/notifications');

        // Claim the badge
        await page2.getByRole('button', { name: /claim/i }).click({ timeout: 30_000 });

        // Click the badge card to flip it. LC-2071 exposes the credential card as a
        // labeled group rather than a role="button": a clickable card must not also
        // contain focusable controls (the issuer badge), which axe reports as a
        // serious `nested-interactive` violation. The card keeps its pointer click,
        // and the same verification content is reachable by keyboard via the
        // Details tab below.
        const credentialCard = page2.getByRole('group', {
            name: new RegExp(TEST_CREDENTIAL_TITLE),
        });
        await expect(credentialCard).toBeVisible({ timeout: 30_000 });
        await credentialCard.click({ timeout: 30_000 });

        // Accept the badge. LC-2071 wraps the boost preview tabs in a real tablist,
        // so "Details" is now a tab rather than a plain button.
        await page2.getByRole('tab', { name: 'Details', exact: true }).click({ timeout: 30_000 });
        await page2.getByRole('button', { name: 'Accept' }).click({ timeout: 30_000 });

        // Assert badge was claimed
        await expect(page2.getByText(/successfully claimed/i)).toBeVisible({
            timeout: 30_000,
        });

        // User 2: Navigate to wallet and verify the badge via category
        await page2.goto('/wallet');
        await page2.waitForURL(/\/wallet/, { timeout: 30_000 });

        // Verify the Badges (social badge) category exists on User 2's wallet
        // (the LC-1919 Passport reorg renamed "Boosts" → "Badges").
        const badgesCategory = page2.locator('[role="button"]').filter({ hasText: 'Badges' });
        await expect(badgesCategory).toBeVisible({ timeout: 30_000 });

        // Click into the Badges category
        await badgesCategory.click();
        await page2.waitForURL(/\/socialBadges/, { timeout: 30_000 });

        // Verify the badge appears in User 2's Badges list
        await expect(page2.getByText(TEST_CREDENTIAL_TITLE).first()).toBeVisible({
            timeout: 30_000,
        });

        // Click the badge to open its detail view
        await page2.getByText(TEST_CREDENTIAL_TITLE).first().click();

        // Verify detail view elements (front + back face both have the title, use first())
        await expect(page2.locator('.vc-card-header-main-title').first()).toContainText(
            TEST_CREDENTIAL_TITLE,
            { timeout: 30_000 }
        );
        await expect(page2.locator('.issued-by').first()).toBeVisible({ timeout: 30_000 });

        await context2.close();
    });
});
