import { Locator, Page } from '@playwright/test';
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
        await page.getByRole('button', { name: "Let's Go!" }).waitFor({ state: 'hidden', timeout: 60_000 });
    }
};

/**
 * Issues a credential to the current user via the UI.
 *
 * Flow: Add to LearnCard → Boost Someone → pick template → fill form →
 *       Next → Publish & Issue → Plus → Boost Myself → Save
 */
export const issueCredentialToSelf = async (page: Page, timeout = 60_000) => {
    // Open the "Add to LearnCard" menu
    await page.getByRole('button', { name: 'Add to LearnCard' }).click({ timeout: 30_000 });

    // Select "Boost Someone"
    await page.getByRole('button', { name: 'Boost Someone' }).click({ timeout: 30_000 });

    // Select the first available template
    await page.getByText('LearnCard Template').first().click({ timeout: 30_000 });

    // Fill in credential title and description
    await page.getByRole('textbox', { name: /0\// }).fill(TEST_CREDENTIAL_TITLE);
    await page.locator('textarea[placeholder="What is this boost for?"]').fill('Test credential description');

    // Click Next to proceed to publish
    await page.getByRole('button', { name: 'Next' }).click({ timeout: 30_000 });

    // Click Publish & Issue
    await page.getByRole('button', { name: /publish & issue/i }).click({ timeout: 30_000 });

    // Click Plus to open recipient selection
    await page.getByRole('button', { name: 'Plus' }).click({ timeout: 30_000 });

    // Click Boost Myself
    await page.getByRole('button', { name: /boost myself/i }).first().click({ timeout });

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
    const options = typeof pathOrOptions === 'string'
        ? { path: pathOrOptions, seed: TEST_USER_SEED, profileId: undefined as string | undefined }
        : { path: pathOrOptions.path ?? '/', seed: pathOrOptions.seed ?? TEST_USER_SEED, profileId: pathOrOptions.profileId };

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

    // If a different path was requested, navigate there
    if (options.path !== '/' && options.path !== '/wallet') {
        await page.goto(options.path);
    }
};
