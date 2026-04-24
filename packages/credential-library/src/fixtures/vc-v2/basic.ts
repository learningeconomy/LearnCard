import { UnsignedVCValidator } from '@learncard/types';

import type { CredentialFixture } from '../../types';

export const vcV2Basic: CredentialFixture = {
    id: 'vc-v2/basic',
    name: 'Basic VC v2 Credential',
    description: 'Minimal W3C Verifiable Credential Data Model v2 credential using validFrom instead of issuanceDate',
    spec: 'vc-v2',
    profile: 'generic',
    features: [],
    source: 'spec-example',
    signed: false,
    validity: 'valid',
    validator: UnsignedVCValidator,

    credential: {
        '@context': ['https://www.w3.org/ns/credentials/v2'],
        id: 'urn:uuid:58172aac-d8ba-11ed-83dd-0b3aef56cc33',
        type: ['VerifiableCredential'],
        issuer: 'did:example:issuer123',
        validFrom: '2023-06-15T10:00:00Z',
        credentialSubject: {
            id: 'did:example:subject456',
        },
    },
};
