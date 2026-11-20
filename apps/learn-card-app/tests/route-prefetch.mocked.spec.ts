import { test, expect } from './fixtures/mocked-test';
import { installNetwork } from './mocks/network';
import { waitForAuthenticatedState } from './test.helpers';
import { TEST_USER_PROFILE_ID } from './constants';

// Dev serves the source module; builds serve a hashed chunk. Match both.
const ACHIEVEMENTS_CHUNK = /\/AchievementsPage(?:\.tsx|-[\w-]+\.js)(?:\?.*)?$/;

test.describe('Route prefetch @mocked', () => {
    // Firefox (and Chromium before ~157) remember a failed module import, so a later
    // import() of the same URL fails without asking the server again. Idle route
    // prefetch used to call import() for ~30 routes; a 503 there poisoned navigation.
    // Prefetch must warm with fetch() only so the real navigation is the first import().
    test('a route prefetch that hits a server error does not break later navigation', async ({
        page,
    }) => {
        test.setTimeout(180_000);
        await installNetwork(page);

        let serverDown = true;
        const responses: Array<{ status: number; whileDown: boolean; type: string }> = [];
        await page.route(ACHIEVEMENTS_CHUNK, async route => {
            const type = route.request().resourceType();
            if (serverDown) {
                responses.push({ status: 503, whileDown: true, type });
                await route.fulfill({ status: 503, body: 'Service Unavailable' });
                return;
            }
            const response = await route.fetch();
            responses.push({ status: response.status(), whileDown: false, type });
            await route.fulfill({ response });
        });

        // Land on the wallet so an Achievements square is already on screen; idle prefetch
        // still runs from AppRouter after first paint. Stay here so we never full-reload
        // after setting the no-reload marker.
        await waitForAuthenticatedState(page, {
            path: '/wallet',
            nextPath: '/wallet',
            profileId: TEST_USER_PROFILE_ID,
            waitUntil: 'commit',
        });
        await expect(page.getByRole('heading', { name: 'Passport', level: 1 })).toBeVisible({
            timeout: 90_000,
        });

        // Idle prefetchRoutes warms /achievements with fetch() once the first screen paints.
        await expect.poll(() => responses.length, { timeout: 60_000 }).toBeGreaterThan(0);
        // Speculative warm-up must not have used a module script request (import()).
        expect(responses.some(r => r.whileDown && r.type === 'script')).toBe(false);

        // A full reload would wipe this, so it tells us navigation recovered in place.
        await page.evaluate(() => {
            (window as unknown as { __noReload?: boolean }).__noReload = true;
        });
        serverDown = false;

        // aria-label is e.g. "Achievements Count unavailable" when the count query fails.
        await page.getByRole('button', { name: /Achievements/ }).click();

        await expect(page).toHaveURL(/\/achievements/, { timeout: 30_000 });
        // The navigation asked the server again instead of reusing a failed module.
        expect(responses.some(r => !r.whileDown && r.status < 400)).toBe(true);
        expect(
            await page.evaluate(() => (window as unknown as { __noReload?: boolean }).__noReload)
        ).toBe(true);
    });
});
