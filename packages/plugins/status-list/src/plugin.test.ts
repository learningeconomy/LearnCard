/**
 * Plugin-facade tests for `@learncard/status-list-plugin`.
 *
 * The exhaustive bitstring decode matrix lives in `./status.test.ts`.
 * These tests just confirm the plugin layer:
 *
 *   - Wires the configured fetch into the bound method's defaults.
 *   - Lets per-call options override (or skip) that fetch via
 *     `fetchStatusList`.
 *   - Returns `no_status` for credentials that carry no
 *     `credentialStatus` field.
 */
import { generateLearnCard } from '@learncard/core';

import { getStatusListPlugin } from './plugin';
import { buildBitstringStatusListCredential } from './test-helpers';

const LIST_URL = 'https://example.org/credentials/status/1';

const credentialAt = (
    index: number,
    overrides: { purpose?: string; type?: string } = {}
) => ({
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    issuer: 'did:example:issuer',
    credentialSubject: { id: 'did:example:subject' },
    credentialStatus: {
        id: `${LIST_URL}#${index}`,
        type: overrides.type ?? 'BitstringStatusListEntry',
        statusPurpose: overrides.purpose ?? 'revocation',
        statusListIndex: index,
        statusListCredential: LIST_URL,
    },
});

describe('getStatusListPlugin', () => {
    it('exposes checkCredentialStatus on lc.invoke after addPlugin', async () => {
        const baseLc = await generateLearnCard();
        const lc = await baseLc.addPlugin(getStatusListPlugin(baseLc));

        expect(typeof lc.invoke.checkCredentialStatus).toBe('function');
    });

    it('returns no_status when the credential has no credentialStatus field', async () => {
        const baseLc = await generateLearnCard();
        const lc = await baseLc.addPlugin(getStatusListPlugin(baseLc));

        const result = await lc.invoke.checkCredentialStatus({
            type: ['VerifiableCredential'],
            issuer: 'did:example:issuer',
            credentialSubject: { id: 'did:example:subject' },
        });

        expect(result.outcome).toBe('no_status');
    });

    it('routes lookups through caller-supplied fetchStatusList without hitting the network', async () => {
        const list = buildBitstringStatusListCredential({ bitsSet: [42] });

        const baseLc = await generateLearnCard();
        const lc = await baseLc.addPlugin(getStatusListPlugin(baseLc));

        const revoked = await lc.invoke.checkCredentialStatus(credentialAt(42), {
            fetchStatusList: async () => list,
        });
        const active = await lc.invoke.checkCredentialStatus(credentialAt(7), {
            fetchStatusList: async () => list,
        });

        expect(revoked.outcome).toBe('revoked');
        expect(active.outcome).toBe('active');
    });

    it('uses the plugin-configured fetch as the default for status-list HTTP', async () => {
        const list = buildBitstringStatusListCredential({ bitsSet: [99] });

        const fetchImpl = jest.fn(async (_url: string) =>
            new Response(JSON.stringify(list), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        );

        const baseLc = await generateLearnCard();
        const lc = await baseLc.addPlugin(
            getStatusListPlugin(baseLc, { fetch: fetchImpl as unknown as typeof fetch })
        );

        const result = await lc.invoke.checkCredentialStatus(credentialAt(99));

        expect(result.outcome).toBe('revoked');
        expect(fetchImpl).toHaveBeenCalledTimes(1);
        expect(fetchImpl.mock.calls[0]![0]).toBe(LIST_URL);
    });
});
