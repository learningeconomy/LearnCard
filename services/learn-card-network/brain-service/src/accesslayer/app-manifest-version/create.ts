import { neogma } from '@instance';
import { v4 as uuid } from 'uuid';

import type { AppManifest } from '@learncard/types';

import type { AppManifestVersionType } from 'types/app-manifest';

import { readAppManifestVersionById } from './read';

/**
 * Computes the next version number for an integration's manifest and creates the
 * AppManifestVersion node + HAS_MANIFEST_VERSION relationship atomically.
 *
 * The version read (`coalesce(max(existing.version), 0) + 1`) and the node/relationship
 * CREATE happen in a single Cypher statement/transaction, so there is no gap between
 * "read latest version" and "write new version" for concurrent submits to race in — unlike
 * a separate getLatestManifestVersionForIntegration() read followed by a later create call.
 * Creating the relationship also takes a write lock on the `integration` node for the
 * duration of the transaction, which serializes concurrent creates for the same integration.
 */
export const createAppManifestVersion = async ({
    integrationId,
    manifestHash,
    manifest,
    status = 'draft',
}: {
    integrationId: string;
    manifestHash: string;
    manifest: AppManifest;
    status?: 'draft' | 'active' | 'superseded';
}): Promise<AppManifestVersionType> => {
    const id = uuid();
    const createdAt = new Date().toISOString();

    const result = await neogma.queryRunner.run(
        `MATCH (integration:Integration {id: $integrationId})
         OPTIONAL MATCH (integration)-[:HAS_MANIFEST_VERSION]->(existing:AppManifestVersion)
         WITH integration, coalesce(max(existing.version), 0) + 1 AS nextVersion
         CREATE (integration)-[:HAS_MANIFEST_VERSION]->(manifestVersion:AppManifestVersion {
             id: $id,
             version: nextVersion,
             manifestHash: $manifestHash,
             manifestJson: $manifestJson,
             status: $status,
             createdAt: $createdAt
         })
         RETURN manifestVersion`,
        {
            integrationId,
            id,
            manifestHash,
            manifestJson: JSON.stringify(manifest),
            status,
            createdAt,
        }
    );

    if (!result.records[0]) {
        throw new Error(
            `Failed to create app manifest version for integration "${integrationId}": integration not found`
        );
    }

    const created = await readAppManifestVersionById(id);

    if (!created) {
        throw new Error(
            `Failed to create app manifest version for integration "${integrationId}": manifest version "${id}" was written but could not be read back`
        );
    }

    return created;
};
