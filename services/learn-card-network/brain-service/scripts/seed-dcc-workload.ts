#!/usr/bin/env bun
/** Dev-only catalog publication. No DCC calls, software deployment, operator
 * enablement, or partner authority. Publishes the DCC core-only issuer
 * WorkloadPackage (profile `core` = issuer-coordinator + signing-service; see
 * scripts/fixtures/dcc-workload.ts for why status-db/lcw-exchange are not included)
 * signed by the curator identity, then extends the DCC Tools bundle to v1.2.0 with it
 * as an optional member alongside the existing LCW wallet + registry adapter members
 * (same pins as v1.1.0). Re-runs reuse immutable versions; changed fixtures require a
 * new manifest version.
 */
import * as dotenv from 'dotenv';
import { pathToFileURL } from 'node:url';
import type { BundleManifestV11, CatalogReadinessGate, WorkloadPackage } from '@learncard/types';
import { buildDccCoreWorkloadPackage } from './fixtures/dcc-workload';
import { DCC_READINESS } from './fixtures/dcc-tools';
import { seedDccTools } from './seed-dcc-tools';

const RELEASE_PINNING_NOTE = 'DCC core images pinned by digest 2026-10-20; LEF sign-off OPEN';
const STATUS_LIST_GATE: CatalogReadinessGate = {
    name: 'Status list (revocation)',
    status: 'OPEN',
    note: 'status-service-db needs a Mongo replica set; pending contract extension.',
};

