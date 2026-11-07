import { expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { initLearnCard } from '@learncard/init';
import { hasKnownUnsupportedInsightSuite } from './insight-eligibility';

const base = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential'],
    issuer: 'did:example:issuer',
    validFrom: '2026-01-01T00:00:00Z',
    credentialSubject: { id: 'did:example:subject' },
};
const proof = (cryptosuite: string) => ({
    type: 'DataIntegrityProof',
    cryptosuite,
    created: '2026-01-01T00:00:00Z',
    proofPurpose: 'assertionMethod',
    verificationMethod: 'did:example:issuer#key',
    proofValue: 'zSynthetic',
});

for (const array of [false, true]) {
    test(`only the proven unsupported suite is ineligible (array=${array})`, () => {
        for (const suite of ['ecdsa-sd-2023', 'ecdsa-rdfc-2019', 'eddsa-rdfc-2022', 'unknown']) {
            const credential = {
                ...base,
                proof: array ? [proof(suite)] : proof(suite),
            };
            const original = JSON.stringify(credential);
            expect(hasKnownUnsupportedInsightSuite(credential)).toBe(suite === 'ecdsa-sd-2023');
            expect(JSON.stringify(credential)).toBe(original);
        }
    });
}

test('mixed proof chains and either Boost layer exclude the entire input', () => {
    const supported = { ...base, proof: proof('eddsa-rdfc-2022') };
    const unsupported = { ...base, proof: proof('ecdsa-sd-2023') };
    expect(
        hasKnownUnsupportedInsightSuite({
            ...base,
            proof: [supported.proof, { ...unsupported.proof, previousProof: 'urn:previous' }],
        })
    ).toBe(true);
    expect(
        hasKnownUnsupportedInsightSuite({
            ...supported,
            boostCredential: unsupported,
        })
    ).toBe(true);
    expect(
        hasKnownUnsupportedInsightSuite({
            ...unsupported,
            boostCredential: supported,
        })
    ).toBe(true);
    expect(
        hasKnownUnsupportedInsightSuite({
            ...supported,
            boostCredential: supported,
        })
    ).toBe(false);
});

test('exact unsupported proof is detected before validation; unrelated claims remain strict', () => {
    expect(
        hasKnownUnsupportedInsightSuite({
            ...base,
            issuer: undefined,
            proof: proof('ecdsa-sd-2023'),
        })
    ).toBe(true);
    expect(
        hasKnownUnsupportedInsightSuite({
            ...base,
            proof: { type: 'OtherProof', cryptosuite: 'ecdsa-sd-2023' },
        })
    ).toBe(false);
    expect(
        hasKnownUnsupportedInsightSuite({
            ...base,
            proof: proof('eddsa-rdfc-2022'),
            credentialSubject: { cryptosuite: 'ecdsa-sd-2023' },
        })
    ).toBe(false);
});

test('pinned WASM rejects unsupported suite in objects and arrays, while supported arrays parse', async () => {
    const wallet = await initLearnCard({
        seed: 'ab'.repeat(32),
        allowRemoteContexts: false,
        didkit: readFile(require.resolve('@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm')),
    });
    const vc = await wallet.invoke.issueCredential(
        {
            ...base,
            issuer: wallet.id.did(),
            credentialSubject: { id: wallet.id.did() },
        },
        { type: 'DataIntegrityProof', cryptosuite: 'eddsa-rdfc-2022' }
    );
    for (const array of [false, true]) {
        const unsupportedProof = {
            ...(vc.proof as any),
            cryptosuite: 'ecdsa-sd-2023',
        };
        const credential = {
            ...vc,
            proof: array ? [unsupportedProof] : unsupportedProof,
        };
        expect(hasKnownUnsupportedInsightSuite(credential)).toBe(true);
        await expect(wallet.invoke.verifyCredential(credential as any)).rejects.toMatch(
            /untagged enum OneOrMany/
        );
    }
    const result = await wallet.invoke.verifyCredential({
        ...vc,
        proof: [vc.proof],
    } as any);
    expect(result.errors).toEqual([]);
    expect(result.checks).toContain('proof');
}, 30_000);

test('optional created does not hide an unsupported outer or inner chain proof', () => {
    const unsupported = proof('ecdsa-sd-2023');
    delete (unsupported as Partial<typeof unsupported>).created;
    const credential = {
        ...base,
        proof: [proof('eddsa-rdfc-2022'), { ...unsupported, previousProof: 'urn:previous' }],
    };
    expect(hasKnownUnsupportedInsightSuite(credential)).toBe(true);
    expect(
        hasKnownUnsupportedInsightSuite({
            ...base,
            proof: proof('eddsa-rdfc-2022'),
            boostCredential: credential,
        })
    ).toBe(true);
    expect(
        hasKnownUnsupportedInsightSuite({
            ...base,
            proof: { ...unsupported, cryptosuite: 'unknown-suite' },
        })
    ).toBe(false);
});
