import type { CredentialFixture } from '../../types';

export const vcV2EducationDegree: CredentialFixture = {
    id: 'vc-v2/education-degree',
    name: 'University Bachelor Degree Credential',
    description:
        'A W3C VC v2.0 university degree credential following the DCC (Digital Credentials Consortium) pattern used by MIT, Harvard, and other universities for digital diploma issuance.',
    spec: 'vc-v2',
    profile: 'diploma',
    features: ['image'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    tags: ['education', 'degree', 'university', 'diploma', 'dcc'],

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://www.w3.org/ns/credentials/examples/v2',
        ],
        id: 'urn:uuid:e4d89b31-a4f7-4c8e-9d02-b6ef3a17c9e8',
        type: ['VerifiableCredential'],
        name: 'Bachelor of Science in Computer Science',
        description:
            'Conferred upon successful completion of all requirements for the degree of Bachelor of Science in Computer Science from Metropolis University.',
        image: 'https://metropolis-university-example.edu/diplomas/cs-bsc-seal.png',
        credentialSubject: {
            id: 'did:example:graduate-2024-1234',
            type: ['Person'],
            name: 'Alex J. Rivera',
            hasCredential: {
                type: ['EducationalOccupationalCredential'],
                name: 'Bachelor of Science in Computer Science',
                credentialCategory: 'degree',
                educationalLevel: 'Bachelor',
                competencyRequired: [
                    'Software Engineering',
                    'Data Structures & Algorithms',
                    'Computer Systems',
                    'Artificial Intelligence',
                    'Mathematics (Calculus, Linear Algebra, Discrete Math)',
                ],
                dateAwarded: '2024-05-18',
                awardedBy: {
                    type: ['Organization'],
                    name: 'Metropolis University',
                    url: 'https://metropolis-university-example.edu',
                    address: {
                        type: ['PostalAddress'],
                        addressLocality: 'Metropolis',
                        addressRegion: 'NY',
                        addressCountry: 'US',
                    },
                },
                recognizedBy: {
                    type: ['Organization'],
                    name: 'Middle States Commission on Higher Education',
                    url: 'https://www.msche.org',
                },
            },
            honors: 'Magna Cum Laude',
            gpa: '3.78',
        },
        issuer: {
            id: 'did:web:registrar.metropolis-university-example.edu',
            type: ['Profile'],
            name: 'Metropolis University – Office of the Registrar',
            url: 'https://metropolis-university-example.edu',
            image: {
                id: 'https://metropolis-university-example.edu/logo.png',
                type: 'Image',
                caption: 'Metropolis University seal',
            },
        },
        validFrom: '2024-05-18T00:00:00Z',
    },
};
