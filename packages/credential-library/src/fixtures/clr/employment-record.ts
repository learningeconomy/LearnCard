import type { CredentialFixture } from '../../types';

/**
 * LC-2184: synthetic, unsigned CLR display/issuance template.
 * Both the outer record and embedded achievements intentionally have no proof.
 * Sign/rebind children before the outer CLR for cryptographic verification tests.
 */
export const clrEmploymentRecord: CredentialFixture = {
    id: 'clr/employment-record',
    name: 'Work & Experience Record — Harbor Systems',
    description:
        'Explores roles, activity periods, awarded versus issued dates, assessor provenance, fieldwork hours, and a rubric-level-only competency result. Unsigned display/issuance template; child proofs must be issued separately for a fully verifiable CLR.',
    spec: 'clr-v2',
    profile: 'learner-record',
    features: ['nested-credentials', 'associations', 'results', 'evidence', 'alignment', 'source'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    tags: [
        'lc-2184',
        'non-academic',
        'synthetic',
        'employment',
        'work-history',
        'roles',
        'fieldwork',
        'rubric-level-only',
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
        id: 'urn:uuid:aa1d359d-4bba-5b72-8fe2-da8d88ec8a3e',
        type: ['VerifiableCredential', 'ClrCredential'],
        name: 'Work & Experience Record — Harbor Systems',
        description:
            'Synthetic demonstration record as of September 1, 2026. Explores roles, activity periods, awarded versus issued dates, assessor provenance, fieldwork hours, and a rubric-level-only competency result.',
        issuer: {
            id: 'did:example:lc2184-harbor-systems',
            type: ['Profile'],
            name: 'Harbor Systems — People & Development',
            url: 'https://harbor-systems.example',
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
                    id: 'urn:uuid:f03f696d-95c1-5dab-b7fd-6c05d42cf5c8',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'Supervised Operations Placement',
                    description:
                        'Supervised workplace experience with explicitly labeled practice hours.',
                    issuer: {
                        id: 'did:example:lc2184-harbor-systems',
                        type: ['Profile'],
                        name: 'Harbor Systems — People & Development',
                        url: 'https://harbor-systems.example',
                        description:
                            'Fictional organization used only for LearnCard display tests.',
                    },
                    validFrom: '2025-05-05T12:00:00Z',
                    credentialSubject: {
                        id: 'did:example:lc2184-alex-morgan',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'urn:uuid:74308796-94d6-5737-89bd-0594fce9490d',
                            type: ['Achievement'],
                            achievementType: 'Fieldwork',
                            name: 'Supervised Operations Placement',
                            description:
                                'Supervised workplace experience with explicitly labeled practice hours.',
                            criteria: {
                                narrative:
                                    'Complete at least 200 supervised practice hours and submit a reflective account.',
                            },
                            creator: {
                                id: 'did:example:lc2184-harbor-systems',
                                type: ['Profile'],
                                name: 'Harbor Systems — People & Development',
                                url: 'https://harbor-systems.example',
                                description:
                                    'Fictional organization used only for LearnCard display tests.',
                            },
                            humanCode: 'SYN-EMPLOYMENT-FIELDWORK',
                            version: '1.0',
                            inLanguage: 'en',
                            tag: ['synthetic', 'lc-2184'],
                            resultDescription: [
                                {
                                    id: 'urn:uuid:79b81515-f60e-525b-bdec-d1a9e62340f4',
                                    type: ['ResultDescription'],
                                    name: 'Supervised practice (hours)',
                                    resultType: 'RawScore',
                                    valueMin: '0',
                                    valueMax: '240',
                                    requiredValue: '200',
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
                        activityStartDate: '2025-02-03T09:00:00Z',
                        activityEndDate: '2025-04-30T17:00:00Z',
                        role: 'Operations Trainee',
                        narrative:
                            'The placement covered routine operations, handovers, and supervised troubleshooting.',
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
                                resultDescription: 'urn:uuid:79b81515-f60e-525b-bdec-d1a9e62340f4',
                                value: '224',
                            },
                        ],
                    },
                    awardedDate: '2025-05-05T12:00:00Z',
                    evidence: [
                        {
                            type: ['Evidence'],
                            name: 'Placement log review',
                            description: 'Synthetic assessment evidence.',
                            narrative:
                                'A fictional supervisor attested 224 hours. These are practice hours, not academic credits.',
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
            ],
            association: [
                {
                    type: ['Association'],
                    associationType: 'isRelatedTo',
                    sourceId: 'urn:uuid:271fcad0-7169-547b-856f-5ca71c4a1915',
                    targetId: 'urn:uuid:74308796-94d6-5737-89bd-0594fce9490d',
                },
                {
                    type: ['Association'],
                    associationType: 'isRelatedTo',
                    sourceId: 'urn:uuid:271fcad0-7169-547b-856f-5ca71c4a1915',
                    targetId: 'urn:uuid:d45026e9-13d2-5557-881a-b7ca2b655cd3',
                },
            ],
        },
    },
};
