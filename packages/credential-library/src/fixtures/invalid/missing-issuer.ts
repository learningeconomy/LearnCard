import { UnsignedVCValidator } from '@learncard/types';

import type { CredentialFixture, InvalidCredential } from '../../types';

export const invalidMissingIssuer: CredentialFixture = {
    id: 'invalid/missing-issuer',
    name: 'Missing Issuer',
    description:
        'Credential with no issuer field — should fail validation since issuer is required by the VC Data Model',
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
        id: 'urn:uuid:invalid-0003',
        type: ['VerifiableCredential'],
        // Intentionally missing 'issuer'
        validFrom: '2024-01-01T00:00:00Z',
        credentialSubject: { id: 'did:example:subject456' },
    } as InvalidCredential as any,
};
