import { VC } from '@learncard/types';

export const testVc: VC = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: 'http://example.org/credentials/3731',
    type: ['VerifiableCredential'],
    credentialSubject: { id: 'did:web:localhost%3A3000:users:myseedisc' },
    issuer: 'did:web:localhost%3A3000:users:taylor',
    issuanceDate: '2020-08-19T21:41:50Z',
    proof: {
        '@context': ['https://w3id.org/security/suites/ed25519-2020/v1'],
        type: 'Ed25519Signature2020',
        proofPurpose: 'assertionMethod',
        proofValue:
            'z5yES8h51z4GXFiYnrepWbz3veZZ9gAA99LRKpcU1u3EM9LrkmGKXhxEJPwSJcRAHuX1S7uq5nKJeaUT9RMVjWvT5',
        verificationMethod: 'did:web:localhost%3A3000:users:taylor#owner',
        created: '2023-02-16T19:57:33.033Z',
    },
};
