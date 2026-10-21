import type { CredentialFixture } from '../../types';

/**
 * LC-2184: synthetic, unsigned CLR display/issuance template.
 * Both the outer record and embedded achievements intentionally have no proof.
 * Sign/rebind children before the outer CLR for cryptographic verification tests.
 */
export const clrMixedCareerRecord: CredentialFixture = {
    id: 'clr/mixed-career-record',
    name: 'Mixed Career Record — Learning, Work & Professional Practice',
    description:
        'Course-first regression fixture: employment, membership, apprenticeship, competency, and license records must remain accessible when a course selects the transcript layout. Unsigned display/issuance template; child proofs must be issued separately for a fully verifiable CLR.',
    spec: 'clr-v2',
    profile: 'learner-record',
    features: [
        'nested-credentials',
        'associations',
        'results',
        'evidence',
        'alignment',
        'source',
        'expiration',
    ],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    tags: [
        'lc-2184',
        'non-academic',
        'synthetic',
        'mixed',
        'career',
        'education',
        'employment',
        'membership',
        'apprenticeship',
        'licensing',
        'multi-issuer',
    ],
    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/clr/v2p0/context.json',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            {
                partial: {
                    '@id': 'https://purl.imsglobal.org/spec/vc/clr/vocab.html#partial',
                    '@type': 'http://www.w3.org/2001/XMLSchema#boolean',
                },
                identifier: {
                    '@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#identifier',
                    '@container': '@set',
                },
            },
        ],
        id: 'urn:uuid:c7d9e662-894e-57e5-a9a6-c7a7ac0248ca',
        type: ['VerifiableCredential', 'ClrCredential'],
        name: 'Mixed Career Record — Learning, Work & Professional Practice',
        description:
            'Synthetic demonstration record as of September 1, 2026. Course-first regression fixture: employment, membership, apprenticeship, competency, and license records must remain accessible when a course selects the transcript layout.',
        issuer: {
            id: 'did:example:lc2184-career-records',
            type: ['Profile'],
            name: 'Career Record Assembly Service (Fictional)',
            url: 'https://career-records.example',
            description: 'Fictional organization used only for LearnCard display tests.',
        },
        validFrom: '2026-09-01T12:00:00Z',
        partial: true,
        credentialSubject: {
            id: 'did:example:lc2184-alex-morgan',
            type: ['ClrSubject'],
            identifier: [
                {
                    type: 'IdentityObject',
                    hashed: false,
                    identityType: 'name',
                    identityHash: 'Alex Morgan (Synthetic)',
                },
            ],
            verifiableCredential: [
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    id: 'urn:uuid:cdd6f7ed-27b2-5af8-8ee2-c2e3a2ea4e18',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'Applied Systems Thinking',
                    description:
                        'An academic course appearing alongside professional and work records.',
                    issuer: {
                        id: 'did:example:lc2184-sequoia-college',
                        type: ['Profile'],
                        name: 'Sequoia Technical College (Fictional)',
                        url: 'https://sequoia-college.example',
                        description:
                            'Fictional organization used only for LearnCard display tests.',
                    },
                    validFrom: '2026-05-22T12:00:00Z',
                    credentialSubject: {
                        id: 'did:example:lc2184-alex-morgan',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'urn:uuid:2b44d9c7-d291-58da-8cba-15696c3b1f7d',
                            type: ['Achievement'],
                            achievementType: 'Course',
                            name: 'Applied Systems Thinking',
                            description:
                                'An academic course appearing alongside professional and work records.',
                            criteria: {
                                narrative: 'Complete the course with a final grade of C or above.',
                            },
                            creator: {
                                id: 'did:example:lc2184-sequoia-college',
                                type: ['Profile'],
                                name: 'Sequoia Technical College (Fictional)',
                                url: 'https://sequoia-college.example',
                                description:
                                    'Fictional organization used only for LearnCard display tests.',
                            },
                            humanCode: 'SYN-MIXED-COLLEGE-COURSE',
                            version: '1.0',
                            inLanguage: 'en',
                            tag: ['synthetic', 'lc-2184'],
                            resultDescription: [
                                {
                                    id: 'urn:uuid:6171955a-14d9-515f-b4d2-003cf32a077e',
                                    type: ['ResultDescription'],
                                    name: 'Final grade',
                                    resultType: 'LetterGrade',
                                    allowedValue: ['F', 'D', 'C', 'B', 'A'],
                                    requiredValue: 'C',
                                },
                            ],
                            alignment: [
                                {
                                    type: ['Alignment'],
                                    targetName: 'Systems thinking',
                                    targetCode: 'SYSTEMS-101',
                                    targetFramework: 'Synthetic Workplace Capability Framework',
                                    targetUrl: 'https://skills.example/framework/systems-101',
                                    targetDescription:
                                        'Fictional framework node for testing explicit alignment display; not a real qualification equivalence.',
                                    targetType: 'CFItem',
                                },
                            ],
                            creditsAvailable: 3,
                            fieldOfStudy: 'Applied systems',
                        },
                        activityStartDate: '2026-01-12T09:00:00Z',
                        activityEndDate: '2026-05-15T17:00:00Z',
                        source: {
                            id: 'did:example:lc2184-sequoia-college',
                            type: ['Profile'],
                            name: 'Sequoia Technical College (Fictional)',
                            url: 'https://sequoia-college.example',
                            description:
                                'Fictional organization used only for LearnCard display tests.',
                        },
                        result: [
                            {
                                type: ['Result'],
                                resultDescription: 'urn:uuid:6171955a-14d9-515f-b4d2-003cf32a077e',
                                value: 'A',
                            },
                        ],
                        creditsEarned: 3,
                        term: 'Spring 2026',
                    },
                    awardedDate: '2026-05-22T12:00:00Z',
                    evidence: [
                        {
                            type: ['Evidence'],
                            name: 'Course project summary',
                            description: 'Synthetic assessment evidence.',
                            narrative:
                                'The learner completed the synthetic systems-mapping project with a final grade of A.',
                            genre: 'Assessment record',
                            audience: 'Learner and authorized reviewer',
                        },
                    ],
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    id: 'urn:uuid:e0b80289-4d2b-52cf-abb9-ad6c1d085a7b',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'Platform Engineering Practice',
                    description:
                        'A completed workplace practice period contributing to service reliability.',
                    issuer: {
                        id: 'did:example:lc2184-harbor-systems',
                        type: ['Profile'],
                        name: 'Harbor Systems — People & Development',
                        url: 'https://harbor-systems.example',
                        description:
                            'Fictional organization used only for LearnCard display tests.',
                    },
                    validFrom: '2026-08-15T12:00:00Z',
                    credentialSubject: {
                        id: 'did:example:lc2184-alex-morgan',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'urn:uuid:271fcad0-7169-547b-856f-5ca71c4a1915',
                            type: ['Achievement'],
                            achievementType: 'Achievement',
                            name: 'Platform Engineering Practice',
                            description:
                                'A completed workplace practice period contributing to service reliability.',
                            criteria: {
                                narrative:
                                    'Complete the practice period and receive an assessment of the documented project outcomes.',
                            },
                            creator: {
                                id: 'did:example:lc2184-harbor-systems',
                                type: ['Profile'],
                                name: 'Harbor Systems — People & Development',
                                url: 'https://harbor-systems.example',
                                description:
                                    'Fictional organization used only for LearnCard display tests.',
                            },
                            humanCode: 'SYN-EMPLOYMENT-PRACTICE',
                            version: '1.0',
                            inLanguage: 'en',
                            tag: ['synthetic', 'lc-2184'],
                            resultDescription: [
                                {
                                    id: 'urn:uuid:1a704213-0de4-50d8-ae7b-575156c39dd2',
                                    type: ['ResultDescription'],
                                    name: 'Activity completion',
                                    resultType: 'Status',
                                },
                            ],
                            alignment: [
                                {
                                    type: ['Alignment'],
                                    targetName: 'Service reliability practice',
                                    targetCode: 'REL-101',
                                    targetFramework: 'Synthetic Workplace Capability Framework',
                                    targetUrl: 'https://skills.example/framework/rel-101',
                                    targetDescription:
                                        'Fictional framework node for testing explicit alignment display; not a real qualification equivalence.',
                                    targetType: 'CFItem',
                                },
                            ],
                            fieldOfStudy: 'Software engineering',
                            specialization: 'Platform reliability',
                        },
                        activityStartDate: '2025-02-03T09:00:00Z',
                        activityEndDate: '2026-06-30T17:00:00Z',
                        role: 'Platform Engineer',
                        narrative:
                            'Led a service-migration project, documented incident reviews, and mentored two colleagues. This is a synthetic activity assertion, not a payroll record.',
                        source: {
                            id: 'did:example:lc2184-harbor-assessment',
                            type: ['Profile'],
                            name: 'Harbor Systems — Assessment Team',
                            url: 'https://harbor-assessment.example',
                            description:
                                'Fictional organization used only for LearnCard display tests.',
                        },
                        result: [
                            {
                                type: ['Result'],
                                resultDescription: 'urn:uuid:1a704213-0de4-50d8-ae7b-575156c39dd2',
                                status: 'Completed',
                            },
                        ],
                    },
                    awardedDate: '2026-07-10T12:00:00Z',
                    evidence: [
                        {
                            type: ['Evidence'],
                            name: 'Manager assessment narrative',
                            description: 'Synthetic assessment evidence.',
                            narrative:
                                'The assessor reviewed the migration plan and three incident review write-ups.',
                            genre: 'Assessment record',
                            audience: 'Learner and authorized reviewer',
                        },
                    ],
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    id: 'urn:uuid:6d5e9cdf-41a6-5223-abff-faceaad2f29f',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'Professional Society Membership',
                    description:
                        'Admission to a fictional professional organization for a stated period.',
                    issuer: {
                        id: 'did:example:lc2184-practice-guild',
                        type: ['Profile'],
                        name: 'Society of Applied Practice (Fictional)',
                        url: 'https://practice-guild.example',
                        description:
                            'Fictional organization used only for LearnCard display tests.',
                    },
                    validFrom: '2026-01-01T00:00:00Z',
                    credentialSubject: {
                        id: 'did:example:lc2184-alex-morgan',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'urn:uuid:6ad7f99b-7d9d-59a8-a207-825d1d2bf57e',
                            type: ['Achievement'],
                            achievementType: 'Membership',
                            name: 'Professional Society Membership',
                            description:
                                'Admission to a fictional professional organization for a stated period.',
                            criteria: {
                                narrative:
                                    'Meet the society membership criteria and receive an admission decision.',
                            },
                            creator: {
                                id: 'did:example:lc2184-practice-guild',
                                type: ['Profile'],
                                name: 'Society of Applied Practice (Fictional)',
                                url: 'https://practice-guild.example',
                                description:
                                    'Fictional organization used only for LearnCard display tests.',
                            },
                            humanCode: 'SYN-PROFESSIONAL-MEMBERSHIP',
                            version: '1.0',
                            inLanguage: 'en',
                            tag: ['synthetic', 'lc-2184'],
                            resultDescription: [
                                {
                                    id: 'urn:uuid:ea631e7d-ca45-58ab-85e6-f96da00fa43c',
                                    type: ['ResultDescription'],
                                    name: 'Membership admission',
                                    resultType: 'Status',
                                },
                            ],
                            alignment: [
                                {
                                    type: ['Alignment'],
                                    targetName: 'Professional practice participation',
                                    targetCode: 'PRO-101',
                                    targetFramework: 'Synthetic Workplace Capability Framework',
                                    targetUrl: 'https://skills.example/framework/pro-101',
                                    targetDescription:
                                        'Fictional framework node for testing explicit alignment display; not a real qualification equivalence.',
                                    targetType: 'CFItem',
                                },
                            ],
                        },
                        activityStartDate: '2026-01-01T00:00:00Z',
                        activityEndDate: '2026-12-31T23:59:59Z',
                        role: 'Professional Member',
                        source: {
                            id: 'did:example:lc2184-practice-guild',
                            type: ['Profile'],
                            name: 'Society of Applied Practice (Fictional)',
                            url: 'https://practice-guild.example',
                            description:
                                'Fictional organization used only for LearnCard display tests.',
                        },
                        identifier: [
                            {
                                type: 'IdentityObject',
                                hashed: false,
                                identityType: 'ext:membershipId',
                                identityHash: 'SYN-MEM-2184-001',
                            },
                        ],
                        result: [
                            {
                                type: ['Result'],
                                resultDescription: 'urn:uuid:ea631e7d-ca45-58ab-85e6-f96da00fa43c',
                                status: 'Completed',
                            },
                        ],
                    },
                    awardedDate: '2026-01-01T00:00:00Z',
                    validUntil: '2026-12-31T23:59:59Z',
                    evidence: [
                        {
                            type: ['Evidence'],
                            name: 'Admission record',
                            description: 'Synthetic assessment evidence.',
                            narrative:
                                'Membership SYN-MEM-2184-001 covers calendar year 2026; admission is not a professional license.',
                            genre: 'Assessment record',
                            audience: 'Learner and authorized reviewer',
                        },
                    ],
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    id: 'urn:uuid:22b8181d-9367-5877-be1f-bbf582ba2261',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'Operations Apprenticeship Certificate',
                    description:
                        'A workplace apprenticeship completion credential, not an academic course.',
                    issuer: {
                        id: 'did:example:lc2184-harbor-systems',
                        type: ['Profile'],
                        name: 'Harbor Systems — People & Development',
                        url: 'https://harbor-systems.example',
                        description:
                            'Fictional organization used only for LearnCard display tests.',
                    },
                    validFrom: '2025-02-14T12:00:00Z',
                    credentialSubject: {
                        id: 'did:example:lc2184-alex-morgan',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'urn:uuid:3dc10a7d-7203-5579-9b78-1ae86c92a2c0',
                            type: ['Achievement'],
                            achievementType: 'ApprenticeshipCertificate',
                            name: 'Operations Apprenticeship Certificate',
                            description:
                                'A workplace apprenticeship completion credential, not an academic course.',
                            criteria: {
                                narrative:
                                    'Complete the supervised apprenticeship and employer assessment.',
                            },
                            creator: {
                                id: 'did:example:lc2184-harbor-systems',
                                type: ['Profile'],
                                name: 'Harbor Systems — People & Development',
                                url: 'https://harbor-systems.example',
                                description:
                                    'Fictional organization used only for LearnCard display tests.',
                            },
                            humanCode: 'SYN-MIXED-APPRENTICESHIP',
                            version: '1.0',
                            inLanguage: 'en',
                            tag: ['synthetic', 'lc-2184'],
                            resultDescription: [
                                {
                                    id: 'urn:uuid:c8113e36-a6b9-51aa-b1a7-cb93227cae9d',
                                    type: ['ResultDescription'],
                                    name: 'Apprenticeship completion',
                                    resultType: 'Status',
                                },
                            ],
                            alignment: [
                                {
                                    type: ['Alignment'],
                                    targetName: 'Operational handover',
                                    targetCode: 'OPS-101',
                                    targetFramework: 'Synthetic Workplace Capability Framework',
                                    targetUrl: 'https://skills.example/framework/ops-101',
                                    targetDescription:
                                        'Fictional framework node for testing explicit alignment display; not a real qualification equivalence.',
                                    targetType: 'CFItem',
                                },
                            ],
                        },
                        activityStartDate: '2024-02-01T09:00:00Z',
                        activityEndDate: '2025-01-31T17:00:00Z',
                        role: 'Operations Apprentice',
                        narrative:
                            'Completed the agreed workplace practice and assessment activities.',
                        source: {
                            id: 'did:example:lc2184-harbor-assessment',
                            type: ['Profile'],
                            name: 'Harbor Systems — Assessment Team',
                            url: 'https://harbor-assessment.example',
                            description:
                                'Fictional organization used only for LearnCard display tests.',
                        },
                        result: [
                            {
                                type: ['Result'],
                                resultDescription: 'urn:uuid:c8113e36-a6b9-51aa-b1a7-cb93227cae9d',
                                status: 'Completed',
                            },
                        ],
                    },
                    awardedDate: '2025-02-14T12:00:00Z',
                    evidence: [
                        {
                            type: ['Evidence'],
                            name: 'Completion assessment',
                            description: 'Synthetic assessment evidence.',
                            narrative:
                                'The fictional employer recorded completion of the supervised apprenticeship.',
                            genre: 'Assessment record',
                            audience: 'Learner and authorized reviewer',
                        },
                    ],
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    id: 'urn:uuid:c1bc221b-063e-5923-8a9f-729ab50aaed6',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'Incident Review Facilitation',
                    description:
                        'An assessed workplace capability expressed only by an achieved rubric-level reference.',
                    issuer: {
                        id: 'did:example:lc2184-harbor-systems',
                        type: ['Profile'],
                        name: 'Harbor Systems — People & Development',
                        url: 'https://harbor-systems.example',
                        description:
                            'Fictional organization used only for LearnCard display tests.',
                    },
                    validFrom: '2026-09-01T12:00:00Z',
                    credentialSubject: {
                        id: 'did:example:lc2184-alex-morgan',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'urn:uuid:d45026e9-13d2-5557-881a-b7ca2b655cd3',
                            type: ['Achievement'],
                            achievementType: 'Competency',
                            name: 'Incident Review Facilitation',
                            description:
                                'An assessed workplace capability expressed only by an achieved rubric-level reference.',
                            criteria: {
                                narrative:
                                    'Demonstrate Independent level or above on the published rubric.',
                            },
                            creator: {
                                id: 'did:example:lc2184-cedar-standards',
                                type: ['Profile'],
                                name: 'Cedar Skills Council',
                                url: 'https://cedar-standards.example',
                                description:
                                    'Fictional organization used only for LearnCard display tests.',
                            },
                            humanCode: 'SYN-EMPLOYMENT-COMPETENCY',
                            version: '1.0',
                            inLanguage: 'en',
                            tag: ['synthetic', 'lc-2184'],
                            resultDescription: [
                                {
                                    id: 'urn:uuid:c77458bb-293c-5204-8fbb-a674dfbf4250',
                                    type: ['ResultDescription'],
                                    name: 'Incident review capability',
                                    resultType: 'RubricCriterionLevel',
                                    rubricCriterionLevel: [
                                        {
                                            id: 'urn:uuid:2ecc2476-6b11-55c1-bb31-34b56b7fe918',
                                            type: ['RubricCriterionLevel'],
                                            name: 'Developing',
                                            level: '1',
                                            points: '1',
                                            description:
                                                'Performs the activity with step-by-step assistance.',
                                            alignment: [
                                                {
                                                    type: ['Alignment'],
                                                    targetName: 'Developing capability level',
                                                    targetCode: 'LEVEL-1',
                                                    targetFramework:
                                                        'Synthetic Workplace Capability Framework',
                                                    targetUrl:
                                                        'https://skills.example/framework/level-1',
                                                    targetDescription:
                                                        'Fictional framework node for testing explicit alignment display; not a real qualification equivalence.',
                                                    targetType: 'CFItem',
                                                },
                                            ],
                                        },
                                        {
                                            id: 'urn:uuid:759e11fa-2c2d-585e-9176-7acf40661a72',
                                            type: ['RubricCriterionLevel'],
                                            name: 'Independent',
                                            level: '2',
                                            points: '2',
                                            description:
                                                'Performs the activity independently and explains the decisions.',
                                            alignment: [
                                                {
                                                    type: ['Alignment'],
                                                    targetName: 'Independent capability level',
                                                    targetCode: 'LEVEL-2',
                                                    targetFramework:
                                                        'Synthetic Workplace Capability Framework',
                                                    targetUrl:
                                                        'https://skills.example/framework/level-2',
                                                    targetDescription:
                                                        'Fictional framework node for testing explicit alignment display; not a real qualification equivalence.',
                                                    targetType: 'CFItem',
                                                },
                                            ],
                                        },
                                        {
                                            id: 'urn:uuid:30f5170e-8230-5af0-8bdc-ccb520dde6af',
                                            type: ['RubricCriterionLevel'],
                                            name: 'Mentoring',
                                            level: '3',
                                            points: '3',
                                            description:
                                                'Performs the activity independently and supports another participant.',
                                            alignment: [
                                                {
                                                    type: ['Alignment'],
                                                    targetName: 'Mentoring capability level',
                                                    targetCode: 'LEVEL-3',
                                                    targetFramework:
                                                        'Synthetic Workplace Capability Framework',
                                                    targetUrl:
                                                        'https://skills.example/framework/level-3',
                                                    targetDescription:
                                                        'Fictional framework node for testing explicit alignment display; not a real qualification equivalence.',
                                                    targetType: 'CFItem',
                                                },
                                            ],
                                        },
                                    ],
                                    requiredLevel: 'urn:uuid:759e11fa-2c2d-585e-9176-7acf40661a72',
                                    alignment: [
                                        {
                                            type: ['Alignment'],
                                            targetName: 'Incident review capability',
                                            targetCode: 'INCIDENT-REVIEW',
                                            targetFramework:
                                                'Synthetic Workplace Capability Framework',
                                            targetUrl:
                                                'https://skills.example/framework/incident-review',
                                            targetDescription:
                                                'Fictional framework node for testing explicit alignment display; not a real qualification equivalence.',
                                            targetType: 'CFItem',
                                        },
                                    ],
                                },
                            ],
                            alignment: [
                                {
                                    type: ['Alignment'],
                                    targetName: 'Facilitates an incident review',
                                    targetCode: 'REL-102',
                                    targetFramework: 'Synthetic Workplace Capability Framework',
                                    targetUrl: 'https://skills.example/framework/rel-102',
                                    targetDescription:
                                        'Fictional framework node for testing explicit alignment display; not a real qualification equivalence.',
                                    targetType: 'CFItem',
                                },
                            ],
                        },
                        role: 'Review Facilitator',
                        source: {
                            id: 'did:example:lc2184-harbor-assessment',
                            type: ['Profile'],
                            name: 'Harbor Systems — Assessment Team',
                            url: 'https://harbor-assessment.example',
                            description:
                                'Fictional organization used only for LearnCard display tests.',
                        },
                        result: [
                            {
                                type: ['Result'],
                                resultDescription: 'urn:uuid:c77458bb-293c-5204-8fbb-a674dfbf4250',
                                achievedLevel: 'urn:uuid:759e11fa-2c2d-585e-9176-7acf40661a72',
                                alignment: [
                                    {
                                        type: ['Alignment'],
                                        targetName: 'Facilitates an incident review',
                                        targetCode: 'REL-102',
                                        targetFramework: 'Synthetic Workplace Capability Framework',
                                        targetUrl: 'https://skills.example/framework/rel-102',
                                        targetDescription:
                                            'Fictional framework node for testing explicit alignment display; not a real qualification equivalence.',
                                        targetType: 'CFItem',
                                    },
                                ],
                            },
                        ],
                    },
                    awardedDate: '2026-07-10T12:00:00Z',
                    evidence: [
                        {
                            type: ['Evidence'],
                            name: 'Observed facilitation',
                            description: 'Synthetic assessment evidence.',
                            narrative:
                                'The assessor observed a synthetic review session and selected the Independent rubric level.',
                            genre: 'Assessment record',
                            audience: 'Learner and authorized reviewer',
                        },
                    ],
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    id: 'urn:uuid:75a0d998-e0fa-5ae3-9728-530067b4f68e',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'Synthetic Applied Practice License',
                    description:
                        'A fictional license used to test number and validity display; no legal authorization is conferred.',
                    issuer: {
                        id: 'did:example:lc2184-meridian-licensing',
                        type: ['Profile'],
                        name: 'Meridian Licensing Board (Fictional)',
                        url: 'https://meridian-licensing.example',
                        description:
                            'Fictional organization used only for LearnCard display tests.',
                    },
                    validFrom: '2026-02-01T00:00:00Z',
                    credentialSubject: {
                        id: 'did:example:lc2184-alex-morgan',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'urn:uuid:2ed76eda-2d43-5c41-ac2a-c1d8ae12cd50',
                            type: ['Achievement'],
                            achievementType: 'License',
                            name: 'Synthetic Applied Practice License',
                            description:
                                'A fictional license used to test number and validity display; no legal authorization is conferred.',
                            criteria: {
                                narrative:
                                    'Meet the fictional board requirements and receive an award decision.',
                            },
                            creator: {
                                id: 'did:example:lc2184-cedar-standards',
                                type: ['Profile'],
                                name: 'Cedar Skills Council',
                                url: 'https://cedar-standards.example',
                                description:
                                    'Fictional organization used only for LearnCard display tests.',
                            },
                            humanCode: 'SYN-PRACTICE-LICENSE',
                            version: '1.0',
                            inLanguage: 'en',
                            tag: ['synthetic', 'lc-2184'],
                            resultDescription: [
                                {
                                    id: 'urn:uuid:9bcb7d96-b284-5f2d-9b25-2ba7e054ad3b',
                                    type: ['ResultDescription'],
                                    name: 'License award decision',
                                    resultType: 'Status',
                                },
                            ],
                            alignment: [
                                {
                                    type: ['Alignment'],
                                    targetName: 'Applied practice capability',
                                    targetCode: 'PRACTICE-101',
                                    targetFramework: 'Synthetic Workplace Capability Framework',
                                    targetUrl: 'https://skills.example/framework/practice-101',
                                    targetDescription:
                                        'Fictional framework node for testing explicit alignment display; not a real qualification equivalence.',
                                    targetType: 'CFItem',
                                },
                            ],
                        },
                        role: 'License Holder',
                        source: {
                            id: 'did:example:lc2184-meridian-licensing',
                            type: ['Profile'],
                            name: 'Meridian Licensing Board (Fictional)',
                            url: 'https://meridian-licensing.example',
                            description:
                                'Fictional organization used only for LearnCard display tests.',
                        },
                        licenseNumber: 'SYN-LIC-2184-042',
                        result: [
                            {
                                type: ['Result'],
                                resultDescription: 'urn:uuid:9bcb7d96-b284-5f2d-9b25-2ba7e054ad3b',
                                status: 'Completed',
                            },
                        ],
                    },
                    awardedDate: '2026-01-15T12:00:00Z',
                    validUntil: '2028-01-31T23:59:59Z',
                    evidence: [
                        {
                            type: ['Evidence'],
                            name: 'Fictional board award record',
                            description: 'Synthetic assessment evidence.',
                            narrative:
                                'The number and dates are synthetic. Completed describes the award decision, not current regulatory standing.',
                            genre: 'Assessment record',
                            audience: 'Learner and authorized reviewer',
                        },
                    ],
                },
            ],
            association: [
                {
                    type: ['Association'],
                    associationType: 'isRelatedTo',
                    sourceId: 'urn:uuid:2b44d9c7-d291-58da-8cba-15696c3b1f7d',
                    targetId: 'urn:uuid:d45026e9-13d2-5557-881a-b7ca2b655cd3',
                },
                {
                    type: ['Association'],
                    associationType: 'precedes',
                    sourceId: 'urn:uuid:3dc10a7d-7203-5579-9b78-1ae86c92a2c0',
                    targetId: 'urn:uuid:271fcad0-7169-547b-856f-5ca71c4a1915',
                },
                {
                    type: ['Association'],
                    associationType: 'isRelatedTo',
                    sourceId: 'urn:uuid:271fcad0-7169-547b-856f-5ca71c4a1915',
                    targetId: 'urn:uuid:d45026e9-13d2-5557-881a-b7ca2b655cd3',
                },
                {
                    type: ['Association'],
                    associationType: 'isRelatedTo',
                    sourceId: 'urn:uuid:6ad7f99b-7d9d-59a8-a207-825d1d2bf57e',
                    targetId: 'urn:uuid:2ed76eda-2d43-5c41-ac2a-c1d8ae12cd50',
                },
            ],
        },
    },
};
