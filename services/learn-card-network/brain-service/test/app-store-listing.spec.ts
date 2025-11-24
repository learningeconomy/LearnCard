import { describe, it, beforeAll, beforeEach, afterAll, expect } from 'vitest';

import { getUser } from './helpers/getClient';

import { AppStoreListing, Integration, Profile } from '@models';

import { createAppStoreListing } from '@accesslayer/app-store-listing/create';
import {
    readAppStoreListingById,
    getListingsForIntegration,
    countListingsForIntegration,
    getListedApps,
    getInstalledAppsForProfile,
    countInstalledAppsForProfile,
    checkIfProfileInstalledApp,
} from '@accesslayer/app-store-listing/read';
import { updateAppStoreListing } from '@accesslayer/app-store-listing/update';
import { deleteAppStoreListing } from '@accesslayer/app-store-listing/delete';
import {
    associateListingWithIntegration,
    installAppForProfile,
} from '@accesslayer/app-store-listing/relationships/create';
import {
    dissociateListingFromIntegration,
    uninstallAppForProfile,
} from '@accesslayer/app-store-listing/relationships/delete';
import {
    getIntegrationForListing,
    getProfilesInstalledApp,
    countProfilesInstalledApp,
} from '@accesslayer/app-store-listing/relationships/read';
import { createIntegration } from '@accesslayer/integration/create';
import { associateIntegrationWithProfile } from '@accesslayer/integration/relationships/create';

let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;
let userC: Awaited<ReturnType<typeof getUser>>;

const makeListingInput = (overrides?: Record<string, any>) => ({
    display_name: 'Test App',
    tagline: 'A test application',
    full_description: 'This is a comprehensive test application for the app store',
    icon_url: 'https://example.com/icon.png',
    app_listing_status: 'DRAFT' as const,
    launch_type: 'EMBEDDED_IFRAME' as const,
    launch_config_json: JSON.stringify({ iframeUrl: 'https://app.example.com' }),
    category: 'Learning',
    promotion_level: 'STANDARD' as const,
    ...overrides,
});

const seedProfile = async (user: Awaited<ReturnType<typeof getUser>>, profileId: string) => {
    await user.clients.fullAuth.profile.createProfile({ profileId });
};

const seedIntegration = async (name: string, profileId: string) => {
    const integration = await createIntegration({
        name,
        description: `Test integration for ${name}`,
        whitelistedDomains: ['example.com'],
    });
    await associateIntegrationWithProfile(integration.id, profileId);
    return integration;
};

