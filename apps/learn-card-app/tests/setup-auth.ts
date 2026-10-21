import { expect, type Page } from '@playwright/test';

/** Finish fresh-account onboarding before saving a reusable E2E session. */
export const finishSetupSignIn = async (page: Page, profileId: string): Promise<void> => {
    page.setDefaultTimeout(30_000);
    const welcome = page.getByRole('heading', { name: "Welcome — let's set you up" });
    await expect
        .poll(
            async () => (await welcome.isVisible()) || new URL(page.url()).pathname === '/wallet',
            { timeout: 60_000, message: 'Expected onboarding or the signed-in account page' }
        )
        .toBe(true);

    if (await welcome.isVisible()) {
        // Moving the year wheel initializes the DOB and selects an adult age.
        const year = page.getByRole('listbox', { name: 'Year', exact: true });
        await year.focus();
        await year.press('ArrowUp');
        await page.getByRole('button', { name: /select country|united states/i }).click();
        await page.getByPlaceholder('Search countries').fill('United States');
        await page
            .getByRole('button', { name: /United States/ })
            .last()
            .click();
        await page.getByRole('button', { name: 'Continue', exact: true }).click();
        await expect(page.getByRole('heading', { name: 'Make it yours' })).toBeVisible({
            timeout: 60_000,
        });
        await page.getByRole('textbox', { name: /full name/i }).fill('E2E Demo User');
        await page.getByRole('textbox', { name: /public handle/i }).fill(profileId);
        await page.getByRole('button', { name: 'Create my LearnCard' }).click();
        await expect(page.getByRole('heading', { name: "You're in!" })).toBeVisible({
            timeout: 90_000,
        });
        await page.getByRole('button', { name: 'Explore LearnCard' }).click();
        await page.waitForURL(/\/dashboard(?:[?#]|$)/, { timeout: 30_000 });
        await page.goto(new URL('/wallet', page.url()).href);
    }
    await page.waitForURL(/\/wallet(?:[?#]|$)/, { timeout: 30_000 });
};
