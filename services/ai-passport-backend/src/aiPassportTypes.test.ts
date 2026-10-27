import { expect, test } from 'bun:test';
import {
    AIPassportCredentialRecordValidator,
    AuthenticatedMessageValidator,
} from '@learncard/types';

const credential = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: 'urn:uuid:test',
    type: ['VerifiableCredential', 'TestCredential'],
    issuer: 'did:example:issuer',
    issuanceDate: '2026-01-01T00:00:00.000Z',
    credentialSubject: { id: 'did:example:learner' },
    proof: {
        type: 'Ed25519Signature2020',
        created: '2026-01-01T00:00:00.000Z',
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:example:issuer#key-1',
    },
};

test('authenticated messages do not expose client-supplied DIDs', () => {
    const message = AuthenticatedMessageValidator.parse({
        action: 'start_topic',
        topic: 'TypeScript',
        did: 'did:example:attacker',
    });

    expect(message).toEqual({ action: 'start_topic', topic: 'TypeScript' });
    expect('did' in message).toBe(false);
});

test('credential records wrap validated LearnCard VCs', () => {
    expect(
        AIPassportCredentialRecordValidator.parse({
            id: 'record-1',
            uri: 'lc:network:test',
            category: 'Achievement',
            credential,
            aiContext: 'Completed a TypeScript course.',
            createdAt: '2026-01-01T00:00:00.000Z',
        }).credential
    ).toEqual(credential);

    expect(() =>
        AIPassportCredentialRecordValidator.parse({
            id: 'record-1',
            uri: 'lc:network:test',
            category: 'Achievement',
            credential: { raw: JSON.stringify(credential) },
            aiContext: 'Completed a TypeScript course.',
            createdAt: '2026-01-01T00:00:00.000Z',
        })
    ).toThrow();
});
