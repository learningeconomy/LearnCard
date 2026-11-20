import { readFile } from 'node:fs/promises';

import { generateLearnCard } from '@learncard/core';
import { describe, expect, it } from 'vitest';

import { getDidKitPlugin } from '../src/plugin';
import type { DIDKitPlugin } from '../src/types';

const wasm = readFile(new URL('../src/didkit/pkg/didkit_wasm_bg.wasm', import.meta.url));

// Mirrors MANAGED_REFRESH_SERVICE_CONTEXT in @learncard/helpers (LC-2380 trigger)
const managedRefreshContext = {
    LearnCardCredentialRefresh2026: 'https://learncard.com/refresh#LearnCardCredentialRefresh2026',
    authorization: {
        '@id': 'https://purl.imsglobal.org/spec/ob/v3p0#authorization',
        '@context': { LearnCardDIDAuth: 'https://docs.learncard.com/definitions#LearnCardDIDAuth' },
    },
};

const getLearnCard = async () => {
    const debugErrors: unknown[] = [];
    const plugin = await getDidKitPlugin(await wasm);
    const learnCard = await generateLearnCard<[DIDKitPlugin]>({
        plugins: [plugin],
        debug: (...args: unknown[]) => {
            debugErrors.push(...args.filter(arg => arg instanceof Error));
        },
    });

    return { learnCard, debugErrors };
};

describe('DIDKit WASM plugin', () => {
    it('signs and verifies a credential carrying the managed refresh inline context', async () => {
        const { learnCard, debugErrors } = await getLearnCard();
        const keypair = learnCard.invoke.generateEd25519KeyFromBytes(new Uint8Array(32).fill(7));
        const did = learnCard.invoke.keyToDid('key', keypair);
        const verificationMethod = await learnCard.invoke.keyToVerificationMethod('key', keypair);

        const credential = {
            '@context': ['https://www.w3.org/ns/credentials/v2', managedRefreshContext],
            type: ['VerifiableCredential'],
            issuer: did,
            validFrom: '2026-11-09T00:00:00Z',
            credentialSubject: { id: did },
            refreshService: {
                id: 'https://example.com/refresh/lc-2380',
                type: 'LearnCardCredentialRefresh2026',
                authorization: { type: 'LearnCardDIDAuth' },
            },
        };

        const signed = await learnCard.invoke.issueCredential(
            credential,
            {
                proofPurpose: 'assertionMethod',
                type: 'DataIntegrityProof',
                cryptosuite: 'eddsa-rdfc-2022',
                verificationMethod,
            },
            keypair
        );
        const verification = await learnCard.invoke.verifyCredential(signed);

        expect(signed.proof).toBeDefined();
        expect(verification.errors).toEqual([]);
        expect(verification.checks).toContain('proof');
        // Before LC-2380, the inline context objects were handed to the WASM context
        // loader and trapped with "memory access out of bounds" (swallowed into debug)
        expect(debugErrors).toEqual([]);
    });

    it('ignores non-string context URLs instead of passing them into WASM', async () => {
        const { learnCard, debugErrors } = await getLearnCard();

        await expect(
            learnCard.context.resolveDocument(managedRefreshContext as never)
        ).resolves.toBeUndefined();
        expect(debugErrors).toEqual([]);
    });
});
