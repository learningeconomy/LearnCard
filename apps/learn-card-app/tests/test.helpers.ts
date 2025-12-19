import { Locator, Page } from '@playwright/test';

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
