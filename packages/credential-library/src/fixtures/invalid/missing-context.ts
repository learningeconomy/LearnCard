import { UnsignedVCValidator } from '@learncard/types';

import type { CredentialFixture, InvalidCredential } from '../../types';

export const invalidMissingContext: CredentialFixture = {
    id: 'invalid/missing-context',
    name: 'Missing @context',
    description:
        'Credential with no @context array — should fail validation since @context is required by the VC Data Model',
    spec: 'vc-v2',
    profile: 'generic',
    features: [],
    source: 'synthetic',
    signed: false,
    validity: 'invalid',
    validator: UnsignedVCValidator,
    tags: ['negative-test'],

    credential: {
        // Intentionally missing '@context'
        id: 'urn:uuid:invalid-0001',
        type: ['VerifiableCredential'],
        issuer: 'did:example:issuer123',
        validFrom: '2024-01-01T00:00:00Z',
        credentialSubject: { id: 'did:example:subject456' },
    } as InvalidCredential as any,
};
