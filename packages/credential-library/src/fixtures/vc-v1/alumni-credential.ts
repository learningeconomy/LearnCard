import type { CredentialFixture } from '../../types';

export const vcV1AlumniCredential: CredentialFixture = {
    id: 'vc-v1/alumni-credential',
    name: 'University Alumni Credential',
    description:
        'A W3C VC v1.1 alumni credential from the W3C VC specification examples, representing a common real-world use case for university alumni verification.',
    spec: 'vc-v1',
    profile: 'membership',
    features: ['expiration'],
    source: 'spec-example',
    signed: false,
    validity: 'valid',
    tags: ['alumni', 'university', 'education', 'w3c-example'],

    credential: {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://www.w3.org/2018/credentials/examples/v1',
        ],
        id: 'https://example.edu/credentials/1872',
        type: ['VerifiableCredential', 'AlumniCredential'],
        issuer: {
            id: 'https://example.edu/issuers/565049',
            name: 'Example University',
        },
        issuanceDate: '2010-01-01T19:23:24Z',
        expirationDate: '2030-01-01T19:23:24Z',
        credentialSubject: {
            id: 'did:example:ebfeb1f712ebc6f1c276e12ec21',
            alumniOf: {
                id: 'did:example:c276e12ec21ebfeb1f712ebc6f1',
                name: 'Example University',
            },
        },
    },
};
