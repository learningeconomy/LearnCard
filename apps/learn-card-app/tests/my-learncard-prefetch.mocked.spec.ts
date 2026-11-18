import { test, expect } from './fixtures/mocked-test';
import { installNetwork } from './mocks/network';
import { waitForAuthenticatedState } from './test.helpers';
import { TEST_USER_PROFILE_ID } from './constants';

// Dev serves the source module; builds serve a hashed chunk. Match both.
const MODAL_CHUNK = /\/MyLearnCardModalContent(?:\.tsx|-[\w-]+\.js)(?:\?.*)?$/;

test.describe('My LearnCard prefetch @mocked', () => {
    // Firefox (and Chromium before ~157) remember a failed module import, so a later
    // import() of the same URL fails without asking the server again. The speculative
    // prefetch must not leave that behind for the real open.
    test('a prefetch that hits a server error does not break the later open', async ({ page }) => {
        test.setTimeout(180_000);
        await installNetwork(page);

        let serverDown = true;
        const responses: Array<{ status: number; whileDown: boolean }> = [];
        await page.route(MODAL_CHUNK, async route => {
            if (serverDown) {
                responses.push({ status: 503, whileDown: true });
                await route.fulfill({ status: 503, body: 'Service Unavailable' });
                return;
            }
            const response = await route.fetch();
            responses.push({ status: response.status(), whileDown: false });
            await route.fulfill({ response });
        });

        await waitForAuthenticatedState(page, {
            path: '/dashboard',
            nextPath: '/dashboard',
            profileId: TEST_USER_PROFILE_ID,
            waitUntil: 'commit',
        });
        await expect(page.getByRole('button', { name: /^Open your / })).toBeVisible({
            timeout: 90_000,
        });

        // The idle prefetch runs once the dashboard has painted, and gets a 503.
        await expect.poll(() => responses.length, { timeout: 30_000 }).toBeGreaterThan(0);

        // A full reload would wipe this, so it tells us the open recovered in place.
        await page.evaluate(() => {
            (window as unknown as { __noReload?: boolean }).__noReload = true;
        });
        serverDown = false;

        await page.getByRole('button', { name: 'Open profile', exact: true }).click();

        await expect(page.getByRole('button', { name: 'Data Sharing', exact: true })).toBeVisible({
            timeout: 30_000,
        });
        // The open asked the server again instead of reusing the failed module.
        expect(responses.some(r => !r.whileDown && r.status < 400)).toBe(true);
        expect(
            await page.evaluate(() => (window as unknown as { __noReload?: boolean }).__noReload)
        ).toBe(true);
    });
});
