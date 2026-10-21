import { expect, it } from 'vitest';
import type { VC } from '@learncard/types';
import { getInboxDeliveryId } from './inboxDelivery';

const proof = {
    type: 'DataIntegrityProof',
    created: '2026-01-01T00:00:00.000Z',
    proofPurpose: 'assertionMethod',
    verificationMethod: 'did:key:issuer#key',
    proofValue: 'zfixture',
};

it('preserves the inbox id for id-less credentials across transport and selection', () => {
    const first: VC = {
        '@context': ['https://www.w3.org/ns/credentials/v2'],
        issuer: 'did:key:issuer',
        proof,
        type: ['VerifiableCredential'],
        credentialSubject: { name: 'First' },
    };
    const second: VC = {
        '@context': ['https://www.w3.org/ns/credentials/v2'],
        issuer: 'did:key:issuer',
        proof,
        type: ['VerifiableCredential'],
        credentialSubject: { name: 'Second' },
    };
    const deliveries = [
        { id: 'inbox-first', credential: first },
        { id: 'inbox-second', credential: second },
    ];
    expect(getInboxDeliveryId(structuredClone(second), deliveries)).toBe('inbox-second');
    expect(getInboxDeliveryId(first, deliveries)).toBe('inbox-first');
    expect(getInboxDeliveryId(first)).toBeUndefined();
    expect(first).not.toHaveProperty('inboxDeliveryId');
});

it('keeps identical id-less deliveries distinct using their original presentation positions', () => {
    const credential: VC = {
        '@context': ['https://www.w3.org/ns/credentials/v2'],
        issuer: 'did:key:issuer',
        proof,
        type: ['VerifiableCredential'],
        credentialSubject: {},
    };
    const deliveries = [
        { id: 'first', credential },
        { id: 'second', credential },
    ];
    expect(getInboxDeliveryId(credential, deliveries, 1)).toBe('second');
});
