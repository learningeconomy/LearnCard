import { UnsignedVCValidator } from '@learncard/types';

import type { CredentialFixture } from '../../types';

export const vcV2MultipleSubjects: CredentialFixture = {
    id: 'vc-v2/multiple-subjects',
    name: 'VC v2 with Multiple Credential Subjects',
    description:
        'W3C VCDM v2 credential with an array of credentialSubjects, which is valid per spec but uncommon',
    spec: 'vc-v2',
    profile: 'generic',
    features: ['multiple-subjects'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    validator: UnsignedVCValidator,
    tags: ['edge-case'],

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://www.w3.org/ns/credentials/examples/v2',
        ],
        id: 'urn:uuid:b2c3d4e5-f6a7-8901-bcde-f12345678901',
        type: ['VerifiableCredential'],
        issuer: 'did:example:issuer123',
        validFrom: '2024-01-15T00:00:00Z',
        credentialSubject: [
            {
                id: 'did:example:alice',
                role: 'Team Lead',
            },
            {
                id: 'did:example:bob',
                role: 'Developer',
            },
        ],
    },
};
