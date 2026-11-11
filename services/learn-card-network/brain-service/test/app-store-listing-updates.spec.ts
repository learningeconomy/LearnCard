import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AppManifestVersion, AppStoreListing, Integration, Profile } from '@models';

import { getUser } from './helpers/getClient';
import { seedListedApp } from './helpers/app-store.helpers';

import type { AppManifest } from '@learncard/types';

let owner: Awaited<ReturnType<typeof getUser>>;
let stranger: Awaited<ReturnType<typeof getUser>>;
let admin: Awaited<ReturnType<typeof getUser>>;

const cleanup = async () => {
    await AppManifestVersion.delete({ detach: true, where: {} });
    await AppStoreListing.delete({ detach: true, where: {} });
    await Integration.delete({ detach: true, where: {} });
    await Profile.delete({ detach: true, where: {} });
};

const manifest = (permissions: string[]): AppManifest => ({
    manifestVersion: 1,
    appUrl: 'https://app.example.com',
    permissions,
    templates: [],
    consentRequests: [],
    featuresLaunched: [],
    counterKeys: [],
    usedLearnerContext: false,
    usedNotifications: false,
    firstCapturedAt: '2026-01-01T00:00:00.000Z',
    lastUpdatedAt: '2026-01-01T00:00:00.000Z',
});

