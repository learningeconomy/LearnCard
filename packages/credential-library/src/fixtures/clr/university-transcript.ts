import type { CredentialFixture } from '../../types';

export const clrUniversityTranscript: CredentialFixture = {
    id: 'clr/university-transcript',
    name: 'University Academic Transcript',
    description:
        'A CLR v2 comprehensive university transcript with multiple semesters, courses, grades, GPA, and degree conferral. Modeled after real university transcript issuance patterns.',
    spec: 'clr-v2',
    profile: 'learner-record',
    features: ['results', 'associations', 'image'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    tags: ['transcript', 'university', 'education', 'grades', 'gpa', 'comprehensive'],

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            'https://purl.imsglobal.org/spec/clr/v2p0/context-2.0.1.json',
        ],
        id: 'urn:uuid:8f3a1c2e-5b74-4d09-ae61-9c8f0d2e7b3a',
        type: ['VerifiableCredential', 'ClrCredential'],
        name: 'Official Academic Transcript – Pacific Coast University',
        description:
            'Official academic transcript for the Bachelor of Science in Computer Science program at Pacific Coast University.',
        issuer: {
            id: 'did:web:registrar.pcu-example.edu',
            type: ['Profile'],
            name: 'Pacific Coast University – Office of the Registrar',
            url: 'https://pcu-example.edu',
            image: {
                id: 'https://pcu-example.edu/logo.png',
                type: 'Image',
                caption: 'Pacific Coast University seal',
            },
            email: 'registrar@pcu-example.edu',
            address: {
                type: ['Address'],
                addressCountry: 'USA',
                addressRegion: 'CA',
                addressLocality: 'Santa Cruz',
                streetAddress: '1156 High Street',
                postalCode: '95064',
            },
        },
        validFrom: '2025-01-15T00:00:00Z',
        credentialSubject: {
            id: 'did:example:student-pcu-20210045',
            type: ['ClrSubject'],
            identifier: [
                {
                    type: 'IdentityObject',
                    identityHash: 'student20210045@pcu-example.edu',
                    identityType: 'emailAddress',
                    hashed: false,
                    salt: 'not-used',
                },
            ],
            verifiableCredential: [
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    id: 'urn:uuid:8f3a1c2e-0001-4000-8000-000000000001',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'CS 101 – Introduction to Computer Science',
                    issuer: {
                        id: 'did:web:registrar.pcu-example.edu',
                        type: ['Profile'],
                        name: 'Pacific Coast University',
                    },
                    validFrom: '2021-12-18T00:00:00Z',
                    credentialSubject: {
                        id: 'did:example:student-pcu-20210045',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'https://pcu-example.edu/courses/cs101',
                            type: ['Achievement'],
                            achievementType: 'Course',
                            name: 'Introduction to Computer Science',
                            description: 'Fundamental concepts of programming, algorithms, and computational thinking using Python.',
                            humanCode: 'CS 101',
                            fieldOfStudy: 'Computer Science',
                            creator: {
                                id: 'https://pcu-example.edu/departments/cs',
                                type: ['Profile'],
                                name: 'Department of Computer Science',
                            },
                        },
                        result: [
                            {
                                type: ['Result'],
                                value: 'A',
                                resultDescription: 'urn:uuid:8f3a-grade',
                            },
                        ],
                    },
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    id: 'urn:uuid:8f3a1c2e-0001-4000-8000-000000000002',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'CS 201 – Data Structures and Algorithms',
                    issuer: {
                        id: 'did:web:registrar.pcu-example.edu',
                        type: ['Profile'],
                        name: 'Pacific Coast University',
                    },
                    validFrom: '2022-05-20T00:00:00Z',
                    credentialSubject: {
                        id: 'did:example:student-pcu-20210045',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'https://pcu-example.edu/courses/cs201',
                            type: ['Achievement'],
                            achievementType: 'Course',
                            name: 'Data Structures and Algorithms',
                            description: 'Study of fundamental data structures (arrays, linked lists, trees, graphs, hash tables) and algorithm design, analysis, and complexity.',
                            humanCode: 'CS 201',
                            fieldOfStudy: 'Computer Science',
                            creator: {
                                id: 'https://pcu-example.edu/departments/cs',
                                type: ['Profile'],
                                name: 'Department of Computer Science',
                            },
                        },
                        result: [
                            {
                                type: ['Result'],
                                value: 'A-',
                                resultDescription: 'urn:uuid:8f3a-grade',
                            },
                        ],
                    },
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    id: 'urn:uuid:8f3a1c2e-0001-4000-8000-000000000003',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'CS 310 – Operating Systems',
                    issuer: {
                        id: 'did:web:registrar.pcu-example.edu',
                        type: ['Profile'],
                        name: 'Pacific Coast University',
                    },
                    validFrom: '2022-12-18T00:00:00Z',
                    credentialSubject: {
                        id: 'did:example:student-pcu-20210045',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'https://pcu-example.edu/courses/cs310',
                            type: ['Achievement'],
                            achievementType: 'Course',
                            name: 'Operating Systems',
                            description: 'Process management, memory management, file systems, I/O, and distributed systems. Includes substantial C programming projects.',
                            humanCode: 'CS 310',
                            fieldOfStudy: 'Computer Science',
                            creator: {
                                id: 'https://pcu-example.edu/departments/cs',
                                type: ['Profile'],
                                name: 'Department of Computer Science',
                            },
                        },
                        result: [
                            {
                                type: ['Result'],
                                value: 'B+',
                                resultDescription: 'urn:uuid:8f3a-grade',
                            },
                        ],
                    },
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    id: 'urn:uuid:8f3a1c2e-0001-4000-8000-000000000004',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'CS 420 – Machine Learning',
                    issuer: {
                        id: 'did:web:registrar.pcu-example.edu',
                        type: ['Profile'],
                        name: 'Pacific Coast University',
                    },
                    validFrom: '2023-05-19T00:00:00Z',
                    credentialSubject: {
                        id: 'did:example:student-pcu-20210045',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'https://pcu-example.edu/courses/cs420',
                            type: ['Achievement'],
                            achievementType: 'Course',
                            name: 'Machine Learning',
                            description: 'Supervised and unsupervised learning, deep learning, reinforcement learning. Hands-on projects with PyTorch.',
                            humanCode: 'CS 420',
                            fieldOfStudy: 'Computer Science',
                            creator: {
                                id: 'https://pcu-example.edu/departments/cs',
                                type: ['Profile'],
                                name: 'Department of Computer Science',
                            },
                        },
                        result: [
                            {
                                type: ['Result'],
                                value: 'A',
                                resultDescription: 'urn:uuid:8f3a-grade',
                            },
                        ],
                    },
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    id: 'urn:uuid:8f3a1c2e-0001-4000-8000-000000000005',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'MATH 210 – Linear Algebra',
                    issuer: {
                        id: 'did:web:registrar.pcu-example.edu',
                        type: ['Profile'],
                        name: 'Pacific Coast University',
                    },
                    validFrom: '2022-05-20T00:00:00Z',
                    credentialSubject: {
                        id: 'did:example:student-pcu-20210045',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'https://pcu-example.edu/courses/math210',
                            type: ['Achievement'],
                            achievementType: 'Course',
                            name: 'Linear Algebra',
                            description: 'Vector spaces, linear transformations, eigenvalues, matrix decompositions, and applications.',
                            humanCode: 'MATH 210',
                            fieldOfStudy: 'Mathematics',
                            creator: {
                                id: 'https://pcu-example.edu/departments/math',
                                type: ['Profile'],
                                name: 'Department of Mathematics',
                            },
                        },
                        result: [
                            {
                                type: ['Result'],
                                value: 'B+',
                                resultDescription: 'urn:uuid:8f3a-grade',
                            },
                        ],
                    },
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    id: 'urn:uuid:8f3a1c2e-0001-4000-8000-000000000006',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'CS 490 – Senior Capstone Project',
                    issuer: {
                        id: 'did:web:registrar.pcu-example.edu',
                        type: ['Profile'],
                        name: 'Pacific Coast University',
                    },
                    validFrom: '2024-12-18T00:00:00Z',
                    credentialSubject: {
                        id: 'did:example:student-pcu-20210045',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'https://pcu-example.edu/courses/cs490',
                            type: ['Achievement'],
                            achievementType: 'Course',
                            name: 'Senior Capstone Project',
                            description: 'A year-long team project applying software engineering practices to build a real-world application. Includes requirements gathering, design, implementation, testing, and deployment.',
                            humanCode: 'CS 490',
                            fieldOfStudy: 'Computer Science',
                            creator: {
                                id: 'https://pcu-example.edu/departments/cs',
                                type: ['Profile'],
                                name: 'Department of Computer Science',
                            },
                        },
                        result: [
                            {
                                type: ['Result'],
                                value: 'A',
                                resultDescription: 'urn:uuid:8f3a-grade',
                            },
                        ],
                    },
                },
            ],
            achievement: [
                {
                    id: 'https://pcu-example.edu/programs/bs-cs',
                    type: ['Achievement'],
                    achievementType: 'Degree',
                    name: 'Bachelor of Science in Computer Science',
                    description: 'A four-year undergraduate program providing comprehensive training in computer science theory, systems, and applications.',
                    humanCode: 'BS-CS',
                    fieldOfStudy: 'Computer Science',
                    creator: {
                        id: 'https://pcu-example.edu/departments/cs',
                        type: ['Profile'],
                        name: 'Department of Computer Science',
                    },
                    resultDescription: [
                        {
                            id: 'urn:uuid:8f3a-gpa',
                            type: ['ResultDescription'],
                            name: 'Cumulative GPA',
                            resultType: 'GradePointAverage',
                        },
                    ],
                },
            ],
        },
    },
};
