import { test, expect } from './fixtures/mocked-test';
import { installNetwork } from './mocks/network';
import type { BrainOutputs } from './mocks/trpc';

const listing = {
    listing_id: 'public-cleanup-regression',
    display_name: 'Public Cleanup Test App',
    tagline: 'A public listing',
    full_description: 'Available before signing in.',
    icon_url: '',
    app_listing_status: 'LISTED',
    launch_type: 'DIRECT_LINK',
    launch_config_json: JSON.stringify({ url: 'https://example.com' }),
} satisfies NonNullable<BrainOutputs['appStore']['getPublicListing']>;

test.describe('Anonymous app listing @mocked', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('finishes a delayed listing request without idle startup clearing its query', async ({
        page,
    }) => {
        const mock = await installNetwork(page);
        mock.on('profile.getProfile', () => null);
        mock.on('appStore.getPublicListing', async () => {
            // Exercise the old 1.5-second idle cleanup before resolving the API.
            await new Promise(resolve => setTimeout(resolve, 2500));
            return listing;
        });
        mock.on('appStore.getListingInstallCount', () => 0);

        await page.goto(`/app/${listing.listing_id}`);
        await expect(page.getByText(listing.display_name).first()).toBeVisible({
            timeout: 30_000,
        });
        await expect(page.getByText('Loading app...')).not.toBeVisible();
        await expect(page.getByRole('button', { name: /get app|install/i })).toBeVisible();
    });
});
