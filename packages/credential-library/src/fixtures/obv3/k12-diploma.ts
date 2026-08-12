import type { CredentialFixture } from '../../types';

export const obv3K12Diploma: CredentialFixture = {
    id: 'obv3/k12-diploma',
    name: 'High School Diploma',
    description:
        'An OBv3 high school diploma credential modeled after K-12 digital credential initiatives, with alignment to state standards.',
    spec: 'obv3',
    profile: 'diploma',
    features: ['alignment', 'image'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    tags: ['k12', 'diploma', 'high-school', 'education'],

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        id: 'urn:uuid:c2e9f4a7-1d83-4b56-a0e2-7f3c8d9b1e64',
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        name: 'Lincoln High School Diploma',
        description:
            'Conferred upon successful completion of all requirements for graduation from Lincoln High School, Class of 2025.',
        image: {
            id: 'https://lincoln-hs-example.edu/badges/diploma-2025.png',
            type: 'Image',
            caption: 'Lincoln High School Class of 2025 Diploma',
        },
        credentialSubject: {
            id: 'did:example:student-lhs-2025-0342',
            type: ['AchievementSubject'],
            achievement: {
                id: 'https://lincoln-hs-example.edu/achievements/diploma-2025',
                type: ['Achievement'],
                achievementType: 'Diploma',
                name: 'High School Diploma',
                description:
                    'Awarded upon completion of all state-required credits (24 credits minimum), including 4 years of English, 3 years of Mathematics through Algebra II, 3 years of Science, 3 years of Social Studies, 2 years of World Language, and required electives.',
                criteria: {
                    id: 'https://lincoln-hs-example.edu/achievements/diploma-2025/criteria',
                    narrative:
                        'Complete minimum 24 credits across required subject areas, maintain cumulative GPA of 2.0 or higher, complete 40 hours of community service, and pass all state-mandated assessments.',
                },
                image: {
                    id: 'https://lincoln-hs-example.edu/badges/diploma-seal.png',
                    type: 'Image',
                    caption: 'Lincoln High School diploma seal',
                },
                creator: {
                    id: 'https://lincoln-hs-example.edu/issuers/1',
                    type: ['Profile'],
                    name: 'Lincoln High School',
                    url: 'https://lincoln-hs-example.edu',
                    description: 'A public high school in Springfield serving grades 9-12.',
                    address: {
                        type: ['Address'],
                        addressCountry: 'USA',
                        addressRegion: 'IL',
                        addressLocality: 'Springfield',
                        streetAddress: '1000 Lincoln Blvd',
                        postalCode: '62701',
                    },
                },
                alignment: [
                    {
                        type: ['Alignment'],
                        targetName: 'Illinois High School Graduation Requirements',
                        targetUrl: 'https://isbe.net-example.gov/graduation-requirements',
                        targetDescription:
                            'State of Illinois minimum requirements for high school graduation, including required courses, assessments, and credit hours.',
                        targetFramework: 'Illinois State Board of Education Standards',
                        targetType: 'CFItem',
                    },
                ],
            },
        },
        issuer: {
            id: 'did:web:lincoln-hs-example.edu',
            type: ['Profile'],
            name: 'Lincoln High School',
            url: 'https://lincoln-hs-example.edu',
            image: {
                id: 'https://lincoln-hs-example.edu/logo.png',
                type: 'Image',
                caption: 'Lincoln High School logo',
            },
        },
        validFrom: '2025-06-07T14:00:00Z',
    },
};
