import { UnsignedVCValidator } from '@learncard/types';

import type { CredentialFixture, InvalidCredential } from '../../types';

export const invalidEmptyType: CredentialFixture = {
    id: 'invalid/empty-type',
    name: 'Empty type Array',
    description:
        'Credential with an empty type array — should fail validation since type must be a non-empty array containing at least "VerifiableCredential"',
    spec: 'vc-v2',
    profile: 'generic',
    features: [],
    source: 'synthetic',
    signed: false,
    validity: 'invalid',
    validator: UnsignedVCValidator,
    tags: ['negative-test'],

    credential: {
        '@context': ['https://www.w3.org/ns/credentials/v2'],
        id: 'urn:uuid:invalid-0002',
        type: [],
        issuer: 'did:example:issuer123',
        validFrom: '2024-01-01T00:00:00Z',
        credentialSubject: { id: 'did:example:subject456' },
    } as InvalidCredential as any,
};
