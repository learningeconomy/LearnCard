import type { CredentialFixture } from '../../types';

export const vcV2DigitalId: CredentialFixture = {
    id: 'vc-v2/digital-id',
    name: 'Government Digital Identity Credential',
    description:
        'A W3C VC v2.0 digital identity credential modeled after government-issued digital ID programs, with status checking, terms of use, and credential schema.',
    spec: 'vc-v2',
    profile: 'id',
    features: ['status', 'terms-of-use', 'credential-schema', 'image', 'expiration'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    tags: ['identity', 'government', 'digital-id', 'kyc'],

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://www.w3.org/ns/credentials/examples/v2',
        ],
        id: 'urn:uuid:d12e6b3a-45f8-4c91-a7d0-9e8b2f1c3a56',
        type: ['VerifiableCredential'],
        name: 'National Digital Identity Card',
        description:
            'A government-issued digital identity credential verifying the identity of the holder.',
        image: 'https://gov-id-example.gov/credentials/id-card-hologram.png',
        credentialSubject: {
            id: 'did:example:citizen-98765',
            type: ['Person'],
            givenName: 'Maria',
            familyName: 'Garcia',
            birthDate: '1990-07-22',
            gender: 'Female',
            nationality: 'US',
            address: {
                type: ['PostalAddress'],
                streetAddress: '456 Oak Avenue, Apt 12B',
                addressLocality: 'Portland',
                addressRegion: 'OR',
                addressCountry: 'US',
                postalCode: '97201',
            },
            identifier: {
                type: ['PropertyValue'],
                propertyID: 'nationalIdNumber',
                value: 'XXX-XX-1234',
            },
            image: 'https://gov-id-example.gov/photos/citizen-98765.jpg',
        },
        issuer: {
            id: 'did:web:identity.gov-example.gov',
            type: ['Profile'],
            name: 'Department of Digital Identity',
            url: 'https://identity.gov-example.gov',
            description: 'Government agency responsible for issuing and managing digital identity credentials.',
        },
        validFrom: '2024-01-15T00:00:00Z',
        validUntil: '2034-01-15T00:00:00Z',
        credentialStatus: {
            id: 'https://identity.gov-example.gov/credentials/status/3',
            type: 'BitstringStatusListEntry',
            statusPurpose: 'revocation',
            statusListIndex: '94567',
            statusListCredential: 'https://identity.gov-example.gov/credentials/status/3',
        },
        credentialSchema: {
            id: 'https://identity.gov-example.gov/schemas/digital-id-v1.json',
            type: 'JsonSchema',
        },
        termsOfUse: [
            {
                type: 'IssuerPolicy',
                id: 'https://identity.gov-example.gov/policies/digital-id-terms',
                profile: 'https://identity.gov-example.gov/policies/digital-id-terms',
            },
        ],
    },
};
