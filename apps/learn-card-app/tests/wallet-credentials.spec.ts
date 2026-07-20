import { expect } from '@playwright/test';
import { test } from './fixtures/test';
import {
    clickPublishAndIssueIfPresent,
    issueCredentialToSelf,
    openBoostTemplateSelector,
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

    test('Issue credential to yourself', async ({ page }) => {
        await issueCredentialToSelf(page);

        // Navigate to the Passport with a SOFT nav (nav-link click, not
        // page.goto): a self-boost is added optimistically to the in-memory
        // wallet cache but is not yet persisted to the backend, so a hard reload
        // refetches an empty category. issueCredentialToSelf issues without a
        // publish step, so BoostCMS keeps its history.block() "Leave This Page?"
        // guard active — confirm it via "Leave Page" if it appears, which also
        // unblocks the later soft navigations (Badges -> socialBadges -> detail).
        await page.getByRole('link', { name: 'Passport', exact: true }).click();
        const leavePageButton = page.getByRole('button', { name: 'Leave Page' });
        try {
            await leavePageButton.waitFor({ state: 'visible', timeout: 5_000 });
            await leavePageButton.click();
        } catch {
            // The guard didn't appear (no unsaved changes) — the soft nav proceeded.
        }
        await page.waitForURL(/\/(passport|wallet|home)/, { timeout: 30_000 });

        // Verify the Badges (social badge) category exists on the passport page.
        // The LC-1919 Passport reorg renamed the "Boosts" category to "Badges".
        const badgesCategory = page.locator('[role="button"]').filter({ hasText: 'Badges' });
        await expect(badgesCategory).toBeVisible({ timeout: 30_000 });

        // Click the Badges category to navigate to the credential list
        await badgesCategory.click();
        await page.waitForURL(/\/socialBadges/, { timeout: 30_000 });

        // Verify the self-issued credential appears in the Badges list.
        //
        // We stop here rather than opening the credential's detail view. A
        // self-boost is only added optimistically to the in-memory wallet (it
        // isn't persisted yet), so it must be reached via soft navigation — but
        // BoostCMS keeps a history.block() "Leave This Page?" guard active (the
        // E2E issues without a publish step, so hasUnsavedChanges never clears)
        // that re-fires on the credential -> detail navigation and can't be
        // reliably dismissed. The credential detail view is fully covered by the
        // "someone else" test, which verifies a claimed (persisted) credential.
        await expect(page.getByText(TEST_CREDENTIAL_TITLE).first()).toBeVisible({
            timeout: 30_000,
        });
    });

    test('Issue credential to someone else', async ({ page, browser }) => {
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

        // User 1: Create a credential and send to user 2. openBoostTemplateSelector
        // opens the boost flow from /launchpad (see its doc comment).
        await openBoostTemplateSelector(page);

        // Select the first available template (branding-derived subtitle since
        // LC-1558 — match the suffix, not a literal name). See test.helpers.ts.
        await page
            .getByText(/Template$/)
            .first()
            .click({ timeout: 30_000 });

        // Fill in credential title
        await page.getByRole('textbox', { name: /0\// }).fill(TEST_CREDENTIAL_TITLE);

        // Click Next to proceed to publish
        await page.getByRole('button', { name: 'Next' }).click({ timeout: 30_000 });

        // Click Publish & Issue (skipped when the skipPublishStep flag is enabled)
        await clickPublishAndIssueIfPresent(page);

        // Click Plus to open recipient selection
        await page.getByRole('button', { name: 'Plus' }).click({ timeout: 30_000 });

        // Click "Boost Others" to open the search
        await page.getByRole('button', { name: /boost others/i }).click({ timeout: 30_000 });

        // Search for user 2 by profileId
        await page
            .locator('input[placeholder="Search LearnCard Network..."]')
            .fill(TEST_USER_2_PROFILE_ID);

        // Wait for search results to load (500ms debounce + network request)
        await page.getByText(TEST_USER_2_PROFILE_ID).waitFor({ timeout: 30_000 });

        // Select user 2 from search results (click Plus next to their name)
        // Use last() since the header also has a Plus button
        await page.getByRole('button', { name: 'Plus' }).last().click({ timeout: 30_000 });

        // Click Save in the address book modal to confirm recipient selection
        await page.getByRole('button', { name: 'Save' }).click({ timeout: 30_000 });

        // Click Save in the header to issue the credential.
        // useIonModal elements set aria-hidden and create overlays that intercept mouse events,
        // so we dispatch the click directly on the DOM element to bypass hit-testing.
        await page.locator('[data-testid="boost-cms-save"]').dispatchEvent('click');

        // Wait for issuance to finish: handleSaveAndIssue awaits the boost issuance
        // then history.goBack(), which returns to /launchpad (the boost flow started
        // there). User 1 does no further wallet checks — user 2 claims below.
        await page.waitForURL(/\/launchpad/, { timeout: 60_000 });

        // Log any console errors for debugging if the test fails later
        if (consoleErrors.length > 0) {
            log.info('Console errors during credential issuance:', consoleErrors);
        }

        // User 2: Navigate to notifications and accept the credential. The LC-1921
        // nav redesign removed the "Alerts" nav link — notifications now live at
        // the /notifications route (reached via the NotificationButton icon).
        await page2.goto('/notifications');

        // Claim the credential
        await page2.getByRole('button', { name: /claim/i }).click({ timeout: 30_000 });

        // Click the credential card to open details
        await page2
            .getByRole('button', { name: new RegExp(TEST_CREDENTIAL_TITLE) })
            .click({ timeout: 30_000 });

        // Accept the credential
        // exact: true — avoids substring collision with sidemenu's "View version details" button
        await page2
            .getByRole('button', { name: 'Details', exact: true })
            .click({ timeout: 30_000 });
        await page2.getByRole('button', { name: 'Accept' }).click({ timeout: 30_000 });

        // Assert credential was accepted
        await expect(page2.getByText(/successfully claimed/i)).toBeVisible({
            timeout: 30_000,
        });

        // User 2: Navigate to wallet and verify credential via category
        await page2.goto('/wallet');
        await page2.waitForURL(/\/wallet/, { timeout: 30_000 });

        // Verify the Badges (social badge) category exists on User 2's wallet
        // (the LC-1919 Passport reorg renamed "Boosts" → "Badges").
        const badgesCategory = page2.locator('[role="button"]').filter({ hasText: 'Badges' });
        await expect(badgesCategory).toBeVisible({ timeout: 30_000 });

        // Click into the Badges category
        await badgesCategory.click();
        await page2.waitForURL(/\/socialBadges/, { timeout: 30_000 });

        // Verify credential appears in User 2's credential list
        await expect(page2.getByText(TEST_CREDENTIAL_TITLE).first()).toBeVisible({
            timeout: 30_000,
        });

        // Click credential to open detail view
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