export const seedDccWorkload = async (
    curatorSeed = 'a'.repeat(64),
    publisherSeed = process.env.DCC_DEV_PUBLISHER_SEED ?? 'b'.repeat(64)
): Promise<{
    workload: { packageId: string; packageVersionId: string; manifestHash: string };
    bundle: { listingId: string; versionId: string; manifest: BundleManifestV11 };
}> => {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('DCC workload fixtures are dev-only and do not establish pilot readiness.');
    }
    const { neogma } = await import('../src/instance');
    const { environment } = await import('../src/config/environment');
    const { getLearnCard } = await import('../src/helpers/learnCard.helpers');
    const { signManifestWithDidKey, computeManifestHash, assertSignedListingVersionOrThrow } =
        await import('../src/helpers/manifest-signature.helpers');
    const { publishWorkloadPackageVersion } =
        await import('../src/accesslayer/workload-package/create');
    const { createListingVersion } = await import('../src/accesslayer/listing-version/create');
    const { readListingVersionsForListing } =
        await import('../src/accesslayer/listing-version/read');

    // Idempotent: ensures the LCW wallet, registry adapter and v1.1.0 bundle exist.
    const dccTools = await seedDccTools(publisherSeed);

    const curatorDid = (await getLearnCard(curatorSeed)).id.did();
    environment.WORKLOAD_CURATOR_DIDS = curatorDid;
    const draft = buildDccCoreWorkloadPackage(curatorDid);
    const signedPackage = await signManifestWithDidKey<WorkloadPackage>(draft, curatorSeed);

    const existingPackageVersion = await neogma.queryRunner.run(
        'MATCH (v:WorkloadPackageVersion {packageId: $packageId, version: $version}) RETURN v.manifestHash AS manifestHash',
        { packageId: signedPackage.id, version: signedPackage.version }
    );
    const packageAlreadyPublished = existingPackageVersion.records.length > 0;
    const packageVersion = await publishWorkloadPackageVersion(JSON.stringify(signedPackage));
    console.log(
        packageAlreadyPublished
            ? `Workload package ${signedPackage.id}@${signedPackage.version} already published (idempotent no-op).`
            : `Workload package ${signedPackage.id}@${signedPackage.version} newly published.`,
        { packageVersionId: packageVersion.versionId, manifestHash: packageVersion.manifestHash }
    );

    const readiness: CatalogReadinessGate[] = [
        ...DCC_READINESS.map((gate): CatalogReadinessGate =>
            gate.name === 'Release / pinning' ? { ...gate, note: RELEASE_PINNING_NOTE } : gate
        ),
        STATUS_LIST_GATE,
    ];
    const publisherDid = dccTools.bundle.manifest.publisherDid;
    const unsignedBundle: Omit<BundleManifestV11, 'signature'> = {
        apiVersion: 'lc.bundle/v1.1',
        id: dccTools.bundle.manifest.id,
        version: '1.2.0',
        publisherDid,
        contains: [
            {
                declarationId: 'lcw',
                targetType: 'WALLET_ENABLEMENT',
                listingId: dccTools.wallet.listingId,
                versionId: dccTools.wallet.versionId,
                optional: false,
            },
            {
                declarationId: 'dcc-registry-adapter',
                targetType: 'INTEGRATION_INSTALL',
                listingId: dccTools.registryAdapter.listingId,
                versionId: dccTools.registryAdapter.versionId,
                optional: false,
            },
            {
                declarationId: 'dcc-issuer',
                targetType: 'WORKLOAD_DEPLOYMENT',
                packageId: signedPackage.id,
                packageVersionId: packageVersion.versionId,
                manifestHash: packageVersion.manifestHash,
                profiles: ['core'],
                optional: true,
            },
        ],
        defaultBindings: dccTools.bundle.manifest.defaultBindings,
        preflight: dccTools.bundle.manifest.preflight,
        readiness,
    };
    const signedBundle = await signManifestWithDidKey<BundleManifestV11>(
        unsignedBundle,
        publisherSeed
    );
    const bundleHash = computeManifestHash(signedBundle);

    const existingBundleVersion = (
        await readListingVersionsForListing(dccTools.bundle.listingId)
    ).find((version): boolean => version.version === '1.2.0');
    if (existingBundleVersion && existingBundleVersion.manifest_hash !== bundleHash) {
        throw new Error('Immutable dcc-tools@1.2.0 differs; bump the fixture version.');
    }
    const bundleVersion =
        existingBundleVersion ??
        (await createListingVersion(dccTools.bundle.listingId, {
            version: '1.2.0',
            status: 'LISTED',
            manifest_json: JSON.stringify(signedBundle),
            review_snapshot_json: JSON.stringify({
                reviewer: publisherDid,
                reviewedAt: new Date().toISOString(),
                reviewStatus: 'DEV_CATALOG_ONLY',
                approvedConsentTiers: [],
                notes: 'Adds the optional DCC issuer core workload member (profile core). Catalog candidate only; not an installation, deployment, or LEF sign-off.',
            }),
        }));
    await assertSignedListingVersionOrThrow('BUNDLE', bundleVersion);
    console.log(
        existingBundleVersion
            ? 'DCC Tools bundle 1.2.0 already published (idempotent no-op).'
            : 'DCC Tools bundle 1.2.0 newly published.',
        { listingId: dccTools.bundle.listingId, versionId: bundleVersion.version_id }
    );

    return {
        workload: {
            packageId: signedPackage.id,
            packageVersionId: packageVersion.versionId,
            manifestHash: packageVersion.manifestHash,
        },
        bundle: {
            listingId: dccTools.bundle.listingId,
            versionId: bundleVersion.version_id,
            manifest: signedBundle,
        },
    };
};

const main = async (): Promise<void> => {
    dotenv.config();
    process.env.NEO4J_URI ??= 'bolt://localhost:7687';
    process.env.NEO4J_USERNAME ??= 'neo4j';
    process.env.NEO4J_PASSWORD ??= 'this-is-the-password';
    process.env.DOMAIN_NAME ??= 'localhost%3A4000';
    try {
        const result = await seedDccWorkload();
        console.log(
            'DCC core workload seeded (no deployment; readiness gates remain open):',
            result
        );
    } finally {
        const { neogma } = await import('../src/instance');
        await neogma.driver.close();
    }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch(error => {
        console.error(error);
        process.exitCode = 1;
    });
}
