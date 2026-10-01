import { beforeAll, describe, expect, it } from 'vitest';

import { createAppStoreListing } from '@accesslayer/app-store-listing/create';
import { readAppStoreListingById } from '@accesslayer/app-store-listing/read';
import { createListingVersion } from '@accesslayer/listing-version/create';
import { getLearnCard } from '@helpers/learnCard.helpers';
import { verifyManifestSignature } from '@helpers/manifest-signature.helpers';

import { getUser } from './helpers/getClient';
import { makeListingInput } from './helpers/app-store.helpers';
import { buildSignedManifestForKind } from './helpers/manifest.helpers';

let admin: Awaited<ReturnType<typeof getUser>>;

beforeAll(async () => {
    admin = await getUser('9'.repeat(64));
    await admin.clients.fullAuth.profile.createProfile({ profileId: 'app-store-admin' });
});

describe.each(['WALLET', 'BUNDLE'] as const)('%s publisher-DID publication', kind => {
    it.each(['valid', 'unsigned', 'tampered', 'wrong-DID'] as const)(
        'checks a %s manifest at the publish boundary',
        async variant => {
            const signed = await buildSignedManifestForKind(kind);
            const { signature: _signature, ...unsigned } = signed;
            const manifest =
                variant === 'unsigned'
                    ? unsigned
                    : variant === 'tampered'
                      ? { ...signed, id: `${signed.id}.tampered` }
                      : variant === 'wrong-DID'
                        ? { ...signed, publisherDid: (await getLearnCard('e'.repeat(64))).id.did() }
                        : signed;

            // Recompute stored metadata from the altered payload: rejection must come from
            // publisher verification, not merely a stale cached manifest hash.
            const listing = await createAppStoreListing(
                makeListingInput({ kind, app_listing_status: 'PENDING_REVIEW' })
            );
            await createListingVersion(listing.listing_id, {
                version: '1.0.0',
                status: 'LISTED',
                manifest_json: JSON.stringify(manifest),
            });

            const publish = admin.clients.fullAuth.appStore.adminUpdateListingStatus({
                listingId: listing.listing_id,
                status: 'LISTED',
            });
            if (variant === 'valid') {
                await expect(verifyManifestSignature(signed)).resolves.toBeUndefined();
                await expect(publish).resolves.toBe(true);
            } else {
                await expect(publish).rejects.toMatchObject({ code: 'BAD_REQUEST' });
                expect(
                    (await readAppStoreListingById(listing.listing_id))?.app_listing_status
                ).toBe('PENDING_REVIEW');
            }
        }
    );
});
