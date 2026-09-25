import type { CredentialFixture } from '../../types';

/**
 * LC-2184: synthetic, unsigned CLR display/issuance template.
 * Both the outer record and embedded achievements intentionally have no proof.
 * Sign/rebind children before the outer CLR for cryptographic verification tests.
 */
export const clrMilitaryTrainingRecord: CredentialFixture = {
    id: 'clr/military-training-record',
    name: 'Military Training & Qualifications — Meridian Service Academy',
    description:
        'Explores fictional non-combat training, fieldwork roles, assessment provenance, and recognition. Makes no real service, rank, clearance, or civilian-equivalence claims. Unsigned display/issuance template; child proofs must be issued separately for a fully verifiable CLR.',
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
        'military',
        'training',
        'fieldwork',
        'roles',
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
        id: 'urn:uuid:a0b2aae8-579c-5f54-9fab-53faebed5bf2',
        type: ['VerifiableCredential', 'ClrCredential'],
        name: 'Military Training & Qualifications — Meridian Service Academy',
        description:
            'Synthetic demonstration record as of September 1, 2026. Explores fictional non-combat training, fieldwork roles, assessment provenance, and recognition. Makes no real service, rank, clearance, or civilian-equivalence claims.',
        issuer: {
            id: 'did:example:lc2184-meridian-service-academy',
            type: ['Profile'],
            name: 'Meridian Service Training Academy (Fictional)',
            url: 'https://meridian-service-academy.example',
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
                    id: 'urn:uuid:9e23d75f-9bec-54ea-b4c5-4f6c53672537',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'Logistics Coordination Fundamentals',
                    description:
                        'A non-combat logistics coordination training activity at a fictional service academy.',
                    issuer: {
                        id: 'did:example:lc2184-meridian-service-academy',
                        type: ['Profile'],
                        name: 'Meridian Service Training Academy (Fictional)',
                        url: 'https://meridian-service-academy.example',
                        description:
                            'Fictional organization used only for LearnCard display tests.',
                    },
                    validFrom: '2026-02-01T12:00:00Z',
                    credentialSubject: {
                        id: 'did:example:lc2184-alex-morgan',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'urn:uuid:edc5c8be-252d-5c0e-b4b8-8190533aecd9',
                            type: ['Achievement'],
                            achievementType: 'Course',
                            name: 'Logistics Coordination Fundamentals',
                            description:
                                'A non-combat logistics coordination training activity at a fictional service academy.',
                            criteria: {
                                narrative:
                                    'Complete the training activities and supervised handover exercise.',
                            },
                            creator: {
                                id: 'did:example:lc2184-meridian-service-academy',
                                type: ['Profile'],
                                name: 'Meridian Service Training Academy (Fictional)',
                                url: 'https://meridian-service-academy.example',
                                description:
                                    'Fictional organization used only for LearnCard display tests.',
                            },
                            humanCode: 'SYN-MILITARY-COURSE',
                            version: '1.0',
                            inLanguage: 'en',
                            tag: ['synthetic', 'lc-2184'],
                            resultDescription: [
                                {
                                    id: 'urn:uuid:9346a2fe-d9a1-5802-b1fd-cc3a7dfc8a52',
                                    type: ['ResultDescription'],
                                    name: 'Training completion',
                                    resultType: 'Status',
                                },
                            ],
                            alignment: [
                                {
                                    type: ['Alignment'],
                                    targetName: 'Coordinates supply handovers',
                                    targetCode: 'LOG-101',
                                    targetFramework: 'Synthetic Workplace Capability Framework',
                                    targetUrl: 'https://skills.example/framework/log-101',
                                    targetDescription:
                                        'Fictional framework node for testing explicit alignment display; not a real qualification equivalence.',
                                    targetType: 'CFItem',
                                },
                            ],
                        },
                        activityStartDate: '2026-01-05T09:00:00Z',
                        activityEndDate: '2026-01-23T17:00:00Z',
                        role: 'Trainee',
                        source: {
                            id: 'did:example:lc2184-meridian-evaluation',
                            type: ['Profile'],
                            name: 'Meridian Training Evaluation Unit (Fictional)',
                            url: 'https://meridian-evaluation.example',
                            description:
                                'Fictional organization used only for LearnCard display tests.',
                        },
                        result: [
                            {
                                type: ['Result'],
                                resultDescription: 'urn:uuid:9346a2fe-d9a1-5802-b1fd-cc3a7dfc8a52',
                                status: 'Completed',
                            },
                        ],
                    },
                    awardedDate: '2026-01-30T12:00:00Z',
                    evidence: [
                        {
                            type: ['Evidence'],
                            name: 'Training exercise narrative',
                            description: 'Synthetic assessment evidence.',
                            narrative:
                                'The participant prepared and delivered a simulated supply handover.',
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
                    id: 'urn:uuid:7f5b4e8a-6573-5c81-901e-acf983804516',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'Supervised Logistics Exercise',
                    description:
                        'A simulated non-combat fieldwork activity with a distinct participant role.',
                    issuer: {
                        id: 'did:example:lc2184-meridian-service-academy',
                        type: ['Profile'],
                        name: 'Meridian Service Training Academy (Fictional)',
                        url: 'https://meridian-service-academy.example',
                        description:
                            'Fictional organization used only for LearnCard display tests.',
                    },
                    validFrom: '2026-02-12T12:00:00Z',
                    credentialSubject: {
                        id: 'did:example:lc2184-alex-morgan',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'urn:uuid:e9689b95-4922-515e-b881-e2d928a2964b',
                            type: ['Achievement'],
                            achievementType: 'Fieldwork',
                            name: 'Supervised Logistics Exercise',
                            description:
                                'A simulated non-combat fieldwork activity with a distinct participant role.',
                            criteria: {
                                narrative:
                                    'Coordinate the exercise independently and provide a reflective review.',
                            },
                            creator: {
                                id: 'did:example:lc2184-meridian-service-academy',
                                type: ['Profile'],
                                name: 'Meridian Service Training Academy (Fictional)',
                                url: 'https://meridian-service-academy.example',
                                description:
                                    'Fictional organization used only for LearnCard display tests.',
                            },
                            humanCode: 'SYN-MILITARY-FIELDWORK',
                            version: '1.0',
                            inLanguage: 'en',
                            tag: ['synthetic', 'lc-2184'],
                            resultDescription: [
                                {
                                    id: 'urn:uuid:5a4afeb8-7bfc-524e-a11f-67b3d444556c',
                                    type: ['ResultDescription'],
                                    name: 'Team coordination',
                                    resultType: 'RubricCriterionLevel',
                                    rubricCriterionLevel: [
                                        {
                                            id: 'urn:uuid:d75c1567-2bcc-5f64-9365-9909dc87d0ae',
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
                                            id: 'urn:uuid:ac0352e0-0025-5e29-ac19-47c7cb3e67b4',
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
                                            id: 'urn:uuid:2b8a5b1a-4e8a-52ab-9753-98c8bd20f306',
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
                                    requiredLevel: 'urn:uuid:ac0352e0-0025-5e29-ac19-47c7cb3e67b4',
                                    alignment: [
                                        {
                                            type: ['Alignment'],
                                            targetName: 'Team coordination',
                                            targetCode: 'LOGISTICS-LEADERSHIP',
                                            targetFramework:
                                                'Synthetic Workplace Capability Framework',
                                            targetUrl:
                                                'https://skills.example/framework/logistics-leadership',
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
                                    targetName: 'Coordinates a logistics team',
                                    targetCode: 'LOG-102',
                                    targetFramework: 'Synthetic Workplace Capability Framework',
                                    targetUrl: 'https://skills.example/framework/log-102',
                                    targetDescription:
                                        'Fictional framework node for testing explicit alignment display; not a real qualification equivalence.',
                                    targetType: 'CFItem',
                                },
                            ],
                        },
                        activityStartDate: '2026-02-02T09:00:00Z',
                        activityEndDate: '2026-02-06T17:00:00Z',
                        role: 'Exercise Team Coordinator',
                        narrative:
                            'Coordinated a fictional warehouse handover and explained decisions during debrief.',
                        source: {
                            id: 'did:example:lc2184-meridian-evaluation',
                            type: ['Profile'],
                            name: 'Meridian Training Evaluation Unit (Fictional)',
                            url: 'https://meridian-evaluation.example',
                            description:
                                'Fictional organization used only for LearnCard display tests.',
                        },
                        result: [
                            {
                                type: ['Result'],
                                resultDescription: 'urn:uuid:5a4afeb8-7bfc-524e-a11f-67b3d444556c',
                                achievedLevel: 'urn:uuid:2b8a5b1a-4e8a-52ab-9753-98c8bd20f306',
                            },
                        ],
                    },
                    awardedDate: '2026-02-10T12:00:00Z',
                    evidence: [
                        {
                            type: ['Evidence'],
                            name: 'Exercise debrief',
                            description: 'Synthetic assessment evidence.',
                            narrative:
                                'The evaluation unit selected Mentoring level using the synthetic rubric.',
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
                    id: 'urn:uuid:7b1934f3-c5d7-56f2-b0fe-9500cde031b4',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'Training Team Contribution Award',
                    description:
                        'A fictional training award; it does not represent a real military decoration.',
                    issuer: {
                        id: 'did:example:lc2184-meridian-service-academy',
                        type: ['Profile'],
                        name: 'Meridian Service Training Academy (Fictional)',
                        url: 'https://meridian-service-academy.example',
                        description:
                            'Fictional organization used only for LearnCard display tests.',
                    },
                    validFrom: '2026-02-25T12:00:00Z',
                    credentialSubject: {
                        id: 'did:example:lc2184-alex-morgan',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'urn:uuid:24936002-7a1c-54d2-aa88-2e54bd75f21b',
                            type: ['Achievement'],
                            achievementType: 'Award',
                            name: 'Training Team Contribution Award',
                            description:
                                'A fictional training award; it does not represent a real military decoration.',
                            criteria: {
                                narrative:
                                    'Receive a documented nomination for supporting fellow trainees during the exercise.',
                            },
                            creator: {
                                id: 'did:example:lc2184-meridian-service-academy',
                                type: ['Profile'],
                                name: 'Meridian Service Training Academy (Fictional)',
                                url: 'https://meridian-service-academy.example',
                                description:
                                    'Fictional organization used only for LearnCard display tests.',
                            },
                            humanCode: 'SYN-MILITARY-AWARD',
                            version: '1.0',
                            inLanguage: 'en',
                            tag: ['synthetic', 'lc-2184'],
                            resultDescription: [
                                {
                                    id: 'urn:uuid:ebe8f326-30fd-51e8-b1e7-6975d3198b91',
                                    type: ['ResultDescription'],
                                    name: 'Award outcome',
                                    resultType: 'Status',
                                },
                            ],
                            alignment: [
                                {
                                    type: ['Alignment'],
                                    targetName: 'Supports team learning',
                                    targetCode: 'TEAM-101',
                                    targetFramework: 'Synthetic Workplace Capability Framework',
                                    targetUrl: 'https://skills.example/framework/team-101',
                                    targetDescription:
                                        'Fictional framework node for testing explicit alignment display; not a real qualification equivalence.',
                                    targetType: 'CFItem',
                                },
                            ],
                        },
                        role: 'Peer Mentor',
                        source: {
                            id: 'did:example:lc2184-meridian-evaluation',
                            type: ['Profile'],
                            name: 'Meridian Training Evaluation Unit (Fictional)',
                            url: 'https://meridian-evaluation.example',
                            description:
                                'Fictional organization used only for LearnCard display tests.',
                        },
                        result: [
                            {
                                type: ['Result'],
                                resultDescription: 'urn:uuid:ebe8f326-30fd-51e8-b1e7-6975d3198b91',
                                status: 'Completed',
                            },
                        ],
                    },
                    awardedDate: '2026-02-20T12:00:00Z',
                    evidence: [
                        {
                            type: ['Evidence'],
                            name: 'Nomination narrative',
                            description: 'Synthetic assessment evidence.',
                            narrative:
                                'The training group recognized the participant for peer support in the simulated exercise.',
                            genre: 'Assessment record',
                            audience: 'Learner and authorized reviewer',
                        },
                    ],
                },
            ],
            association: [
                {
                    type: ['Association'],
                    associationType: 'precedes',
                    sourceId: 'urn:uuid:edc5c8be-252d-5c0e-b4b8-8190533aecd9',
                    targetId: 'urn:uuid:e9689b95-4922-515e-b881-e2d928a2964b',
                },
                {
                    type: ['Association'],
                    associationType: 'isRelatedTo',
                    sourceId: 'urn:uuid:e9689b95-4922-515e-b881-e2d928a2964b',
                    targetId: 'urn:uuid:24936002-7a1c-54d2-aa88-2e54bd75f21b',
                },
            ],
        },
    },
};
