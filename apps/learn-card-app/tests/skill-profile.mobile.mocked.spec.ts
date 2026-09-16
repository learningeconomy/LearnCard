import { test, expect } from './fixtures/mocked-test';
import { installNetwork } from './mocks/network';
import { waitForAuthenticatedState } from './test.helpers';
import { TEST_USER_PROFILE_ID } from './constants';

test.describe('My Skill Profile mobile form @mocked', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await installNetwork(page);
        await waitForAuthenticatedState(page, {
            path: '/ai/pathways',
            profileId: TEST_USER_PROFILE_ID,
        });

        await expect(page.getByText('My Skill Profile')).toBeVisible({ timeout: 30_000 });
        await page.getByRole('button', { name: 'Edit skill profile' }).click();
        await expect(
            page.getByRole('heading', { name: 'Fill out your skills profile' })
        ).toBeVisible({ timeout: 30_000 });
        await expect(
            page.getByRole('heading', { name: 'Grow your skills and explore opportunities' })
        ).toBeVisible({ timeout: 30_000 });
    });

    test('keeps the first step reachable and resets scroll between steps', async ({ page }) => {
        const nextButton = page.getByRole('button', { name: 'Next', exact: true });
        const formScroller = page.getByTestId('skill-profile-form-scroller');

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

        await expect
            .poll(() => formScroller.evaluate(element => element.scrollTop))
            .toBeGreaterThan(0);

        await page.getByRole('button', { name: 'Skip', exact: true }).click();

        await expect.poll(() => formScroller.evaluate(element => element.scrollTop)).toBe(0);
    });
});
