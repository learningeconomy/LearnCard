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

/**
 * Issues a Social Badge (Charmer) boost to the current user.
 * Navigates through the boost creation flow, publishes, and issues to self.
 * Waits for redirect to /wallet after issuance completes.
 *
 * Note: The VC issuance step has a known intermittent crash. This helper
 * will throw if the page fails to redirect to /wallet within the timeout.
 */
export const issueBoostToSelf = async (page: Page, timeout = 60_000) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Boost' }).click();
    await page.getByRole('button', { name: 'New Boost' }).click();
    await page.getByRole('button', { name: 'Social Badge', exact: true }).click();
    await page.getByRole('button', { name: 'Charmer' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Publish & Issue' }).click();
    await page.locator('ion-col').filter({ hasText: 'Issue To' }).getByRole('button').click();
    await page.getByRole('button', { name: 'Boost Myself' }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForURL('/wallet', { timeout });
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
    pathOrOptions: string | { path?: string; seed?: string } = '/',
    timeout = 30000
) => {
    // Parse options
    const options = typeof pathOrOptions === 'string'
        ? { path: pathOrOptions, seed: TEST_USER_SEED }
        : { path: pathOrOptions.path ?? '/', seed: pathOrOptions.seed ?? TEST_USER_SEED };

    // Login via seed - this creates a proper user with privateKey
    await page.goto('/hidden/seed');

    // Fill in the seed and submit
    await page.getByRole('textbox').fill(options.seed);
    await page.getByRole('button', { name: /sign in with seed/i }).click();

    // Wait for redirect to wallet (indicates successful login)
    await page.waitForURL(/\/wallet/, { timeout });

    // If a different path was requested, navigate there
    if (options.path !== '/' && options.path !== '/wallet') {
        await page.goto(options.path);
    }
};
