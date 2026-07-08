import { expect, type Page } from '@playwright/test';
import { test } from './fixtures/test';
import { waitForAuthenticatedState } from './test.helpers';
import { TEST_USER_PROFILE_ID, TEST_USER_2_SEED, TEST_USER_2_PROFILE_ID } from './constants';
import { mockDidKitWasmForContext } from './route.helpers';

const NAME_PLACEHOLDER = 'e.g. Web Development Fundamentals';

// The Issue button renders two <span>s (a short mobile label and the full
// desktop label) toggled by CSS. On the desktop Firefox viewport the accessible
// name resolves to "Issue Credential"; the regex tolerates either label.
const issueButton = (page: Page) => page.getByTestId('issue-submit');

const selectBadgeType = async (page: Page) => {
    await page.getByRole('button', { name: 'Badge', exact: true }).click({ timeout: 30_000 });
    await expect(page.getByPlaceholder(NAME_PLACEHOLDER)).toBeVisible({ timeout: 30_000 });
};

const fillName = (page: Page, name: string) => page.getByPlaceholder(NAME_PLACEHOLDER).fill(name);

// Recipient-tab labels are viewport-gated (full text on desktop, short text on
// mobile), so every tab selector tolerates both forms.
const addPersonRecipient = async (page: Page, profileId: string) => {
    await page.getByRole('button', { name: /specific people/i }).click({ timeout: 30_000 });
    const search = page.getByPlaceholder('Search people...');
    await expect(search).toBeVisible({ timeout: 30_000 });
    await search.fill(profileId);
    // The result row is a button whose accessible name includes "@{profileId}".
    await page.getByText(profileId).first().waitFor({ timeout: 30_000 });
    await page
        .getByRole('button', { name: new RegExp(profileId, 'i') })
        .first()
        .click({ timeout: 30_000 });
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
        // The hint renders twice (desktop + mobile variants toggled by CSS).
        await expect(page.getByText('Pick a type to begin').first()).toBeVisible();
    });

    test('selecting a type unfolds the form and enables issuing only after a name', async ({
        page,
    }) => {
        await selectBadgeType(page);

        await expect(issueButton(page)).toBeDisabled();
        await expect(page.getByText('Add a name to continue').first()).toBeVisible();

        await fillName(page, 'E2E Badge');
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

    test('issues a credential to yourself, then routes off the success screen', async ({
        page,
    }) => {
        await selectBadgeType(page);
        await fillName(page, 'E2E Self Badge');

        const button = issueButton(page);
        await expect(button).toBeEnabled();
        await button.click();

        // Issuance is a real backend round-trip (sign + store), so allow generous time.
        await expect(page.getByRole('heading', { name: /you made it/i })).toBeVisible({
            timeout: 90_000,
        });
        await expect(page.getByRole('button', { name: /view in wallet/i })).toBeVisible();

        // Self-issued credentials route to their category page (Badge → /socialBadges),
        // falling back to /wallet; either confirms we left the success screen.
        await page.getByRole('button', { name: /view in wallet/i }).click();
        // "View in Wallet" is an SPA history.push (no load event), so assert we
        // leave the success route rather than waiting for navigation load.
        await expect(page).not.toHaveURL(/\/issue/, { timeout: 30_000 });
    });

    test('issues to a specific person and shows the Sent screen', async ({ page, browser }) => {
        // Second user must exist on the network to be searchable as a recipient.
        const context2 = await browser.newContext({ ignoreHTTPSErrors: true });
        await mockDidKitWasmForContext(context2);
        const page2 = await context2.newPage();
        await waitForAuthenticatedState(page2, {
            seed: TEST_USER_2_SEED,
            profileId: TEST_USER_2_PROFILE_ID,
        });

        await selectBadgeType(page);
        await fillName(page, 'E2E Sent Badge');
        await addPersonRecipient(page, TEST_USER_2_PROFILE_ID);

        const button = issueButton(page);
        await expect(button).toBeEnabled();
        await button.click();

        await expect(page.getByRole('heading', { name: /^sent!$/i })).toBeVisible({
            timeout: 90_000,
        });
        await expect(page.getByRole('button', { name: /^done$/i })).toBeVisible();

        await context2.close();
    });

    test('generates a shareable claim link in link mode', async ({ page }) => {
        await selectBadgeType(page);
        await fillName(page, 'E2E Link Badge');

        await page.getByRole('button', { name: /anyone with a link/i }).click({ timeout: 30_000 });

        const button = issueButton(page);
        await expect(button).toBeEnabled();
        await button.click();

        // Link mode also registers a signing authority server-side on first use,
        // so this round-trip can be slower than a plain issue.
        await expect(page.getByRole('heading', { name: /your link is ready/i })).toBeVisible({
            timeout: 90_000,
        });
        await expect(page.getByRole('button', { name: /copy link/i })).toBeVisible();
    });

    test('shows a retry-able error when issuance fails', async ({ page }) => {
        await selectBadgeType(page);
        await fillName(page, 'E2E Error Badge');

        // Abort the brain-service calls behind createBoost/send so the friendly,
        // retry-able error path renders. Added after setup so auth/profile are intact.
        await page.route(/\/\/localhost:4000\/trpc/, route => route.abort());

        const button = issueButton(page);
        await expect(button).toBeEnabled();
        await button.click();

        await expect(page.getByRole('button', { name: /try again/i })).toBeVisible({
            timeout: 60_000,
        });
    });

    test('restores the success screen after a page reload', async ({ page }) => {
        await selectBadgeType(page);
        await fillName(page, 'E2E Snapshot Badge');

        await issueButton(page).click();
        await expect(page.getByRole('heading', { name: /you made it/i })).toBeVisible({
            timeout: 90_000,
        });

        // The success state is persisted to sessionStorage and restored on reload.
        await page.reload();
        await expect(page.getByRole('heading', { name: /you made it/i })).toBeVisible({
            timeout: 30_000,
        });
    });
});
