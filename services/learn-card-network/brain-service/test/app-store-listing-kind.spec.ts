import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'crypto';

import { neogma } from '@instance';
import { readAppStoreListingByIdCached } from '@cache/app-store.caches';
import { createAppStoreListing } from '@accesslayer/app-store-listing/create';
import { readAppStoreListingById } from '@accesslayer/app-store-listing/read';
import { updateAppStoreListing } from '@accesslayer/app-store-listing/update';
import { createListingVersion } from '@accesslayer/listing-version/create';
import {
    readListingVersionById,
    readListingVersionsForListing,
} from '@accesslayer/listing-version/read';
import { createIntegration } from '@accesslayer/integration/create';
import { associateIntegrationWithProfile } from '@accesslayer/integration/relationships/create';
import { AppStoreListing, Integration, ListingVersion, Profile } from '@models';
import { AppStoreListingCreateValidator } from 'types/app-store-listing';

import { getUser } from './helpers/getClient';
import { makeListingInput } from './helpers/app-store.helpers';
import {
    backfillListingKind,
    getListingKindBackfillVerification,
} from '../scripts/backfill-listing-kind';

let userA: Awaited<ReturnType<typeof getUser>>;

const seedProfile = async (profileId: string): Promise<void> => {
    await userA.clients.fullAuth.profile.createProfile({ profileId });
};

const seedOwnedIntegration = async (profileId: string): Promise<string> => {
    const integration = await createIntegration({
        name: `Integration ${randomUUID()}`,
        description: 'Kind migration test integration',
        whitelistedDomains: ['example.com'],
    });

    await associateIntegrationWithProfile(integration.id, profileId);

    return integration.id;
};

const createLegacyListingNode = async (overrides?: {
    listingId?: string;
    slug?: string;
}): Promise<string> => {
    const listingId = overrides?.listingId ?? `legacy-${randomUUID()}`;
    const slug = overrides?.slug ?? `legacy-${randomUUID()}`;

    await neogma.queryRunner.run(
        `CREATE (:AppStoreListing {
            listing_id: $listingId,
            slug: $slug,
            display_name: 'Legacy Listing',
            tagline: 'Legacy row',
            full_description: 'Legacy row without kind',
            icon_url: 'https://example.com/icon.png',
            app_listing_status: 'LISTED',
            launch_type: 'EMBEDDED_IFRAME',
            launch_config_json: $launchConfigJson,
            category: 'Learning',
            promotion_level: 'STANDARD'
        })`,
        {
            listingId,
            slug,
            launchConfigJson: JSON.stringify({ iframeUrl: 'https://example.com/app' }),
        }
    );

    return listingId;
};

describe('AppStoreListing kind migration', () => {
    beforeAll(async () => {
        userA = await getUser('d'.repeat(64));
    });

    beforeEach(async () => {
        await ListingVersion.delete({ detach: true, where: {} });
        await AppStoreListing.delete({ detach: true, where: {} });
        await Integration.delete({ detach: true, where: {} });
        await Profile.delete({ detach: true, where: {} });

        await seedProfile('kind-user');
    });

    afterAll(async () => {
        await ListingVersion.delete({ detach: true, where: {} });
        await AppStoreListing.delete({ detach: true, where: {} });
        await Integration.delete({ detach: true, where: {} });
        await Profile.delete({ detach: true, where: {} });
    });

    it('normalizes a legacy listing row without kind to APP on read and cache boundaries', async () => {
        const listingId = await createLegacyListingNode();

        const listing = await readAppStoreListingById(listingId);
        const cachedListing = await readAppStoreListingByIdCached(listingId);

        expect(listing?.kind).toBe('APP');
        expect(cachedListing?.kind).toBe('APP');
    });

    it('creates and round-trips each supported kind', async () => {
        const integrationId = await seedOwnedIntegration('kind-user');
        const supportedKinds = ['APP', 'INTEGRATION', 'WALLET', 'BUNDLE'] as const;

        for (const kind of supportedKinds) {
            const listingId = await userA.clients.fullAuth.appStore.createListing({
                integrationId,
                listing: {
                    ...makeListingInput({ display_name: `${kind} Listing` }),
                    kind,
                },
            });

            const listing = await userA.clients.fullAuth.appStore.getListing({ listingId });

            expect(listing?.kind).toBe(kind);
        }
    });

    it('rejects invalid kind on create validation', async () => {
        const result = AppStoreListingCreateValidator.safeParse({
            ...makeListingInput(),
            kind: 'NOT_A_KIND',
        });

        expect(result.success).toBe(false);
    });

    it('rejects a kind change on ordinary update while tolerating the same value', async () => {
        const integrationId = await seedOwnedIntegration('kind-user');
        const listingId = await userA.clients.fullAuth.appStore.createListing({
            integrationId,
            listing: {
                ...makeListingInput({ display_name: 'Mutable Kind Listing' }),
                kind: 'APP',
            },
        });

        await expect(
            userA.clients.fullAuth.appStore.updateListing({
                listingId,
                updates: { kind: 'INTEGRATION' },
            })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

        await expect(
            userA.clients.fullAuth.appStore.updateListing({
                listingId,
                updates: { kind: 'APP', display_name: 'Updated Listing Name' },
            })
        ).resolves.toBe(true);

        const listing = await readAppStoreListingById(listingId);
        expect(listing?.kind).toBe('APP');
        expect(listing?.display_name).toBe('Updated Listing Name');
    });

    it('backfills legacy rows to kind APP and verifies zero missing kinds remain', async () => {
        await createLegacyListingNode({ listingId: `legacy-backfill-${randomUUID()}` });

        const before = await getListingKindBackfillVerification(neogma);
        const updatedCount = await backfillListingKind(neogma);
        const after = await getListingKindBackfillVerification(neogma);

        expect(before.listingsMissingKind).toBe(1);
        expect(updatedCount).toBe(1);
        expect(after.listingsMissingKind).toBe(0);
    });

    it('creates and reads immutable ListingVersion artifacts through HAS_VERSION', async () => {
        const listing = await createAppStoreListing(
            makeListingInput({
                listing_id: `listing-${randomUUID()}`,
                display_name: 'Versioned Listing',
                kind: 'INTEGRATION',
            })
        );

        const version = await createListingVersion(listing.listing_id, {
            version: '1.0.0',
            status: 'DRAFT',
            manifest_json: JSON.stringify({ manifest: 'stub' }),
            publisher_did: 'did:web:example.com:publisher',
        });

        const byId = await readListingVersionById(version.version_id);
        const byListing = await readListingVersionsForListing(listing.listing_id);
        const createModule = await import('../src/accesslayer/listing-version/create');
        const readModule = await import('../src/accesslayer/listing-version/read');

        expect(byId?.version_id).toBe(version.version_id);
        expect(byListing).toHaveLength(1);
        expect(byListing[0]?.version).toBe('1.0.0');
        expect('updateListingVersion' in createModule).toBe(false);
        expect('deleteListingVersion' in readModule).toBe(false);
    });

    it('preserves kind on ordinary access-layer metadata updates', async () => {
        const listing = await createAppStoreListing(
            makeListingInput({
                listing_id: `listing-${randomUUID()}`,
                display_name: 'Access Layer Listing',
                kind: 'WALLET',
            })
        );

        await updateAppStoreListing(listing, { display_name: 'Access Layer Listing Updated' });

        const updated = await readAppStoreListingById(listing.listing_id);
        expect(updated?.kind).toBe('WALLET');
        expect(updated?.display_name).toBe('Access Layer Listing Updated');
    });
});