describe('updates to live apps', () => {
    beforeAll(async () => {
        owner = await getUser('a'.repeat(64));
        stranger = await getUser('b'.repeat(64));
        admin = await getUser('d'.repeat(64));
    });

    beforeEach(async () => {
        await cleanup();
        await owner.clients.fullAuth.profile.createProfile({ profileId: 'listing-owner' });
        await stranger.clients.fullAuth.profile.createProfile({ profileId: 'stranger' });
        await admin.clients.fullAuth.profile.createProfile({ profileId: 'app-store-admin' });
    });

    afterAll(cleanup);

    const getOwned = async (listingId: string) =>
        owner.clients.fullAuth.appStore.getListing({ listingId });

    it('holds edits to a live app until they are approved', async () => {
        const { listing } = await seedListedApp('listing-owner');

        await owner.clients.fullAuth.appStore.updateListing({
            listingId: listing.listing_id,
            updates: { tagline: 'A brand new tagline', screenshots: ['https://example.com/s.png'] },
        });

        const publicListing = await stranger.clients.fullAuth.appStore.getPublicListing({
            listingId: listing.listing_id,
        });
        expect(publicListing?.tagline).toBe('A test application');
        expect(publicListing).not.toHaveProperty('pending_update');

        const owned = await getOwned(listing.listing_id);
        expect(owned?.tagline).toBe('A test application');
        expect(owned?.pending_update).toMatchObject({
            status: 'DRAFT',
            changes: { tagline: 'A brand new tagline', screenshots: ['https://example.com/s.png'] },
        });
    });

    it('applies an approved update to the live listing', async () => {
        const { listing } = await seedListedApp('listing-owner');
        const listingId = listing.listing_id;

        await owner.clients.fullAuth.appStore.updateListing({
            listingId,
            updates: { tagline: 'Approved tagline' },
        });
        await owner.clients.fullAuth.appStore.submitListingUpdate({ listingId });

        expect((await getOwned(listingId))?.pending_update?.status).toBe('PENDING_REVIEW');

        await admin.clients.fullAuth.appStore.adminReviewListingUpdate({
            listingId,
            approve: true,
        });

        const owned = await getOwned(listingId);
        expect(owned?.tagline).toBe('Approved tagline');
        expect(owned?.app_listing_status).toBe('LISTED');
        expect(owned?.pending_update).toBeUndefined();
    });

    it('keeps rejected changes editable without touching the live listing', async () => {
        const { listing } = await seedListedApp('listing-owner');
        const listingId = listing.listing_id;

        await owner.clients.fullAuth.appStore.updateListing({
            listingId,
            updates: { tagline: 'Rejected tagline' },
        });
        await owner.clients.fullAuth.appStore.submitListingUpdate({ listingId });
        await admin.clients.fullAuth.appStore.adminReviewListingUpdate({
            listingId,
            approve: false,
        });

        const owned = await getOwned(listingId);
        expect(owned?.tagline).toBe('A test application');
        expect(owned?.pending_update).toMatchObject({
            status: 'DRAFT',
            changes: { tagline: 'Rejected tagline' },
        });
    });

    it('blocks edits while an update is in review, until it is withdrawn', async () => {
        const { listing } = await seedListedApp('listing-owner');
        const listingId = listing.listing_id;

        await owner.clients.fullAuth.appStore.updateListing({
            listingId,
            updates: { tagline: 'First' },
        });
        await owner.clients.fullAuth.appStore.submitListingUpdate({ listingId });

        await expect(
            owner.clients.fullAuth.appStore.updateListing({
                listingId,
                updates: { tagline: 'Second' },
            })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

        await owner.clients.fullAuth.appStore.withdrawListingUpdate({ listingId });
        await owner.clients.fullAuth.appStore.updateListing({
            listingId,
            updates: { tagline: 'Second' },
        });

        expect((await getOwned(listingId))?.pending_update).toMatchObject({
            status: 'DRAFT',
            changes: { tagline: 'Second' },
        });
    });

    it('discards unsubmitted changes', async () => {
        const { listing } = await seedListedApp('listing-owner');
        const listingId = listing.listing_id;

        await owner.clients.fullAuth.appStore.updateListing({
            listingId,
            updates: { tagline: 'Never mind' },
        });
        await owner.clients.fullAuth.appStore.discardListingUpdate({ listingId });

        expect((await getOwned(listingId))?.pending_update).toBeUndefined();
    });

    it('holds new capabilities for a live app instead of switching them on', async () => {
        const { listing, integration } = await seedListedApp('listing-owner');
        const listingId = listing.listing_id;

        const first = await owner.clients.fullAuth.appStore.submitAppManifest({
            integrationId: integration.id,
            manifest: manifest(['request_identity']),
        });
        const applied = await owner.clients.fullAuth.appStore.applyManifestVersion({
            integrationId: integration.id,
            version: first.version,
            listingId,
        });

        expect(applied).toMatchObject({ applied: false, pendingReview: true });
        expect((await getOwned(listingId))?.pending_update?.manifest_version).toBe(first.version);

        await owner.clients.fullAuth.appStore.submitListingUpdate({ listingId });
        await admin.clients.fullAuth.appStore.adminReviewListingUpdate({
            listingId,
            approve: true,
        });

        const versions = await owner.clients.fullAuth.appStore.getManifestVersions({
            integrationId: integration.id,
        });
        expect(versions.records[0]).toMatchObject({ version: first.version, status: 'active' });
    });

    it('refuses to submit a localhost address in an update', async () => {
        const { listing } = await seedListedApp('listing-owner');
        const listingId = listing.listing_id;

        await owner.clients.fullAuth.appStore.updateListing({
            listingId,
            updates: {
                launch_type: 'EMBEDDED_IFRAME',
                launch_config_json: JSON.stringify({ url: 'http://localhost:4321' }),
            },
        });

        await expect(
            owner.clients.fullAuth.appStore.submitListingUpdate({ listingId })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('only lets the owner manage updates and only admins review them', async () => {
        const { listing } = await seedListedApp('listing-owner');
        const listingId = listing.listing_id;

        await owner.clients.fullAuth.appStore.updateListing({
            listingId,
            updates: { tagline: 'Mine' },
        });

        await expect(
            stranger.clients.fullAuth.appStore.submitListingUpdate({ listingId })
        ).rejects.toBeDefined();
        await expect(
            stranger.clients.fullAuth.appStore.discardListingUpdate({ listingId })
        ).rejects.toBeDefined();

        await owner.clients.fullAuth.appStore.submitListingUpdate({ listingId });
        await expect(
            owner.clients.fullAuth.appStore.adminReviewListingUpdate({ listingId, approve: true })
        ).rejects.toBeDefined();

        const pendingForAdmin = await admin.clients.fullAuth.appStore.adminGetAllListings({
            pendingUpdatesOnly: true,
        });
        expect(pendingForAdmin.records.map(record => record.listing_id)).toEqual([listingId]);
        expect(pendingForAdmin.records[0]?.pending_update?.changes.tagline).toBe('Mine');
    });
});
