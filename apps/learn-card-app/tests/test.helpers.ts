import { expect, Locator, Page } from '@playwright/test';
import { TEST_USER_SEED } from './constants';

// This is basically expect(locator).toBeVisible() except it'll actually wait for the timeout if the element isn't visible yet
export const locatorExists = async (locator: Locator, timeout: number = 1000) =>
    !((await locator.waitFor({ timeout }).catch((e: Error) => e)) instanceof Error);

export const logoutTestAccount = async (page: Page) => {
    await page.goto('/wallet');
    await page.getByLabel('qr-code-scanner-button').click();
    await page.getByRole('button', { name: 'Logout' }).click();
    await page.waitForURL(/.*login.*/, { timeout: 10000 });
};

export const loginTestAccount = async (page: Page) => {
    await page.getByRole('textbox').fill('demo@learningeconomy.io');
    await page.getByRole('button', { name: /sign in with email/i }).click();
    // await page.waitForURL(/wallet/);
};

/** Title used when creating a test credential. Exported so tests can assert on it. */
export const TEST_CREDENTIAL_TITLE = 'Test Credential';

/**
 * Completes the "Setup Your Profile" modal to join the LearnCard Network.
 * If the modal doesn't appear (user already has a profile), this is a no-op.
 */
export const joinNetworkIfNeeded = async (page: Page, profileId: string) => {
    const userIdInput = page.locator('input[placeholder="User ID"]');
    if (await locatorExists(userIdInput, 15_000)) {
        await userIdInput.fill(profileId);
        await page.getByRole('button', { name: "Let's Go!" }).click({ timeout: 30_000 });
        // Wait for "Joining Network..." to finish and modal to close
        await page
            .getByRole('button', { name: "Let's Go!" })
            .waitFor({ state: 'hidden', timeout: 60_000 });
    }
};

/**
 * Opens the Boost template picker (BoostTemplateSelector) — the entry point for
 * issuing a credential — leaving it ready to pick a template.
 *
 * The Nav/App/Passport redesign (LC-1921) routed the old side-menu "Add to
 * LearnCard" boost entry through a nested LaunchPadActionModal → AddToLearnCardMenu
 * modal stack that is unreliable to drive (the inner modal opens on top of the
 * still-open launcher and the stack intermittently collapses). The "Boost a
 * Friend" shortcut tile on the /launchpad (MyAppsLanding) landing opens the *same*
 * BoostTemplateSelector modal directly, with no nesting — see
 * useOpenBoostTemplateSelector — so drive that instead.
 *
 * Note: this navigates to /launchpad, so after the boost flow's history.goBack()
 * the app returns to /launchpad (not the wallet). Callers that verify the issued
 * credential on the wallet should navigate there explicitly afterwards.
 */
export const openBoostTemplateSelector = async (page: Page) => {
    await page.goto('/launchpad');
    await page.getByRole('button', { name: 'Boost a Friend' }).click({ timeout: 30_000 });
};

/**
 * After clicking "Next" in the boost flow, clicks "Publish & Issue" when it is
 * shown.
 *
 * When the `skipPublishStep` flag is enabled (current E2E config), "Next" lands
 * directly on the "Issue To" screen and the publish step is absent — see
 * BoostCMS.tsx. We wait for whichever screen renders first (the publish button
 * or the "Issue To" Plus button) and only click publish when it is present.
 * Racing the two screens avoids a fixed dead-wait when the step is skipped and
 * avoids silently skipping a required click if the button renders slowly.
 */
export const clickPublishAndIssueIfPresent = async (page: Page) => {
    const publishButton = page.getByRole('button', { name: /publish & issue/i });
    const issueToPlusButton = page.getByRole('button', { name: 'Plus' });

    await expect(publishButton.or(issueToPlusButton).first()).toBeVisible({ timeout: 30_000 });

    if (await publishButton.isVisible()) {
        await publishButton.click({ timeout: 30_000 });
    }
};

