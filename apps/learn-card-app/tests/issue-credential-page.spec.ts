import { expect, type Page } from '@playwright/test';
import { test } from './fixtures/test';
import { waitForAuthenticatedState } from './test.helpers';
import { TEST_USER_PROFILE_ID } from './constants';

const NAME_PLACEHOLDER = 'e.g. Web Development Fundamentals';

// The Issue button renders two <span>s (a short mobile label and the full
// desktop label) toggled by CSS. On the desktop Firefox viewport the accessible
// name resolves to "Issue Credential"; the regex tolerates either label.
const issueButton = (page: Page) => page.getByRole('button', { name: /issue credential|^issue$/i });

const selectBadgeType = async (page: Page) => {
    await page.getByRole('button', { name: 'Badge', exact: true }).click({ timeout: 30_000 });
    await expect(page.getByPlaceholder(NAME_PLACEHOLDER)).toBeVisible({ timeout: 30_000 });
};

test.describe('Issue Credential Page (/issue)', () => {
    test.beforeEach(async ({ page }) => {
        // A network profile is required so self-issue has an issuer identity.
        await waitForAuthenticatedState(page, {
            path: '/issue',
            profileId: TEST_USER_PROFILE_ID,
        });
        await page.waitForURL(/\/issue/, { timeout: 30_000 });
    });

    test('renders the type picker and gates the Issue button before a type is chosen', async ({
        page,
    }) => {
        await expect(page.getByRole('heading', { name: 'What are you issuing?' })).toBeVisible({
            timeout: 30_000,
        });
        await expect(issueButton(page)).toBeDisabled();
        await expect(page.getByText('Pick a type to begin')).toBeVisible();
    });

    test('selecting a type unfolds the form and enables issuing only after a name', async ({
        page,
    }) => {
        await selectBadgeType(page);

        await expect(issueButton(page)).toBeDisabled();
        await expect(page.getByText('Add a name to continue')).toBeVisible();

        await page.getByPlaceholder(NAME_PLACEHOLDER).fill('E2E Badge');
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
        // JsonStudio is the only monospace textarea rendered in JSON view.
        await expect(page.locator('textarea.font-mono')).toBeVisible({ timeout: 30_000 });
    });

    test('issues a credential to yourself and shows the success screen', async ({ page }) => {
        await selectBadgeType(page);
        await page.getByPlaceholder(NAME_PLACEHOLDER).fill('E2E Self Badge');

        const button = issueButton(page);
        await expect(button).toBeEnabled();
        await button.click();

        // Issuance is a real backend round-trip (sign + store), so allow generous time.
        await expect(page.getByRole('heading', { name: /you made it/i })).toBeVisible({
            timeout: 90_000,
        });
        await expect(page.getByRole('button', { name: /view in wallet/i })).toBeVisible();
    });
});
