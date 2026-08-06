import { v4 as uuid } from 'uuid';

import { ListingVersion } from '@models';
import { neogma } from '@instance';
import { computeManifestHash } from '@helpers/manifest-signature.helpers';

import type { ListingVersionCreateType, ListingVersionType } from 'types/listing-version';

export const createListingVersion = async (
    listingId: string,
    input: ListingVersionCreateType
): Promise<ListingVersionType> => {
    const existingVersion = await neogma.queryRunner.run(
        `MATCH (:AppStoreListing {listing_id: $listingId})-[:HAS_VERSION]->(version:ListingVersion {version: $version})
         RETURN version.version_id AS versionId
         LIMIT 1`,
        { listingId, version: input.version }
    );

    if (existingVersion.records.length > 0) {
        throw new Error(
            `Listing ${listingId} already has immutable ListingVersion ${input.version}.`
        );
    }

    let manifestHash = input.manifest_hash;
    let publisherDid = input.publisher_did;
    let signature = input.signature;

    if (input.manifest_json) {
        const manifest = JSON.parse(input.manifest_json) as {
            publisherDid?: unknown;
            signature?: { sig?: unknown };
        };

        manifestHash ??= computeManifestHash(manifest);
        publisherDid ??=
            typeof manifest.publisherDid === 'string' ? manifest.publisherDid : undefined;
        signature ??=
            manifest.signature && typeof manifest.signature.sig === 'string'
                ? manifest.signature.sig
                : undefined;
    }

    const version = {
        version_id: input.version_id ?? uuid(),
        version: input.version,
        status: input.status,
        manifest_json: input.manifest_json,
        manifest_hash: manifestHash,
        publisher_did: publisherDid,
        signature,
        review_snapshot_json: input.review_snapshot_json,
        created_at: input.created_at ?? new Date().toISOString(),
    } satisfies ListingVersionType;

    await ListingVersion.createOne(version);

    await neogma.queryRunner.run(
        `MATCH (listing:AppStoreListing {listing_id: $listingId})
         MATCH (version:ListingVersion {version_id: $versionId})
         MERGE (listing)-[:HAS_VERSION]->(version)`,
        { listingId, versionId: version.version_id }
    );

    return version;
};
