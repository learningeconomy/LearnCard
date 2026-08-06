import { createListingVersion } from '@accesslayer/listing-version/create';
import { getLearnCard } from '@helpers/learnCard.helpers';
import { signManifestWithDidKey } from '@helpers/manifest-signature.helpers';
import type { BundleManifest, IntegrationManifest, WalletManifest } from '@learncard/types';
import type { AppStoreListingKind } from 'types/app-store-listing';
import type { ListingVersionType } from 'types/listing-version';

const SEEDS_BY_KIND: Record<'INTEGRATION' | 'WALLET' | 'BUNDLE', string> = {
    INTEGRATION: '1'.repeat(64),
    WALLET: '2'.repeat(64),
    BUNDLE: '3'.repeat(64),
};

const getPublisherDidForSeed = async (seed: string): Promise<string> => {
    const learnCard = await getLearnCard(seed);
    return learnCard.id.did();
};

export const buildSignedManifestForKind = async (
    kind: 'INTEGRATION' | 'WALLET' | 'BUNDLE',
    overrides: Partial<IntegrationManifest | WalletManifest | BundleManifest> = {}
): Promise<IntegrationManifest | WalletManifest | BundleManifest> => {
    const seed = SEEDS_BY_KIND[kind];
    const publisherDid = await getPublisherDidForSeed(seed);

    switch (kind) {
        case 'INTEGRATION': {
            const unsignedManifest: Omit<IntegrationManifest, 'signature'> = {
                apiVersion: 'lc.integration/v1.2',
                id: 'com.example.integration',
                version: '1.0.0',
                listingKind: 'INTEGRATION',
                publisherDid,
                category: 'sis',
                scopes: [
                    {
                        resource: 'group',
                        action: 'sync',
                        selectorKind: 'tree',
                        selectorValue: '$installEcosystemId',
                        reason: 'Sync roster data',
                    },
                ],
                consentRequirements: ['directory'],
                capabilities: { provided: ['roster-source'], consumed: [] },
                supportedRecordClasses: ['academic'],
                extensionPoints: [],
                endpoints: { healthUrl: 'https://example.com/health' },
                ...(overrides as Partial<IntegrationManifest>),
                publisherDid,
            };

            return signManifestWithDidKey(unsignedManifest, seed);
        }
        case 'WALLET': {
            const unsignedManifest: Omit<WalletManifest, 'signature'> = {
                apiVersion: 'lc.wallet/v1',
                id: 'wallet.example',
                version: '1.0.0',
                listingKind: 'WALLET',
                walletName: 'Example Wallet',
                publisherDid,
                claimProtocols: ['oid4vci'],
                platforms: ['web'],
                endpoints: { healthUrl: 'https://wallet.example/health' },
                provides: ['wallet-claim'],
                supportsApps: true,
                ...(overrides as Partial<WalletManifest>),
                publisherDid,
            };

            return signManifestWithDidKey(unsignedManifest, seed);
        }
        case 'BUNDLE': {
            const unsignedManifest: Omit<BundleManifest, 'signature'> = {
                apiVersion: 'lc.bundle/v1',
                id: 'bundle.example',
                version: '1.0.0',
                publisherDid,
                contains: [],
                defaultBindings: [],
                preflight: [],
                ...(overrides as Partial<BundleManifest>),
                publisherDid,
            };

            return signManifestWithDidKey(unsignedManifest, seed);
        }
    }
};

export const createSignedListingVersionForKind = async (input: {
    listingId: string;
    kind: 'INTEGRATION' | 'WALLET' | 'BUNDLE';
    versionId?: string;
    version?: string;
    status?: string;
    manifestOverrides?: Partial<IntegrationManifest | WalletManifest | BundleManifest>;
    reviewSnapshot?: Record<string, unknown>;
}): Promise<ListingVersionType> => {
    const manifest = await buildSignedManifestForKind(input.kind, {
        version: input.version ?? '1.0.0',
        ...(input.manifestOverrides ?? {}),
    });

    return createListingVersion(input.listingId, {
        version_id: input.versionId,
        version: manifest.version,
        status: input.status ?? 'LISTED',
        manifest_json: JSON.stringify(manifest),
        review_snapshot_json: input.reviewSnapshot
            ? JSON.stringify(input.reviewSnapshot)
            : undefined,
    });
};

export const createUnsignedListingVersionForKind = async (input: {
    listingId: string;
    kind: AppStoreListingKind;
    versionId?: string;
    version?: string;
    status?: string;
}): Promise<ListingVersionType> => {
    switch (input.kind) {
        case 'INTEGRATION':
            return createListingVersion(input.listingId, {
                version_id: input.versionId,
                version: input.version ?? '1.0.0',
                status: input.status ?? 'LISTED',
                manifest_json: JSON.stringify({
                    apiVersion: 'lc.integration/v1.2',
                    id: 'com.example.integration',
                    version: input.version ?? '1.0.0',
                    listingKind: 'INTEGRATION',
                    publisherDid: 'did:key:unsigned',
                    category: 'sis',
                    scopes: [],
                    consentRequirements: [],
                    capabilities: { provided: ['roster-source'], consumed: [] },
                    supportedRecordClasses: ['academic'],
                    extensionPoints: [],
                    endpoints: {},
                }),
            });
        case 'WALLET':
            return createListingVersion(input.listingId, {
                version_id: input.versionId,
                version: input.version ?? '1.0.0',
                status: input.status ?? 'LISTED',
                manifest_json: JSON.stringify({
                    apiVersion: 'lc.wallet/v1',
                    id: 'wallet.example',
                    version: input.version ?? '1.0.0',
                    listingKind: 'WALLET',
                    walletName: 'Example Wallet',
                    publisherDid: 'did:key:unsigned',
                    claimProtocols: ['oid4vci'],
                    platforms: ['web'],
                    endpoints: {},
                    provides: ['wallet-claim'],
                    supportsApps: true,
                }),
            });
        case 'BUNDLE':
            return createListingVersion(input.listingId, {
                version_id: input.versionId,
                version: input.version ?? '1.0.0',
                status: input.status ?? 'LISTED',
                manifest_json: JSON.stringify({
                    apiVersion: 'lc.bundle/v1',
                    id: 'bundle.example',
                    version: input.version ?? '1.0.0',
                    publisherDid: 'did:key:unsigned',
                    contains: [],
                    defaultBindings: [],
                    preflight: [],
                }),
            });
        case 'APP':
            return createListingVersion(input.listingId, {
                version_id: input.versionId,
                version: input.version ?? '1.0.0',
                status: input.status ?? 'LISTED',
                manifest_json: JSON.stringify({ apiVersion: 'lc.app/v1', id: 'app.example' }),
            });
    }
};
