import { readFile } from 'fs/promises';

import { describe, it, expect, beforeAll } from 'vitest';

import { initLearnCard } from '@learncard/init';

import {
    getAllFixtures,
    getFixture,
    isCredentialFixture,
    prepareFixture,
    buildFinalTranscriptVariant,
} from '../index';

import type { CredentialFixture } from '../types';

// ---------------------------------------------------------------------------
// Wallet setup — one shared instance for all tests
// ---------------------------------------------------------------------------

const didkit = readFile(
    require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let wallet: any;
let issuerDid: string;

beforeAll(async () => {
    wallet = await initLearnCard({ seed: 'a'.repeat(64), didkit, allowRemoteContexts: true });
    issuerDid = wallet.id.did();
}, 30_000);

// ---------------------------------------------------------------------------
// Issuance tests — every valid fixture should issue successfully
// ---------------------------------------------------------------------------

describe('Credential issuance', () => {
    const validFixtures = (): CredentialFixture[] =>
        getAllFixtures().filter(
            (fixture): fixture is CredentialFixture =>
                fixture.validity === 'valid' && isCredentialFixture(fixture)
        );

    describe('issueCredential succeeds for all valid fixtures', () => {
        it.each(validFixtures().map(f => [f.id, f] as const))(
            '%s',
            async (_id, fixture) => {
                const prepared = prepareFixture(fixture, {
                    issuerDid,
                    subjectDid: 'did:example:test-subject-123',
                });

                const signed = await wallet.invoke.issueCredential(prepared);

                expect(signed).toBeDefined();
                expect((signed as Record<string, unknown>).proof).toBeDefined();
            },
            15_000
        );
    });

    it('issues the full CLR fixture without remote contexts', async () => {
        const offlineWallet = await initLearnCard({
            seed: 'b'.repeat(64),
            didkit,
            allowRemoteContexts: false,
        });
        const fixture = getFixture('clr/westbridge-full');
        const prepared = prepareFixture(fixture, {
            issuerDid: offlineWallet.id.did(),
            subjectDid: 'did:example:test-subject-123',
        });
        const signed = await offlineWallet.invoke.issueCredential(prepared);

        expect(signed.proof).toBeDefined();
    }, 30_000);

    it('issues the provisional transcript fixture and its final variant without remote contexts', async () => {
        const offlineWallet = await initLearnCard({
            seed: 'c'.repeat(64),
            didkit,
            allowRemoteContexts: false,
        });

        const provisional = prepareFixture(getFixture('clr/provisional-transcript'), {
            issuerDid: offlineWallet.id.did(),
            subjectDid: 'did:example:test-subject-123',
        });
        const signedProvisional = await offlineWallet.invoke.issueCredential(provisional);

        expect(signedProvisional.proof).toBeDefined();

        const final = buildFinalTranscriptVariant(provisional, {
            validFrom: new Date().toISOString(),
        });
        const signedFinal = await offlineWallet.invoke.issueCredential(final);

        expect(signedFinal.proof).toBeDefined();
        expect(signedFinal.id).toBe(signedProvisional.id);
    }, 30_000);
});
