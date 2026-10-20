import { randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import type { WorkloadPackage } from '@learncard/types';
import { neogma } from '@instance';
import {
    assertSignedWorkloadPackageOrThrow,
    computeWorkloadManifestHash,
} from '@helpers/manifest-signature.helpers';
import { assertWorkloadCurator } from '@helpers/workload-package.helpers';
import {
    WorkloadPackageVersionRecordValidator,
    type WorkloadPackageVersionRecord,
} from 'types/workload-package';

/** Enforce uniqueness before accepting writes, including direct seed/access-layer callers. */
export const ensureWorkloadPackageConstraints = async (): Promise<void> => {
    for (const query of [
        'CREATE CONSTRAINT workload_package_id IF NOT EXISTS FOR (p:WorkloadPackage) REQUIRE p.id IS UNIQUE',
        'CREATE CONSTRAINT workload_version_id IF NOT EXISTS FOR (v:WorkloadPackageVersion) REQUIRE v.versionId IS UNIQUE',
        'CREATE CONSTRAINT workload_package_version IF NOT EXISTS FOR (v:WorkloadPackageVersion) REQUIRE (v.packageId, v.version) IS UNIQUE',
    ])
        await neogma.queryRunner.run(query);
};

export const publishWorkloadPackageVersion = async (
    manifestJson: string
): Promise<WorkloadPackageVersionRecord> => {
    const manifest = await assertSignedWorkloadPackageOrThrow(manifestJson);
    assertWorkloadCurator(manifest.publisherDid);
    // Verification above establishes this type without transforming the signed payload.
    const manifestHash = computeWorkloadManifestHash(JSON.parse(manifestJson) as WorkloadPackage);
    await ensureWorkloadPackageConstraints();
    const result = await neogma.queryRunner.run(
        `MERGE (p:WorkloadPackage {id: $packageId})
         ON CREATE SET p.publisherDid = $publisherDid, p.createdAt = $createdAt
         WITH p WHERE p.publisherDid = $publisherDid
         MERGE (v:WorkloadPackageVersion {packageId: $packageId, version: $version})
         ON CREATE SET v.versionId = $versionId, v.manifestHash = $manifestHash,
                       v.manifestJson = $manifestJson, v.status = 'PUBLISHED', v.createdAt = $createdAt
         MERGE (p)-[:HAS_VERSION]->(v)
         RETURN properties(v) AS version`,
        {
            packageId: manifest.id,
            publisherDid: manifest.publisherDid,
            version: manifest.version,
            versionId: `wpv_${randomUUID()}`,
            manifestHash,
            manifestJson,
            createdAt: new Date().toISOString(),
        }
    );
    if (!result.records[0])
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Package belongs to another publisher.',
        });
    const version = WorkloadPackageVersionRecordValidator.parse(result.records[0].get('version'));
    if (version.manifestHash !== manifestHash)
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'Workload package versions are immutable.',
        });
    return version;
};
