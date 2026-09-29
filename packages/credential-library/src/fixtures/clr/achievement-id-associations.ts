import type { CredentialFixture } from '../../types';

export const clrAchievementIdAssociations: CredentialFixture = {
    id: 'clr/achievement-id-associations',
    name: 'Achievement-ID Relationship Transcript',
    description:
        'A CLR v2 transcript whose relationships use Achievement.id values and cover every association type.',
    spec: 'clr-v2',
    profile: 'learner-record',
    features: ['results', 'alignment', 'associations', 'nested-credentials'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    tags: ['transcript', 'relationships', 'achievement-ids'],
    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            'https://purl.imsglobal.org/spec/clr/v2p0/context.json',
        ],
        id: 'urn:uuid:relationship-clr',
        type: ['VerifiableCredential', 'ClrCredential'],
        name: 'Relationship Transcript',
        issuer: {
            id: 'did:example:relationship-college',
            type: ['Profile'],
            name: 'Relationship College',
        },
        validFrom: '2026-01-15T00:00:00Z',
        credentialSubject: {
            id: 'did:example:relationship-learner',
            type: ['ClrSubject'],
            identifier: [
                {
                    type: 'IdentityObject',
                    identityHash: 'Jordan Rivera',
                    identityType: 'name',
                    hashed: false,
                },
            ],
            verifiableCredential: [
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    id: 'urn:uuid:relationship-foundation-credential',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'Foundations Course Credential',
                    issuer: {
                        id: 'did:example:relationship-college',
                        type: ['Profile'],
                        name: 'Relationship College',
                    },
                    validFrom: '2025-05-15T00:00:00Z',
                    credentialSubject: {
                        id: 'did:example:relationship-learner',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'urn:achievement:relationship-foundation',
                            type: ['Achievement'],
                            achievementType: 'Course',
                            name: 'Foundations of Systems Thinking',
                            humanCode: 'SYS 101',
                            creditsAvailable: 3,
                            resultDescription: [
                                {
                                    id: 'urn:result-description:relationship-grade',
                                    type: ['ResultDescription'],
                                    name: 'Mastery Level',
                                    resultType: 'PerformanceLevel',
                                    allowedValue: [
                                        'Beginning',
                                        'Developing',
                                        'Proficient',
                                        'Advanced',
                                    ],
                                    requiredValue: 'Proficient',
                                    alignment: [
                                        {
                                            type: ['Alignment'],
                                            targetName: 'Systems Thinking',
                                            targetFramework: 'Relationship Skills Framework',
                                            targetType: 'CFItem',
                                            targetUrl:
                                                'https://example.edu/framework/systems-thinking',
                                        },
                                    ],
                                },
                            ],
                        },
                        result: [
                            {
                                type: ['Result'],
                                value: 'Advanced',
                                resultDescription: 'urn:result-description:relationship-grade',
                            },
                        ],
                        creditsEarned: 3,
                    },
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    id: 'urn:uuid:relationship-advanced-credential',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'Advanced Course Credential',
                    issuer: {
                        id: 'did:example:relationship-college',
                        type: ['Profile'],
                        name: 'Relationship College',
                    },
                    validFrom: '2025-12-15T00:00:00Z',
                    credentialSubject: {
                        id: 'did:example:relationship-learner',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'urn:achievement:relationship-advanced',
                            type: ['Achievement'],
                            achievementType: 'Course',
                            name: 'Applied Systems Design',
                            humanCode: 'SYS 201',
                            creditsAvailable: 3,
                            resultDescription: [
                                {
                                    id: 'urn:result-description:relationship-score',
                                    type: ['ResultDescription'],
                                    name: 'Final Score',
                                    resultType: 'Percent',
                                    valueMin: '0',
                                    valueMax: '100',
                                    requiredValue: '70',
                                },
                            ],
                        },
                        result: [
                            {
                                type: ['Result'],
                                value: 86,
                                resultDescription: 'urn:result-description:relationship-score',
                            },
                        ],
                        creditsEarned: 3,
                    },
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    id: 'urn:uuid:relationship-program-credential',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'Systems Design Program Credential',
                    issuer: {
                        id: 'did:example:relationship-college',
                        type: ['Profile'],
                        name: 'Relationship College',
                    },
                    validFrom: '2026-01-15T00:00:00Z',
                    credentialSubject: {
                        id: 'did:example:relationship-learner',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'urn:achievement:relationship-program',
                            type: ['Achievement'],
                            achievementType: 'BachelorDegree',
                            name: 'Systems Design Certificate',
                            resultDescription: [
                                {
                                    id: 'urn:result-description:relationship-status',
                                    type: ['ResultDescription'],
                                    name: 'Program Status',
                                    resultType: 'Status',
                                },
                            ],
                        },
                        result: [
                            {
                                type: ['Result'],
                                status: 'Completed',
                                resultDescription: 'urn:result-description:relationship-status',
                            },
                        ],
                    },
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    id: 'urn:uuid:relationship-assessment-credential',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'Systems Assessment Credential',
                    issuer: {
                        id: 'did:example:relationship-college',
                        type: ['Profile'],
                        name: 'Relationship College',
                    },
                    validFrom: '2025-12-10T00:00:00Z',
                    credentialSubject: {
                        id: 'did:example:relationship-learner',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'urn:achievement:relationship-assessment',
                            type: ['Achievement'],
                            achievementType: 'Assessment',
                            name: 'Systems Design Assessment',
                            resultDescription: [
                                {
                                    id: 'urn:result-description:relationship-rubric',
                                    type: ['ResultDescription'],
                                    name: 'Design Quality',
                                    resultType: 'RubricCriterionLevel',
                                    requiredLevel: 'urn:rubric-level:proficient',
                                    rubricCriterionLevel: [
                                        {
                                            id: 'urn:rubric-level:developing',
                                            type: ['RubricCriterionLevel'],
                                            name: 'Developing',
                                            level: 'Developing',
                                            description: 'Applies parts of the design process.',
                                        },
                                        {
                                            id: 'urn:rubric-level:proficient',
                                            type: ['RubricCriterionLevel'],
                                            name: 'Proficient',
                                            level: 'Proficient',
                                            description:
                                                'Applies the complete design process independently.',
                                        },
                                        {
                                            id: 'urn:rubric-level:advanced',
                                            type: ['RubricCriterionLevel'],
                                            name: 'Advanced',
                                            level: 'Advanced',
                                            description:
                                                'Adapts the design process to complex constraints.',
                                        },
                                    ],
                                },
                            ],
                        },
                        result: [
                            {
                                type: ['Result'],
                                value: 'Advanced',
                                achievedLevel: 'urn:rubric-level:advanced',
                                resultDescription: 'urn:result-description:relationship-rubric',
                                alignment: [
                                    {
                                        type: ['Alignment'],
                                        targetName: 'Design Quality',
                                        targetFramework: 'Relationship Skills Framework',
                                        targetType: 'CFItem',
                                        targetUrl: 'https://example.edu/framework/design-quality',
                                    },
                                ],
                            },
                        ],
                    },
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    id: 'urn:uuid:relationship-competency-credential',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'Systems Thinking Competency Credential',
                    issuer: {
                        id: 'did:example:relationship-college',
                        type: ['Profile'],
                        name: 'Relationship College',
                    },
                    validFrom: '2025-12-10T00:00:00Z',
                    credentialSubject: {
                        id: 'did:example:relationship-learner',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'urn:achievement:relationship-competency',
                            type: ['Achievement'],
                            achievementType: 'Competency',
                            name: 'Systems Thinking',
                        },
                    },
                },
            ],
            association: [
                {
                    type: ['Association'],
                    associationType: 'isChildOf',
                    sourceId: 'urn:achievement:relationship-foundation',
                    targetId: 'urn:achievement:relationship-program',
                },
                {
                    type: ['Association'],
                    associationType: 'isParentOf',
                    sourceId: 'urn:achievement:relationship-program',
                    targetId: 'urn:achievement:relationship-advanced',
                },
                {
                    type: ['Association'],
                    associationType: 'isPartOf',
                    sourceId: 'urn:achievement:relationship-assessment',
                    targetId: 'urn:achievement:relationship-program',
                },
                {
                    type: ['Association'],
                    associationType: 'precedes',
                    sourceId: 'urn:achievement:relationship-foundation',
                    targetId: 'urn:achievement:relationship-advanced',
                },
                {
                    type: ['Association'],
                    associationType: 'isPeerOf',
                    sourceId: 'urn:achievement:relationship-foundation',
                    targetId: 'urn:achievement:relationship-assessment',
                },
                {
                    type: ['Association'],
                    associationType: 'exactMatchOf',
                    sourceId: 'urn:achievement:relationship-competency',
                    targetId: 'urn:achievement:relationship-assessment',
                },
                {
                    type: ['Association'],
                    associationType: 'replacedBy',
                    sourceId: 'urn:achievement:relationship-foundation',
                    targetId: 'urn:achievement:relationship-advanced',
                },
                {
                    type: ['Association'],
                    associationType: 'isRelatedTo',
                    sourceId: 'urn:achievement:relationship-competency',
                    targetId: 'urn:achievement:relationship-advanced',
                },
            ],
        },
    },
};