/**
 * Issues a credential to the current user via the UI.
 *
 * Flow: Boost a Friend → pick template → fill form →
 *       Next → Publish & Issue → Plus → Boost Myself → Save
 */
export const issueCredentialToSelf = async (page: Page, timeout = 60_000) => {
    await openBoostTemplateSelector(page);

    // Select the first available template. The subtitle is branding-derived
    // ("{brandingConfig.name} Template") since the multi-tenant refactor
    // (LC-1558), so match the branding-agnostic suffix instead of a literal.
    await page
        .getByText(/Template$/)
        .first()
        .click({ timeout: 30_000 });

    // Fill in credential title and description
    await page.getByRole('textbox', { name: /0\// }).fill(TEST_CREDENTIAL_TITLE);
    await page
        .locator('textarea[placeholder="What is this boost for?"]')
        .fill('Test credential description');

    // Click Next to proceed to publish
    await page.getByRole('button', { name: 'Next' }).click({ timeout: 30_000 });

    // Click Publish & Issue (skipped when the skipPublishStep flag is enabled)
    await clickPublishAndIssueIfPresent(page);

    // Click Plus to open recipient selection
    await page.getByRole('button', { name: 'Plus' }).click({ timeout: 30_000 });

    // Click Boost Myself
    await page
        .getByRole('button', { name: /boost myself/i })
        .first()
        .click({ timeout });

    // Click Save to issue the boost
    await page.getByRole('button', { name: 'Save' }).click({ timeout: 30_000 });

    // Wait for navigation away from /boost
    await page.waitForURL(/(?!.*\/boost)/, { timeout });
};

/**
 * Logs in via seed phrase and navigates to the specified path.
 *
 * NOTE: Storage state-based authentication doesn't work because the app requires
 * a privateKey that is stored separately from localStorage for security. When
 * localStorage is restored without the privateKey, the app logs out the user.
 *
 * This helper uses the /hidden/seed route which creates a proper user with a
 * private key derived from the seed.
 *
 * @param page - Playwright page object
 * @param pathOrOptions - Path to navigate to after login (default '/'), or options object
 * @param timeout - Maximum time to wait for authenticated state (default 30s)
 */
export const waitForAuthenticatedState = async (
    page: Page,
    pathOrOptions: string | { path?: string; seed?: string; profileId?: string } = '/',
    timeout = 30000
) => {
    // Parse options
    const options =
        typeof pathOrOptions === 'string'
            ? {
                  path: pathOrOptions,
                  seed: TEST_USER_SEED,
                  profileId: undefined as string | undefined,
              }
            : {
                  path: pathOrOptions.path ?? '/',
                  seed: pathOrOptions.seed ?? TEST_USER_SEED,
                  profileId: pathOrOptions.profileId,
              };

    // Wait for the LCN gate's underlying profile lookup so `Add to LearnCard`
    // opens the menu rather than the OnboardingContainer. Tolerate timeout
    // for cache-hit paths where no fresh request fires.
    const profileFetchPromise = page
        .waitForResponse(
            response => /profile\.getProfile/.test(response.url()) && response.status() < 500,
            { timeout }
        )
        .catch(() => undefined);

    // Login via seed - this creates a proper user with privateKey
    // If profileId is provided, the seed route will also create a network profile
    const seedUrl = options.profileId
        ? `/hidden/seed?profileId=${encodeURIComponent(options.profileId)}`
        : '/hidden/seed';
    await page.goto(seedUrl);

    // Fill in the seed and submit
    await page.getByRole('textbox').fill(options.seed);
    await page.getByRole('button', { name: /sign in with seed/i }).click();

    // Wait for redirect to wallet (indicates successful login + profile creation)
    await page.waitForURL(/\/wallet/, { timeout });

    await profileFetchPromise;

    // If a different path was requested, navigate there
    if (options.path !== '/' && options.path !== '/wallet') {
        await page.goto(options.path);
    }
};
