import { describe, expect, it, vi } from 'vitest';
import type { WorkloadPackage } from '@learncard/types';
import { getLearnCard } from '@helpers/learnCard.helpers';
import * as learnCardHelpers from '@helpers/learnCard.helpers';
import {
    assertSignedWorkloadPackageOrThrow,
    computeManifestHash,
    computeWorkloadManifestHash,
    signManifestWithDidKey,
} from '@helpers/manifest-signature.helpers';
import { buildDccIssuerWorkloadPackage } from '../../test/fixtures/workload/dcc-issuer';

describe('workload manifest signing', (): void => {
    it('preserves own __proto__ fields in canonical hashes', (): void => {
        const raw: { signature?: unknown } = JSON.parse('{"configSchema":{"__proto__":{"x":1}}}');
        const other: { signature?: unknown } = JSON.parse('{"configSchema":{}}');
        expect(computeManifestHash(raw)).not.toBe(computeManifestHash(other));
    });
    it('does not authorize a different DID URL sharing a fragment', async (): Promise<void> => {
        const seed = '2'.repeat(64);
        const wallet = await getLearnCard(seed);
        const publisherDid = wallet.id.did();
        const signed = await signManifestWithDidKey<WorkloadPackage>(
            buildDccIssuerWorkloadPackage(publisherDid),
            seed
        );
        const resolver = await learnCardHelpers.getEmptyLearnCard();
        const document = await resolver.invoke.resolveDid(publisherDid);
        const fragment = signed.signature.verificationMethod.split('#')[1];
        const spy = vi.spyOn(resolver.invoke, 'resolveDid').mockResolvedValue({
            ...document,
            assertionMethod: [`did:example:other#${fragment}`],
        });
        try {
            await expect(
                assertSignedWorkloadPackageOrThrow(JSON.stringify(signed))
            ).rejects.toThrow(/not authorized/i);
        } finally {
            spy.mockRestore();
        }
    });
    it('verifies raw signed packages, rejects tampering and tolerates reordered keys', async (): Promise<void> => {
        const seed = '1'.repeat(64);
        const publisherDid = (await getLearnCard(seed)).id.did();
        const signed = await signManifestWithDidKey<WorkloadPackage>(
            buildDccIssuerWorkloadPackage(publisherDid),
            seed
        );
        const manifestHash = computeWorkloadManifestHash(signed);
        expect(manifestHash).toBe(computeManifestHash(signed));
        await expect(
            assertSignedWorkloadPackageOrThrow(JSON.stringify(signed), {
                manifestHash,
                publisherDid,
            })
        ).resolves.toEqual(signed);
        await expect(
            assertSignedWorkloadPackageOrThrow(JSON.stringify({ ...signed, version: '1.0.1' }))
        ).rejects.toThrow(/payload/i);
        const reordered = Object.fromEntries(Object.entries(signed).reverse());
        await expect(
            assertSignedWorkloadPackageOrThrow(JSON.stringify(reordered), { manifestHash })
        ).resolves.toEqual(signed);
        await expect(
            assertSignedWorkloadPackageOrThrow(JSON.stringify(signed), {
                manifestHash: 'f'.repeat(64),
            })
        ).rejects.toThrow(/hash/i);
    });
});
