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
import { neogma } from '@instance';

let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;

const makeListingInput = (overrides?: Record<string, unknown>) => ({
    display_name: 'Counter Test App',
    tagline: 'An app that uses counters',
    full_description: 'Test application for app counter tests',
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
    const integration = await seedIntegration('Counter App Integration', ownerProfileId);

    const listing = await createAppStoreListing(makeListingInput(overrides));

    await associateListingWithIntegration(listing.listing_id, integration.id);

    return { listing, integration };
};

const cleanupCounters = async () => {
    // Remove all APP_COUNTER relationships from the graph
    await neogma.queryRunner.run('MATCH ()-[r:APP_COUNTER]->() DELETE r', {});
};

describe('App Counters', () => {
    beforeAll(async () => {
        userA = await getUser('c'.repeat(64));
        userB = await getUser('d'.repeat(64));
    });

    beforeEach(async () => {
        await cleanupCounters();
        await AppStoreListing.delete({ detach: true, where: {} });
        await Integration.delete({ detach: true, where: {} });
        await Profile.delete({ detach: true, where: {} });

        await seedProfile(userA, 'usera');
        await seedProfile(userB, 'userb');
    });

    afterAll(async () => {
        await cleanupCounters();
        await AppStoreListing.delete({ detach: true, where: {} });
        await Integration.delete({ detach: true, where: {} });
        await Profile.delete({ detach: true, where: {} });
    });

    // ==================== increment-counter ====================

    describe('increment-counter', () => {
        it('creates a counter on first increment', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('usera', listing.listing_id);

            const result = await userA.clients.fullAuth.appStore.appEvent({
                listingId: listing.listing_id,
                event: {
                    type: 'increment-counter',
                    key: 'coins',
                    amount: 10,
                },
            });

            expect(result).toMatchObject({
                key: 'coins',
                previousValue: 0,
                newValue: 10,
            });
        });

        it('accumulates across multiple increments', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('usera', listing.listing_id);

            await userA.clients.fullAuth.appStore.appEvent({
                listingId: listing.listing_id,
                event: { type: 'increment-counter', key: 'coins', amount: 10 },
            });

            await userA.clients.fullAuth.appStore.appEvent({
                listingId: listing.listing_id,
                event: { type: 'increment-counter', key: 'coins', amount: 5 },
            });

            const result = await userA.clients.fullAuth.appStore.appEvent({
                listingId: listing.listing_id,
                event: { type: 'increment-counter', key: 'coins', amount: 3 },
            });

            expect(result).toMatchObject({
                key: 'coins',
                previousValue: 15,
                newValue: 18,
            });
        });

        it('supports negative amounts (decrement)', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('usera', listing.listing_id);

            await userA.clients.fullAuth.appStore.appEvent({
                listingId: listing.listing_id,
                event: { type: 'increment-counter', key: 'coins', amount: 20 },
            });

            const result = await userA.clients.fullAuth.appStore.appEvent({
                listingId: listing.listing_id,
                event: { type: 'increment-counter', key: 'coins', amount: -5 },
            });

            expect(result).toMatchObject({
                key: 'coins',
                previousValue: 20,
                newValue: 15,
            });
        });

        it('keeps counters scoped per key', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('usera', listing.listing_id);

            await userA.clients.fullAuth.appStore.appEvent({
                listingId: listing.listing_id,
                event: { type: 'increment-counter', key: 'coins', amount: 100 },
            });

            const result = await userA.clients.fullAuth.appStore.appEvent({
                listingId: listing.listing_id,
                event: { type: 'increment-counter', key: 'spins', amount: 3 },
            });

            expect(result).toMatchObject({
                key: 'spins',
                previousValue: 0,
                newValue: 3,
            });
        });

        it('keeps counters scoped per user', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('usera', listing.listing_id);
            await installAppForProfile('userb', listing.listing_id);

            await userA.clients.fullAuth.appStore.appEvent({
                listingId: listing.listing_id,
                event: { type: 'increment-counter', key: 'coins', amount: 50 },
            });

            const result = await userB.clients.fullAuth.appStore.appEvent({
                listingId: listing.listing_id,
                event: { type: 'increment-counter', key: 'coins', amount: 10 },
            });

            expect(result).toMatchObject({
                key: 'coins',
                previousValue: 0,
                newValue: 10,
            });
        });

        it('rejects when app is not installed', async () => {
            const { listing } = await seedListedApp('usera');

            await expect(
                userB.clients.fullAuth.appStore.appEvent({
                    listingId: listing.listing_id,
                    event: { type: 'increment-counter', key: 'coins', amount: 1 },
                })
            ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        });

        it('allows integration owner without installation', async () => {
            const { listing } = await seedListedApp('usera');

            const result = await userA.clients.fullAuth.appStore.appEvent({
                listingId: listing.listing_id,
                event: { type: 'increment-counter', key: 'coins', amount: 5 },
            });

            expect(result).toMatchObject({ key: 'coins', newValue: 5 });
        });

        it('rejects invalid key format', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('usera', listing.listing_id);

            await expect(
                userA.clients.fullAuth.appStore.appEvent({
                    listingId: listing.listing_id,
                    event: { type: 'increment-counter', key: 'bad key!', amount: 1 },
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('rejects key longer than 64 characters', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('usera', listing.listing_id);

            await expect(
                userA.clients.fullAuth.appStore.appEvent({
                    listingId: listing.listing_id,
                    event: {
                        type: 'increment-counter',
                        key: 'a'.repeat(65),
                        amount: 1,
                    },
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('rejects empty key', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('usera', listing.listing_id);

            await expect(
                userA.clients.fullAuth.appStore.appEvent({
                    listingId: listing.listing_id,
                    event: { type: 'increment-counter', key: '', amount: 1 },
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('rejects non-numeric amount', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('usera', listing.listing_id);

            await expect(
                userA.clients.fullAuth.appStore.appEvent({
                    listingId: listing.listing_id,
                    event: {
                        type: 'increment-counter',
                        key: 'coins',
                        amount: 'ten' as unknown as number,
                    },
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('rejects Infinity amount', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('usera', listing.listing_id);

            await expect(
                userA.clients.fullAuth.appStore.appEvent({
                    listingId: listing.listing_id,
                    event: {
                        type: 'increment-counter',
                        key: 'coins',
                        amount: Infinity,
                    },
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('enforces max 50 counter keys per user per app', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('usera', listing.listing_id);

            const rateLimitKey = `app-counter-rate:${listing.listing_id}:usera`;
            await cache.delete([rateLimitKey]);

            // Create 50 distinct keys (at the limit)
            for (let i = 0; i < 50; i++) {
                await userA.clients.fullAuth.appStore.appEvent({
                    listingId: listing.listing_id,
                    event: { type: 'increment-counter', key: `key-${i}`, amount: 1 },
                });
            }

            await cache.delete([rateLimitKey]);

            // 51st distinct key should be rejected
            await expect(
                userA.clients.fullAuth.appStore.appEvent({
                    listingId: listing.listing_id,
                    event: { type: 'increment-counter', key: 'key-overflow', amount: 1 },
                })
            ).rejects.toMatchObject({
                code: 'BAD_REQUEST',
                message: expect.stringContaining('50'),
            });

            await cache.delete([rateLimitKey]);

            // Incrementing an existing key should still work
            const result = await userA.clients.fullAuth.appStore.appEvent({
                listingId: listing.listing_id,
                event: { type: 'increment-counter', key: 'key-0', amount: 5 },
            });

            expect(result).toMatchObject({ key: 'key-0', newValue: 6 });

            await cache.delete([rateLimitKey]);
        });

        it('rate limits at 100 writes per user per app per minute', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('usera', listing.listing_id);

            const rateLimitKey = `app-counter-rate:${listing.listing_id}:usera`;
            await cache.delete([rateLimitKey]);

            // Send 100 increments (should all succeed)
            for (let i = 0; i < 100; i++) {
                await userA.clients.fullAuth.appStore.appEvent({
                    listingId: listing.listing_id,
                    event: { type: 'increment-counter', key: 'coins', amount: 1 },
                });
            }

            // 101st should be rate-limited
            await expect(
                userA.clients.fullAuth.appStore.appEvent({
                    listingId: listing.listing_id,
                    event: { type: 'increment-counter', key: 'coins', amount: 1 },
                })
            ).rejects.toMatchObject({
                message: expect.stringContaining('Rate limit'),
            });

            await cache.delete([rateLimitKey]);
        });
    });

    // ==================== get-counter ====================

    describe('get-counter', () => {
        it('returns 0 for non-existent counter', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('usera', listing.listing_id);

            const result = await userA.clients.fullAuth.appStore.appEvent({
                listingId: listing.listing_id,
                event: { type: 'get-counter', key: 'coins' },
            });

            expect(result).toMatchObject({
                key: 'coins',
                value: 0,
                updatedAt: null,
            });
        });

        it('returns correct value after increments', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('usera', listing.listing_id);

            await userA.clients.fullAuth.appStore.appEvent({
                listingId: listing.listing_id,
                event: { type: 'increment-counter', key: 'coins', amount: 42 },
            });

            const result = await userA.clients.fullAuth.appStore.appEvent({
                listingId: listing.listing_id,
                event: { type: 'get-counter', key: 'coins' },
            });

            expect(result).toMatchObject({
                key: 'coins',
                value: 42,
            });

            expect(result.updatedAt).toBeTruthy();
        });

        it('does not return another user\'s counter', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('usera', listing.listing_id);
            await installAppForProfile('userb', listing.listing_id);

            await userA.clients.fullAuth.appStore.appEvent({
                listingId: listing.listing_id,
                event: { type: 'increment-counter', key: 'coins', amount: 999 },
            });

            const result = await userB.clients.fullAuth.appStore.appEvent({
                listingId: listing.listing_id,
                event: { type: 'get-counter', key: 'coins' },
            });

            expect(result).toMatchObject({ key: 'coins', value: 0 });
        });

        it('rejects invalid key format', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('usera', listing.listing_id);

            await expect(
                userA.clients.fullAuth.appStore.appEvent({
                    listingId: listing.listing_id,
                    event: { type: 'get-counter', key: 'bad key!' },
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });
    });

    // ==================== get-counters ====================

    describe('get-counters', () => {
        it('returns empty array when no counters exist', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('usera', listing.listing_id);

            const result = await userA.clients.fullAuth.appStore.appEvent({
                listingId: listing.listing_id,
                event: { type: 'get-counters' },
            });

            expect(result).toMatchObject({ counters: [] });
        });

        it('returns all counters when keys not specified', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('usera', listing.listing_id);

            await userA.clients.fullAuth.appStore.appEvent({
                listingId: listing.listing_id,
                event: { type: 'increment-counter', key: 'coins', amount: 10 },
            });

            await userA.clients.fullAuth.appStore.appEvent({
                listingId: listing.listing_id,
                event: { type: 'increment-counter', key: 'spins', amount: 3 },
            });

            const result = await userA.clients.fullAuth.appStore.appEvent({
                listingId: listing.listing_id,
                event: { type: 'get-counters' },
            });

            const counters = (result as { counters: Array<{ key: string; value: number }> }).counters;

            expect(counters).toHaveLength(2);

            const coinCounter = counters.find((c: { key: string }) => c.key === 'coins');
            const spinCounter = counters.find((c: { key: string }) => c.key === 'spins');

            expect(coinCounter).toMatchObject({ key: 'coins', value: 10 });
            expect(spinCounter).toMatchObject({ key: 'spins', value: 3 });
        });

        it('filters by specific keys', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('usera', listing.listing_id);

            await userA.clients.fullAuth.appStore.appEvent({
                listingId: listing.listing_id,
                event: { type: 'increment-counter', key: 'coins', amount: 10 },
            });

            await userA.clients.fullAuth.appStore.appEvent({
                listingId: listing.listing_id,
                event: { type: 'increment-counter', key: 'spins', amount: 3 },
            });

            await userA.clients.fullAuth.appStore.appEvent({
                listingId: listing.listing_id,
                event: { type: 'increment-counter', key: 'streak', amount: 7 },
            });

            const result = await userA.clients.fullAuth.appStore.appEvent({
                listingId: listing.listing_id,
                event: { type: 'get-counters', keys: ['coins', 'streak'] },
            });

            const counters = (result as { counters: Array<{ key: string; value: number }> }).counters;

            expect(counters).toHaveLength(2);

            const keys = counters.map((c: { key: string }) => c.key).sort();

            expect(keys).toEqual(['coins', 'streak']);
        });

        it('does not return another user\'s counters', async () => {
            const { listing } = await seedListedApp('usera');

            await installAppForProfile('usera', listing.listing_id);
            await installAppForProfile('userb', listing.listing_id);

            await userA.clients.fullAuth.appStore.appEvent({
                listingId: listing.listing_id,
                event: { type: 'increment-counter', key: 'coins', amount: 100 },
            });

            const result = await userB.clients.fullAuth.appStore.appEvent({
                listingId: listing.listing_id,
                event: { type: 'get-counters' },
            });

            expect(result).toMatchObject({ counters: [] });
        });
    });

    // ==================== cross-app isolation ====================

    describe('cross-app isolation', () => {
        it('counters for one app do not leak into another app', async () => {
            const { listing: listingA } = await seedListedApp('usera', {
                display_name: 'App A',
            });

            const listingB = await createAppStoreListing(
                makeListingInput({ display_name: 'App B' })
            );

            const integrationB = await seedIntegration('App B Integration', 'usera');

            await associateListingWithIntegration(listingB.listing_id, integrationB.id);

            await installAppForProfile('usera', listingA.listing_id);
            await installAppForProfile('usera', listingB.listing_id);

            // Increment counter in app A
            await userA.clients.fullAuth.appStore.appEvent({
                listingId: listingA.listing_id,
                event: { type: 'increment-counter', key: 'coins', amount: 100 },
            });

            // Read from app B — should be empty
            const getResult = await userA.clients.fullAuth.appStore.appEvent({
                listingId: listingB.listing_id,
                event: { type: 'get-counter', key: 'coins' },
            });

            expect(getResult).toMatchObject({ key: 'coins', value: 0 });

            const getAllResult = await userA.clients.fullAuth.appStore.appEvent({
                listingId: listingB.listing_id,
                event: { type: 'get-counters' },
            });

            expect(getAllResult).toMatchObject({ counters: [] });
        });
    });
});