describe('AppStoreListing', () => {
    beforeAll(async () => {
        userA = await getUser('a'.repeat(64));
        userB = await getUser('b'.repeat(64));
        userC = await getUser('c'.repeat(64));
    });

    describe('Access Layer', () => {
        beforeEach(async () => {
            await AppStoreListing.delete({ detach: true, where: {} });
            await Integration.delete({ detach: true, where: {} });
            await Profile.delete({ detach: true, where: {} });

            await seedProfile(userA, 'usera');
            await seedProfile(userB, 'userb');
            await seedProfile(userC, 'userc');
        });

        afterAll(async () => {
            await AppStoreListing.delete({ detach: true, where: {} });
            await Integration.delete({ detach: true, where: {} });
            await Profile.delete({ detach: true, where: {} });
        });

        describe('CRUD Operations', () => {
            it('create, read by id, update, and delete', async () => {
                // Create
                const created = await createAppStoreListing(
                    makeListingInput({ display_name: 'My App' })
                );

                expect(created.listing_id).toBeTruthy();
                expect(created.display_name).toBe('My App');
                expect(created.tagline).toBe('A test application');
                expect(created.app_listing_status).toBe('DRAFT');
                expect(created.launch_type).toBe('EMBEDDED_IFRAME');
                expect(created.category).toBe('Learning');
                expect(created.promotion_level).toBe('STANDARD');

                // Read by ID
                const byId = await readAppStoreListingById(created.listing_id);
                expect(byId?.display_name).toBe('My App');
                expect(byId?.listing_id).toBe(created.listing_id);

                // Update
                const updated = await updateAppStoreListing(created, {
                    display_name: 'Updated App',
                    app_listing_status: 'LISTED',
                    promotion_level: 'FEATURED_CAROUSEL',
                });
                expect(updated).toBe(true);

                const afterUpdate = await readAppStoreListingById(created.listing_id);
                expect(afterUpdate?.display_name).toBe('Updated App');
                expect(afterUpdate?.app_listing_status).toBe('LISTED');
                expect(afterUpdate?.promotion_level).toBe('FEATURED_CAROUSEL');
                expect(afterUpdate?.tagline).toBe('A test application'); // unchanged

                // Delete
                await deleteAppStoreListing(created.listing_id);
                const afterDelete = await readAppStoreListingById(created.listing_id);
                expect(afterDelete).toBeNull();
            });

            it('creates listing with optional fields', async () => {
                const listing = await createAppStoreListing(
                    makeListingInput({
                        promo_video_url: 'https://example.com/video.mp4',
                        ios_app_store_id: 'com.example.app',
                        android_app_store_id: 'com.example.app.android',
                        privacy_policy_url: 'https://example.com/privacy',
                        terms_url: 'https://example.com/terms',
                    })
                );

                expect(listing.promo_video_url).toBe('https://example.com/video.mp4');
                expect(listing.ios_app_store_id).toBe('com.example.app');
                expect(listing.android_app_store_id).toBe('com.example.app.android');
                expect(listing.privacy_policy_url).toBe('https://example.com/privacy');
                expect(listing.terms_url).toBe('https://example.com/terms');
            });

            it('creates listing with custom listing_id', async () => {
                const customId = 'custom-listing-123';
                const listing = await createAppStoreListing(
                    makeListingInput({ listing_id: customId })
                );

                expect(listing.listing_id).toBe(customId);
            });

            it('update returns false when no fields change', async () => {
                const listing = await createAppStoreListing(makeListingInput());
                const result = await updateAppStoreListing(listing, {});
                expect(result).toBe(true); // nothing to update
            });
        });

        describe('Integration Relationships', () => {
            it('associates listing with integration and retrieves it', async () => {
                const integration = await seedIntegration('Test Integration', 'usera');
                const listing = await createAppStoreListing(
                    makeListingInput({ display_name: 'Integration App' })
                );

                // Associate
                await associateListingWithIntegration(listing.listing_id, integration.id);

                // Read integration for listing
                const fetchedIntegration = await getIntegrationForListing(listing.listing_id);
                expect(fetchedIntegration?.id).toBe(integration.id);
                expect(fetchedIntegration?.name).toBe('Test Integration');

                // Get listings for integration
                const listings = await getListingsForIntegration(integration.id, { limit: 10 });
                expect(listings.length).toBe(1);
                expect(listings[0]?.listing_id).toBe(listing.listing_id);

                // Count listings
                const count = await countListingsForIntegration(integration.id);
                expect(count).toBe(1);
            });

            it('dissociates listing from integration', async () => {
                const integration = await seedIntegration('Test Integration', 'usera');
                const listing = await createAppStoreListing(makeListingInput());

                await associateListingWithIntegration(listing.listing_id, integration.id);
                expect(await getIntegrationForListing(listing.listing_id)).toBeTruthy();

                await dissociateListingFromIntegration(listing.listing_id, integration.id);
                expect(await getIntegrationForListing(listing.listing_id)).toBeNull();
            });

            it('paginates listings for integration', async () => {
                const integration = await seedIntegration('Test Integration', 'usera');
                const listing1 = await createAppStoreListing(
                    makeListingInput({ display_name: 'App 1' })
                );
                const listing2 = await createAppStoreListing(
                    makeListingInput({ display_name: 'App 2' })
                );
                const listing3 = await createAppStoreListing(
                    makeListingInput({ display_name: 'App 3' })
                );

                await associateListingWithIntegration(listing1.listing_id, integration.id);
                await associateListingWithIntegration(listing2.listing_id, integration.id);
                await associateListingWithIntegration(listing3.listing_id, integration.id);

                const page1 = await getListingsForIntegration(integration.id, { limit: 2 });
                expect(page1.length).toBe(2);

                const page2 = await getListingsForIntegration(integration.id, {
                    limit: 2,
                    cursor: page1[1]?.listing_id,
                });
                expect(page2.length).toBe(1);
            });
        });

        describe('Profile Install Relationships', () => {
            it('installs app for profile and checks installation', async () => {
                const listing = await createAppStoreListing(
                    makeListingInput({ display_name: 'Installable App' })
                );

                // Check not installed initially
                const isInstalledBefore = await checkIfProfileInstalledApp(
                    'usera',
                    listing.listing_id
                );
                expect(isInstalledBefore).toBe(false);

                // Install
                const installedAt = new Date().toISOString();
                await installAppForProfile('usera', listing.listing_id, installedAt);

                // Check installed
                const isInstalledAfter = await checkIfProfileInstalledApp(
                    'usera',
                    listing.listing_id
                );
                expect(isInstalledAfter).toBe(true);

                // Get installed apps for profile
                const installed = await getInstalledAppsForProfile('usera', { limit: 10 });
                expect(installed.length).toBe(1);
                expect(installed[0]?.listing_id).toBe(listing.listing_id);
                expect(installed[0]?.installed_at).toBeTruthy();

                // Count
                const count = await countInstalledAppsForProfile('usera');
                expect(count).toBe(1);
            });

            it('uninstalls app for profile', async () => {
                const listing = await createAppStoreListing(makeListingInput());
                await installAppForProfile('usera', listing.listing_id);

                expect(await checkIfProfileInstalledApp('usera', listing.listing_id)).toBe(true);

                await uninstallAppForProfile('usera', listing.listing_id);

                expect(await checkIfProfileInstalledApp('usera', listing.listing_id)).toBe(false);
            });

            it('gets profiles who installed an app', async () => {
                const listing = await createAppStoreListing(makeListingInput());

                await installAppForProfile('usera', listing.listing_id);
                await installAppForProfile('userb', listing.listing_id);

                const profiles = await getProfilesInstalledApp(listing.listing_id, { limit: 10 });
                expect(profiles.length).toBe(2);

                const count = await countProfilesInstalledApp(listing.listing_id);
                expect(count).toBe(2);
            });

            it('paginates installed apps for profile', async () => {
                const listing1 = await createAppStoreListing(
                    makeListingInput({ display_name: 'App 1' })
                );
                const listing2 = await createAppStoreListing(
                    makeListingInput({ display_name: 'App 2' })
                );
                const listing3 = await createAppStoreListing(
                    makeListingInput({ display_name: 'App 3' })
                );

                await installAppForProfile('usera', listing1.listing_id, '2025-01-01T00:00:00Z');
                await installAppForProfile('usera', listing2.listing_id, '2025-01-02T00:00:00Z');
                await installAppForProfile('usera', listing3.listing_id, '2025-01-03T00:00:00Z');

                const page1 = await getInstalledAppsForProfile('usera', { limit: 2 });
                expect(page1.length).toBe(2);

                // Use installed_at as cursor since results are ordered by installed_at DESC
                const page2 = await getInstalledAppsForProfile('usera', {
                    limit: 2,
                    cursor: page1[1]?.installed_at,
                });
                expect(page2.length).toBe(1);
            });

            it('stores listing_id in INSTALLS relationship', async () => {
                const listing = await createAppStoreListing(makeListingInput());
                await installAppForProfile('usera', listing.listing_id);

                const installed = await getInstalledAppsForProfile('usera', { limit: 10 });
                expect(installed[0]?.listing_id).toBe(listing.listing_id);
            });
        });

        describe('App Store Queries', () => {
            it('filters listed apps by status', async () => {
                await createAppStoreListing(
                    makeListingInput({
                        display_name: 'Draft App',
                        app_listing_status: 'DRAFT',
                    })
                );
                await createAppStoreListing(
                    makeListingInput({
                        display_name: 'Listed App',
                        app_listing_status: 'LISTED',
                    })
                );
                await createAppStoreListing(
                    makeListingInput({
                        display_name: 'Archived App',
                        app_listing_status: 'ARCHIVED',
                    })
                );

                const listedApps = await getListedApps({ limit: 10 });
                expect(listedApps.length).toBe(1);
                expect(listedApps[0]?.display_name).toBe('Listed App');
            });

            it('filters listed apps by category', async () => {
                await createAppStoreListing(
                    makeListingInput({
                        display_name: 'Learning App',
                        app_listing_status: 'LISTED',
                        category: 'Learning',
                    })
                );
                await createAppStoreListing(
                    makeListingInput({
                        display_name: 'Games App',
                        app_listing_status: 'LISTED',
                        category: 'Games',
                    })
                );

                const learningApps = await getListedApps({ limit: 10, category: 'Learning' });
                expect(learningApps.length).toBe(1);
                expect(learningApps[0]?.display_name).toBe('Learning App');

                const gamesApps = await getListedApps({ limit: 10, category: 'Games' });
                expect(gamesApps.length).toBe(1);
                expect(gamesApps[0]?.display_name).toBe('Games App');
            });

            it('filters listed apps by promotion level', async () => {
                await createAppStoreListing(
                    makeListingInput({
                        display_name: 'Featured App',
                        app_listing_status: 'LISTED',
                        promotion_level: 'FEATURED_CAROUSEL',
                    })
                );
                await createAppStoreListing(
                    makeListingInput({
                        display_name: 'Curated App',
                        app_listing_status: 'LISTED',
                        promotion_level: 'CURATED_LIST',
                    })
                );
                await createAppStoreListing(
                    makeListingInput({
                        display_name: 'Standard App',
                        app_listing_status: 'LISTED',
                        promotion_level: 'STANDARD',
                    })
                );

                const featured = await getListedApps({
                    limit: 10,
                    promotionLevel: 'FEATURED_CAROUSEL',
                });
                expect(featured.length).toBe(1);
                expect(featured[0]?.display_name).toBe('Featured App');
            });

            it('paginates listed apps', async () => {
                await createAppStoreListing(
                    makeListingInput({ display_name: 'App 1', app_listing_status: 'LISTED' })
                );
                await createAppStoreListing(
                    makeListingInput({ display_name: 'App 2', app_listing_status: 'LISTED' })
                );
                await createAppStoreListing(
                    makeListingInput({ display_name: 'App 3', app_listing_status: 'LISTED' })
                );

                const page1 = await getListedApps({ limit: 2 });
                expect(page1.length).toBe(2);

                const page2 = await getListedApps({ limit: 2, cursor: page1[1]?.listing_id });
                expect(page2.length).toBe(1);
            });

            it('combines multiple filters', async () => {
                await createAppStoreListing(
                    makeListingInput({
                        display_name: 'Learning Featured',
                        app_listing_status: 'LISTED',
                        category: 'Learning',
                        promotion_level: 'FEATURED_CAROUSEL',
                    })
                );
                await createAppStoreListing(
                    makeListingInput({
                        display_name: 'Games Featured',
                        app_listing_status: 'LISTED',
                        category: 'Games',
                        promotion_level: 'FEATURED_CAROUSEL',
                    })
                );
                await createAppStoreListing(
                    makeListingInput({
                        display_name: 'Learning Standard',
                        app_listing_status: 'LISTED',
                        category: 'Learning',
                        promotion_level: 'STANDARD',
                    })
                );

                const filtered = await getListedApps({
                    limit: 10,
                    category: 'Learning',
                    promotionLevel: 'FEATURED_CAROUSEL',
                });
                expect(filtered.length).toBe(1);
                expect(filtered[0]?.display_name).toBe('Learning Featured');
            });
        });

        describe('Launch Types and Config', () => {
            it('stores different launch types', async () => {
                const types = [
                    'EMBEDDED_IFRAME',
                    'SECOND_SCREEN',
                    'DIRECT_LINK',
                    'CONSENT_REDIRECT',
                    'SERVER_HEADLESS',
                ] as const;

                for (const launchType of types) {
                    const listing = await createAppStoreListing(
                        makeListingInput({
                            display_name: `${launchType} App`,
                            launch_type: launchType,
                            launch_config_json: JSON.stringify({ type: launchType }),
                        })
                    );

                    const fetched = await readAppStoreListingById(listing.listing_id);
                    expect(fetched?.launch_type).toBe(launchType);
                    expect(fetched?.launch_config_json).toContain(launchType);
                }
            });
        });

        describe('Edge Cases', () => {
            it('handles missing optional fields gracefully', async () => {
                const listing = await createAppStoreListing(
                    makeListingInput({
                        category: undefined,
                        promo_video_url: undefined,
                        promotion_level: undefined,
                    })
                );

                expect(listing.category).toBeUndefined();
                expect(listing.promo_video_url).toBeUndefined();
                expect(listing.promotion_level).toBeUndefined();
            });

            it('multiple profiles can install same app', async () => {
                const listing = await createAppStoreListing(makeListingInput());

                await installAppForProfile('usera', listing.listing_id);
                await installAppForProfile('userb', listing.listing_id);
                await installAppForProfile('userc', listing.listing_id);

                expect(await checkIfProfileInstalledApp('usera', listing.listing_id)).toBe(true);
                expect(await checkIfProfileInstalledApp('userb', listing.listing_id)).toBe(true);
                expect(await checkIfProfileInstalledApp('userc', listing.listing_id)).toBe(true);

                const count = await countProfilesInstalledApp(listing.listing_id);
                expect(count).toBe(3);
            });

            it('profile can install multiple apps', async () => {
                const listing1 = await createAppStoreListing(
                    makeListingInput({ display_name: 'App 1' })
                );
                const listing2 = await createAppStoreListing(
                    makeListingInput({ display_name: 'App 2' })
                );
                const listing3 = await createAppStoreListing(
                    makeListingInput({ display_name: 'App 3' })
                );

                await installAppForProfile('usera', listing1.listing_id);
                await installAppForProfile('usera', listing2.listing_id);
                await installAppForProfile('usera', listing3.listing_id);

                const count = await countInstalledAppsForProfile('usera');
                expect(count).toBe(3);
            });

            it('integration can publish multiple listings', async () => {
                const integration = await seedIntegration('Multi App Publisher', 'usera');

                const listing1 = await createAppStoreListing(
                    makeListingInput({ display_name: 'App 1' })
                );
                const listing2 = await createAppStoreListing(
                    makeListingInput({ display_name: 'App 2' })
                );

                await associateListingWithIntegration(listing1.listing_id, integration.id);
                await associateListingWithIntegration(listing2.listing_id, integration.id);

                const count = await countListingsForIntegration(integration.id);
                expect(count).toBe(2);
            });
        });
    });
});
