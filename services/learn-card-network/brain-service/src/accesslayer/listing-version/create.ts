import { v4 as uuid } from 'uuid';

import { ListingVersion } from '@models';
import { neogma } from '@instance';

import type { ListingVersionCreateType, ListingVersionType } from 'types/listing-version';

export const createListingVersion = async (
    listingId: string,
    input: ListingVersionCreateType
): Promise<ListingVersionType> => {
    const version = {
        version_id: input.version_id ?? uuid(),
        version: input.version,
        status: input.status,
        manifest_json: input.manifest_json,
        publisher_did: input.publisher_did,
        signature: input.signature,
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
