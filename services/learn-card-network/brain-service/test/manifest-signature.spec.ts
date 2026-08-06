import { describe, expect, it } from 'vitest';

import { getLearnCard } from '@helpers/learnCard.helpers';
import {
    signManifestWithDidKey,
    verifyManifestSignature,
} from '../src/helpers/manifest-signature.helpers';

describe('manifest signing infrastructure', () => {
    it('verifies a signed integration manifest', async () => {
        const publisherDid = (await getLearnCard('1'.repeat(64))).id.did();
        const manifest = await signManifestWithDidKey(
            {
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
                endpoints: {},
            },
            '1'.repeat(64)
        );

        await expect(verifyManifestSignature(manifest)).resolves.toBeUndefined();
    });

    it('rejects a tampered manifest', async () => {
        const publisherDid = (await getLearnCard('2'.repeat(64))).id.did();
        const manifest = await signManifestWithDidKey(
            {
                apiVersion: 'lc.wallet/v1',
                id: 'wallet.example',
                version: '1.0.0',
                listingKind: 'WALLET',
                walletName: 'Example Wallet',
                publisherDid,
                claimProtocols: ['oid4vci'],
                platforms: ['web'],
                endpoints: {},
                provides: ['wallet-claim'],
                supportsApps: true,
            },
            '2'.repeat(64)
        );

        await expect(
            verifyManifestSignature({
                ...manifest,
                walletName: 'Tampered Wallet',
            })
        ).rejects.toThrow(/payload does not match/i);
    });

    it('rejects a manifest whose publisher DID does not match the signing key', async () => {
        const publisherDid = (await getLearnCard('3'.repeat(64))).id.did();
        const manifest = await signManifestWithDidKey(
            {
                apiVersion: 'lc.bundle/v1',
                id: 'bundle.example',
                version: '1.0.0',
                publisherDid,
                contains: [],
                defaultBindings: [],
                preflight: [],
            },
            '3'.repeat(64)
        );

        await expect(
            verifyManifestSignature({
                ...manifest,
                publisherDid: (await getLearnCard('4'.repeat(64))).id.did(),
            })
        ).rejects.toThrow(/verification method/i);
    });
});
