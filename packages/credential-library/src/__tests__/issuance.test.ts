import { readFile } from 'fs/promises';

import { describe, it, expect, beforeAll } from 'vitest';

import { initLearnCard } from '@learncard/init';

import { getAllFixtures, getFixture, prepareFixture } from '../index';

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
        getAllFixtures().filter(f => f.validity === 'valid');

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
});
