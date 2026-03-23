/**
 * Shared helpers for seeding app store data in tests and dev scripts.
 *
 * Used by: test/app-counters.spec.ts, test/app-notifications.spec.ts, scripts/seed-dev-app.ts
 */

import { createAppStoreListing } from '@accesslayer/app-store-listing/create';
import {
    associateListingWithIntegration,
    installAppForProfile,
} from '@accesslayer/app-store-listing/relationships/create';
import { createIntegration } from '@accesslayer/integration/create';
import { associateIntegrationWithProfile } from '@accesslayer/integration/relationships/create';
import type { AppStoreListingCreateType } from 'types/app-store-listing';

export const makeListingInput = (
    overrides?: Partial<AppStoreListingCreateType>
): AppStoreListingCreateType => ({
    display_name: 'Dev Test App',
    tagline: 'A test application',
    full_description: 'Test application seeded for development',
    icon_url: 'https://example.com/icon.png',
    app_listing_status: 'LISTED' as const,
    launch_type: 'EMBEDDED_IFRAME' as const,
    launch_config_json: JSON.stringify({ url: 'https://app.example.com' }),
    category: 'Learning',
    promotion_level: 'STANDARD' as const,
    ...overrides,
});

export const seedIntegration = async (
    name: string,
    profileId: string,
    whitelistedDomains: string[] = ['example.com']
): Promise<{ id: string; name: string }> => {
    const integration = await createIntegration({
        name,
        description: `Integration for ${name}`,
        whitelistedDomains,
    });

    await associateIntegrationWithProfile(integration.id, profileId);

    return integration;
};

export const seedListedApp = async (
    ownerProfileId: string,
    overrides?: Partial<AppStoreListingCreateType>,
    integrationName: string = 'Dev App Integration'
): Promise<{
    listing: Awaited<ReturnType<typeof createAppStoreListing>>;
    integration: Awaited<ReturnType<typeof seedIntegration>>;
}> => {
    const integration = await seedIntegration(integrationName, ownerProfileId);

    const listing = await createAppStoreListing(makeListingInput(overrides));

    await associateListingWithIntegration(listing.listing_id, integration.id);

    return { listing, integration };
};

export { installAppForProfile };
