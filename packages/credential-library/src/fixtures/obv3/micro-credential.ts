import type { CredentialFixture } from '../../types';

export const obv3MicroCredential: CredentialFixture = {
    id: 'obv3/micro-credential',
    name: 'Data Science Fundamentals Micro-credential',
    description:
        'A stackable micro-credential for completing a data science fundamentals course, with results and skills alignment. Modeled after real university continuing education programs.',
    spec: 'obv3',
    profile: 'micro-credential',
    features: ['alignment', 'results', 'image', 'skills'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    tags: ['micro-credential', 'data-science', 'education', 'stackable', 'continuing-education'],

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        id: 'urn:uuid:91c82a75-7b2d-4e38-a5d3-78f0c2e9a16b',
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        name: 'Data Science Fundamentals',
        description:
            'Awarded for successful completion of the Data Science Fundamentals micro-credential program, demonstrating competency in statistical analysis, data visualization, and introductory machine learning.',
        image: {
            id: 'https://university-example.edu/badges/data-science-fundamentals.png',
            type: 'Image',
            caption: 'Data Science Fundamentals micro-credential badge',
        },
        credentialSubject: {
            id: 'did:example:learner-ds-001',
            type: ['AchievementSubject'],
            achievement: {
                id: 'https://university-example.edu/achievements/data-science-fundamentals',
                type: ['Achievement'],
                achievementType: 'MicroCredential',
                name: 'Data Science Fundamentals',
                description:
                    'A 120-hour micro-credential covering statistical analysis, data visualization with Python, SQL for data analysis, and introductory machine learning concepts. Part of the Data Science Professional Certificate pathway.',
                criteria: {
                    id: 'https://university-example.edu/achievements/data-science-fundamentals/criteria',
                    narrative:
                        'Complete all four course modules (Statistics, Data Visualization, SQL, Intro ML) with a passing grade of 70% or higher on each module assessment, and submit a capstone data analysis project.',
                },
                image: {
                    id: 'https://university-example.edu/badges/data-science-fundamentals.png',
                    type: 'Image',
                    caption: 'Data Science Fundamentals badge',
                },
                creator: {
                    id: 'https://university-example.edu/issuers/continuing-ed',
                    type: ['Profile'],
                    name: 'State University Continuing Education',
                    url: 'https://university-example.edu/continuing-ed',
                    description:
                        'The continuing education division of State University offers professional development and micro-credential programs.',
                },
                alignment: [
                    {
                        type: ['Alignment'],
                        targetName: 'Data Science Practices',
                        targetUrl: 'https://credentialengineregistry.org/resources/ce-ds-practices-001',
                        targetDescription:
                            'Apply data science techniques to collect, clean, analyze, and visualize data for decision-making.',
                        targetFramework: 'Credential Engine Data Science Competency Framework',
                        targetType: 'CTDL',
                    },
                    {
                        type: ['Alignment'],
                        targetName: 'Data Science',
                        targetUrl: 'https://nces.ed.gov/ipeds/cipcode/cipdetail.aspx?y=56&cipid=91995',
                        targetDescription: 'CIP Code 30.7001 – Data Science',
                        targetFramework: 'Classification of Instructional Programs (CIP)',
                        targetType: 'CFItem',
                        targetCode: '30.7001',
                    },
                ],
                resultDescription: [
                    {
                        id: 'urn:uuid:c4e7d3a0-0001-4000-8000-000000000001',
                        type: ['ResultDescription'],
                        name: 'Statistics Module',
                        resultType: 'LetterGrade',
                        allowedValue: ['A', 'B', 'C', 'D', 'F'],
                        requiredValue: 'C',
                    },
                    {
                        id: 'urn:uuid:c4e7d3a0-0001-4000-8000-000000000002',
                        type: ['ResultDescription'],
                        name: 'Data Visualization Module',
                        resultType: 'LetterGrade',
                        allowedValue: ['A', 'B', 'C', 'D', 'F'],
                        requiredValue: 'C',
                    },
                    {
                        id: 'urn:uuid:c4e7d3a0-0001-4000-8000-000000000003',
                        type: ['ResultDescription'],
                        name: 'SQL Module',
                        resultType: 'LetterGrade',
                        allowedValue: ['A', 'B', 'C', 'D', 'F'],
                        requiredValue: 'C',
                    },
                    {
                        id: 'urn:uuid:c4e7d3a0-0001-4000-8000-000000000004',
                        type: ['ResultDescription'],
                        name: 'Intro ML Module',
                        resultType: 'LetterGrade',
                        allowedValue: ['A', 'B', 'C', 'D', 'F'],
                        requiredValue: 'C',
                    },
                    {
                        id: 'urn:uuid:c4e7d3a0-0001-4000-8000-000000000005',
                        type: ['ResultDescription'],
                        name: 'Capstone Project',
                        resultType: 'Status',
                    },
                ],
                tag: [
                    'data-science',
                    'statistics',
                    'python',
                    'sql',
                    'machine-learning',
                    'data-visualization',
                ],
            },
            result: [
                {
                    type: ['Result'],
                    resultDescription: 'urn:uuid:c4e7d3a0-0001-4000-8000-000000000001',
                    value: 'A',
                },
                {
                    type: ['Result'],
                    resultDescription: 'urn:uuid:c4e7d3a0-0001-4000-8000-000000000002',
                    value: 'B',
                },
                {
                    type: ['Result'],
                    resultDescription: 'urn:uuid:c4e7d3a0-0001-4000-8000-000000000003',
                    value: 'A',
                },
                {
                    type: ['Result'],
                    resultDescription: 'urn:uuid:c4e7d3a0-0001-4000-8000-000000000004',
                    value: 'B',
                },
                {
                    type: ['Result'],
                    resultDescription: 'urn:uuid:c4e7d3a0-0001-4000-8000-000000000005',
                    status: 'Completed',
                },
            ],
        },
        issuer: {
            id: 'did:web:university-example.edu',
            type: ['Profile'],
            name: 'State University',
            url: 'https://university-example.edu',
            description: 'A public research university offering undergraduate, graduate, and continuing education programs.',
            image: {
                id: 'https://university-example.edu/logo.png',
                type: 'Image',
                caption: 'State University logo',
            },
        },
        validFrom: '2024-12-15T00:00:00Z',
    },
};
