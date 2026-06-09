import type { CredentialFixture } from '../../types';

/**
 * A focused CLR v2 transcript purpose-built to exercise the two competency-linking
 * mechanisms in the spec, plus evidence at every level:
 *
 *  1. `achievement.alignment[]` — courses, the degree, and standalone competencies each
 *     align to external framework nodes (CFItem / ceasn:Competency / CTDL / CFRubric).
 *  2. `association[]` — explicit edges tie each Competency credential to the course(s)
 *     that develop it (`isRelatedTo`) and tie courses to the degree (`isChildOf`), so the
 *     renderer can map competencies to their parent course/degree with no heuristics.
 *
 * Evidence is attached at three levels: top-level (whole transcript), per-course, and on
 * the degree — to exercise the flat "all evidence" count and per-record grouping.
 */
export const clrCompetencyAligned: CredentialFixture = {
    id: 'clr/competency-aligned',
    name: 'Riverside College — Competency-Aligned Web Development Certificate',
    description:
        'A compact CLR v2 transcript that ties courses and a certificate to competency framework alignments, links competency credentials to their parent courses via associations, and carries evidence at the transcript, course, and program levels.',
    spec: 'clr-v2',
    profile: 'learner-record',
    features: [
        'results',
        'evidence',
        'alignment',
        'image',
        'associations',
        'nested-credentials',
        'status',
    ],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    tags: ['transcript', 'certificate', 'web-development', 'clr-v2', 'alignment', 'competencies'],

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            'https://purl.imsglobal.org/spec/clr/v2p0/context-2.0.1.json',
        ],
        id: 'urn:uuid:rc-clr-2025-sam-okafor-001',
        type: ['VerifiableCredential', 'ClrCredential'],
        name: 'Web Development Certificate — Riverside College',
        description:
            'Competency-aligned certificate record for Samuel Okafor, documenting four courses, three demonstrated competencies, and the awarded Full-Stack Web Development certificate.',
        image: {
            id: 'https://www.rcc.edu/_resources/assets/icons/riverside-logo.svg',
            type: 'Image',
            caption: 'Riverside College official logo',
        },
        issuer: {
            id: 'did:web:registrar.riverside.edu',
            type: ['Profile'],
            name: 'Riverside College — Office of the Registrar',
            url: 'https://riverside.edu/registrar',
            email: 'registrar@riverside.edu',
            image: {
                id: 'https://www.rcc.edu/_resources/assets/icons/riverside-logo.svg',
                type: 'Image',
                caption: 'Riverside City College official logo',
            },
            address: {
                type: ['Address'],
                streetAddress: '450 River Road',
                addressLocality: 'Riverside',
                addressRegion: 'CA',
                postalCode: '92501',
                addressCountry: 'USA',
            },
        },
        validFrom: '2025-06-02T00:00:00Z',
        awardedDate: '2025-05-30',
        credentialStatus: {
            id: 'https://registrar.riverside.edu/status/2025#7',
            type: 'BitstringStatusListEntry',
            statusPurpose: 'revocation',
            statusListIndex: '7',
            statusListCredential: 'https://registrar.riverside.edu/status/2025',
        },
        // Top-level evidence — belongs to the transcript as a whole.
        evidence: [
            {
                id: 'https://registrar.riverside.edu/transcripts/t-rc-2025-001.pdf',
                type: ['Evidence'],
                name: 'Official Certificate Transcript',
                description:
                    'Official sealed certificate transcript issued by the Office of the Registrar.',
                genre: 'Document',
                audience: 'Employer',
            },
        ],
        credentialSubject: {
            id: 'did:example:rc-student-2025-001',
            type: ['ClrSubject'],
            identifier: [
                {
                    type: 'IdentityObject',
                    identityHash: 'Samuel Okafor',
                    identityType: 'name',
                    hashed: false,
                },
                {
                    type: 'IdentityObject',
                    identityHash: 's.okafor@riverside.edu',
                    identityType: 'emailAddress',
                    hashed: false,
                },
                {
                    type: 'IdentityObject',
                    identityHash: 'RC-2023-0188',
                    identityType: 'studentId',
                    hashed: false,
                },
            ],
            verifiableCredential: [
                // ── COURSE 1 ──────────────────────────────────────────────────────
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    id: 'urn:uuid:rc-web101',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'WEB 101 — HTML, CSS & Accessibility',
                    issuer: {
                        id: 'did:web:registrar.riverside.edu',
                        type: ['Profile'],
                        name: 'Riverside College',
                    },
                    validFrom: '2024-09-20T00:00:00Z',
                    // Per-course evidence.
                    evidence: [
                        {
                            id: 'https://riverside.edu/portfolios/okafor/web101-landing-page.png',
                            type: ['Evidence'],
                            name: 'Accessible Landing Page',
                            description:
                                'Final project: a WCAG 2.1 AA-compliant responsive landing page.',
                            genre: 'Image',
                            audience: 'Faculty, Employer',
                        },
                    ],
                    credentialSubject: {
                        id: 'did:example:rc-student-2025-001',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'https://riverside.edu/courses/web101',
                            type: ['Achievement'],
                            achievementType: 'Course',
                            name: 'HTML, CSS & Accessibility',
                            description:
                                'Semantic HTML, modern CSS layout (flexbox, grid), responsive design, and building to WCAG accessibility standards.',
                            humanCode: 'WEB 101',
                            fieldOfStudy: 'Web Development',
                            inLanguage: 'en',
                            // Course → framework competency alignment.
                            alignment: [
                                {
                                    type: ['Alignment'],
                                    targetCode: 'WD.FRONT.1',
                                    targetName: 'Front-End Fundamentals',
                                    targetFramework: 'Riverside Web Dev Competency Framework',
                                    targetType: 'CFItem',
                                    targetUrl: 'https://riverside.edu/frameworks/wd/FRONT.1',
                                    targetDescription:
                                        'Builds accessible, responsive interfaces with semantic HTML and modern CSS.',
                                },
                                {
                                    type: ['Alignment'],
                                    targetCode: 'ceasn:accessibility-aware-design',
                                    targetName: 'Accessibility-Aware Design',
                                    targetFramework: 'Open Skills Network',
                                    targetType: 'ceasn:Competency',
                                    targetUrl:
                                        'https://osn.example.org/competencies/accessibility-aware-design',
                                },
                            ],
                            resultDescription: [
                                {
                                    id: 'urn:uuid:rc-rd-letter',
                                    type: ['ResultDescription'],
                                    name: 'Letter Grade',
                                    resultType: 'LetterGrade',
                                    allowedValue: ['A', 'B', 'C', 'D', 'F'],
                                },
                            ],
                        },
                        result: [
                            {
                                type: ['Result'],
                                value: 'A',
                                resultDescription: 'urn:uuid:rc-rd-letter',
                            },
                        ],
                        creditsEarned: 3,
                        term: 'Fall 2024',
                    },
                },
                // ── COURSE 2 ──────────────────────────────────────────────────────
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    id: 'urn:uuid:rc-web150',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'WEB 150 — JavaScript Programming',
                    issuer: {
                        id: 'did:web:registrar.riverside.edu',
                        type: ['Profile'],
                        name: 'Riverside College',
                    },
                    validFrom: '2024-12-18T00:00:00Z',
                    evidence: [
                        {
                            id: 'https://riverside.edu/portfolios/okafor/web150-todo-app.pdf',
                            type: ['Evidence'],
                            name: 'Interactive To-Do App Writeup',
                            description:
                                'Project report for a vanilla-JS task manager with localStorage persistence.',
                            genre: 'Document',
                            audience: 'Faculty',
                        },
                    ],
                    credentialSubject: {
                        id: 'did:example:rc-student-2025-001',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'https://riverside.edu/courses/web150',
                            type: ['Achievement'],
                            achievementType: 'Course',
                            name: 'JavaScript Programming',
                            description:
                                'Core JavaScript: types, functions, closures, the DOM, events, asynchronous patterns, and fetch.',
                            humanCode: 'WEB 150',
                            fieldOfStudy: 'Web Development',
                            inLanguage: 'en',
                            alignment: [
                                {
                                    type: ['Alignment'],
                                    targetCode: 'WD.PROG.1',
                                    targetName: 'Client-Side Programming',
                                    targetFramework: 'Riverside Web Dev Competency Framework',
                                    targetType: 'CFItem',
                                    targetUrl: 'https://riverside.edu/frameworks/wd/PROG.1',
                                    targetDescription:
                                        'Writes interactive client-side logic using modern JavaScript.',
                                },
                            ],
                            resultDescription: [
                                {
                                    id: 'urn:uuid:rc-rd-letter',
                                    type: ['ResultDescription'],
                                    name: 'Letter Grade',
                                    resultType: 'LetterGrade',
                                    allowedValue: ['A', 'B', 'C', 'D', 'F'],
                                },
                            ],
                        },
                        result: [
                            {
                                type: ['Result'],
                                value: 'A-',
                                resultDescription: 'urn:uuid:rc-rd-letter',
                            },
                        ],
                        creditsEarned: 4,
                        term: 'Fall 2024',
                    },
                },
                // ── COURSE 3 ──────────────────────────────────────────────────────
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    id: 'urn:uuid:rc-web220',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'WEB 220 — React & Component Architecture',
                    issuer: {
                        id: 'did:web:registrar.riverside.edu',
                        type: ['Profile'],
                        name: 'Riverside College',
                    },
                    validFrom: '2025-05-14T00:00:00Z',
                    credentialSubject: {
                        id: 'did:example:rc-student-2025-001',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'https://riverside.edu/courses/web220',
                            type: ['Achievement'],
                            achievementType: 'Course',
                            name: 'React & Component Architecture',
                            description:
                                'Building component-based UIs with React: hooks, state management, data fetching, and testing.',
                            humanCode: 'WEB 220',
                            fieldOfStudy: 'Web Development',
                            inLanguage: 'en',
                            alignment: [
                                {
                                    type: ['Alignment'],
                                    targetCode: 'WD.PROG.2',
                                    targetName: 'Component-Based UI Engineering',
                                    targetFramework: 'Riverside Web Dev Competency Framework',
                                    targetType: 'CFItem',
                                    targetUrl: 'https://riverside.edu/frameworks/wd/PROG.2',
                                },
                            ],
                            resultDescription: [
                                {
                                    id: 'urn:uuid:rc-rd-letter',
                                    type: ['ResultDescription'],
                                    name: 'Letter Grade',
                                    resultType: 'LetterGrade',
                                    allowedValue: ['A', 'B', 'C', 'D', 'F'],
                                },
                            ],
                        },
                        result: [
                            {
                                type: ['Result'],
                                value: 'A',
                                resultDescription: 'urn:uuid:rc-rd-letter',
                            },
                        ],
                        creditsEarned: 4,
                        term: 'Spring 2025',
                    },
                },
                // ── COURSE 4 ──────────────────────────────────────────────────────
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    id: 'urn:uuid:rc-web240',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'WEB 240 — APIs & Backend Services',
                    issuer: {
                        id: 'did:web:registrar.riverside.edu',
                        type: ['Profile'],
                        name: 'Riverside College',
                    },
                    validFrom: '2025-05-14T00:00:00Z',
                    evidence: [
                        {
                            id: 'https://riverside.edu/portfolios/okafor/web240-api.pdf',
                            type: ['Evidence'],
                            name: 'REST API Design Document',
                            description:
                                'Design and implementation notes for a Node/Express REST API with auth.',
                            genre: 'Document',
                            audience: 'Faculty, Employer',
                        },
                    ],
                    credentialSubject: {
                        id: 'did:example:rc-student-2025-001',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'https://riverside.edu/courses/web240',
                            type: ['Achievement'],
                            achievementType: 'Course',
                            name: 'APIs & Backend Services',
                            description:
                                'Designing and building RESTful services with Node and Express, authentication, and persistence.',
                            humanCode: 'WEB 240',
                            fieldOfStudy: 'Web Development',
                            inLanguage: 'en',
                            alignment: [
                                {
                                    type: ['Alignment'],
                                    targetCode: 'WD.BACK.1',
                                    targetName: 'Server-Side Services',
                                    targetFramework: 'Riverside Web Dev Competency Framework',
                                    targetType: 'CFItem',
                                    targetUrl: 'https://riverside.edu/frameworks/wd/BACK.1',
                                },
                            ],
                            resultDescription: [
                                {
                                    id: 'urn:uuid:rc-rd-letter',
                                    type: ['ResultDescription'],
                                    name: 'Letter Grade',
                                    resultType: 'LetterGrade',
                                    allowedValue: ['A', 'B', 'C', 'D', 'F'],
                                },
                            ],
                        },
                        result: [
                            {
                                type: ['Result'],
                                value: 'B+',
                                resultDescription: 'urn:uuid:rc-rd-letter',
                            },
                        ],
                        creditsEarned: 4,
                        term: 'Spring 2025',
                    },
                },

                // ── CERTIFICATE (PROGRAM) ─────────────────────────────────────────
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    id: 'urn:uuid:rc-cert-001',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'Full-Stack Web Development Certificate',
                    issuer: {
                        id: 'did:web:registrar.riverside.edu',
                        type: ['Profile'],
                        name: 'Riverside College',
                    },
                    validFrom: '2025-05-30T00:00:00Z',
                    // Program-level evidence.
                    evidence: [
                        {
                            id: 'https://riverside.edu/certificates/c-rc-2025-001.jpg',
                            type: ['Evidence'],
                            name: 'Certificate of Completion',
                            description:
                                'Full-Stack Web Development certificate awarded May 30, 2025.',
                            genre: 'Image',
                            audience: 'General',
                        },
                    ],
                    credentialSubject: {
                        id: 'did:example:rc-student-2025-001',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'https://riverside.edu/programs/fullstack-cert',
                            type: ['Achievement'],
                            achievementType: 'LearningProgram',
                            name: 'Full-Stack Web Development Certificate',
                            description:
                                'A professional certificate covering the full web stack: accessible front-ends, interactive JavaScript, React, and backend APIs.',
                            humanCode: 'CERT-FSWD',
                            fieldOfStudy: 'Web Development',
                            inLanguage: 'en',
                            // Program → framework alignment.
                            alignment: [
                                {
                                    type: ['Alignment'],
                                    targetCode: 'OND-WEBDEV',
                                    targetName: 'O*NET Web Developers (15-1254.00)',
                                    targetFramework: 'O*NET-SOC 2019',
                                    targetType: 'CTDL',
                                    targetUrl: 'https://www.onetonline.org/link/summary/15-1254.00',
                                    targetDescription:
                                        'Aligns to the O*NET occupational profile for Web Developers.',
                                },
                            ],
                            resultDescription: [
                                {
                                    id: 'urn:uuid:rc-rd-gpa',
                                    type: ['ResultDescription'],
                                    name: 'Certificate GPA',
                                    resultType: 'GradePointAverage',
                                    valueMin: '0.0',
                                    valueMax: '4.0',
                                },
                            ],
                        },
                        result: [
                            {
                                type: ['Result'],
                                value: 3.78,
                                resultDescription: 'urn:uuid:rc-rd-gpa',
                            },
                        ],
                    },
                },

                // ── COMPETENCIES ──────────────────────────────────────────────────
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    id: 'urn:uuid:rc-comp-frontend',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'Competency — Accessible Front-End Development',
                    issuer: {
                        id: 'did:web:registrar.riverside.edu',
                        type: ['Profile'],
                        name: 'Riverside College',
                    },
                    validFrom: '2025-05-30T00:00:00Z',
                    credentialSubject: {
                        id: 'did:example:rc-student-2025-001',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'https://riverside.edu/competencies/accessible-frontend',
                            type: ['Achievement'],
                            achievementType: 'Competency',
                            name: 'Accessible Front-End Development',
                            description:
                                'Builds responsive, accessible user interfaces that meet WCAG 2.1 AA.',
                            fieldOfStudy: 'Web Development',
                            alignment: [
                                {
                                    type: ['Alignment'],
                                    targetCode: 'WD.FRONT.1',
                                    targetName: 'Front-End Fundamentals',
                                    targetFramework: 'Riverside Web Dev Competency Framework',
                                    targetType: 'CFItem',
                                    targetUrl: 'https://riverside.edu/frameworks/wd/FRONT.1',
                                },
                            ],
                            resultDescription: [
                                {
                                    id: 'urn:uuid:rc-rd-comp-level',
                                    type: ['ResultDescription'],
                                    name: 'Competency Level',
                                    resultType: 'RubricCriterionLevel',
                                    allowedValue: ['Developing', 'Proficient', 'Advanced'],
                                },
                            ],
                        },
                        result: [
                            {
                                type: ['Result'],
                                value: 'Advanced',
                                resultDescription: 'urn:uuid:rc-rd-comp-level',
                            },
                        ],
                    },
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    id: 'urn:uuid:rc-comp-js',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'Competency — JavaScript Application Development',
                    issuer: {
                        id: 'did:web:registrar.riverside.edu',
                        type: ['Profile'],
                        name: 'Riverside College',
                    },
                    validFrom: '2025-05-30T00:00:00Z',
                    credentialSubject: {
                        id: 'did:example:rc-student-2025-001',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'https://riverside.edu/competencies/javascript-apps',
                            type: ['Achievement'],
                            achievementType: 'Competency',
                            name: 'JavaScript Application Development',
                            description:
                                'Designs and builds interactive applications using JavaScript and React.',
                            fieldOfStudy: 'Web Development',
                            alignment: [
                                {
                                    type: ['Alignment'],
                                    targetCode: 'WD.PROG.2',
                                    targetName: 'Component-Based UI Engineering',
                                    targetFramework: 'Riverside Web Dev Competency Framework',
                                    targetType: 'CFItem',
                                    targetUrl: 'https://riverside.edu/frameworks/wd/PROG.2',
                                },
                            ],
                            resultDescription: [
                                {
                                    id: 'urn:uuid:rc-rd-comp-level',
                                    type: ['ResultDescription'],
                                    name: 'Competency Level',
                                    resultType: 'RubricCriterionLevel',
                                    allowedValue: ['Developing', 'Proficient', 'Advanced'],
                                },
                            ],
                        },
                        result: [
                            {
                                type: ['Result'],
                                value: 'Proficient',
                                resultDescription: 'urn:uuid:rc-rd-comp-level',
                            },
                        ],
                    },
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    id: 'urn:uuid:rc-comp-backend',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'Competency — Backend API Development',
                    issuer: {
                        id: 'did:web:registrar.riverside.edu',
                        type: ['Profile'],
                        name: 'Riverside College',
                    },
                    validFrom: '2025-05-30T00:00:00Z',
                    credentialSubject: {
                        id: 'did:example:rc-student-2025-001',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'https://riverside.edu/competencies/backend-apis',
                            type: ['Achievement'],
                            achievementType: 'Competency',
                            name: 'Backend API Development',
                            description:
                                'Designs and implements secure RESTful services and data persistence.',
                            fieldOfStudy: 'Web Development',
                            alignment: [
                                {
                                    type: ['Alignment'],
                                    targetCode: 'WD.BACK.1',
                                    targetName: 'Server-Side Services',
                                    targetFramework: 'Riverside Web Dev Competency Framework',
                                    targetType: 'CFItem',
                                    targetUrl: 'https://riverside.edu/frameworks/wd/BACK.1',
                                },
                            ],
                            resultDescription: [
                                {
                                    id: 'urn:uuid:rc-rd-comp-level',
                                    type: ['ResultDescription'],
                                    name: 'Competency Level',
                                    resultType: 'RubricCriterionLevel',
                                    allowedValue: ['Developing', 'Proficient', 'Advanced'],
                                },
                            ],
                        },
                        result: [
                            {
                                type: ['Result'],
                                value: 'Proficient',
                                resultDescription: 'urn:uuid:rc-rd-comp-level',
                            },
                        ],
                    },
                },
            ],

            association: [
                // Courses are part of the certificate.
                {
                    type: ['Association'],
                    associationType: 'isChildOf',
                    sourceId: 'urn:uuid:rc-web101',
                    targetId: 'urn:uuid:rc-cert-001',
                },
                {
                    type: ['Association'],
                    associationType: 'isChildOf',
                    sourceId: 'urn:uuid:rc-web150',
                    targetId: 'urn:uuid:rc-cert-001',
                },
                {
                    type: ['Association'],
                    associationType: 'isChildOf',
                    sourceId: 'urn:uuid:rc-web220',
                    targetId: 'urn:uuid:rc-cert-001',
                },
                {
                    type: ['Association'],
                    associationType: 'isChildOf',
                    sourceId: 'urn:uuid:rc-web240',
                    targetId: 'urn:uuid:rc-cert-001',
                },

                // Competencies are developed by specific courses (parent mapping).
                {
                    type: ['Association'],
                    associationType: 'isRelatedTo',
                    sourceId: 'urn:uuid:rc-comp-frontend',
                    targetId: 'urn:uuid:rc-web101',
                },
                {
                    type: ['Association'],
                    associationType: 'isRelatedTo',
                    sourceId: 'urn:uuid:rc-comp-js',
                    targetId: 'urn:uuid:rc-web150',
                },
                {
                    type: ['Association'],
                    associationType: 'isRelatedTo',
                    sourceId: 'urn:uuid:rc-comp-js',
                    targetId: 'urn:uuid:rc-web220',
                },
                {
                    type: ['Association'],
                    associationType: 'isRelatedTo',
                    sourceId: 'urn:uuid:rc-comp-backend',
                    targetId: 'urn:uuid:rc-web240',
                },

                // Competencies also relate to the overall certificate.
                {
                    type: ['Association'],
                    associationType: 'isRelatedTo',
                    sourceId: 'urn:uuid:rc-comp-frontend',
                    targetId: 'urn:uuid:rc-cert-001',
                },
                {
                    type: ['Association'],
                    associationType: 'isRelatedTo',
                    sourceId: 'urn:uuid:rc-comp-js',
                    targetId: 'urn:uuid:rc-cert-001',
                },
                {
                    type: ['Association'],
                    associationType: 'isRelatedTo',
                    sourceId: 'urn:uuid:rc-comp-backend',
                    targetId: 'urn:uuid:rc-cert-001',
                },

                // Course sequencing.
                {
                    type: ['Association'],
                    associationType: 'precedes',
                    sourceId: 'urn:uuid:rc-web101',
                    targetId: 'urn:uuid:rc-web150',
                },
                {
                    type: ['Association'],
                    associationType: 'precedes',
                    sourceId: 'urn:uuid:rc-web150',
                    targetId: 'urn:uuid:rc-web220',
                },
                {
                    type: ['Association'],
                    associationType: 'precedes',
                    sourceId: 'urn:uuid:rc-web150',
                    targetId: 'urn:uuid:rc-web240',
                },
            ],
        },
    },
};
