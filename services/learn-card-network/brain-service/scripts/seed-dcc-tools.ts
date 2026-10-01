#!/usr/bin/env bun
/** Dev-only catalog publication. No DCC calls, software deployment or partner authority.
 * Uses the sibling seeds' deterministic dev did:key convention; never a production key.
 * Re-runs reuse immutable versions; changed fixtures require a new manifest version.
 */
import * as dotenv from 'dotenv';
import { pathToFileURL } from 'node:url';
import type { BundleManifest, IntegrationManifest, WalletManifest } from '@learncard/types';
import { dccBundleManifest, dccRegistryManifest, lcwManifest } from './fixtures/dcc-tools';

type CatalogManifest = WalletManifest | IntegrationManifest | BundleManifest;
type SeededListing<T extends CatalogManifest> = {
    listingId: string;
    versionId: string;
    manifest: T;
};

export const seedDccTools = async (
    publisherSeed = process.env.DCC_DEV_PUBLISHER_SEED ?? 'b'.repeat(64)
): Promise<{
    wallet: SeededListing<WalletManifest>;
    registryAdapter: SeededListing<IntegrationManifest>;
    bundle: SeededListing<BundleManifest>;
}> => {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('DCC Tools fixtures are dev-only and do not establish pilot readiness.');
    }
    const { getLearnCard } = await import('../src/helpers/learnCard.helpers');
    const { assertSignedListingVersionOrThrow, computeManifestHash, signManifestWithDidKey } =
        await import('../src/helpers/manifest-signature.helpers');
    const { createAppStoreListing } = await import('../src/accesslayer/app-store-listing/create');
    const { readAppStoreListingBySlug } = await import('../src/accesslayer/app-store-listing/read');
    const { updateAppStoreListing } = await import('../src/accesslayer/app-store-listing/update');
    const { createListingVersion } = await import('../src/accesslayer/listing-version/create');
    const { readListingVersionsForListing } =
        await import('../src/accesslayer/listing-version/read');

    const publisherDid = (await getLearnCard(publisherSeed)).id.did();
    const publish = async <T extends CatalogManifest>(
        kind: 'WALLET' | 'INTEGRATION' | 'BUNDLE',
        slug: string,
        name: string,
        unsigned: Omit<T, 'signature'>,
        notes: string
    ): Promise<SeededListing<T>> => {
        const manifest = await signManifestWithDidKey<T>(unsigned, publisherSeed);
        const listing =
            (await readAppStoreListingBySlug(slug)) ??
            (await createAppStoreListing({
                slug,
                kind,
                display_name: name,
                tagline: 'DCC Phase C catalog candidate — not a deployment or production approval',
                full_description: notes,
                icon_url: 'https://dcc-catalog-placeholder.invalid/icon.png',
                app_listing_status: 'DRAFT',
                launch_type: 'SERVER_HEADLESS',
                launch_config_json: '{}',
                category: kind === 'BUNDLE' ? 'Bundles' : 'Education',
                promotion_level: 'STANDARD',
            }));
        if (listing.kind !== kind)
            throw new Error(`Seed slug ${slug} belongs to another listing kind.`);

        const existing = (await readListingVersionsForListing(listing.listing_id)).find(
            version => version.version === manifest.version
        );
        if (existing && existing.manifest_hash !== computeManifestHash(manifest)) {
            throw new Error(
                `Immutable ${slug}@${manifest.version} differs; bump the fixture version.`
            );
        }
        const version =
            existing ??
            (await createListingVersion(listing.listing_id, {
                version: manifest.version,
                status: 'LISTED',
                manifest_json: JSON.stringify(manifest),
                review_snapshot_json: JSON.stringify({
                    reviewer: publisherDid,
                    reviewedAt: new Date().toISOString(),
                    reviewStatus: 'DEV_CATALOG_ONLY',
                    approvedConsentTiers: [],
                    notes,
                }),
            }));
        await assertSignedListingVersionOrThrow(kind, version);
        if (version.status !== 'LISTED') throw new Error(`Existing ${slug} version is not LISTED.`);
        await updateAppStoreListing(listing, { app_listing_status: 'LISTED' });
        return { listingId: listing.listing_id, versionId: version.version_id, manifest };
    };

    const wallet = await publish<WalletManifest>(
        'WALLET',
        'dcc-lcw',
        'Learner Credential Wallet (LCW)',
        lcwManifest(publisherDid),
        'LEF-authored dev catalog candidate; not signed or endorsed by DCC. Sanctioned-wallet review OPEN: preserve learner choice; verify VC-API/CHAPI/deep-link claims and exact build. Upstream: openwallet-foundation-labs/learner-credential-wallet (MIT, changelog 2.2.10). No evidenced OID4VCI. Claim/icon .invalid URLs are placeholders; health endpoint unknown. No customer credentials or deployment.'
    );
    const registryAdapter = await publish<IntegrationManifest>(
        'INTEGRATION',
        'dcc-registry-adapter',
        'DCC Registry Adapter',
        dccRegistryManifest(publisherDid),
        'LEF-authored dev catalog-only subscription adapter, not a DCC-hosted service. Five advisory trust artifacts; test/legacy candidates are never auto-trusted. Raw upstream JSON is not a signed manifest. Exact OIDF/community endpoints and refresh policy need review; .invalid URLs are placeholders. No scopes, consent requirements, partner credentials or subject-data release.'
    );
    const bundle = await publish<BundleManifest>(
        'BUNDLE',
        'dcc-tools',
        'DCC Tools',
        dccBundleManifest(publisherDid, [
            {
                declarationId: 'lcw',
                targetType: 'WALLET_ENABLEMENT',
                listingId: wallet.listingId,
                versionId: wallet.versionId,
                optional: false,
            },
            {
                declarationId: 'dcc-registry-adapter',
                targetType: 'INTEGRATION_INSTALL',
                listingId: registryAdapter.listingId,
                versionId: registryAdapter.versionId,
                optional: false,
            },
        ]),
        'Phase C catalog only: LCW plus advisory registry subscriptions. Review all ten readiness gates in the approval plan. OPEN gates are not cleared by dev signing or READY catalog resources. Issuer Workloads are Phase E; ServiceAccounts and partner permissions require separate implementation. This is not ADR-007 installation acceptance. Default bindings remain PROPOSED.'
    );
    return { wallet, registryAdapter, bundle };
};

const main = async (): Promise<void> => {
    dotenv.config();
    process.env.NEO4J_URI ??= 'bolt://localhost:7687';
    process.env.NEO4J_USERNAME ??= 'neo4j';
    process.env.NEO4J_PASSWORD ??= 'this-is-the-password';
    process.env.DOMAIN_NAME ??= 'localhost%3A4000';
    try {
        const seeded = await seedDccTools();
        console.log('DCC Tools dev catalog seeded (no deployment; readiness gates remain open):', {
            listingId: seeded.bundle.listingId,
            versionId: seeded.bundle.versionId,
            publisherDid: seeded.bundle.manifest.publisherDid,
        });
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
