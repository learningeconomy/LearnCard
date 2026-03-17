import { expect } from '@playwright/test';
import { test } from './fixtures/test';
import {
    issueCredentialToSelf,
    TEST_CREDENTIAL_TITLE,
    waitForAuthenticatedState,
} from './test.helpers';
import { TEST_USER_2_SEED, TEST_USER_PROFILE_ID, TEST_USER_2_PROFILE_ID } from './constants';
import { mockDidKitWasmForContext } from './route.helpers';

test.describe('Wallet Credentials', () => {
    test.beforeEach(async ({ page }) => {
        await waitForAuthenticatedState(page);
    });

    test('Issue credential to yourself', async ({ page }) => {
        // waitForAuthenticatedState lands on /wallet — issue credential from here
        await issueCredentialToSelf(page);

        // history.goBack() returns to /wallet
        await page.waitForURL(/\/wallet/, { timeout: 60_000 });

        // Verify the Boosts category exists on wallet page
        const boostsCategory = page.locator('[role="button"]').filter({ hasText: 'Boosts' });
        await expect(boostsCategory).toBeVisible({ timeout: 30_000 });

        // Click the Boosts category to navigate to credential list
        await boostsCategory.click();
        await page.waitForURL(/\/socialBadges/, { timeout: 30_000 });

        // Verify credential appears in the list
        await expect(page.getByText(TEST_CREDENTIAL_TITLE).first()).toBeVisible({
            timeout: 30_000,
        });

        // Click credential to open detail view
        await page.getByText(TEST_CREDENTIAL_TITLE).first().click();

        // Verify detail view elements (front + back face both have the title, use first())
        await expect(page.locator('.vc-card-header-main-title').first()).toContainText(
            TEST_CREDENTIAL_TITLE,
            { timeout: 30_000 }
        );
        await expect(page.locator('.issued-by').first()).toBeVisible({ timeout: 30_000 });
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

        // User 1: Start from /wallet so history.goBack() returns here after issuing
        // (waitForAuthenticatedState already lands on /wallet)

        // User 1: Create a credential and send to user 2
        await page.getByRole('button', { name: 'Add to LearnCard' }).click({ timeout: 30_000 });
        await page.getByRole('button', { name: 'Boost Someone' }).click({ timeout: 30_000 });

        // Select the first available template
        await page.getByText('LearnCard Template').first().click({ timeout: 30_000 });

        // Fill in credential title
        await page.getByRole('textbox', { name: /0\// }).fill(TEST_CREDENTIAL_TITLE);

        // Click Next to proceed to publish
        await page.getByRole('button', { name: 'Next' }).click({ timeout: 30_000 });

        // Click Publish & Issue
        await page.getByRole('button', { name: /publish & issue/i }).click({ timeout: 30_000 });

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

        // history.goBack() returns to /wallet
        await page.waitForURL(/\/wallet/, { timeout: 60_000 });

        // Log any console errors for debugging if the test fails later
        if (consoleErrors.length > 0) {
            console.log('Console errors during credential issuance:', consoleErrors);
        }

        // User 2: Navigate to alerts and accept the credential
        await page2.getByRole('link', { name: 'Alerts', exact: true }).click({ timeout: 30_000 });

        // Claim the credential
        await page2.getByRole('button', { name: /claim/i }).click({ timeout: 30_000 });

        // Click the credential card to open details
        await page2
            .getByRole('button', { name: new RegExp(TEST_CREDENTIAL_TITLE) })
            .click({ timeout: 30_000 });

        // Accept the credential
        await page2.getByRole('button', { name: 'Details' }).click({ timeout: 30_000 });
        await page2.getByRole('button', { name: 'Accept' }).click({ timeout: 30_000 });

        // Assert credential was accepted
        await expect(page2.getByText(/successfully claimed/i)).toBeVisible({
            timeout: 30_000,
        });

        // User 2: Navigate to wallet and verify credential via category
        await page2.goto('/wallet');
        await page2.waitForURL(/\/wallet/, { timeout: 30_000 });

        // Verify the Boosts category exists on User 2's wallet
        const boostsCategory = page2.locator('[role="button"]').filter({ hasText: 'Boosts' });
        await expect(boostsCategory).toBeVisible({ timeout: 30_000 });

        // Click into the Boosts category
        await boostsCategory.click();
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
