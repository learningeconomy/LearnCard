import { UnsignedVCValidator } from '@learncard/types';

import type { CredentialFixture } from '../../types';

export const vcV2WithEvidence: CredentialFixture = {
    id: 'vc-v2/with-evidence',
    name: 'VC v2 with Evidence',
    description: 'W3C VCDM v2 credential with evidence array documenting supporting artifacts',
    spec: 'vc-v2',
    profile: 'generic',
    features: ['evidence'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    validator: UnsignedVCValidator,

    credential: {
        '@context': ['https://www.w3.org/ns/credentials/v2'],
        id: 'urn:uuid:a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        type: ['VerifiableCredential'],
        issuer: {
            id: 'did:example:issuer123',
            name: 'Example University',
        },
        validFrom: '2023-09-01T00:00:00Z',
        credentialSubject: {
            id: 'did:example:student789',
            degree: {
                type: 'MasterDegree',
                name: 'Master of Science in Data Engineering',
            },
        },
        evidence: [
            {
                type: ['Evidence', 'DocumentVerification'],
                name: 'Transcript Review',
                description: 'Official transcript reviewed and verified by registrar office.',
            },
            {
                type: ['Evidence', 'ThesisDefense'],
                name: 'Thesis Defense',
                narrative:
                    'Student successfully defended thesis titled "Scalable Data Pipelines" on 2023-06-20.',
            },
        ],
    },
};
