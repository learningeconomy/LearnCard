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
