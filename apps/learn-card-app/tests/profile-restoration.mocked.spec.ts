import { test, expect } from './fixtures/mocked-test';
import { installNetwork } from './mocks/network';
import type { BrainOutputs } from './mocks/trpc';
import { waitForAuthenticatedState } from './test.helpers';
import { TEST_USER_PROFILE_ID } from './constants';

test('new profile survives full-page navigation before its cache flush @mocked', async ({
    page,
}) => {
    // Each hard reload boots the unbundled app with Playwright's HTTP cache
    // disabled by mocked routes. Give CI headroom without retrying assertions.
    test.setTimeout(210_000);
    const network = await installNetwork(page);
    let created = false;
    const profile = {
        profileId: TEST_USER_PROFILE_ID,
        displayName: 'User From Seed',
        did: `did:web:localhost%3A4000:users:${TEST_USER_PROFILE_ID}`,
        profileVisibility: 'public',
        showEmail: false,
        allowConnectionRequests: 'anyone',
        isServiceProfile: false,
    } satisfies NonNullable<BrainOutputs['profile']['getProfile']>;
    network.on('profile.getProfile', () => (created ? profile : undefined));
    network.on('profile.createProfile', async () => {
        // Keep creation pending beyond the one-second persistence batch. Before the
        // fix this saves success:null, then immediate navigation drops the positive
        // snapshot and hydrates that absence as fresh for another five minutes.
        await new Promise(resolve => setTimeout(resolve, 1600));
        created = true;
        return profile.did;
    });
    network.on('profile.getOtherProfile', () => profile);
    network.on('profile.updateProfile', () => true);

    await waitForAuthenticatedState(page, {
        path: '/dashboard',
        profileId: TEST_USER_PROFILE_ID,
        waitUntil: 'commit',
    });
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 60_000 });

    // Exercise the first restore and one subsequent restore, omitting a third
    // full dev-server startup. Badges renders without an own profile, but its
    // Earned tab does not.
    for (let navigation = 0; navigation < 2; navigation++) {
        await page.goto('/wallet', { waitUntil: 'commit' });
        const badges = page.getByRole('button', { name: /Badges/i });
        await expect(badges).toBeVisible({ timeout: 60_000 });
        await badges.click();
        await page.waitForURL(/\/socialBadges/);
        await expect(page.getByRole('tab', { name: 'Earned', exact: true })).toBeVisible({
            timeout: 30_000,
        });
    }
});
