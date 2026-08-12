import type { CredentialFixture } from '../../types';

export const vcV2EmploymentCredential: CredentialFixture = {
    id: 'vc-v2/employment-credential',
    name: 'Employment Verification Credential',
    description:
        'A W3C VC v2.0 employment verification credential, representing a common real-world use case for background checks and professional verification.',
    spec: 'vc-v2',
    profile: 'generic',
    features: ['expiration'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    tags: ['employment', 'verification', 'hr', 'professional'],

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://www.w3.org/ns/credentials/examples/v2',
        ],
        id: 'urn:uuid:7c8e2a4f-91b3-4d06-a857-3e1f9c0d4a72',
        type: ['VerifiableCredential'],
        name: 'Employment Verification – Senior Software Engineer',
        description:
            'Verifies employment of the credential subject as a Senior Software Engineer at TechCorp Global from March 2021 to present.',
        credentialSubject: {
            id: 'did:example:employee-567',
            type: ['Person'],
            name: 'Jane A. Doe',
            employmentRecord: {
                type: ['EmploymentRecord'],
                employer: {
                    type: ['Organization'],
                    name: 'TechCorp Global Inc.',
                    url: 'https://techcorp-global-example.com',
                    address: {
                        type: ['PostalAddress'],
                        addressLocality: 'San Francisco',
                        addressRegion: 'CA',
                        addressCountry: 'US',
                    },
                },
                jobTitle: 'Senior Software Engineer',
                department: 'Platform Engineering',
                startDate: '2021-03-15',
                employmentType: 'Full-time',
                occupationalCategory: '15-1252.00',
                responsibilities: [
                    'Lead architecture design for cloud-native microservices',
                    'Mentor junior engineers and conduct code reviews',
                    'Drive adoption of CI/CD best practices across teams',
                ],
            },
        },
        issuer: {
            id: 'did:web:hr.techcorp-global-example.com',
            type: ['Profile'],
            name: 'TechCorp Global Inc. – Human Resources',
            url: 'https://techcorp-global-example.com',
        },
        validFrom: '2024-06-01T00:00:00Z',
        validUntil: '2025-06-01T00:00:00Z',
    },
};
