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
        await expect(page.getByText('Pick a type to begin')).toBeVisible();
    });

    test('unfolds the form and enables issuing only after a name', async ({ page }) => {
        await selectBadgeType(page);
        await expect(issueButton(page)).toBeDisabled();
        await expect(page.getByText('Add a name to continue')).toBeVisible();
        await fillName(page, 'Mocked Badge');
        await expect(issueButton(page)).toBeEnabled();
    });

    test('recipient mode tabs switch the recipient controls', async ({ page }) => {
        await selectBadgeType(page);
        await page
            .getByRole('button', { name: /anyone with a link|^link$/i })
            .click({ timeout: 30_000 });
        await expect(page.getByText(/create a shareable link when you issue/i)).toBeVisible();
        await page
            .getByRole('button', { name: /specific people|^people$/i })
            .click({ timeout: 30_000 });
        await expect(page.getByPlaceholder('Search people...')).toBeVisible();
    });

    test('JSON toggle reveals the raw credential editor', async ({ page }) => {
        await selectBadgeType(page);
        await page.getByRole('button', { name: 'JSON', exact: true }).click({ timeout: 30_000 });
        await expect(page.locator('textarea.font-mono')).toBeVisible({ timeout: 30_000 });
    });

    test('issues to self, then routes off the success screen', async ({ page }) => {
        await selectBadgeType(page);
        await fillName(page, 'Mocked Self Badge');
        await issueButton(page).click();
        await expect(page.getByRole('heading', { name: /you made it/i })).toBeVisible({
            timeout: 30_000,
        });
        await page.getByRole('button', { name: /view in wallet/i }).click();
        await page.waitForURL(/\/(socialBadges|wallet)/, { timeout: 30_000 });
    });

    test('generates a shareable claim link in link mode', async ({ page }) => {
        await selectBadgeType(page);
        await fillName(page, 'Mocked Link Badge');
        await page
            .getByRole('button', { name: /anyone with a link|^link$/i })
            .click({ timeout: 30_000 });
        await issueButton(page).click();
        await expect(page.getByRole('heading', { name: /your link is ready/i })).toBeVisible({
            timeout: 30_000,
        });
        await expect(page.getByRole('button', { name: /copy link/i })).toBeVisible();
    });

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

    test('restores the success screen after a page reload', async ({ page }) => {
        await selectBadgeType(page);
        await fillName(page, 'Mocked Snapshot Badge');
        await issueButton(page).click();
        await expect(page.getByRole('heading', { name: /you made it/i })).toBeVisible({
            timeout: 30_000,
        });
        await page.reload();
        await expect(page.getByRole('heading', { name: /you made it/i })).toBeVisible({
            timeout: 30_000,
        });
    });
});
