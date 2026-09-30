import type { CredentialFixture } from '../../types';

/**
 * LC-2184: synthetic, unsigned CLR display/issuance template.
 * Both the outer record and embedded achievements intentionally have no proof.
 * Sign/rebind children before the outer CLR for cryptographic verification tests.
 */
export const clrTrainingProviderRecord: CredentialFixture = {
    id: 'clr/training-provider-record',
    name: 'Training & Development Record — Cedar Technical Training',
    description:
        'Explores non-credit training, explicit participation hours, score thresholds, completion certificates, and ongoing participation without GPA or academic terms. Unsigned display/issuance template; child proofs must be issued separately for a fully verifiable CLR.',
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
        'training-provider',
        'training',
        'hours',
        'completion',
        'in-progress',
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
        id: 'urn:uuid:c474810b-5e8d-5e3d-873e-def68a09f6bb',
        type: ['VerifiableCredential', 'ClrCredential'],
        name: 'Training & Development Record — Cedar Technical Training',
        description:
            'Synthetic demonstration record as of September 1, 2026. Explores non-credit training, explicit participation hours, score thresholds, completion certificates, and ongoing participation without GPA or academic terms.',
        issuer: {
            id: 'did:example:lc2184-cedar-training',
            type: ['Profile'],
            name: 'Cedar Technical Training',
            url: 'https://cedar-training.example',
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
                    id: 'urn:uuid:ce28f882-7ccf-5433-b38b-547276c159ee',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'Applied Data Operations Workshop',
                    description:
                        'A workplace training course with participation hours rather than academic credits.',
                    issuer: {
                        id: 'did:example:lc2184-cedar-training',
                        type: ['Profile'],
                        name: 'Cedar Technical Training',
                        url: 'https://cedar-training.example',
                        description:
                            'Fictional organization used only for LearnCard display tests.',
                    },
                    validFrom: '2026-03-16T12:00:00Z',
                    credentialSubject: {
                        id: 'did:example:lc2184-alex-morgan',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'urn:uuid:248e9bf0-ac3d-5d64-873f-5f26f3cb8edc',
                            type: ['Achievement'],
                            achievementType: 'Course',
                            name: 'Applied Data Operations Workshop',
                            description:
                                'A workplace training course with participation hours rather than academic credits.',
                            criteria: {
                                narrative:
                                    'Attend at least 32 instructor-led hours and complete the practical exercises.',
                            },
                            creator: {
                                id: 'did:example:lc2184-cedar-standards',
                                type: ['Profile'],
                                name: 'Cedar Skills Council',
                                url: 'https://cedar-standards.example',
                                description:
                                    'Fictional organization used only for LearnCard display tests.',
                            },
                            humanCode: 'SYN-TRAINING-COURSE',
                            version: '1.0',
                            inLanguage: 'en',
                            tag: ['synthetic', 'lc-2184'],
                            resultDescription: [
                                {
                                    id: 'urn:uuid:65a6a2c1-8ea3-58f4-b66c-a09b8ec02ffb',
                                    type: ['ResultDescription'],
                                    name: 'Instructor-led participation (hours)',
                                    resultType: 'RawScore',
                                    valueMin: '0',
                                    valueMax: '40',
                                    requiredValue: '32',
                                },
                                {
                                    id: 'urn:uuid:3ff5b035-6745-51fa-9160-8c7c13f931cf',
                                    type: ['ResultDescription'],
                                    name: 'Training completion',
                                    resultType: 'Status',
                                },
                            ],
                            alignment: [
                                {
                                    type: ['Alignment'],
                                    targetName: 'Operates a data workflow',
                                    targetCode: 'DATA-101',
                                    targetFramework: 'Synthetic Workplace Capability Framework',
                                    targetUrl: 'https://skills.example/framework/data-101',
                                    targetDescription:
                                        'Fictional framework node for testing explicit alignment display; not a real qualification equivalence.',
                                    targetType: 'CFItem',
                                },
                            ],
                            fieldOfStudy: 'Data operations',
                            specialization: 'Operational quality',
                        },
                        activityStartDate: '2026-03-02T09:00:00Z',
                        activityEndDate: '2026-03-13T17:00:00Z',
                        role: 'Participant',
                        source: {
                            id: 'did:example:lc2184-cedar-training',
                            type: ['Profile'],
                            name: 'Cedar Technical Training',
                            url: 'https://cedar-training.example',
                            description:
                                'Fictional organization used only for LearnCard display tests.',
                        },
                        result: [
                            {
                                type: ['Result'],
                                resultDescription: 'urn:uuid:3ff5b035-6745-51fa-9160-8c7c13f931cf',
                                status: 'Completed',
                            },
                            {
                                type: ['Result'],
                                resultDescription: 'urn:uuid:65a6a2c1-8ea3-58f4-b66c-a09b8ec02ffb',
                                value: '36',
                            },
                        ],
                    },
                    awardedDate: '2026-03-16T12:00:00Z',
                    evidence: [
                        {
                            type: ['Evidence'],
                            name: 'Participation and exercise log',
                            description: 'Synthetic assessment evidence.',
                            narrative:
                                'The fictional learner attended 36 hours and completed six practical exercises.',
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
                    id: 'urn:uuid:06a114b2-fee9-5093-8a7f-d6c2ce138b49',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'Data Workflow Practical Assessment',
                    description:
                        'An assessment with the achieved score, its scale, and an explicit required score.',
                    issuer: {
                        id: 'did:example:lc2184-cedar-training',
                        type: ['Profile'],
                        name: 'Cedar Technical Training',
                        url: 'https://cedar-training.example',
                        description:
                            'Fictional organization used only for LearnCard display tests.',
                    },
                    validFrom: '2026-03-16T12:00:00Z',
                    credentialSubject: {
                        id: 'did:example:lc2184-alex-morgan',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'urn:uuid:c66210ee-6afa-59e6-91c1-750cfdc644f0',
                            type: ['Achievement'],
                            achievementType: 'Assessment',
                            name: 'Data Workflow Practical Assessment',
                            description:
                                'An assessment with the achieved score, its scale, and an explicit required score.',
                            criteria: {
                                narrative:
                                    'Score at least 75 out of 100 in the practical assessment.',
                            },
                            creator: {
                                id: 'did:example:lc2184-cedar-standards',
                                type: ['Profile'],
                                name: 'Cedar Skills Council',
                                url: 'https://cedar-standards.example',
                                description:
                                    'Fictional organization used only for LearnCard display tests.',
                            },
                            humanCode: 'SYN-TRAINING-ASSESSMENT',
                            version: '1.0',
                            inLanguage: 'en',
                            tag: ['synthetic', 'lc-2184'],
                            resultDescription: [
                                {
                                    id: 'urn:uuid:d2f3bc37-90bf-5dde-8e90-043c37f53ebf',
                                    type: ['ResultDescription'],
                                    name: 'Practical assessment score',
                                    resultType: 'RawScore',
                                    valueMin: '0',
                                    valueMax: '100',
                                    requiredValue: '75',
                                },
                                {
                                    id: 'urn:uuid:38317465-32de-5e76-86bc-063024cf30d2',
                                    type: ['ResultDescription'],
                                    name: 'Assessment completion',
                                    resultType: 'Status',
                                },
                            ],
                            alignment: [
                                {
                                    type: ['Alignment'],
                                    targetName: 'Checks workflow quality',
                                    targetCode: 'DATA-102',
                                    targetFramework: 'Synthetic Workplace Capability Framework',
                                    targetUrl: 'https://skills.example/framework/data-102',
                                    targetDescription:
                                        'Fictional framework node for testing explicit alignment display; not a real qualification equivalence.',
                                    targetType: 'CFItem',
                                },
                            ],
                        },
                        activityStartDate: '2026-03-13T13:00:00Z',
                        activityEndDate: '2026-03-13T16:00:00Z',
                        role: 'Candidate',
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
                                resultDescription: 'urn:uuid:d2f3bc37-90bf-5dde-8e90-043c37f53ebf',
                                value: '86',
                            },
                            {
                                type: ['Result'],
                                resultDescription: 'urn:uuid:38317465-32de-5e76-86bc-063024cf30d2',
                                status: 'Completed',
                            },
                        ],
                    },
                    awardedDate: '2026-03-16T12:00:00Z',
                    evidence: [
                        {
                            type: ['Evidence'],
                            name: 'Assessor observation',
                            description: 'Synthetic assessment evidence.',
                            narrative:
                                'The assessor awarded 86 of 100 possible points on the practical exercise.',
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
                    id: 'urn:uuid:1b82d22c-071c-59cf-83e5-23427750f517',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'Applied Data Operations Completion',
                    description:
                        'A certificate of completion linking course participation and assessment.',
                    issuer: {
                        id: 'did:example:lc2184-cedar-training',
                        type: ['Profile'],
                        name: 'Cedar Technical Training',
                        url: 'https://cedar-training.example',
                        description:
                            'Fictional organization used only for LearnCard display tests.',
                    },
                    validFrom: '2026-03-16T12:00:00Z',
                    credentialSubject: {
                        id: 'did:example:lc2184-alex-morgan',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'urn:uuid:f0fd8b1a-13c2-5c1b-8cb6-eaa12c893e8f',
                            type: ['Achievement'],
                            achievementType: 'CertificateOfCompletion',
                            name: 'Applied Data Operations Completion',
                            description:
                                'A certificate of completion linking course participation and assessment.',
                            criteria: {
                                narrative: 'Complete the workshop and practical assessment.',
                            },
                            creator: {
                                id: 'did:example:lc2184-cedar-training',
                                type: ['Profile'],
                                name: 'Cedar Technical Training',
                                url: 'https://cedar-training.example',
                                description:
                                    'Fictional organization used only for LearnCard display tests.',
                            },
                            humanCode: 'SYN-TRAINING-COMPLETION',
                            version: '1.0',
                            inLanguage: 'en',
                            tag: ['synthetic', 'lc-2184'],
                            resultDescription: [
                                {
                                    id: 'urn:uuid:daac2cb1-3724-514c-845f-320d57c33be8',
                                    type: ['ResultDescription'],
                                    name: 'Completion status',
                                    resultType: 'Status',
                                },
                            ],
                            alignment: [
                                {
                                    type: ['Alignment'],
                                    targetName: 'Operates a data workflow',
                                    targetCode: 'DATA-101',
                                    targetFramework: 'Synthetic Workplace Capability Framework',
                                    targetUrl: 'https://skills.example/framework/data-101',
                                    targetDescription:
                                        'Fictional framework node for testing explicit alignment display; not a real qualification equivalence.',
                                    targetType: 'CFItem',
                                },
                            ],
                        },
                        source: {
                            id: 'did:example:lc2184-cedar-training',
                            type: ['Profile'],
                            name: 'Cedar Technical Training',
                            url: 'https://cedar-training.example',
                            description:
                                'Fictional organization used only for LearnCard display tests.',
                        },
                        result: [
                            {
                                type: ['Result'],
                                resultDescription: 'urn:uuid:daac2cb1-3724-514c-845f-320d57c33be8',
                                status: 'Completed',
                            },
                        ],
                    },
                    awardedDate: '2026-03-16T12:00:00Z',
                    evidence: [
                        {
                            type: ['Evidence'],
                            name: 'Completion decision',
                            description: 'Synthetic assessment evidence.',
                            narrative:
                                'The training provider recorded workshop and assessment completion.',
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
                    id: 'urn:uuid:2bd7ed50-58d3-5a24-9a7e-778d26cb4094',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'Advanced Data Operations Practice',
                    description:
                        'An in-progress program with a start date and intentionally no end date.',
                    issuer: {
                        id: 'did:example:lc2184-cedar-training',
                        type: ['Profile'],
                        name: 'Cedar Technical Training',
                        url: 'https://cedar-training.example',
                        description:
                            'Fictional organization used only for LearnCard display tests.',
                    },
                    validFrom: '2026-09-01T12:00:00Z',
                    credentialSubject: {
                        id: 'did:example:lc2184-alex-morgan',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'urn:uuid:9c523c2f-d87d-582e-909f-c47b3763227a',
                            type: ['Achievement'],
                            achievementType: 'LearningProgram',
                            name: 'Advanced Data Operations Practice',
                            description:
                                'An in-progress program with a start date and intentionally no end date.',
                            criteria: {
                                narrative:
                                    'Complete the advanced practice activities and a final assessment.',
                            },
                            creator: {
                                id: 'did:example:lc2184-cedar-training',
                                type: ['Profile'],
                                name: 'Cedar Technical Training',
                                url: 'https://cedar-training.example',
                                description:
                                    'Fictional organization used only for LearnCard display tests.',
                            },
                            humanCode: 'SYN-TRAINING-PROGRESS',
                            version: '1.0',
                            inLanguage: 'en',
                            tag: ['synthetic', 'lc-2184'],
                            resultDescription: [
                                {
                                    id: 'urn:uuid:f019000e-b53c-5ce7-bc8a-0ad81106512a',
                                    type: ['ResultDescription'],
                                    name: 'Participation status',
                                    resultType: 'Status',
                                },
                            ],
                            alignment: [
                                {
                                    type: ['Alignment'],
                                    targetName: 'Advanced data operations',
                                    targetCode: 'DATA-201',
                                    targetFramework: 'Synthetic Workplace Capability Framework',
                                    targetUrl: 'https://skills.example/framework/data-201',
                                    targetDescription:
                                        'Fictional framework node for testing explicit alignment display; not a real qualification equivalence.',
                                    targetType: 'CFItem',
                                },
                            ],
                        },
                        activityStartDate: '2026-08-03T09:00:00Z',
                        role: 'Participant',
                        source: {
                            id: 'did:example:lc2184-cedar-training',
                            type: ['Profile'],
                            name: 'Cedar Technical Training',
                            url: 'https://cedar-training.example',
                            description:
                                'Fictional organization used only for LearnCard display tests.',
                        },
                        result: [
                            {
                                type: ['Result'],
                                resultDescription: 'urn:uuid:f019000e-b53c-5ce7-bc8a-0ad81106512a',
                                status: 'InProgress',
                            },
                        ],
                    },
                    evidence: [
                        {
                            type: ['Evidence'],
                            name: 'Progress narrative',
                            description: 'Synthetic assessment evidence.',
                            narrative:
                                'Two of four practice activities were completed at the snapshot date; no completion is asserted.',
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
                    sourceId: 'urn:uuid:248e9bf0-ac3d-5d64-873f-5f26f3cb8edc',
                    targetId: 'urn:uuid:c66210ee-6afa-59e6-91c1-750cfdc644f0',
                },
                {
                    type: ['Association'],
                    associationType: 'precedes',
                    sourceId: 'urn:uuid:248e9bf0-ac3d-5d64-873f-5f26f3cb8edc',
                    targetId: 'urn:uuid:f0fd8b1a-13c2-5c1b-8cb6-eaa12c893e8f',
                },
                {
                    type: ['Association'],
                    associationType: 'precedes',
                    sourceId: 'urn:uuid:f0fd8b1a-13c2-5c1b-8cb6-eaa12c893e8f',
                    targetId: 'urn:uuid:9c523c2f-d87d-582e-909f-c47b3763227a',
                },
            ],
        },
    },
};
