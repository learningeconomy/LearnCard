import type { Page } from '@playwright/test';
import { expect, test } from './fixtures/mocked-test';

const HARNESS = '/school-connect-harness.html';
const SHOTS = 'test-results/school-connect';
const connectCalls = (page: Page) => page.evaluate(() => window.schoolConnectHarness.connectCalls);
const connectButton = (page: Page) => page.getByRole('button', { name: 'Connect with ClassLink' });

test.describe('School Connect @mocked', () => {
    test('intro explains the value, shows ClassLink and a way to ask for a school', async ({
        page,
    }) => {
        await page.goto(`${HARNESS}?state=intro`);
        await expect(
            page.getByRole('heading', { name: 'Your school records, in your hands' })
        ).toBeVisible();
        await expect(page.getByAltText('ClassLink')).toBeVisible();
        expect(
            await page
                .getByAltText('ClassLink')
                .evaluate(img => (img as HTMLImageElement).naturalWidth)
        ).toBeGreaterThan(0);
        const ask = page.getByRole('link', { name: 'Ask us to add your school' });
        await expect(ask).toHaveAttribute('href', /^mailto:support@example\.org\?subject=/);
        await page.screenshot({ path: `${SHOTS}/intro.png`, fullPage: true });

        await page.goto(`${HARNESS}?state=intro&support=0`);
        await expect(page.getByText('More schools are coming soon.')).toBeVisible();
        await expect(page.getByRole('link', { name: 'Ask us to add your school' })).toHaveCount(0);
    });

    test('warns before connecting an unlocked account, and Not Now goes back', async ({ page }) => {
        await page.goto(`${HARNESS}?state=intro`);
        await connectButton(page).click();
        await expect(page.getByRole('heading', { name: 'Before you connect' })).toBeVisible();
        expect(await connectCalls(page)).toBe(0);
        await page.screenshot({ path: `${SHOTS}/warning.png`, fullPage: true });

        await page.getByRole('button', { name: 'Not Now' }).click();
        await expect(
            page.getByRole('heading', { name: 'Your school records, in your hands' })
        ).toBeVisible();

        await connectButton(page).click();
        await connectButton(page).click();
        expect(await connectCalls(page)).toBe(1);
        await expect(page.getByText('Connecting…')).toBeVisible();
    });

    test('connects a locked account without the warning', async ({ page }) => {
        await page.goto(`${HARNESS}?state=intro&locked=1`);
        await connectButton(page).click();
        await expect(page.getByRole('heading', { name: 'Before you connect' })).toHaveCount(0);
        expect(await connectCalls(page)).toBe(1);
    });

    test('connected state shows the school, refresh and the transcript request', async ({
        page,
    }) => {
        await page.goto(`${HARNESS}?state=connected&student=1`);
        await expect(page.getByText('Example Unified School District')).toBeVisible();
        await expect(page.getByText('Connected', { exact: true })).toBeVisible();
        await expect(page.getByText('Last connected Nov 2, 2026')).toBeVisible();
        await expect(page.getByTestId('transcript-slot')).toBeVisible();
        await expect(page.getByText(/as your school requires/)).toBeVisible();
        await page.screenshot({ path: `${SHOTS}/connected.png`, fullPage: true });

        await page.getByRole('button', { name: 'Refresh Connection' }).click();
        expect(await connectCalls(page)).toBe(1);
    });

    test('keep-account section shows only while its slot renders something', async ({ page }) => {
        await page.goto(`${HARNESS}?state=connected&keepAccount=shown`);
        await expect(page.getByRole('heading', { name: 'Your account' })).toBeVisible();
        await expect(page.getByTestId('keep-account-slot')).toBeVisible();

        await page.goto(`${HARNESS}?state=connected&keepAccount=empty`);
        await expect(page.getByText('Example Unified School District')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Your account' })).toBeHidden();
    });

    test('keep-account rows: Add opens the form in place, done is one compact row', async ({
        page,
    }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(`${HARNESS}?state=connected&keepAccount=real&step=email`);
        const section = page.getByTestId('keep-account-step');
        await expect(
            section.getByRole('heading', { level: 3, name: 'Sign-in email' })
        ).toBeVisible();
        await expect(page.getByLabel('Personal email')).toHaveCount(0);
        await page.screenshot({ path: `${SHOTS}/keep-account-add.png`, fullPage: true });

        await section.getByRole('button', { name: 'Add', exact: true }).click();
        await expect(page.getByLabel('Personal email')).toBeFocused();
        await page.screenshot({ path: `${SHOTS}/keep-account-form.png`, fullPage: true });
        await page.getByRole('button', { name: 'Cancel' }).click();
        await expect(page.getByLabel('Personal email')).toHaveCount(0);

        await page.goto(`${HARNESS}?state=connected&keepAccount=real&step=done`);
        await expect(
            section.getByText(/s\*\*\*@example\.org\u2069? · School email also works/)
        ).toBeVisible();
        await expect(section.getByRole('button', { name: 'Remove' })).toBeVisible();
        // A compact row, not a hero card.
        expect((await section.boundingBox())?.height).toBeLessThan(120);
        await page.screenshot({ path: `${SHOTS}/keep-account-done.png`, fullPage: true });

        await section.getByRole('button', { name: 'Remove' }).click();
        await expect(page.locator('ion-alert')).toContainText(
            /Stop signing in with \u2068?s\*\*\*@example\.org/
        );
        await expect(page.getByTestId('keep-account-remove-confirm')).toBeVisible();
        await page.waitForTimeout(400); // Let the alert finish animating in for the shot.
        await page.screenshot({ path: `${SHOTS}/keep-account-remove.png`, fullPage: true });
    });

    test('keep-account row: Saved in place, then the form folds into the address row', async ({
        page,
    }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.clock.install();
        await page.goto(`${HARNESS}?state=connected&keepAccount=real&step=email`);
        const section = page.getByTestId('keep-account-step');
        await section.getByRole('button', { name: 'Add', exact: true }).click();
        await page.getByLabel('Personal email').fill('student@example.org');
        await page.getByTestId('classlink-email-submit').click();
        await page.getByLabel('Code digit 1').fill('123456');
        await expect(section).toHaveAttribute('data-step', 'saved');
        await expect(page.getByTestId('keep-account-saved')).toBeFocused();
        await page.screenshot({ path: `${SHOTS}/keep-account-saved.png`, fullPage: true });
        await page.clock.runFor(1_000);
        // A PIN account: the backup still names the school email, so the PIN confirm row.
        await expect(section).toHaveAttribute('data-step', 'confirmPin');
        await expect(
            section.getByRole('heading', { level: 3, name: 'Sign-in email' })
        ).toBeFocused();
    });

    test('keep-account row: the PIN confirm opens in place and seals the sign-in email', async ({
        page,
    }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(`${HARNESS}?state=connected&keepAccount=real&step=confirmPin`);
        const section = page.getByTestId('keep-account-step');
        await expect(
            section.getByRole('heading', { level: 3, name: 'Enter your PIN' })
        ).toBeVisible();
        await section.getByTestId('keep-account-confirm').click();
        await page.getByLabel('PIN digit 1').click();
        await page.keyboard.type('593827');
        await expect(section).toHaveAttribute('data-step', 'done');
        expect(await page.evaluate(() => window.keepAccountHarness.sealedContacts)).toEqual([
            'student@example.org',
        ]);
        await page.screenshot({ path: `${SHOTS}/keep-account-confirm-done.png`, fullPage: true });
    });

    test('keep-account row: a missing date of birth offers to add it', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(
            `${HARNESS}?state=connected&keepAccount=real&step=email&reason=age_unknown`
        );
        // Short in the row: the subtitle says why, the pill says Add.
        await expect(page.getByText('Needs your date of birth')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Add date of birth' })).toHaveText('Add');
        await page.getByRole('button', { name: 'Add date of birth' }).click();
        expect(await page.evaluate(() => window.keepAccountHarness.birthDateOpened)).toBe(1);
        await page.screenshot({ path: `${SHOTS}/keep-account-blocked.png`, fullPage: true });
    });

    test('unavailable and mobile layouts', async ({ page }) => {
        await page.goto(`${HARNESS}?state=unavailable`);
        await expect(
            page.getByText("School Connect isn't available for your account yet.")
        ).toBeVisible();

        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto(`${HARNESS}?state=intro`);
        const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        );
        expect(overflow).toBeLessThanOrEqual(0);
        await page.screenshot({ path: `${SHOTS}/intro-mobile.png`, fullPage: true });
    });
});
