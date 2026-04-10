import { UnsignedVCValidator } from '@learncard/types';

import type { CredentialFixture } from '../../types';

export const vcV1Basic: CredentialFixture = {
    id: 'vc-v1/basic',
    name: 'Basic VC v1 Credential',
    description: 'Minimal W3C Verifiable Credential Data Model v1 credential with only required fields',
    spec: 'vc-v1',
    profile: 'generic',
    features: [],
    source: 'spec-example',
    signed: false,
    validity: 'valid',
    validator: UnsignedVCValidator,

    credential: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: 'http://example.org/credentials/3731',
        type: ['VerifiableCredential'],
        issuer: 'did:example:issuer123',
        issuanceDate: '2020-08-19T21:41:50Z',
        credentialSubject: {
            id: 'did:example:subject456',
        },
    },
};
