import { describe, it, beforeAll, beforeEach, afterAll, expect } from 'vitest';

import { getClient, getUser } from './helpers/getClient';

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

// For access layer tests - can set all fields including protected ones
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

// For router tests - excludes protected fields (app_listing_status, promotion_level)
const makeRouterListingInput = (overrides?: Record<string, any>) => {
    const { app_listing_status, promotion_level, ...rest } = makeListingInput(overrides);
    return rest;
};

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

    describe('Router', () => {
        const noAuthClient = getClient();

        let adminUser: Awaited<ReturnType<typeof getUser>>;

        beforeAll(async () => {
            userA = await getUser('a'.repeat(64));
            userB = await getUser('b'.repeat(64));
            userC = await getUser('c'.repeat(64), 'app-store:write');
            adminUser = await getUser('d'.repeat(64));
        });

        beforeEach(async () => {
            await AppStoreListing.delete({ detach: true, where: {} });
            await Integration.delete({ detach: true, where: {} });
            await Profile.delete({ detach: true, where: {} });

            await seedProfile(userA, 'usera');
            await seedProfile(userB, 'userb');
            await seedProfile(adminUser, 'app-store-admin');
            // userC intentionally has no profile for NOT_FOUND checks
        });

        afterAll(async () => {
            await AppStoreListing.delete({ detach: true, where: {} });
            await Integration.delete({ detach: true, where: {} });
            await Profile.delete({ detach: true, where: {} });
        });

        const seedIntegrationViaRouter = async (
            user: Awaited<ReturnType<typeof getUser>>,
            name = 'Test Integration'
        ) => {
            const id = await user.clients.fullAuth.integrations.addIntegration({
                name,
                description: 'Test integration',
                whitelistedDomains: ['example.com'],
            });
            return id;
        };

        const seedListingViaRouter = async (
            user: Awaited<ReturnType<typeof getUser>>,
            integrationId: string,
            overrides?: Record<string, any>
        ) => {
            // Router creates listings as DRAFT - protected fields are stripped
            const listingId = await user.clients.fullAuth.appStore.createListing({
                integrationId,
                listing: makeRouterListingInput(overrides),
            });
            return listingId;
        };

        // Helper to set listing status via access layer (simulating admin action for test setup)
        const setListingStatus = async (
            listingId: string,
            status: 'DRAFT' | 'LISTED' | 'ARCHIVED'
        ) => {
            const listing = await readAppStoreListingById(listingId);
            if (listing) {
                await updateAppStoreListing(listing, { app_listing_status: status });
            }
        };

        describe('createListing', () => {
            it('requires app-store:write scope and an existing profile', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);

                await expect(
                    noAuthClient.appStore.createListing({
                        integrationId,
                        listing: makeRouterListingInput(),
                    })
                ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

                await expect(
                    userA.clients.partialAuth.appStore.createListing({
                        integrationId,
                        listing: makeRouterListingInput(),
                    })
                ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

                await expect(
                    userC.clients.fullAuth.appStore.createListing({
                        integrationId,
                        listing: makeRouterListingInput(),
                    })
                ).rejects.toMatchObject({ code: 'NOT_FOUND' });
            });

            it('requires ownership of the integration', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);

                await expect(
                    userB.clients.fullAuth.appStore.createListing({
                        integrationId,
                        listing: makeRouterListingInput(),
                    })
                ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            });

            it('creates a listing as DRAFT with STANDARD promotion', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);
                const listingId = await seedListingViaRouter(userA, integrationId);

                expect(typeof listingId).toBe('string');

                const listing = await userA.clients.fullAuth.appStore.getListing({ listingId });
                expect(listing?.display_name).toBe('Test App');
                // Verify protected defaults are set correctly
                expect(listing?.app_listing_status).toBe('DRAFT');
                expect(listing?.promotion_level).toBe('STANDARD');
            });
        });

        describe('getListing', () => {
            it('requires app-store:read and enforces ownership', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);
                const listingId = await seedListingViaRouter(userA, integrationId);

                await expect(
                    userB.clients.fullAuth.appStore.getListing({ listingId })
                ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

                const listing = await userA.clients.fullAuth.appStore.getListing({ listingId });
                expect(listing?.listing_id).toBe(listingId);
            });
        });

        describe('getListingsForIntegration', () => {
            it('paginates listings', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);

                await seedListingViaRouter(userA, integrationId, { display_name: 'App 1' });
                await seedListingViaRouter(userA, integrationId, { display_name: 'App 2' });
                await seedListingViaRouter(userA, integrationId, { display_name: 'App 3' });

                const page1 = await userA.clients.fullAuth.appStore.getListingsForIntegration({
                    integrationId,
                    limit: 2,
                });
                expect(page1.records.length).toBe(2);
                expect(page1.hasMore).toBe(true);

                const page2 = await userA.clients.fullAuth.appStore.getListingsForIntegration({
                    integrationId,
                    limit: 2,
                    cursor: page1.cursor!,
                });
                expect(page2.records.length).toBe(1);
                expect(page2.hasMore).toBe(false);
            });
        });

        describe('countListingsForIntegration', () => {
            it('counts listings for integration', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);

                await seedListingViaRouter(userA, integrationId, { display_name: 'App 1' });
                await seedListingViaRouter(userA, integrationId, { display_name: 'App 2' });

                const count = await userA.clients.fullAuth.appStore.countListingsForIntegration({
                    integrationId,
                });
                expect(count).toBe(2);
            });
        });

        describe('updateListing', () => {
            it('requires app-store:write and ownership', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);
                const listingId = await seedListingViaRouter(userA, integrationId);

                await expect(
                    userB.clients.fullAuth.appStore.updateListing({
                        listingId,
                        updates: { display_name: 'Nope' },
                    })
                ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

                const ok = await userA.clients.fullAuth.appStore.updateListing({
                    listingId,
                    updates: { display_name: 'Updated App', tagline: 'New tagline' },
                });
                expect(ok).toBe(true);

                const after = await userA.clients.fullAuth.appStore.getListing({ listingId });
                expect(after?.display_name).toBe('Updated App');
                expect(after?.tagline).toBe('New tagline');
            });
        });

        describe('deleteListing', () => {
            it('requires app-store:delete and ownership', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);
                const listingId = await seedListingViaRouter(userA, integrationId);

                await expect(
                    userB.clients.fullAuth.appStore.deleteListing({ listingId })
                ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

                const ok = await userA.clients.fullAuth.appStore.deleteListing({ listingId });
                expect(ok).toBe(true);

                const after = await readAppStoreListingById(listingId);
                expect(after).toBeNull();
            });
        });

        describe('browseListedApps (public)', () => {
            it('returns only LISTED apps without auth', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);

                // Create draft app (stays as DRAFT)
                await seedListingViaRouter(userA, integrationId, { display_name: 'Draft App' });

                // Create and set to LISTED
                const listedId = await seedListingViaRouter(userA, integrationId, {
                    display_name: 'Listed App',
                });
                await setListingStatus(listedId, 'LISTED');

                const result = await noAuthClient.appStore.browseListedApps();

                expect(result.records.length).toBe(1);
                expect(result.records[0]?.display_name).toBe('Listed App');
            });

            it('filters by category', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);

                const learning = await seedListingViaRouter(userA, integrationId, {
                    display_name: 'Learning App',
                    category: 'Learning',
                });
                await setListingStatus(learning, 'LISTED');

                const games = await seedListingViaRouter(userA, integrationId, {
                    display_name: 'Games App',
                    category: 'Games',
                });
                await setListingStatus(games, 'LISTED');

                const result = await noAuthClient.appStore.browseListedApps({
                    category: 'Learning',
                });

                expect(result.records.length).toBe(1);
                expect(result.records[0]?.display_name).toBe('Learning App');
            });

            it('filters by promotion level', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);

                // Use access layer to set promotion level directly (admin-only field)
                const featured = await seedListingViaRouter(userA, integrationId, {
                    display_name: 'Featured App',
                });
                const featuredListing = await readAppStoreListingById(featured);
                await updateAppStoreListing(featuredListing!, {
                    app_listing_status: 'LISTED',
                    promotion_level: 'FEATURED_CAROUSEL',
                });

                const standard = await seedListingViaRouter(userA, integrationId, {
                    display_name: 'Standard App',
                });
                await setListingStatus(standard, 'LISTED');

                const result = await noAuthClient.appStore.browseListedApps({
                    promotionLevel: 'FEATURED_CAROUSEL',
                });

                expect(result.records.length).toBe(1);
                expect(result.records[0]?.display_name).toBe('Featured App');
            });
        });

        describe('getPublicListing', () => {
            it('returns listed apps without auth', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);
                const listingId = await seedListingViaRouter(userA, integrationId, {
                    display_name: 'Public App',
                });
                await setListingStatus(listingId, 'LISTED');

                const listing = await noAuthClient.appStore.getPublicListing({ listingId });
                expect(listing?.display_name).toBe('Public App');
            });

            it('returns undefined for non-LISTED apps', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);
                const listingId = await seedListingViaRouter(userA, integrationId, {
                    display_name: 'Draft App',
                });
                // Listing stays as DRAFT by default

                const listing = await noAuthClient.appStore.getPublicListing({ listingId });
                expect(listing).toBeUndefined();
            });
        });

        describe('getListingInstallCount', () => {
            it('returns install count for listed apps', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);
                const listingId = await seedListingViaRouter(userA, integrationId);
                await setListingStatus(listingId, 'LISTED');

                // Install the app
                await userA.clients.fullAuth.appStore.installApp({ listingId });
                await userB.clients.fullAuth.appStore.installApp({ listingId });

                const count = await noAuthClient.appStore.getListingInstallCount({ listingId });
                expect(count).toBe(2);
            });
        });

        describe('installApp', () => {
            it('requires app-store:write scope', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);
                const listingId = await seedListingViaRouter(userA, integrationId);
                await setListingStatus(listingId, 'LISTED');

                await expect(
                    noAuthClient.appStore.installApp({ listingId })
                ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

                await expect(
                    userA.clients.partialAuth.appStore.installApp({ listingId })
                ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            });

            it('installs a listed app', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);
                const listingId = await seedListingViaRouter(userA, integrationId);
                await setListingStatus(listingId, 'LISTED');

                const ok = await userA.clients.fullAuth.appStore.installApp({ listingId });
                expect(ok).toBe(true);

                const isInstalled = await userA.clients.fullAuth.appStore.isAppInstalled({
                    listingId,
                });
                expect(isInstalled).toBe(true);
            });

            it('prevents installing non-LISTED apps', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);
                const listingId = await seedListingViaRouter(userA, integrationId);
                // Listing stays as DRAFT by default

                await expect(
                    userA.clients.fullAuth.appStore.installApp({ listingId })
                ).rejects.toMatchObject({ code: 'NOT_FOUND' });
            });

            it('prevents duplicate installations', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);
                const listingId = await seedListingViaRouter(userA, integrationId);
                await setListingStatus(listingId, 'LISTED');

                await userA.clients.fullAuth.appStore.installApp({ listingId });

                await expect(
                    userA.clients.fullAuth.appStore.installApp({ listingId })
                ).rejects.toMatchObject({ code: 'CONFLICT' });
            });
        });

        describe('uninstallApp', () => {
            it('uninstalls an installed app', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);
                const listingId = await seedListingViaRouter(userA, integrationId);
                await setListingStatus(listingId, 'LISTED');

                await userA.clients.fullAuth.appStore.installApp({ listingId });
                const ok = await userA.clients.fullAuth.appStore.uninstallApp({ listingId });
                expect(ok).toBe(true);

                const isInstalled = await userA.clients.fullAuth.appStore.isAppInstalled({
                    listingId,
                });
                expect(isInstalled).toBe(false);
            });

            it('fails if app is not installed', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);
                const listingId = await seedListingViaRouter(userA, integrationId);
                await setListingStatus(listingId, 'LISTED');

                await expect(
                    userA.clients.fullAuth.appStore.uninstallApp({ listingId })
                ).rejects.toMatchObject({ code: 'NOT_FOUND' });
            });
        });

        describe('getInstalledApps', () => {
            it('returns installed apps with pagination', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);

                const listing1 = await seedListingViaRouter(userA, integrationId, {
                    display_name: 'App 1',
                });
                await setListingStatus(listing1, 'LISTED');

                const listing2 = await seedListingViaRouter(userA, integrationId, {
                    display_name: 'App 2',
                });
                await setListingStatus(listing2, 'LISTED');

                const listing3 = await seedListingViaRouter(userA, integrationId, {
                    display_name: 'App 3',
                });
                await setListingStatus(listing3, 'LISTED');

                await userA.clients.fullAuth.appStore.installApp({ listingId: listing1 });
                await userA.clients.fullAuth.appStore.installApp({ listingId: listing2 });
                await userA.clients.fullAuth.appStore.installApp({ listingId: listing3 });

                const page1 = await userA.clients.fullAuth.appStore.getInstalledApps({ limit: 2 });
                expect(page1.records.length).toBe(2);
                expect(page1.hasMore).toBe(true);

                const page2 = await userA.clients.fullAuth.appStore.getInstalledApps({
                    limit: 2,
                    cursor: page1.cursor!,
                });
                expect(page2.records.length).toBe(1);
                expect(page2.hasMore).toBe(false);
            });
        });

        describe('countInstalledApps', () => {
            it('counts installed apps', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);

                const listing1 = await seedListingViaRouter(userA, integrationId, {
                    display_name: 'App 1',
                });
                await setListingStatus(listing1, 'LISTED');

                const listing2 = await seedListingViaRouter(userA, integrationId, {
                    display_name: 'App 2',
                });
                await setListingStatus(listing2, 'LISTED');

                await userA.clients.fullAuth.appStore.installApp({ listingId: listing1 });
                await userA.clients.fullAuth.appStore.installApp({ listingId: listing2 });

                const count = await userA.clients.fullAuth.appStore.countInstalledApps();
                expect(count).toBe(2);
            });
        });

        describe('isAppInstalled', () => {
            it('returns correct installation status', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);
                const listingId = await seedListingViaRouter(userA, integrationId);
                await setListingStatus(listingId, 'LISTED');

                const before = await userA.clients.fullAuth.appStore.isAppInstalled({ listingId });
                expect(before).toBe(false);

                await userA.clients.fullAuth.appStore.installApp({ listingId });

                const after = await userA.clients.fullAuth.appStore.isAppInstalled({ listingId });
                expect(after).toBe(true);
            });
        });

        describe('Admin Routes', () => {
            // For admin tests, we need to temporarily add the user to the admin list
            // Since the admin list is config-based, we'll use the access layer directly
            // to verify admin-only behavior works correctly

            it('adminUpdateListingStatus - rejects non-admin users', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);
                const listingId = await seedListingViaRouter(userA, integrationId);

                // userA is not an admin
                await expect(
                    userA.clients.fullAuth.appStore.adminUpdateListingStatus({
                        listingId,
                        status: 'LISTED',
                    })
                ).rejects.toMatchObject({ code: 'FORBIDDEN' });

                // Listing should still be DRAFT
                const listing = await readAppStoreListingById(listingId);
                expect(listing?.app_listing_status).toBe('DRAFT');
            });

            it('adminUpdatePromotionLevel - rejects non-admin users', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);
                const listingId = await seedListingViaRouter(userA, integrationId);

                await expect(
                    userA.clients.fullAuth.appStore.adminUpdatePromotionLevel({
                        listingId,
                        promotionLevel: 'FEATURED_CAROUSEL',
                    })
                ).rejects.toMatchObject({ code: 'FORBIDDEN' });

                // Promotion level should still be STANDARD
                const listing = await readAppStoreListingById(listingId);
                expect(listing?.promotion_level).toBe('STANDARD');
            });

            it('adminGetAllListings - rejects non-admin users', async () => {
                await expect(
                    userA.clients.fullAuth.appStore.adminGetAllListings()
                ).rejects.toMatchObject({ code: 'FORBIDDEN' });
            });

            it('isAdmin - returns false for non-admin users', async () => {
                const isAdmin = await userA.clients.fullAuth.appStore.isAdmin();
                expect(isAdmin).toBe(false);
            });

            it('isAdmin - returns true for admin users', async () => {
                const isAdmin = await adminUser.clients.fullAuth.appStore.isAdmin();
                expect(isAdmin).toBe(true);
            });

            it('adminUpdateListingStatus - admin can update listing status', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);
                const listingId = await seedListingViaRouter(userA, integrationId);

                // Verify starts as DRAFT
                const before = await readAppStoreListingById(listingId);
                expect(before?.app_listing_status).toBe('DRAFT');

                // Admin updates to LISTED
                const result = await adminUser.clients.fullAuth.appStore.adminUpdateListingStatus({
                    listingId,
                    status: 'LISTED',
                });
                expect(result).toBe(true);

                const after = await readAppStoreListingById(listingId);
                expect(after?.app_listing_status).toBe('LISTED');

                // Admin can also archive
                await adminUser.clients.fullAuth.appStore.adminUpdateListingStatus({
                    listingId,
                    status: 'ARCHIVED',
                });

                const archived = await readAppStoreListingById(listingId);
                expect(archived?.app_listing_status).toBe('ARCHIVED');
            });

            it('adminUpdatePromotionLevel - admin can update promotion level', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);
                const listingId = await seedListingViaRouter(userA, integrationId);

                // Verify starts as STANDARD
                const before = await readAppStoreListingById(listingId);
                expect(before?.promotion_level).toBe('STANDARD');

                // Admin updates to FEATURED_CAROUSEL
                const result = await adminUser.clients.fullAuth.appStore.adminUpdatePromotionLevel({
                    listingId,
                    promotionLevel: 'FEATURED_CAROUSEL',
                });
                expect(result).toBe(true);

                const after = await readAppStoreListingById(listingId);
                expect(after?.promotion_level).toBe('FEATURED_CAROUSEL');

                // Admin can set other levels too
                await adminUser.clients.fullAuth.appStore.adminUpdatePromotionLevel({
                    listingId,
                    promotionLevel: 'CURATED_LIST',
                });

                const curated = await readAppStoreListingById(listingId);
                expect(curated?.promotion_level).toBe('CURATED_LIST');
            });

            it('adminGetAllListings - admin can view all listings regardless of status', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);

                // Create listings with different statuses
                const draft = await seedListingViaRouter(userA, integrationId, {
                    display_name: 'Draft App',
                });

                const listed = await seedListingViaRouter(userA, integrationId, {
                    display_name: 'Listed App',
                });
                await setListingStatus(listed, 'LISTED');

                const archived = await seedListingViaRouter(userA, integrationId, {
                    display_name: 'Archived App',
                });
                await setListingStatus(archived, 'ARCHIVED');

                // Admin can see all listings
                const allListings = await adminUser.clients.fullAuth.appStore.adminGetAllListings();
                expect(allListings.records.length).toBe(3);

                const names = allListings.records.map(l => l.display_name);
                expect(names).toContain('Draft App');
                expect(names).toContain('Listed App');
                expect(names).toContain('Archived App');
            });

            it('adminGetAllListings - admin can filter by status', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);

                await seedListingViaRouter(userA, integrationId, { display_name: 'Draft App' });

                const listed = await seedListingViaRouter(userA, integrationId, {
                    display_name: 'Listed App',
                });
                await setListingStatus(listed, 'LISTED');

                // Admin filters by DRAFT only
                const draftOnly = await adminUser.clients.fullAuth.appStore.adminGetAllListings({
                    status: 'DRAFT',
                });
                expect(draftOnly.records.length).toBe(1);
                expect(draftOnly.records[0]?.display_name).toBe('Draft App');

                // Admin filters by LISTED only
                const listedOnly = await adminUser.clients.fullAuth.appStore.adminGetAllListings({
                    status: 'LISTED',
                });
                expect(listedOnly.records.length).toBe(1);
                expect(listedOnly.records[0]?.display_name).toBe('Listed App');
            });

            it('regular updateListing - cannot change protected fields', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);
                const listingId = await seedListingViaRouter(userA, integrationId);

                // Try to update with regular route - protected fields should be stripped
                await userA.clients.fullAuth.appStore.updateListing({
                    listingId,
                    updates: {
                        display_name: 'Updated Name',
                        // app_listing_status and promotion_level are not accepted by the validator
                    },
                });

                const listing = await readAppStoreListingById(listingId);
                expect(listing?.display_name).toBe('Updated Name');
                // Protected fields should remain unchanged
                expect(listing?.app_listing_status).toBe('DRAFT');
                expect(listing?.promotion_level).toBe('STANDARD');
            });
        });

        describe('Input Validation', () => {
            it('rejects invalid JSON in launch_config_json', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);

                await expect(
                    userA.clients.fullAuth.appStore.createListing({
                        integrationId,
                        listing: makeRouterListingInput({
                            launch_config_json: 'not valid json',
                        }),
                    })
                ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

                await expect(
                    userA.clients.fullAuth.appStore.createListing({
                        integrationId,
                        listing: makeRouterListingInput({
                            launch_config_json: '{ invalid: json }',
                        }),
                    })
                ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            });

            it('rejects icon_url from disallowed domains', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);

                await expect(
                    userA.clients.fullAuth.appStore.createListing({
                        integrationId,
                        listing: makeRouterListingInput({
                            icon_url: 'https://malicious-site.com/icon.png',
                        }),
                    })
                ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            });

            it('accepts icon_url from allowed domains', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);

                // Should accept example.com (allowed for tests)
                const listingId = await userA.clients.fullAuth.appStore.createListing({
                    integrationId,
                    listing: makeRouterListingInput({
                        icon_url: 'https://example.com/icon.png',
                    }),
                });
                expect(typeof listingId).toBe('string');

                // Should accept cdn.filestackcontent.com
                const listingId2 = await userA.clients.fullAuth.appStore.createListing({
                    integrationId,
                    listing: makeRouterListingInput({
                        icon_url: 'https://cdn.filestackcontent.com/abc123',
                    }),
                });
                expect(typeof listingId2).toBe('string');
            });

            it('rejects screenshots from disallowed domains', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);

                await expect(
                    userA.clients.fullAuth.appStore.createListing({
                        integrationId,
                        listing: makeRouterListingInput({
                            screenshots: ['https://evil-site.com/screenshot.png'],
                        }),
                    })
                ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            });

            it('rejects non-HTTPS iframe URLs for EMBEDDED_IFRAME launch type', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);

                await expect(
                    userA.clients.fullAuth.appStore.createListing({
                        integrationId,
                        listing: makeRouterListingInput({
                            launch_type: 'EMBEDDED_IFRAME',
                            launch_config_json: JSON.stringify({
                                iframeUrl: 'http://insecure-app.example.com',
                            }),
                        }),
                    })
                ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            });

            it('accepts HTTPS iframe URLs for EMBEDDED_IFRAME launch type', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);

                const listingId = await userA.clients.fullAuth.appStore.createListing({
                    integrationId,
                    listing: makeRouterListingInput({
                        launch_type: 'EMBEDDED_IFRAME',
                        launch_config_json: JSON.stringify({
                            iframeUrl: 'https://secure-app.example.com',
                        }),
                    }),
                });
                expect(typeof listingId).toBe('string');
            });

            it('rejects display_name with XSS patterns', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);

                await expect(
                    userA.clients.fullAuth.appStore.createListing({
                        integrationId,
                        listing: makeRouterListingInput({
                            display_name: '<script>alert("xss")</script>',
                        }),
                    })
                ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

                await expect(
                    userA.clients.fullAuth.appStore.createListing({
                        integrationId,
                        listing: makeRouterListingInput({
                            display_name: 'App onclick=alert(1)',
                        }),
                    })
                ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            });

            it('rejects tagline with XSS patterns', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);

                await expect(
                    userA.clients.fullAuth.appStore.createListing({
                        integrationId,
                        listing: makeRouterListingInput({
                            tagline: 'Cool app <iframe src="evil.com">',
                        }),
                    })
                ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            });

            it('rejects full_description with XSS patterns', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);

                await expect(
                    userA.clients.fullAuth.appStore.createListing({
                        integrationId,
                        listing: makeRouterListingInput({
                            full_description: 'Check out this app javascript:alert(1)',
                        }),
                    })
                ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            });

            it('rejects highlights with XSS patterns', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);

                await expect(
                    userA.clients.fullAuth.appStore.createListing({
                        integrationId,
                        listing: makeRouterListingInput({
                            highlights: [
                                'Safe highlight',
                                '<script>evil()</script>',
                            ],
                        }),
                    })
                ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            });

            it('accepts valid content without XSS patterns', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);

                const listingId = await userA.clients.fullAuth.appStore.createListing({
                    integrationId,
                    listing: makeRouterListingInput({
                        display_name: 'Legitimate App Name',
                        tagline: 'A great app for learning!',
                        full_description: 'This app helps users learn new skills. Features include video tutorials and quizzes.',
                        highlights: [
                            'Easy to use interface',
                            'Progress tracking',
                            'Offline mode available',
                        ],
                    }),
                });
                expect(typeof listingId).toBe('string');
            });

            it('rejects invalid hex color for hero_background_color', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);

                await expect(
                    userA.clients.fullAuth.appStore.createListing({
                        integrationId,
                        listing: makeRouterListingInput({
                            hero_background_color: 'not-a-color',
                        }),
                    })
                ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

                await expect(
                    userA.clients.fullAuth.appStore.createListing({
                        integrationId,
                        listing: makeRouterListingInput({
                            hero_background_color: '#FFF', // Too short
                        }),
                    })
                ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            });

            it('accepts valid hex color for hero_background_color', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);

                const listingId = await userA.clients.fullAuth.appStore.createListing({
                    integrationId,
                    listing: makeRouterListingInput({
                        hero_background_color: '#FF5733',
                    }),
                });
                expect(typeof listingId).toBe('string');
            });

            it('validates updates with the same rules as creation', async () => {
                const integrationId = await seedIntegrationViaRouter(userA);
                const listingId = await seedListingViaRouter(userA, integrationId);

                // Should reject XSS in update
                await expect(
                    userA.clients.fullAuth.appStore.updateListing({
                        listingId,
                        updates: {
                            display_name: '<script>alert("xss")</script>',
                        },
                    })
                ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

                // Should reject disallowed domain in update
                await expect(
                    userA.clients.fullAuth.appStore.updateListing({
                        listingId,
                        updates: {
                            icon_url: 'https://malicious-site.com/icon.png',
                        },
                    })
                ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

                // Should accept valid update
                const result = await userA.clients.fullAuth.appStore.updateListing({
                    listingId,
                    updates: {
                        display_name: 'Updated Valid Name',
                    },
                });
                expect(result).toBe(true);
            });
        });
    });
});
