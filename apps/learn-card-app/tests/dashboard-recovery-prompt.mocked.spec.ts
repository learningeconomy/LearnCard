import { expect, test } from './fixtures/mocked-test';
import type { Page } from '@playwright/test';
import { TEST_USER_PROFILE_ID } from './constants';
import { installNetwork } from './mocks/network';
import { waitForAuthenticatedState } from './test.helpers';

const HARNESS_PATH = '/recovery-prompt-harness.html';
const prompt = (page: Page) => page.getByTestId('dashboard-recovery-prompt');

test.describe('Dashboard recovery prompt @mocked', () => {
    test('gates the calm prompt and places it between Quick Actions and the Dashboard grid', async ({
        page,
    }) => {
        for (const query of [
            'supported=0&count=0&credentials=1',
            'supported=1&count=null&credentials=1',
            'supported=1&count=1&credentials=1',
            'supported=1&count=0&credentials=0',
        ]) {
            await page.goto(`${HARNESS_PATH}?clear=1&${query}`);
            await expect(prompt(page)).toHaveCount(0);
        }

        await page.goto(`${HARNESS_PATH}?clear=1&supported=1&count=0&credentials=1`);
        await expect(prompt(page)).toBeVisible();

        const order = await page
            .locator(
                '[data-testid="quick-actions"], [data-testid="dashboard-recovery-prompt"], [data-testid="dashboard-grid"]'
            )
            .evaluateAll(nodes => nodes.map(node => node.getAttribute('data-testid')));
        expect(order).toEqual(['quick-actions', 'dashboard-recovery-prompt', 'dashboard-grid']);
    });

    test('urgent mode overrides credentials and snooze, has no close control, and mirrors in Arabic', async ({
        page,
    }) => {
        await page.goto(`${HARNESS_PATH}?clear=1&legacy=1&public=1&lang=ar&count=0&credentials=0`);

        await expect(prompt(page)).toBeVisible();
        await expect(page.getByRole('button', { name: 'ذكّرني بعد 7 أيام' })).toHaveCount(0);
        await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
        await expect(page.getByText('تنتهي هذه الجلسة عند إغلاق علامة التبويب')).toBeVisible();

        const action = page.getByRole('button', { name: 'إعداد طريقة لتسجيل الدخول مجددًا' });
        await expect(action).toHaveCSS('text-align', 'start');
        const [iconBox, textBox] = await Promise.all([
            action.locator(':scope > span').nth(0).boundingBox(),
            action.locator(':scope > span').nth(1).boundingBox(),
        ]);
        expect(iconBox).not.toBeNull();
        expect(textBox).not.toBeNull();
        expect(iconBox!.x).toBeGreaterThan(textBox!.x);
    });

    test('persists an exact seven-day snooze, suppresses it before expiry, and returns after expiry', async ({
        page,
    }) => {
        await page.goto(`${HARNESS_PATH}?clear=1&count=0&credentials=1`);
        const before = Date.now();

        await page.getByRole('button', { name: 'Remind me in 7 days' }).click();
        const snoozedUntil = await page.evaluate(() =>
            window.recoveryPromptHarness.getSnoozedUntil()
        );
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        expect(snoozedUntil).toBeGreaterThanOrEqual(before + sevenDays);
        expect(snoozedUntil).toBeLessThanOrEqual(Date.now() + sevenDays);

        await page.goto(`${HARNESS_PATH}?count=0&credentials=1`);
        await expect(prompt(page)).toHaveCount(0);

        await page.evaluate(() => window.recoveryPromptHarness.setSnoozedUntil(Date.now() - 1));
        await expect(prompt(page)).toBeVisible();
    });

    test('migrates and removes the legacy dismissal before rendering', async ({ page }) => {
        await page.goto(`${HARNESS_PATH}?clear=1&legacy=1&count=0&credentials=1`);

        await expect(prompt(page)).toHaveCount(0);
        const state = await page.evaluate(() => ({
            legacyExists: window.recoveryPromptHarness.legacyKeyExists(),
            snoozedUntil: window.recoveryPromptHarness.getSnoozedUntil(),
        }));
        expect(state.legacyExists).toBe(false);
        expect(state.snoozedUntil).toBeGreaterThan(Date.now());
    });

    test('chooses the passkey or phrase tab and keeps success visible before its four-second exit', async ({
        page,
    }) => {
        await page.goto(`${HARNESS_PATH}?clear=1&count=0&credentials=1`);
        await expect(page.getByText('Use Face ID or Touch ID')).toBeVisible();
        await page.getByRole('button', { name: 'Set up a way to sign back in' }).press('Enter');
        await expect(page.getByRole('button', { name: 'Set Up Passkey' })).toBeVisible();
        await page.getByRole('button', { name: 'Set Up Passkey' }).click();

        await expect(page.getByRole('status')).toContainText("You're covered");
        await page.waitForTimeout(3_800);
        await expect(prompt(page)).toBeVisible();
        await expect(prompt(page)).toHaveCount(0, { timeout: 1_000 });

        await page.goto(`${HARNESS_PATH}?count=0&credentials=1`);
        await expect(prompt(page)).toHaveCount(0);

        await page.goto(`${HARNESS_PATH}?clear=1&passkey=0&count=0&credentials=1`);
        await expect(page.getByText('Get a recovery phrase')).toBeVisible();
        await page.getByRole('button', { name: 'Set up a way to sign back in' }).click();
        await expect(page.getByRole('button', { name: 'Generate Recovery Phrase' })).toBeVisible();
    });

    test('uses separate keyboard-operable action and snooze buttons', async ({ page }) => {
        await page.goto(`${HARNESS_PATH}?clear=1&count=0&credentials=1`);

        const action = page.getByRole('button', { name: 'Set up a way to sign back in' });
        const snooze = page.getByRole('button', { name: 'Remind me in 7 days' });
        expect(await action.locator('button').count()).toBe(0);
        expect(await snooze.locator('button').count()).toBe(0);

        await snooze.focus();
        await snooze.press('Space');
        await expect(prompt(page)).toHaveCount(0, { timeout: 1_000 });
    });

    test('does not render the recovery prompt on LaunchPad', async ({ page }) => {
        await installNetwork(page);
        await waitForAuthenticatedState(page, {
            path: '/launchpad/browse?tab=All',
            profileId: TEST_USER_PROFILE_ID,
        });

        await expect(page).toHaveURL(/\/launchpad\/browse\?tab=All/);
        await expect(prompt(page)).toHaveCount(0);
    });
});
