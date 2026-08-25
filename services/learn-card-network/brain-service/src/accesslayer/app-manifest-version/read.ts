import { neogma } from '@instance';

import { AppManifestVersionValidator } from '@learncard/types';

import type { AppManifestVersionType } from 'types/app-manifest';

const parseManifestVersionRecord = (
    properties: Record<string, unknown>
): AppManifestVersionType => {
    const manifestJson = properties.manifestJson;
    const rawVersion = properties.version as { toNumber?: () => number } | number;

    if (typeof manifestJson !== 'string') {
        throw new Error('AppManifestVersion.manifestJson is missing');
    }

    return AppManifestVersionValidator.parse({
        id: properties.id,
        version: typeof rawVersion === 'number' ? rawVersion : rawVersion?.toNumber?.(),
        manifestHash: properties.manifestHash,
        manifest: JSON.parse(manifestJson),
        status: properties.status,
        createdAt: properties.createdAt,
        activatedAt: properties.activatedAt,
    });
};

export const readAppManifestVersionById = async (
    id: string
): Promise<AppManifestVersionType | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (manifestVersion:AppManifestVersion {id: $id})
         RETURN manifestVersion
         LIMIT 1`,
        { id }
    );

    const properties = result.records[0]?.get('manifestVersion')?.properties;

    if (!properties) return null;

    return parseManifestVersionRecord(properties as Record<string, unknown>);
};

export const getManifestVersionForIntegration = async (
    integrationId: string,
    version: number
): Promise<AppManifestVersionType | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (:Integration {id: $integrationId})-[:HAS_MANIFEST_VERSION]->(manifestVersion:AppManifestVersion {version: $version})
         RETURN manifestVersion
         LIMIT 1`,
        { integrationId, version }
    );

    const properties = result.records[0]?.get('manifestVersion')?.properties;

    if (!properties) return null;

    return parseManifestVersionRecord(properties as Record<string, unknown>);
};

export const getLatestManifestVersionForIntegration = async (
    integrationId: string
): Promise<AppManifestVersionType | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (:Integration {id: $integrationId})-[:HAS_MANIFEST_VERSION]->(manifestVersion:AppManifestVersion)
         RETURN manifestVersion
         ORDER BY manifestVersion.version DESC
         LIMIT 1`,
        { integrationId }
    );

    const properties = result.records[0]?.get('manifestVersion')?.properties;

    if (!properties) return null;

    return parseManifestVersionRecord(properties as Record<string, unknown>);
};

export const getActiveManifestVersionForIntegration = async (
    integrationId: string
): Promise<AppManifestVersionType | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (:Integration {id: $integrationId})-[:HAS_MANIFEST_VERSION]->(manifestVersion:AppManifestVersion {status: 'active'})
         RETURN manifestVersion
         ORDER BY manifestVersion.activatedAt DESC, manifestVersion.version DESC
         LIMIT 1`,
        { integrationId }
    );

    const properties = result.records[0]?.get('manifestVersion')?.properties;

    if (!properties) return null;

    return parseManifestVersionRecord(properties as Record<string, unknown>);
};

export const getManifestVersionsForIntegration = async (
    integrationId: string,
    { limit, cursor }: { limit: number; cursor?: string }
): Promise<AppManifestVersionType[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (:Integration {id: $integrationId})-[:HAS_MANIFEST_VERSION]->(manifestVersion:AppManifestVersion)
         ${cursor ? 'WHERE manifestVersion.version < toInteger($cursor)' : ''}
         RETURN manifestVersion
         ORDER BY manifestVersion.version DESC
         LIMIT toInteger($limit)`,
        { integrationId, cursor: cursor ?? null, limit }
    );

    return result.records.map(record => {
        const properties = record.get('manifestVersion')?.properties as Record<string, unknown>;
        return parseManifestVersionRecord(properties);
    });
};

export const getListingIdForManifestVersion = async (id: string): Promise<string | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (listing:AppStoreListing)-[:USES_MANIFEST_VERSION]->(:AppManifestVersion {id: $id})
         RETURN listing.listing_id AS listingId
         LIMIT 1`,
        { id }
    );

    const listingId = result.records[0]?.get('listingId');

    return typeof listingId === 'string' ? listingId : null;
};
