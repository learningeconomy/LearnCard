import { UnsignedVCValidator } from '@learncard/types';

import type { CredentialFixture } from '../../types';

export const vcV1WithStatus: CredentialFixture = {
    id: 'vc-v1/with-status',
    name: 'VC v1 with Credential Status',
    description:
        'W3C VCDM v1 credential with credentialStatus for revocation checking (StatusList2021)',
    spec: 'vc-v1',
    profile: 'generic',
    features: ['status'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    validator: UnsignedVCValidator,

    credential: {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://w3id.org/vc/status-list/2021/v1',
        ],
        id: 'http://example.org/credentials/status-example',
        type: ['VerifiableCredential'],
        issuer: 'did:example:issuer123',
        issuanceDate: '2023-06-15T10:00:00Z',
        expirationDate: '2025-06-15T10:00:00Z',
        credentialSubject: {
            id: 'did:example:subject456',
            degree: {
                type: 'BachelorDegree',
                name: 'Bachelor of Science in Computer Science',
            },
        },
        credentialStatus: {
            id: 'https://example.com/credentials/status/1#42',
            type: 'StatusList2021Entry',
            statusPurpose: 'revocation',
            statusListIndex: '42',
            statusListCredential: 'https://example.com/credentials/status/1',
        },
    },
};
