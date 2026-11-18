import { initLearnCard } from '@learncard/init';
import { expect, test } from './fixtures/mocked-test';
import { installNetwork } from './mocks/network';
import { TEST_USER_PROFILE_ID, TEST_USER_SEED } from './constants';
import { waitForAuthenticatedState } from './test.helpers';

test('closing search and changing wallet categories clear the search @mocked', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    const trpc = await installNetwork(page);
    const wallet = await initLearnCard({ seed: TEST_USER_SEED, allowRemoteContexts: false });
    const emptyIndex = await wallet.invoke.createDagJwe({ records: [], hasMore: false });
    trpc.on('index.get', () => emptyIndex);
    // Expose search in both categories without requiring real credentials.
    trpc.on('index.count', () => 2);
    trpc.on('profile.getProfile', () => ({
        profileId: TEST_USER_PROFILE_ID,
        did: wallet.id.did(),
        displayName: 'Mocked User',
        shortBio: '',
        bio: '',
        dob: '1990-01-01',
        country: 'US',
    }));
    trpc.on('profile.updateProfile', () => true);
    trpc.on('boost.countBoosts', () => 2);
    trpc.on('boost.getPaginatedBoosts', () => ({ records: [], hasMore: false }));

    await waitForAuthenticatedState(page, { path: '/wallet', profileId: TEST_USER_PROFILE_ID });
    await page.getByRole('button', { name: /Badges/i }).click();
    await expect(page).toHaveURL(/\/socialBadges/);

    const controls = [
        page.getByRole('tab', { name: 'Earned' }),
        page.getByRole('tab', { name: 'Managed' }),
        page.getByRole('button', { name: 'Grid', exact: true }),
        page.getByRole('button', { name: 'List', exact: true }),
        page.getByRole('button', { name: 'Search', exact: true }),
    ];
    for (const control of controls) {
        await expect(control).toBeVisible();
        const bounds = await control.boundingBox();
        expect(bounds).not.toBeNull();
        expect(bounds!.x).toBeGreaterThanOrEqual(0);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
    }

    const openSearch = page.getByRole('button', { name: 'Search', exact: true });
    const search = page.getByRole('textbox', { name: 'Search' });
    await openSearch.click();
    await search.fill('a badge');
    const closeSearch = page.getByRole('button', { name: 'Close', exact: true });
    await expect(closeSearch).toHaveCount(1);
    await closeSearch.click();
    await openSearch.click();
    await expect(search).toHaveValue('');

    await search.fill('another badge');
    await page.goBack();
    await expect(page).toHaveURL(/\/wallet/);
    await page.getByRole('button', { name: /Experiences/i }).click();
    await expect(page).toHaveURL(/\/workhistory/i);
    await expect(openSearch).toBeVisible();
    await openSearch.click();
    await expect(search).toHaveValue('');

    await page.goBack();
    await expect(page).toHaveURL(/\/wallet/);
    await page.getByRole('button', { name: /Badges/i }).click();
    await expect(page).toHaveURL(/\/socialBadges/);
    await openSearch.click();
    await expect(search).toHaveValue('');
});
