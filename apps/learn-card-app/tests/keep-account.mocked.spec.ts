import type { Page } from '@playwright/test';
import { expect, test } from './fixtures/mocked-test';

const HARNESS = '/keep-account-harness.html';
const SHOTS = 'test-results/keep-account';
const step = (page: Page) => page.getByTestId('keep-account-step');
const submit = (page: Page) => page.getByTestId('classlink-email-submit');

const sendCode = async (page: Page, email = 'student@example.org'): Promise<void> => {
    await page.getByLabel('Personal email').fill(email);
    await submit(page).click();
};

/** Fills the code the way OS one-time-code autofill does; it checks itself at 6 digits. */
const enterCode = async (page: Page, code = '123456'): Promise<void> => {
    await page.getByLabel('Code digit 1').fill(code);
};

const verifyEmail = async (page: Page, email = 'student@example.org'): Promise<void> => {
    await sendCode(page, email);
    await enterCode(page);
};

const typePin = async (page: Page, pin: string): Promise<void> => {
    await page.getByLabel('PIN digit 1').click();
    await page.keyboard.type(pin);
};

test.describe('Keep your account @mocked', () => {
    test('email, code, then done for a PIN account: no passkey or phrase asked', async ({
        page,
    }) => {
        await page.goto(`${HARNESS}?step=email`);
        await expect(
            page.getByRole('heading', { name: 'Keep your account after school' })
        ).toBeVisible();
        await expect(page.getByText(/your PIN gets you back in/)).toBeVisible();
        await expect(
            page.getByText(/We only use this email to help you get back in/)
        ).toBeVisible();
        await expect(submit(page)).toBeDisabled();
        await expect(page.getByText(/sign in with/i)).toHaveCount(0);
        await page.screenshot({ path: `${SHOTS}/email.png`, fullPage: true });

        await verifyEmail(page);
        await expect(step(page)).toHaveAttribute('data-step', 'done');
        await expect(page.getByText(/I lost access to my school email or login/)).toBeVisible();
        await expect(
            page.getByText(/s\*\*\*@example\.org\u2069?, then enter your PIN/)
        ).toBeVisible();
        expect(await page.evaluate(() => window.keepAccountHarness.setupOptions)).toHaveLength(0);
        // Nothing to undo on the success screen: removing lives in School Connect.
        await expect(page.getByTestId('keep-account-remove')).toHaveCount(0);
        await page.screenshot({ path: `${SHOTS}/done.png`, fullPage: true });

        await page.getByTestId('keep-account-continue').click();
        await expect(page.locator('body')).toHaveAttribute('data-done', '1');
    });

    test('creates the PIN in place when escrow has none, then done', async ({ page }) => {
        await page.goto(`${HARNESS}?step=email&pin=none`);
        await verifyEmail(page);
        await expect(step(page)).toHaveAttribute('data-step', 'pin');
        await expect(page.getByRole('heading', { name: 'Create a PIN' })).toBeVisible();
        // The boxes take focus as the screen swaps in.
        await expect(page.getByLabel('PIN digit 1')).toBeFocused();
        await page.screenshot({ path: `${SHOTS}/pin.png`, fullPage: true });

        await typePin(page, '135790');
        // One way out at a time while confirming.
        await expect(page.getByTestId('keep-account-not-now')).toHaveCount(0);
        await typePin(page, '135790');
        await expect(step(page)).toHaveAttribute('data-step', 'done');
        expect(await page.evaluate(() => window.keepAccountHarness.pinsSet)).toBe(1);
        expect(await page.evaluate(() => window.keepAccountHarness.setupOptions)).toHaveLength(0);
    });

    test('says a locked PIN is locked, then opens the new-PIN overlay', async ({ page }) => {
        await page.goto(`${HARNESS}?step=pin&pin=locked`);
        await expect(page.getByRole('heading', { name: 'Your PIN is locked' })).toBeVisible();
        await expect(page.getByTestId('keep-account-pin-reset')).toHaveText('Set new PIN');
        await page.screenshot({ path: `${SHOTS}/pin-locked.png`, fullPage: true });
        await page.getByTestId('keep-account-pin-reset').click();
        expect(
            await page.evaluate(() => window.keepAccountHarness.pinSetupOptions[0]?.reason)
        ).toBe('pin-locked');
        await expect(step(page)).toHaveAttribute('data-step', 'done');
    });

    test('without escrow: email, code, passkey or phrase started directly, then done', async ({
        page,
    }) => {
        await page.goto(`${HARNESS}?step=email&escrow=0`);
        await verifyEmail(page);
        await expect(step(page)).toHaveAttribute('data-step', 'method');
        await page.screenshot({ path: `${SHOTS}/method.png`, fullPage: true });

        await page.getByTestId('keep-account-method').click();
        const options = await page.evaluate(() =>
            window.keepAccountHarness.setupOptions.map(({ initialMethod, autoStart }) => ({
                initialMethod,
                autoStart,
            }))
        );
        expect(options).toEqual([
            { initialMethod: expect.stringMatching(/^(passkey|phrase)$/), autoStart: true },
        ]);
        await expect(step(page)).toHaveAttribute('data-step', 'done');
        await expect(page.getByText(/to get you back in/)).toBeVisible();
    });

    test('refuses a school address by error code, then accepts a personal one', async ({
        page,
    }) => {
        await page.goto(`${HARNESS}?step=email`);
        await page.getByLabel('Personal email').fill('me@school.example');
        await submit(page).click();
        // Under the field it is about.
        await expect(page.getByLabel('Personal email')).toHaveAttribute('aria-invalid', 'true');
        await expect(page.getByRole('alert')).toHaveText(
            'Use a personal email you can get mail at, not your school email.'
        );
        await page.screenshot({ path: `${SHOTS}/email-error.png`, fullPage: true });
        await verifyEmail(page);
        await expect(step(page)).toHaveAttribute('data-step', 'done');
    });

    test('asks for another address when it already recovers a different account', async ({
        page,
    }) => {
        await page.goto(`${HARNESS}?step=email&shared=1`);
        await verifyEmail(page);
        // Like any other email error: under the field, with the address kept.
        await expect(step(page)).toHaveAttribute('data-step', 'email');
        await expect(page.getByRole('alert')).toHaveText(/Another account already uses this email/);
        await expect(page.getByLabel('Personal email')).toHaveValue('student@example.org');
        await expect(page.getByLabel('Personal email')).toHaveAttribute('aria-invalid', 'true');
        await page.screenshot({ path: `${SHOTS}/shared.png`, fullPage: true });
    });

    test('staff and other adults get a headline without "after school"', async ({ page }) => {
        await page.goto(`${HARNESS}?step=email&student=0`);
        await expect(page.getByRole('heading', { name: 'Keep your account' })).toBeVisible();
        await expect(page.getByText(/after school/)).toHaveCount(0);
    });

    test('explains a district refusal instead of showing the form', async ({ page }) => {
        await page.goto(`${HARNESS}?step=email&reason=students_excluded&variant=inline`);
        await expect(
            page.getByText("Your school doesn't let students add a personal email.")
        ).toBeVisible();
        await expect(page.getByLabel('Personal email')).toHaveCount(0);
    });

    test('removes the personal email after a confirm that names it', async ({ page }) => {
        await page.goto(`${HARNESS}?step=done&variant=inline`);
        await expect(
            page.getByText(/s\*\*\*@example\.org\u2069? · Can get you back in/)
        ).toBeVisible();
        await page.getByTestId('keep-account-remove').click();
        const alert = page.locator('ion-alert');
        await expect(alert).toContainText(
            /Remove \u2068?s\*\*\*@example\.org\u2069?\? You won't be able to use it/
        );
        await expect(page.getByTestId('keep-account-remove-confirm')).toBeVisible();
        await page.waitForTimeout(400); // Let the alert finish animating in for the shot.
        await page.screenshot({ path: `${SHOTS}/remove-confirm.png`, fullPage: true });
        await page.getByTestId('keep-account-remove-cancel').click();
        await expect(alert).toHaveCount(0);
        expect(await page.evaluate(() => window.keepAccountHarness.removed)).toBe(0);

        await page.getByTestId('keep-account-remove').click();
        await page.getByTestId('keep-account-remove-confirm').click();
        await expect(step(page)).toHaveAttribute('data-step', 'email');
        expect(await page.evaluate(() => window.keepAccountHarness.removed)).toBe(1);
        await expect(page.getByTestId('keep-account-add')).toBeVisible();
    });

    test('code step: names the address, checks itself, resends after a countdown', async ({
        page,
    }) => {
        await page.clock.install();
        await page.goto(`${HARNESS}?step=email`);
        await sendCode(page);
        await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
        await expect(page.getByText(/We sent a code to \u2068?student@example\.org/)).toBeVisible();
        await expect(submit(page)).toHaveCount(0);
        const resend = page.getByTestId('classlink-email-resend');
        await expect(resend).toBeDisabled();
        await expect(resend).toHaveText('Resend in 60s');
        await page.screenshot({ path: `${SHOTS}/code.png`, fullPage: true });

        // A wrong code: the error sits under the boxes, which clear for the next try.
        await page.getByLabel('Code digit 1').click();
        await page.keyboard.type('999999');
        await expect(page.getByRole('alert')).toHaveText(
            "That code didn't work. Check your latest email or send a new one."
        );
        await expect(page.getByLabel('Code digit 1')).toHaveValue('');
        await page.screenshot({ path: `${SHOTS}/code-wrong.png`, fullPage: true });

        await page.clock.runFor(60_000);
        await expect(resend).toBeEnabled();
        await expect(resend).toHaveText('Resend code');
        await resend.click();
        await expect(resend).toBeDisabled();
        expect(await page.evaluate(() => window.keepAccountHarness.sends)).toEqual([
            'student@example.org',
            'student@example.org',
        ]);

        await page.getByLabel('Code digit 1').click();
        await page.keyboard.type('123456');
        await expect(step(page)).toHaveAttribute('data-step', 'done');
    });

    test('code step: Use a different email goes back with the address kept', async ({ page }) => {
        await page.goto(`${HARNESS}?step=email`);
        await sendCode(page, 'studnet@example.org');
        await page.getByTestId('classlink-email-change').click();
        await expect(page.getByLabel('Personal email')).toBeFocused();
        await expect(page.getByLabel('Personal email')).toHaveValue('studnet@example.org');
        await verifyEmail(page);
        await expect(step(page)).toHaveAttribute('data-step', 'done');
    });

    test('onboarding: frosted card, sticky button, a brief Saved check, then hands back', async ({
        page,
    }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        // Holds the "Saved" check on screen until the test moves the clock.
        await page.clock.install();
        await page.goto(`${HARNESS}?step=email&variant=onboarding`);
        await expect(
            page.getByRole('heading', { level: 1, name: 'Keep your transcript after you graduate' })
        ).toBeVisible();
        // The button sits in the bottom bar, below the card.
        const send = submit(page);
        const card = page.getByRole('heading', { level: 1 }).locator('xpath=ancestor::div[2]');
        const [sendBox, cardBox] = [await send.boundingBox(), await card.boundingBox()];
        expect(sendBox && cardBox && sendBox.y > cardBox.y + cardBox.height).toBe(true);
        expect(sendBox?.width).toBeGreaterThan(300);
        await page.screenshot({ path: `${SHOTS}/onboarding-email.png`, animations: 'disabled' });

        // The card's top edge and "Not now" stay put from screen to screen.
        const notNow = page.getByTestId('keep-account-not-now');
        const cardTop = async (): Promise<number | undefined> => (await card.boundingBox())?.y;
        const [emailTop, emailNotNow] = [await cardTop(), (await notNow.boundingBox())?.y];

        await sendCode(page);
        await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
        expect(await cardTop()).toBe(emailTop);
        expect((await notNow.boundingBox())?.y).toBe(emailNotNow);
        await page.screenshot({ path: `${SHOTS}/onboarding-code.png`, animations: 'disabled' });
        await enterCode(page);
        await expect(step(page)).toHaveAttribute('data-step', 'saved');
        await expect(page.getByRole('heading', { name: 'Saved' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Saved' })).toBeFocused();
        expect(await cardTop()).toBe(emailTop);
        await page.screenshot({ path: `${SHOTS}/onboarding-saved.png`, animations: 'disabled' });
        await expect(page.locator('body')).not.toHaveAttribute('data-done', '1');
        await page.clock.runFor(1_000);
        await expect(page.locator('body')).toHaveAttribute('data-done', '1');
    });

    test('a missing date of birth offers to add it, and the sheet says OK', async ({ page }) => {
        await page.goto(`${HARNESS}?step=email&reason=age_unknown`);
        await expect(page.getByText('Add your date of birth to your profile first.')).toBeVisible();
        await page.screenshot({ path: `${SHOTS}/blocked-sheet.png`, fullPage: true });
        await page.getByTestId('keep-account-add-birth-date').click();
        expect(await page.evaluate(() => window.keepAccountHarness.birthDateOpened)).toBe(1);
        await expect(page.getByTestId('keep-account-blocked-ok')).toHaveText('OK');
        await page.getByTestId('keep-account-blocked-ok').click();
        await expect(page.locator('body')).toHaveAttribute('data-dismissed', '1');
    });

    test('mirrors in Arabic, with the email and code left to right', async ({ page }) => {
        await page.goto(`${HARNESS}?step=method&lang=ar`);
        await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
        await expect(page.getByRole('heading', { name: 'خطوة أخيرة' })).toBeVisible();
        await page.screenshot({ path: `${SHOTS}/method-ar.png`, fullPage: true });

        await page.goto(`${HARNESS}?step=email&lang=ar`);
        await expect(page.getByTestId('classlink-email-input')).toHaveAttribute('dir', 'ltr');
        await page.getByTestId('classlink-email-input').fill('student@example.org');
        await submit(page).click();
        await expect(page.getByTestId('classlink-email-code')).toHaveAttribute('dir', 'ltr');
        await page.screenshot({ path: `${SHOTS}/code-ar.png`, fullPage: true });
    });
});
