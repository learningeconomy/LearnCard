import { describe, it, beforeAll, beforeEach, afterAll, expect } from 'vitest';

import { getUser } from './helpers/getClient';

import { AppStoreListing, Integration, Profile } from '@models';

import { createAppStoreListing } from '@accesslayer/app-store-listing/create';
import {
    associateListingWithIntegration,
    installAppForProfile,
} from '@accesslayer/app-store-listing/relationships/create';
import { createIntegration } from '@accesslayer/integration/create';
import { associateIntegrationWithProfile } from '@accesslayer/integration/relationships/create';
import cache from '@cache';

let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;

const makeListingInput = (overrides?: Record<string, unknown>) => ({
    display_name: 'Notification Test App',
    tagline: 'An app that sends notifications',
    full_description: 'Test application for app notification tests',
    icon_url: 'https://example.com/icon.png',
    app_listing_status: 'LISTED' as const,
    launch_type: 'EMBEDDED_IFRAME' as const,
    launch_config_json: JSON.stringify({ url: 'https://app.example.com' }),
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

const seedListedApp = async (ownerProfileId: string, overrides?: Record<string, unknown>) => {
    const integration = await seedIntegration('Notif App Integration', ownerProfileId);

    const listing = await createAppStoreListing(makeListingInput(overrides));

    await associateListingWithIntegration(listing.listing_id, integration.id);

    return { listing, integration };
};

describe('App Notifications', () => {
    beforeAll(async () => {
        userA = await getUser('a'.repeat(64));
        userB = await getUser('b'.repeat(64));
    });

    beforeEach(async () => {
        await AppStoreListing.delete({ detach: true, where: {} });
        await Integration.delete({ detach: true, where: {} });
        await Profile.delete({ detach: true, where: {} });

        await seedProfile(userA, 'usera');
        await seedProfile(userB, 'userb');
    });

    afterAll(async () => {
        await AppStoreListing.delete({ detach: true, where: {} });
        await Integration.delete({ detach: true, where: {} });
        await Profile.delete({ detach: true, where: {} });
    });

    // ==================== sendAppNotification (server-to-server) ====================

    describe('sendAppNotification (server-to-server)', () => {
        it('sends a notification to an installed user', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('userb', listing.listing_id);

            const result = await userA.clients.fullAuth.appStore.sendAppNotification({
                listingId: listing.listing_id,
                recipient: 'userb',
                title: 'Hello from the app!',
                body: 'You have a new reward.',
                actionPath: '/rewards',
                category: 'reward',
                priority: 'normal',
            });

            expect(result).toEqual({ sent: true });
        });

        it('sends with only a title (no body)', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('userb', listing.listing_id);

            const result = await userA.clients.fullAuth.appStore.sendAppNotification({
                listingId: listing.listing_id,
                recipient: 'userb',
                title: 'Title only',
            });

            expect(result).toEqual({ sent: true });
        });

        it('sends with only a body (no title)', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('userb', listing.listing_id);

            const result = await userA.clients.fullAuth.appStore.sendAppNotification({
                listingId: listing.listing_id,
                recipient: 'userb',
                body: 'Body only notification',
            });

            expect(result).toEqual({ sent: true });
        });

        it('rejects when neither title nor body is provided', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('userb', listing.listing_id);

            await expect(
                userA.clients.fullAuth.appStore.sendAppNotification({
                    listingId: listing.listing_id,
                    recipient: 'userb',
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('rejects when caller does not own the listing', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('userb', listing.listing_id);

            await expect(
                userB.clients.fullAuth.appStore.sendAppNotification({
                    listingId: listing.listing_id,
                    recipient: 'userb',
                    title: 'Unauthorized',
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('rejects when recipient does not have the app installed', async () => {
            const { listing } = await seedListedApp('usera');

            // userB has NOT installed the app

            await expect(
                userA.clients.fullAuth.appStore.sendAppNotification({
                    listingId: listing.listing_id,
                    recipient: 'userb',
                    title: 'Not installed',
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('rejects when listing does not exist', async () => {
            await expect(
                userA.clients.fullAuth.appStore.sendAppNotification({
                    listingId: 'nonexistent-listing-id',
                    recipient: 'userb',
                    title: 'Ghost app',
                })
            ).rejects.toThrow();
        });

        it('rejects when recipient profile does not exist', async () => {
            const { listing } = await seedListedApp('usera');

            await expect(
                userA.clients.fullAuth.appStore.sendAppNotification({
                    listingId: listing.listing_id,
                    recipient: 'nonexistent-profile',
                    title: 'No such user',
                })
            ).rejects.toThrow();
        });

        it('accepts recipient as a did:web', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('userb', listing.listing_id);

            // did:web format: did:web:domain:users:profileId
            const result = await userA.clients.fullAuth.appStore.sendAppNotification({
                listingId: listing.listing_id,
                recipient: 'did:web:localhost%3A3000:users:userb',
                title: 'Via DID',
            });

            expect(result).toEqual({ sent: true });
        });

        it('rate limits at 60 notifications per listing per hour', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('userb', listing.listing_id);

            // Clear any existing rate limit keys
            const rateLimitKey = `app-notif-server-rate:${listing.listing_id}`;
            await cache.delete([rateLimitKey]);

            // Send 60 notifications (should all succeed)
            for (let i = 0; i < 60; i++) {
                await userA.clients.fullAuth.appStore.sendAppNotification({
                    listingId: listing.listing_id,
                    recipient: 'userb',
                    title: `Notification ${i + 1}`,
                });
            }

            // 61st should be rate-limited
            await expect(
                userA.clients.fullAuth.appStore.sendAppNotification({
                    listingId: listing.listing_id,
                    recipient: 'userb',
                    title: 'One too many',
                })
            ).rejects.toMatchObject({
                message: expect.stringContaining('Rate limit'),
            });

            // Clean up
            await cache.delete([rateLimitKey]);
        });

        it('defaults priority to normal', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('userb', listing.listing_id);

            // No priority specified — should not throw
            const result = await userA.clients.fullAuth.appStore.sendAppNotification({
                listingId: listing.listing_id,
                recipient: 'userb',
                title: 'Default priority',
            });

            expect(result).toEqual({ sent: true });
        });

        it('accepts high priority', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('userb', listing.listing_id);

            const result = await userA.clients.fullAuth.appStore.sendAppNotification({
                listingId: listing.listing_id,
                recipient: 'userb',
                title: 'Urgent!',
                priority: 'high',
            });

            expect(result).toEqual({ sent: true });
        });
    });

    // ==================== appEvent send-notification (SDK path) ====================

    describe('appEvent send-notification (SDK path)', () => {
        it('sends a self-notification via SDK event', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('usera', listing.listing_id);

            const result = await userA.clients.fullAuth.appStore.appEvent({
                listingId: listing.listing_id,
                event: {
                    type: 'send-notification',
                    title: 'SDK notification',
                    body: 'Sent from the app',
                    actionPath: '/dashboard',
                    category: 'status',
                    priority: 'normal',
                },
            });

            expect(result).toMatchObject({ sent: true });
        });

        it('works with only title', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('usera', listing.listing_id);

            const result = await userA.clients.fullAuth.appStore.appEvent({
                listingId: listing.listing_id,
                event: {
                    type: 'send-notification',
                    title: 'Title only SDK',
                },
            });

            expect(result).toMatchObject({ sent: true });
        });

        it('rejects when neither title nor body is provided', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('usera', listing.listing_id);

            await expect(
                userA.clients.fullAuth.appStore.appEvent({
                    listingId: listing.listing_id,
                    event: {
                        type: 'send-notification',
                    },
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('rejects when app is not installed', async () => {
            const { listing } = await seedListedApp('usera');

            // userB has NOT installed the app and does NOT own the integration
            await expect(
                userB.clients.fullAuth.appStore.appEvent({
                    listingId: listing.listing_id,
                    event: {
                        type: 'send-notification',
                        title: 'Not installed',
                    },
                })
            ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        });

        it('allows integration owner without installation', async () => {
            const { listing } = await seedListedApp('usera');

            // userA owns the integration but has not installed the app
            const result = await userA.clients.fullAuth.appStore.appEvent({
                listingId: listing.listing_id,
                event: {
                    type: 'send-notification',
                    title: 'Owner testing',
                },
            });

            expect(result).toMatchObject({ sent: true });
        });

        it('rejects malformed event data via Zod validation', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('usera', listing.listing_id);

            await expect(
                userA.clients.fullAuth.appStore.appEvent({
                    listingId: listing.listing_id,
                    event: {
                        type: 'send-notification',
                        title: 12345 as unknown as string,
                    },
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('rejects invalid priority value via Zod validation', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('usera', listing.listing_id);

            await expect(
                userA.clients.fullAuth.appStore.appEvent({
                    listingId: listing.listing_id,
                    event: {
                        type: 'send-notification',
                        title: 'Bad priority',
                        priority: 'urgent' as unknown as 'normal' | 'high',
                    },
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('rate limits at 10 notifications per user per app per hour', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('usera', listing.listing_id);

            // Clear any existing rate limit keys
            const rateLimitKey = `app-notif-rate:${listing.listing_id}:usera`;
            await cache.delete([rateLimitKey]);

            // Send 10 notifications (should all succeed)
            for (let i = 0; i < 10; i++) {
                await userA.clients.fullAuth.appStore.appEvent({
                    listingId: listing.listing_id,
                    event: {
                        type: 'send-notification',
                        title: `SDK notif ${i + 1}`,
                    },
                });
            }

            // 11th should be rate-limited
            await expect(
                userA.clients.fullAuth.appStore.appEvent({
                    listingId: listing.listing_id,
                    event: {
                        type: 'send-notification',
                        title: 'One too many',
                    },
                })
            ).rejects.toMatchObject({
                message: expect.stringContaining('Rate limit'),
            });

            // Clean up
            await cache.delete([rateLimitKey]);
        });
    });
});
