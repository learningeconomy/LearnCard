import { test, expect } from './fixtures/mocked-test';
import { installNetwork } from './mocks/network';
import { waitForAuthenticatedState } from './test.helpers';
import { TEST_USER_PROFILE_ID } from './constants';

test.describe('My Skill Profile mobile form @mocked', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.addInitScript(() => {
            Object.defineProperty(window, 'CapacitorCustomPlatform', {
                configurable: true,
                value: { name: 'ios' },
            });
        });
        await installNetwork(page);
        await waitForAuthenticatedState(page, {
            path: '/wallet',
            profileId: TEST_USER_PROFILE_ID,
        });

        await page.evaluate(() => {
            window.history.pushState({}, '', '/ai/pathways');
            window.dispatchEvent(new PopStateEvent('popstate'));
        });

        await page.waitForURL(/\/ai\/pathways/);
        await expect(page.getByText('My Skill Profile')).toBeVisible({ timeout: 30_000 });

        const stepHeading = page.getByRole('heading', {
            name: 'Grow your skills and explore opportunities',
        });
        const editButton = page.getByRole('button', { name: 'Edit skill profile' });

        await Promise.race([
            stepHeading.waitFor({ state: 'visible', timeout: 30_000 }),
            editButton.waitFor({ state: 'visible', timeout: 30_000 }),
        ]);

        if (!(await stepHeading.isVisible())) await editButton.click();

        await expect(stepHeading).toBeVisible({ timeout: 30_000 });
    });

    test('keeps the first step reachable above the keyboard', async ({ page }) => {
        const nextButton = page.getByRole('button', { name: 'Next', exact: true });
        const formScroller = page.locator('div.overflow-y-auto').filter({ has: nextButton });

        await page.setViewportSize({ width: 390, height: 460 });
        await page.locator('input[placeholder="Professional title..."]').click();

        await expect(formScroller).toHaveCount(1);
        await expect
            .poll(() =>
                formScroller.evaluate(element => element.scrollHeight > element.clientHeight)
            )
            .toBe(true);

        await formScroller.evaluate(element => {
            element.scrollTop = element.scrollHeight;
        });

        await expect(nextButton).toBeInViewport();
    });
});
