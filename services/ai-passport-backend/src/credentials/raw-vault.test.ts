import { expect, mock, test } from 'bun:test';
import type { VC } from '@learncard/types';

mock.module('../constants/env', () => ({
    AI_PRIVACY_KEY: Buffer.alloc(32, 7).toString('base64'),
}));
const { runWithAiPrivacyContext } = await import('../ai/privacy');
const { encryptRawCredential, decryptRawCredential } = await import('./raw-vault');
const { fingerprintCredential } = await import('./verification');
const owner = 'did:example:learner';
const uri = 'lc:credential:private-original';
const original: VC = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    issuer: 'did:example:issuer',
    issuanceDate: '2026-01-01T00:00:00.000Z',
    credentialSubject: {
        id: owner,
        name: 'Private Learner',
        achievement: { name: 'Calculus' },
    },
    proof: {
        type: 'Ed25519Signature2020',
        proofValue: 'synthetic-vault-test-only',
        created: '2026-01-01T00:00:00.000Z',
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:example:issuer#key-1',
    },
};
const raw = JSON.stringify(original);
const hash = fingerprintCredential(original);
const now = new Date('2026-01-01T00:00:00.000Z');

test('retained originals are encrypted and owner-scoped, preserving exact original bytes', () => {
    expect(() => encryptRawCredential(owner, uri, hash, raw, now)).toThrow();
    const envelope = runWithAiPrivacyContext(owner, () =>
        encryptRawCredential(owner, uri, hash, raw, now)
    );
    expect(JSON.stringify(envelope)).not.toContain('Private Learner');
    expect(JSON.stringify(envelope)).not.toContain('Calculus');
    expect(() =>
        runWithAiPrivacyContext('did:example:other', () =>
            decryptRawCredential(owner, uri, hash, envelope, now)
        )
    ).toThrow();
    const restored = runWithAiPrivacyContext(owner, () =>
        decryptRawCredential(owner, uri, hash, envelope, now)
    );
    expect(restored.rawCredentialJson).toBe(raw);
    expect(restored.credential).toEqual(original);
});

test('metadata substitution, modified ciphertext, and logical expiry cannot disclose an original', () => {
    runWithAiPrivacyContext(owner, () => {
        const envelope = encryptRawCredential(owner, uri, hash, raw, now);
        expect(() =>
            decryptRawCredential(owner, uri, hash, envelope, envelope.expiresAt)
        ).toThrow();
        expect(() =>
            decryptRawCredential(
                owner,
                uri,
                hash,
                {
                    ...envelope,
                    expiresAt: new Date(envelope.expiresAt.getTime() + 1000),
                },
                now
            )
        ).toThrow();
        expect(() =>
            decryptRawCredential(
                owner,
                'lc:credential:other',
                hash,
                { ...envelope, uri: 'lc:credential:other' },
                now
            )
        ).toThrow();
        const changed = Buffer.from(envelope.ciphertext, 'base64');
        changed[0] ^= 1;
        expect(() =>
            decryptRawCredential(
                owner,
                uri,
                hash,
                { ...envelope, ciphertext: changed.toString('base64') },
                now
            )
        ).toThrow();
        expect(() => encryptRawCredential(owner, uri, '0'.repeat(64), raw, now)).toThrow();
    });
});
