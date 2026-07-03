import { test, expect } from './fixtures/mocked-test';
import type { Page } from '@playwright/test';
import { installNetwork } from './mocks/network';
import { waitForAuthenticatedState } from './test.helpers';
import { TEST_USER_PROFILE_ID } from './constants';

const NAME_PLACEHOLDER = 'e.g. Web Development Fundamentals';

// See the sibling @e2e spec for the rationale behind these viewport-tolerant selectors.
const issueButton = (page: Page) => page.getByRole('button', { name: /issue credential|^issue$/i });

const selectBadgeType = async (page: Page) => {
    await page.getByRole('button', { name: 'Badge', exact: true }).click({ timeout: 30_000 });
    await expect(page.getByPlaceholder(NAME_PLACEHOLDER)).toBeVisible({ timeout: 30_000 });
};

const fillName = (page: Page, name: string) => page.getByPlaceholder(NAME_PLACEHOLDER).fill(name);

// @mocked — this suite runs on the vite-only tier (no docker). The HAR baseline
// serves the recorded auth/boot + issuance traffic; see tests/mocks/network.ts.
test.describe('Issue Credential Page (/issue) @mocked', () => {
    test.beforeEach(async ({ page }) => {
        // Install the mocked backend BEFORE any navigation so boot calls are served.
        await installNetwork(page);
        await waitForAuthenticatedState(page, {
            path: '/issue',
            profileId: TEST_USER_PROFILE_ID,
        });
        await page.waitForURL(/\/issue/, { timeout: 30_000 });
    });

    test('renders the type picker and gates the Issue button', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'What are you issuing?' })).toBeVisible({
            timeout: 30_000,
        });
        await expect(issueButton(page)).toBeDisabled();
        // The hint renders twice (desktop + mobile variants toggled by CSS).
        await expect(page.getByText('Pick a type to begin').first()).toBeVisible();
    });

    test('unfolds the form and enables issuing only after a name', async ({ page }) => {
        await selectBadgeType(page);
        await expect(issueButton(page)).toBeDisabled();
        await expect(page.getByText('Add a name to continue').first()).toBeVisible();
        await fillName(page, 'Mocked Badge');
        await expect(issueButton(page)).toBeEnabled();
    });

    test('recipient mode tabs switch the recipient controls', async ({ page }) => {
        await selectBadgeType(page);
        await page.getByRole('button', { name: /anyone with a link/i }).click({ timeout: 30_000 });
        await expect(page.getByText(/create a shareable link when you issue/i)).toBeVisible();
        await page.getByRole('button', { name: /specific people/i }).click({ timeout: 30_000 });
        await expect(page.getByPlaceholder('Search people...')).toBeVisible();
    });

    test('JSON toggle reveals the raw credential editor', async ({ page }) => {
        await selectBadgeType(page);
        await page.getByRole('button', { name: 'JSON', exact: true }).click({ timeout: 30_000 });
        await expect(page.locator('textarea.font-mono')).toBeVisible({ timeout: 30_000 });
    });

    // Completing an issuance (self / person / link) is a real signing +
    // multi-service backend flow — it lives in the real-backend @e2e spec, not
    // here. This tier covers the offline UI logic up to the issue action.

    test('shows a retry-able error when issuance fails', async ({ page }) => {
        await selectBadgeType(page);
        await fillName(page, 'Mocked Error Badge');
        // Abort the boost/network call so the friendly retry-able error path renders.
        await page.route(/\/\/localhost:4000\/trpc/, route => route.abort('failed'));
        await issueButton(page).click();
        await expect(page.getByRole('button', { name: /try again/i })).toBeVisible({
            timeout: 30_000,
        });
    });
});
