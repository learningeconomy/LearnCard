import type { CredentialFixture } from '../../types';

export const vcV2LicenseCredential: CredentialFixture = {
    id: 'vc-v2/license-credential',
    name: 'Professional Nursing License',
    description:
        'A W3C VC v2.0 professional license credential modeled after state nursing board licenses, with status checking and expiration. Represents a common regulated-profession use case.',
    spec: 'vc-v2',
    profile: 'license',
    features: ['expiration', 'status', 'credential-schema'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    tags: ['license', 'nursing', 'healthcare', 'regulated-profession', 'state-board'],

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://www.w3.org/ns/credentials/examples/v2',
        ],
        id: 'urn:uuid:3c7d5e9a-12b4-4f68-8a91-d7e2c3f0b15a',
        type: ['VerifiableCredential'],
        name: 'Registered Nurse License – State of California',
        description:
            'Authorizes the holder to practice as a Registered Nurse in the State of California. License is subject to biennial renewal and continuing education requirements.',
        credentialSubject: {
            id: 'did:example:nurse-rn-88420',
            type: ['Person'],
            name: 'Sarah M. Chen',
            license: {
                type: ['ProfessionalLicense'],
                licenseName: 'Registered Nurse (RN)',
                licenseNumber: 'RN-88420-CA',
                licenseType: 'Registered Nurse',
                issuingAuthority: {
                    type: ['Organization'],
                    name: 'California Board of Registered Nursing',
                    url: 'https://rn.ca.gov-example.gov',
                    address: {
                        type: ['PostalAddress'],
                        addressLocality: 'Sacramento',
                        addressRegion: 'CA',
                        addressCountry: 'US',
                    },
                },
                dateIssued: '2019-06-15',
                jurisdiction: 'US-CA',
                occupationalCategory: '29-1141.00',
                continuingEducation: {
                    hoursRequired: 30,
                    renewalPeriod: 'biennial',
                    hoursCompleted: 30,
                    lastCompletedDate: '2024-12-01',
                },
            },
        },
        issuer: {
            id: 'did:web:rn.ca.gov-example.gov',
            type: ['Profile'],
            name: 'California Board of Registered Nursing',
            url: 'https://rn.ca.gov-example.gov',
            description:
                'The California Board of Registered Nursing protects the public by regulating the practice of registered nurses.',
        },
        validFrom: '2025-01-01T00:00:00Z',
        validUntil: '2027-01-01T00:00:00Z',
        credentialStatus: {
            id: 'https://rn.ca.gov-example.gov/credentials/status/5',
            type: 'BitstringStatusListEntry',
            statusPurpose: 'revocation',
            statusListIndex: '88420',
            statusListCredential: 'https://rn.ca.gov-example.gov/credentials/status/5',
        },
        credentialSchema: {
            id: 'https://rn.ca.gov-example.gov/schemas/nursing-license-v1.json',
            type: 'JsonSchema',
        },
    },
};
