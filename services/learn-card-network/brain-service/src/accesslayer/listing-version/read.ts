import { neogma } from '@instance';

import type { ListingVersionType } from 'types/listing-version';

const mapListingVersionRecord = (version: Record<string, unknown>): ListingVersionType => ({
    version_id: String(version.version_id),
    version: String(version.version),
    status: String(version.status),
    manifest_json: typeof version.manifest_json === 'string' ? version.manifest_json : undefined,
    manifest_hash: typeof version.manifest_hash === 'string' ? version.manifest_hash : undefined,
    publisher_did: typeof version.publisher_did === 'string' ? version.publisher_did : undefined,
    signature: typeof version.signature === 'string' ? version.signature : undefined,
    review_snapshot_json:
        typeof version.review_snapshot_json === 'string' ? version.review_snapshot_json : undefined,
    created_at: String(version.created_at),
});

export const readListingVersionById = async (
    versionId: string
): Promise<ListingVersionType | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (version:ListingVersion {version_id: $versionId})
         RETURN version
         LIMIT 1`,
        { versionId }
    );

    const version = result.records[0]?.get('version')?.properties;

    if (!version) return null;

    return mapListingVersionRecord(version as Record<string, unknown>);
};

export const readListingVersionsForListing = async (
    listingId: string
): Promise<ListingVersionType[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (:AppStoreListing {listing_id: $listingId})-[:HAS_VERSION]->(version:ListingVersion)
         RETURN version
         ORDER BY version.created_at DESC, version.version_id DESC`,
        { listingId }
    );

    return result.records.map(record =>
        mapListingVersionRecord(record.get('version')?.properties as Record<string, unknown>)
    );
};
