import { UnsignedClrCredentialValidator } from '@learncard/types';

import type { CredentialFixture } from '../../types';

// Example corpus provenance and alignment attribution: ../../../SOURCES.md.
export const clrMixedRolePortfolio: CredentialFixture = {
    id: 'clr/mixed-role-portfolio',
    name: 'Quadratic Modeling and Statistical Sampling Portfolio',
    description:
        'CLR collection with two learner assessments, one instructor assessment, and scalar Association types.',
    spec: 'clr-v2',
    profile: 'learner-record',
    features: [
        'evidence',
        'alignment',
        'results',
        'expiration',
        'associations',
        'nested-credentials',
    ],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    validator: UnsignedClrCredentialValidator,
    tags: ['portfolio', 'mixed-role', 'canonical-associations', 'achievement-ids'],

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/clr/v2p0/context.json',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        id: 'urn:uuid:47213155-4246-5f73-bcf4-54776e488e21',
        type: ['VerifiableCredential', 'ClrCredential'],
        name: 'Quadratic Modeling and Statistical Sampling Portfolio',
        description:
            'Portfolio of quadratic modeling practice, statistical sampling transfer, and teaching performance.',
        issuer: {
            id: 'https://fixtures.example.org/frenchfry/issuers/education',
            type: ['Profile'],
            name: 'Example Education Institute',
        },
        validFrom: '2026-09-02T00:00:00Z',
        credentialSubject: {
            id: 'https://fixtures.example.org/frenchfry/personas/b8aecbfaee47',
            type: ['ClrSubject'],
            verifiableCredential: [
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    id: 'urn:uuid:a70a3561-5b59-56ef-95c3-fba84bf4dbb6',
                    type: ['VerifiableCredential', 'OpenBadgeCredential'],
                    name: 'Quadratic modeling — observed practice',
                    description:
                        'Fit a parabola to a simulated projectile dataset. Demonstrate a controlled practice task with observer feedback.',
                    issuer: {
                        id: 'https://fixtures.example.org/frenchfry/issuers/education',
                        type: ['Profile'],
                        name: 'Example Education Institute',
                    },
                    validFrom: '2026-09-01T00:00:00Z',
                    validUntil: '2028-09-01T00:00:00Z',
                    credentialSubject: {
                        id: 'https://fixtures.example.org/frenchfry/personas/b8aecbfaee47',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'https://fixtures.example.org/frenchfry/achievements/b8aecbfaee47/practice',
                            type: ['Achievement'],
                            achievementType: 'Assessment',
                            name: 'Quadratic modeling — observed practice',
                            description:
                                'Fit a parabola to a simulated projectile dataset. Demonstrate a controlled practice task with observer feedback.',
                            criteria: {
                                narrative: 'Report residuals and explain the valid time domain',
                            },
                            fieldOfStudy: 'education',
                            inLanguage: 'en',
                            tag: ['education', 'Quadratic modeling', 'learner'],
                            resultDescription: [
                                {
                                    id: 'https://fixtures.example.org/frenchfry/achievements/b8aecbfaee47/practice/rubric',
                                    type: ['ResultDescription'],
                                    name: 'Simulated performance rubric',
                                    resultType: 'Percent',
                                    valueMin: '0',
                                    valueMax: '100',
                                    requiredValue: '80',
                                },
                            ],
                        },
                        role: 'learner',
                        narrative: 'Demonstrate a controlled practice task with observer feedback.',
                        activityStartDate: '2026-08-01T00:00:00Z',
                        activityEndDate: '2026-08-31T00:00:00Z',
                        result: [
                            {
                                type: ['Result'],
                                resultDescription:
                                    'https://fixtures.example.org/frenchfry/achievements/b8aecbfaee47/practice/rubric',
                                value: '86',
                                status: 'Completed',
                            },
                        ],
                    },
                    evidence: [
                        {
                            id: 'https://fixtures.example.org/frenchfry/evidence/b8aecbfaee47/practice',
                            type: ['Evidence'],
                            name: 'Model notebook and residual plot',
                            description:
                                'Fit a parabola to a simulated projectile dataset; evaluation considered: Report residuals and explain the valid time domain',
                            narrative:
                                'Fit a parabola to a simulated projectile dataset; evaluation considered: Report residuals and explain the valid time domain',
                            genre: 'Observation record',
                            audience: 'Assessors',
                        },
                    ],
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    id: 'urn:uuid:16476c98-56e6-5d0e-96dc-9ab47f234874',
                    type: ['VerifiableCredential', 'OpenBadgeCredential'],
                    name: 'Statistical sampling — independent transfer project',
                    description:
                        'Adapt this task to a new fictional setting: Design a stratified survey for a fictional school. Complete an independently planned transfer project, recording assumptions, an initial failed approach and a supported revision.',
                    issuer: {
                        id: 'https://fixtures.example.org/frenchfry/issuers/education',
                        type: ['Profile'],
                        name: 'Example Education Institute',
                    },
                    validFrom: '2026-09-01T00:00:00Z',
                    validUntil: '2028-09-01T00:00:00Z',
                    credentialSubject: {
                        id: 'https://fixtures.example.org/frenchfry/personas/b8aecbfaee47',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'https://fixtures.example.org/frenchfry/achievements/c573cf61265a/transfer',
                            type: ['Achievement'],
                            achievementType: 'Course',
                            name: 'Statistical sampling — independent transfer project',
                            description:
                                'Adapt this task to a new fictional setting: Design a stratified survey for a fictional school. Complete an independently planned transfer project, recording assumptions, an initial failed approach and a supported revision.',
                            criteria: {
                                narrative:
                                    'Identify population, sampling frame and two bias risks; compare two alternative approaches and justify one under time and resource constraints.',
                            },
                            fieldOfStudy: 'education',
                            inLanguage: 'en',
                            tag: ['education', 'Statistical sampling', 'learner'],
                            resultDescription: [
                                {
                                    id: 'https://fixtures.example.org/frenchfry/achievements/c573cf61265a/transfer/rubric',
                                    type: ['ResultDescription'],
                                    name: 'Independent transfer rubric',
                                    resultType: 'RubricCriterionLevel',
                                    requiredLevel:
                                        'https://fixtures.example.org/frenchfry/achievements/c573cf61265a/transfer/rubric/proficient',
                                    rubricCriterionLevel: [
                                        {
                                            id: 'https://fixtures.example.org/frenchfry/achievements/c573cf61265a/transfer/rubric/developing',
                                            type: ['RubricCriterionLevel'],
                                            name: 'Developing',
                                            level: '1',
                                            description:
                                                'Needs support to complete: Adapt this task to a new fictional setting: Design a stratified survey for a fictional school',
                                            points: '1',
                                        },
                                        {
                                            id: 'https://fixtures.example.org/frenchfry/achievements/c573cf61265a/transfer/rubric/proficient',
                                            type: ['RubricCriterionLevel'],
                                            name: 'Proficient',
                                            level: '2',
                                            description:
                                                'Meets the task criterion: Identify population, sampling frame and two bias risks; compare two alternative approaches and justify one under time and resource constraints.',
                                            points: '2',
                                        },
                                        {
                                            id: 'https://fixtures.example.org/frenchfry/achievements/c573cf61265a/transfer/rubric/advanced',
                                            type: ['RubricCriterionLevel'],
                                            name: 'Advanced',
                                            level: '3',
                                            description:
                                                'Meets criterion and explains limits and alternative approaches.',
                                            points: '3',
                                        },
                                    ],
                                },
                            ],
                            alignment: [
                                {
                                    type: ['Alignment'],
                                    targetName: 'statistics',
                                    targetUrl:
                                        'http://data.europa.eu/esco/skill/7ee4c2ea-b349-4bd2-81a3-ec31475d4833',
                                    targetFramework: 'ESCO (requested dataset v1.2.0)',
                                    targetDescription:
                                        'The study of statistical theory, methods and practices such as collection, organisation, analysis, interpretation and presentation of data. It deals with all aspects of data including the planning of data collection in terms of the design of surveys and experiments in order to forecast and plan work-related activities.',
                                },
                            ],
                            creditsAvailable: 2,
                        },
                        role: 'learner',
                        narrative:
                            'Complete an independently planned transfer project, recording assumptions, an initial failed approach and a supported revision.',
                        activityStartDate: '2026-08-01T00:00:00Z',
                        activityEndDate: '2026-08-31T00:00:00Z',
                        result: [
                            {
                                type: ['Result'],
                                resultDescription:
                                    'https://fixtures.example.org/frenchfry/achievements/c573cf61265a/transfer/rubric',
                                achievedLevel:
                                    'https://fixtures.example.org/frenchfry/achievements/c573cf61265a/transfer/rubric/proficient',
                                status: 'Completed',
                            },
                        ],
                        creditsEarned: 2,
                        term: 'Synthetic Fall 2026',
                    },
                    evidence: [
                        {
                            id: 'https://fixtures.example.org/frenchfry/evidence/c573cf61265a/transfer',
                            type: ['Evidence'],
                            name: 'Independent project dossier; Sampling plan and response audit',
                            description:
                                'Adapt this task to a new fictional setting: Design a stratified survey for a fictional school; evaluation considered: Identify population, sampling frame and two bias risks; compare two alternative approaches and justify one under time and resource constraints.',
                            narrative:
                                'Adapt this task to a new fictional setting: Design a stratified survey for a fictional school; evaluation considered: Identify population, sampling frame and two bias risks; compare two alternative approaches and justify one under time and resource constraints.',
                            genre: 'Portfolio',
                            audience: 'Assessors',
                        },
                        {
                            id: 'https://fixtures.example.org/frenchfry/evidence/c573cf61265a/transfer-review',
                            type: ['Evidence'],
                            name: 'Revision and peer critique record',
                            narrative:
                                'An initial approach was reviewed; the learner documented assumptions, evaluated an alternative and revised the work.',
                            genre: 'Reflective critique',
                        },
                    ],
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    id: 'urn:uuid:b2aadaa8-c127-5a89-b4d0-c7f20f4da0df',
                    type: ['VerifiableCredential', 'OpenBadgeCredential'],
                    name: 'Teaching Quadratic modeling — facilitator performance',
                    description:
                        'Facilitate a simulated novice task: Fit a parabola to a simulated projectile dataset. Assesses teaching performance; independent learner skill is outside this assessment.',
                    issuer: {
                        id: 'https://fixtures.example.org/frenchfry/issuers/education',
                        type: ['Profile'],
                        name: 'Example Education Institute',
                    },
                    validFrom: '2026-09-01T00:00:00Z',
                    validUntil: '2028-09-01T00:00:00Z',
                    credentialSubject: {
                        id: 'https://fixtures.example.org/frenchfry/personas/b8aecbfaee47',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'https://fixtures.example.org/frenchfry/achievements/b8aecbfaee47/facilitator',
                            type: ['Achievement'],
                            achievementType: 'Assessment',
                            name: 'Teaching Quadratic modeling — facilitator performance',
                            description:
                                'Facilitate a simulated novice task: Fit a parabola to a simulated projectile dataset. Assesses teaching performance; independent learner skill is outside this assessment.',
                            criteria: {
                                narrative:
                                    'Coach the novice to explain and apply this task criterion: Report residuals and explain the valid time domain. Use an error example, ask for a revised attempt and distinguish this learning task from Linear regression.',
                            },
                            fieldOfStudy: 'education',
                            inLanguage: 'en',
                            tag: ['education', 'Quadratic modeling', 'instructor'],
                            resultDescription: [
                                {
                                    id: 'https://fixtures.example.org/frenchfry/achievements/b8aecbfaee47/facilitator/rubric',
                                    type: ['ResultDescription'],
                                    name: 'Instruction performance',
                                    resultType: 'PerformanceLevel',
                                    allowedValue: ['Developing', 'Proficient', 'Advanced'],
                                    requiredValue: 'Proficient',
                                },
                            ],
                            alignment: [
                                {
                                    type: ['Alignment'],
                                    targetName: 'Instructing',
                                    targetUrl:
                                        'https://www.onetcenter.org/ctdlasn/resources/ce-07c266f7-9119-11e8-b852-782bcb5df6ac',
                                    targetFramework:
                                        'O*NET Content Model Worker Requirements - Transferable Skills: U.S. Department of Labor (DOL)',
                                    targetDescription: 'Teaching others how to do something.',
                                    targetType: 'ceasn:Competency',
                                    targetCode: '2.B.1.e',
                                },
                            ],
                        },
                        role: 'instructor',
                        narrative:
                            'Assesses teaching performance; independent learner skill is outside this assessment.',
                        activityStartDate: '2026-08-01T00:00:00Z',
                        activityEndDate: '2026-08-31T00:00:00Z',
                        result: [
                            {
                                type: ['Result'],
                                resultDescription:
                                    'https://fixtures.example.org/frenchfry/achievements/b8aecbfaee47/facilitator/rubric',
                                value: 'Proficient',
                                status: 'Completed',
                            },
                        ],
                    },
                    evidence: [
                        {
                            id: 'https://fixtures.example.org/frenchfry/evidence/b8aecbfaee47/facilitator',
                            type: ['Evidence'],
                            name: 'Instructional worked example based on Model notebook and residual plot; simulated teach-back and observer critique',
                            description:
                                'Facilitate a simulated novice task: Fit a parabola to a simulated projectile dataset; evaluation considered: Coach the novice to explain and apply this task criterion: Report residuals and explain the valid time domain. Use an error example, ask for a revised attempt and distinguish this learning task from Linear regression.',
                            narrative:
                                'Facilitate a simulated novice task: Fit a parabola to a simulated projectile dataset; evaluation considered: Coach the novice to explain and apply this task criterion: Report residuals and explain the valid time domain. Use an error example, ask for a revised attempt and distinguish this learning task from Linear regression.',
                            genre: 'Portfolio',
                            audience: 'Assessors',
                        },
                    ],
                },
            ],
            achievement: [
                {
                    id: 'https://fixtures.example.org/frenchfry/achievements/b8aecbfaee47/practice',
                    type: ['Achievement'],
                    achievementType: 'Assessment',
                    name: 'Quadratic modeling — observed practice',
                    description:
                        'Fit a parabola to a simulated projectile dataset. Demonstrate a controlled practice task with observer feedback.',
                    criteria: {
                        narrative: 'Report residuals and explain the valid time domain',
                    },
                    fieldOfStudy: 'education',
                    inLanguage: 'en',
                    tag: ['education', 'Quadratic modeling', 'learner'],
                    resultDescription: [
                        {
                            id: 'https://fixtures.example.org/frenchfry/achievements/b8aecbfaee47/practice/rubric',
                            type: ['ResultDescription'],
                            name: 'Simulated performance rubric',
                            resultType: 'Percent',
                            valueMin: '0',
                            valueMax: '100',
                            requiredValue: '80',
                        },
                    ],
                },
                {
                    id: 'https://fixtures.example.org/frenchfry/achievements/c573cf61265a/transfer',
                    type: ['Achievement'],
                    achievementType: 'Course',
                    name: 'Statistical sampling — independent transfer project',
                    description:
                        'Adapt this task to a new fictional setting: Design a stratified survey for a fictional school. Complete an independently planned transfer project, recording assumptions, an initial failed approach and a supported revision.',
                    criteria: {
                        narrative:
                            'Identify population, sampling frame and two bias risks; compare two alternative approaches and justify one under time and resource constraints.',
                    },
                    fieldOfStudy: 'education',
                    inLanguage: 'en',
                    tag: ['education', 'Statistical sampling', 'learner'],
                    resultDescription: [
                        {
                            id: 'https://fixtures.example.org/frenchfry/achievements/c573cf61265a/transfer/rubric',
                            type: ['ResultDescription'],
                            name: 'Independent transfer rubric',
                            resultType: 'RubricCriterionLevel',
                            requiredLevel:
                                'https://fixtures.example.org/frenchfry/achievements/c573cf61265a/transfer/rubric/proficient',
                            rubricCriterionLevel: [
                                {
                                    id: 'https://fixtures.example.org/frenchfry/achievements/c573cf61265a/transfer/rubric/developing',
                                    type: ['RubricCriterionLevel'],
                                    name: 'Developing',
                                    level: '1',
                                    description:
                                        'Needs support to complete: Adapt this task to a new fictional setting: Design a stratified survey for a fictional school',
                                    points: '1',
                                },
                                {
                                    id: 'https://fixtures.example.org/frenchfry/achievements/c573cf61265a/transfer/rubric/proficient',
                                    type: ['RubricCriterionLevel'],
                                    name: 'Proficient',
                                    level: '2',
                                    description:
                                        'Meets the task criterion: Identify population, sampling frame and two bias risks; compare two alternative approaches and justify one under time and resource constraints.',
                                    points: '2',
                                },
                                {
                                    id: 'https://fixtures.example.org/frenchfry/achievements/c573cf61265a/transfer/rubric/advanced',
                                    type: ['RubricCriterionLevel'],
                                    name: 'Advanced',
                                    level: '3',
                                    description:
                                        'Meets criterion and explains limits and alternative approaches.',
                                    points: '3',
                                },
                            ],
                        },
                    ],
                    alignment: [
                        {
                            type: ['Alignment'],
                            targetName: 'statistics',
                            targetUrl:
                                'http://data.europa.eu/esco/skill/7ee4c2ea-b349-4bd2-81a3-ec31475d4833',
                            targetFramework: 'ESCO (requested dataset v1.2.0)',
                            targetDescription:
                                'The study of statistical theory, methods and practices such as collection, organisation, analysis, interpretation and presentation of data. It deals with all aspects of data including the planning of data collection in terms of the design of surveys and experiments in order to forecast and plan work-related activities.',
                        },
                    ],
                    creditsAvailable: 2,
                },
                {
                    id: 'https://fixtures.example.org/frenchfry/achievements/b8aecbfaee47/facilitator',
                    type: ['Achievement'],
                    achievementType: 'Assessment',
                    name: 'Teaching Quadratic modeling — facilitator performance',
                    description:
                        'Facilitate a simulated novice task: Fit a parabola to a simulated projectile dataset. Assesses teaching performance; independent learner skill is outside this assessment.',
                    criteria: {
                        narrative:
                            'Coach the novice to explain and apply this task criterion: Report residuals and explain the valid time domain. Use an error example, ask for a revised attempt and distinguish this learning task from Linear regression.',
                    },
                    fieldOfStudy: 'education',
                    inLanguage: 'en',
                    tag: ['education', 'Quadratic modeling', 'instructor'],
                    resultDescription: [
                        {
                            id: 'https://fixtures.example.org/frenchfry/achievements/b8aecbfaee47/facilitator/rubric',
                            type: ['ResultDescription'],
                            name: 'Instruction performance',
                            resultType: 'PerformanceLevel',
                            allowedValue: ['Developing', 'Proficient', 'Advanced'],
                            requiredValue: 'Proficient',
                        },
                    ],
                    alignment: [
                        {
                            type: ['Alignment'],
                            targetName: 'Instructing',
                            targetUrl:
                                'https://www.onetcenter.org/ctdlasn/resources/ce-07c266f7-9119-11e8-b852-782bcb5df6ac',
                            targetFramework:
                                'O*NET Content Model Worker Requirements - Transferable Skills: U.S. Department of Labor (DOL)',
                            targetDescription: 'Teaching others how to do something.',
                            targetType: 'ceasn:Competency',
                            targetCode: '2.B.1.e',
                        },
                    ],
                },
            ],
            association: [
                {
                    type: 'Association',
                    associationType: 'isRelatedTo',
                    sourceId:
                        'https://fixtures.example.org/frenchfry/achievements/b8aecbfaee47/practice',
                    targetId:
                        'https://fixtures.example.org/frenchfry/achievements/c573cf61265a/transfer',
                },
                {
                    type: 'Association',
                    associationType: 'isRelatedTo',
                    sourceId:
                        'https://fixtures.example.org/frenchfry/achievements/c573cf61265a/transfer',
                    targetId:
                        'https://fixtures.example.org/frenchfry/achievements/b8aecbfaee47/facilitator',
                },
            ],
        },
    },
};
