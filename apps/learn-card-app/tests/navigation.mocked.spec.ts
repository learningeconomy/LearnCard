import { test, expect } from './fixtures/mocked-test';
import { waitForAuthenticatedState } from './test.helpers';
import { TEST_USER_PROFILE_ID } from './constants';

test.describe('Mocked navigation @mocked', () => {
    test('finishes sign-in while an unrelated document resource is still pending', async ({
        page,
    }) => {
        let releaseResource!: () => void;
        const resourceReleased = new Promise<void>(resolve => {
            releaseResource = resolve;
        });
        await page.route('**/pending-navigation-resource.svg', async route => {
            await resourceReleased;
            await route.fulfill({
                contentType: 'image/svg+xml',
                body: '<svg xmlns="http://www.w3.org/2000/svg"/>',
            });
        });
        await page.route('**/developer/sign-in?**', route =>
            route.fulfill({
                contentType: 'text/html',
                body: `<!doctype html>
                    <label>Seed<input /></label>
                    <button onclick="history.replaceState({}, '', '/notifications');
                        document.querySelector('h1').textContent = 'Alerts'">Sign in</button>
                    <h1>Sign in</h1>
                    <img src="/pending-navigation-resource.svg" alt="" />`,
            })
        );
        try {
            await waitForAuthenticatedState(page, {
                path: '/notifications',
                nextPath: '/notifications',
                profileId: TEST_USER_PROFILE_ID,
                waitUntil: 'commit',
            });
            await expect(page.getByRole('heading', { name: 'Alerts', exact: true })).toBeVisible();
            // The route and its UI are ready although the document's load event cannot fire.
            await expect.poll(() => page.evaluate(() => document.readyState)).toBe('interactive');
        } finally {
            releaseResource();
        }
        await page.waitForLoadState('load');
    });
});
