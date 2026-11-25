import { neogma } from '@instance';

export const updateAppManifestVersion = async (
    id: string,
    updates: Partial<{
        status: 'draft' | 'active' | 'superseded';
        activatedAt: string | null;
    }>
): Promise<boolean> => {
    const setClauses: string[] = [];
    const params: Record<string, unknown> = { id };

    if (typeof updates.status !== 'undefined') {
        params.status = updates.status;
        setClauses.push('manifestVersion.status = $status');
    }
    if (typeof updates.activatedAt !== 'undefined') {
        params.activatedAt = updates.activatedAt;
        setClauses.push('manifestVersion.activatedAt = $activatedAt');
    }

    if (setClauses.length === 0) return true;

    const result = await neogma.queryRunner.run(
        `MATCH (manifestVersion:AppManifestVersion {id: $id})
         SET ${setClauses.join(', ')}`,
        params
    );

    return result.summary.updateStatistics.containsUpdates();
};

export const markManifestVersionsSuperseded = async (
    integrationId: string,
    exceptId: string
): Promise<boolean> => {
    const result = await neogma.queryRunner.run(
        `MATCH (:Integration {id: $integrationId})-[:HAS_MANIFEST_VERSION]->(manifestVersion:AppManifestVersion)
         WHERE manifestVersion.id <> $exceptId AND manifestVersion.status = 'active'
         SET manifestVersion.status = 'superseded'`,
        { integrationId, exceptId }
    );

    return result.summary.updateStatistics.containsUpdates();
};

export const associateListingWithManifestVersion = async (
    listingId: string,
    manifestVersionId: string
): Promise<boolean> => {
    await neogma.queryRunner.run(
        `MATCH (listing:AppStoreListing {listing_id: $listingId})
         MATCH (manifestVersion:AppManifestVersion {id: $manifestVersionId})
         OPTIONAL MATCH (listing)-[existing:USES_MANIFEST_VERSION]->(:AppManifestVersion)
         DELETE existing
         MERGE (listing)-[:USES_MANIFEST_VERSION]->(manifestVersion)`,
        { listingId, manifestVersionId }
    );

    return true;
};
