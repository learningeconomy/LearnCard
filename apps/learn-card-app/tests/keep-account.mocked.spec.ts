import type { Page } from '@playwright/test';
import { expect, test } from './fixtures/mocked-test';

const HARNESS = '/keep-account-harness.html';
const SHOTS = 'test-results/keep-account';
const step = (page: Page) => page.getByTestId('keep-account-step');
const submit = (page: Page) => page.getByTestId('classlink-email-submit');

const verifyEmail = async (page: Page, email = 'student@example.org'): Promise<void> => {
    await page.getByLabel('Personal email').fill(email);
    await submit(page).click();
    await page.getByLabel('6-digit code').fill('123456');
    await submit(page).click();
};

test.describe('Keep your account @mocked', () => {
    test('email, code, passkey, then done, all from server state', async ({ page }) => {
        await page.goto(`${HARNESS}?step=email`);
        await expect(
            page.getByRole('heading', { name: 'Keep your account after school' })
        ).toBeVisible();
        await expect(page.getByText(/We save this email with your account/)).toBeVisible();
        await expect(page.getByText(/sign in with/i)).toHaveCount(0);
        await page.screenshot({ path: `${SHOTS}/email.png`, fullPage: true });

        await verifyEmail(page);
        await expect(step(page)).toHaveAttribute('data-step', 'method');
        await page.screenshot({ path: `${SHOTS}/method.png`, fullPage: true });

        await page.getByTestId('keep-account-method').click();
        expect(
            await page.evaluate(() => window.keepAccountHarness.setupOptions[0]?.initialMethod)
        ).toMatch(/^(passkey|phrase)$/);
        await expect(step(page)).toHaveAttribute('data-step', 'done');
        await expect(page.getByText(/I lost access to my school email or login/)).toBeVisible();
        await expect(page.getByText(/your recovery email/)).toBeVisible();
        await page.screenshot({ path: `${SHOTS}/done.png`, fullPage: true });

        await page.getByTestId('keep-account-continue').click();
        await expect(page.locator('body')).toHaveAttribute('data-done', '1');
    });

    test('refuses a school address by error code, then accepts a personal one', async ({
        page,
    }) => {
        await page.goto(`${HARNESS}?step=email`);
        await page.getByLabel('Personal email').fill('me@school.example');
        await submit(page).click();
        await expect(page.getByRole('alert')).toHaveText(
            'Use a personal email you can get mail at, not your school email.'
        );
        await verifyEmail(page);
        await expect(step(page)).toHaveAttribute('data-step', 'method');
    });

    test('asks for another address when it already recovers a different account', async ({
        page,
    }) => {
        await page.goto(`${HARNESS}?step=email&shared=1`);
        await verifyEmail(page);
        await expect(page.getByRole('status')).toHaveText(
            /Another account already uses this email/
        );
        await expect(step(page)).toHaveAttribute('data-step', 'email');
    });

    test('explains a district refusal instead of showing the form', async ({ page }) => {
        await page.goto(`${HARNESS}?step=email&reason=students_excluded&variant=inline`);
        await expect(
            page.getByText("Your school doesn't let students add a personal email.")
        ).toBeVisible();
        await expect(page.getByLabel('Personal email')).toHaveCount(0);
    });

    test('removes the personal email after confirming', async ({ page }) => {
        await page.goto(`${HARNESS}?step=done&variant=inline`);
        await page.getByTestId('keep-account-remove').click();
        await page.getByTestId('keep-account-remove-confirm').click();
        await expect(step(page)).toHaveAttribute('data-step', 'email');
        expect(await page.evaluate(() => window.keepAccountHarness.removed)).toBe(1);
    });

    test('mirrors in Arabic', async ({ page }) => {
        await page.goto(`${HARNESS}?step=method&lang=ar`);
        await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
        await expect(page.getByRole('heading', { name: 'خطوة أخيرة' })).toBeVisible();
        await page.screenshot({ path: `${SHOTS}/method-ar.png`, fullPage: true });
    });
});
