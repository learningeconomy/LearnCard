import { UnsignedAchievementCredentialValidator } from '@learncard/types';

import type { CredentialFixture } from '../../types';

// Example corpus provenance and alignment attribution: ../../../SOURCES.md.
export const obv3PhishingTransfer: CredentialFixture = {
    id: 'obv3/phishing-transfer',
    name: 'Phishing Recognition Transfer Project',
    description:
        'Independent project with an achieved-level-only rubric result and a separate RawScore result.',
    spec: 'obv3',
    profile: 'micro-credential',
    features: ['evidence', 'alignment', 'results', 'expiration'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    validator: UnsignedAchievementCredentialValidator,
    tags: ['phishing', 'mixed-results', 'achieved-level-only', 'learner'],

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        id: 'urn:uuid:670ef7c6-b8de-532c-9667-9817a0c942e8',
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        name: 'Phishing recognition — independent transfer project',
        description:
            'Adapt this task to a new fictional setting: Classify synthetic suspicious email examples. Complete an independently planned transfer project, recording assumptions, an initial failed approach and a supported revision.',
        issuer: {
            id: 'https://fixtures.example.org/frenchfry/issuers/technology',
            type: ['Profile'],
            name: 'Example Technology Institute',
        },
        validFrom: '2026-09-01T00:00:00Z',
        validUntil: '2028-09-01T00:00:00Z',
        credentialSubject: {
            id: 'https://fixtures.example.org/frenchfry/personas/ddf7bc68efd4',
            type: ['AchievementSubject'],
            achievement: {
                id: 'https://fixtures.example.org/frenchfry/achievements/ddf7bc68efd4/transfer',
                type: ['Achievement'],
                achievementType: 'MicroCredential',
                name: 'Phishing recognition — independent transfer project',
                description:
                    'Adapt this task to a new fictional setting: Classify synthetic suspicious email examples. Complete an independently planned transfer project, recording assumptions, an initial failed approach and a supported revision.',
                criteria: {
                    narrative:
                        'Identify cues without following links or sharing secrets; compare two alternative approaches and justify one under time and resource constraints.',
                },
                fieldOfStudy: 'technology',
                inLanguage: 'en',
                tag: ['technology', 'Phishing recognition', 'learner'],
                resultDescription: [
                    {
                        id: 'https://fixtures.example.org/frenchfry/achievements/ddf7bc68efd4/transfer/rubric',
                        type: ['ResultDescription'],
                        name: 'Independent transfer rubric',
                        resultType: 'RubricCriterionLevel',
                        requiredLevel:
                            'https://fixtures.example.org/frenchfry/achievements/ddf7bc68efd4/transfer/rubric/proficient',
                        rubricCriterionLevel: [
                            {
                                id: 'https://fixtures.example.org/frenchfry/achievements/ddf7bc68efd4/transfer/rubric/developing',
                                type: ['RubricCriterionLevel'],
                                name: 'Developing',
                                level: '1',
                                description:
                                    'Needs support to complete: Adapt this task to a new fictional setting: Classify synthetic suspicious email examples',
                                points: '1',
                            },
                            {
                                id: 'https://fixtures.example.org/frenchfry/achievements/ddf7bc68efd4/transfer/rubric/proficient',
                                type: ['RubricCriterionLevel'],
                                name: 'Proficient',
                                level: '2',
                                description:
                                    'Meets the task criterion: Identify cues without following links or sharing secrets; compare two alternative approaches and justify one under time and resource constraints.',
                                points: '2',
                            },
                            {
                                id: 'https://fixtures.example.org/frenchfry/achievements/ddf7bc68efd4/transfer/rubric/advanced',
                                type: ['RubricCriterionLevel'],
                                name: 'Advanced',
                                level: '3',
                                description:
                                    'Meets criterion and explains limits and alternative approaches.',
                                points: '3',
                            },
                        ],
                    },
                    {
                        id: 'https://fixtures.example.org/frenchfry/achievements/ddf7bc68efd4/transfer/rubric/functional-checks',
                        type: ['ResultDescription'],
                        name: 'Simulated functional acceptance checks',
                        resultType: 'RawScore',
                        valueMin: '0',
                        valueMax: '10',
                        requiredValue: '8',
                    },
                ],
                alignment: [
                    {
                        type: ['Alignment'],
                        targetName: 'Critical Thinking',
                        targetUrl:
                            'https://www.onetcenter.org/ctdlasn/resources/ce-07c26361-9119-11e8-b852-782bcb5df6ac',
                        targetFramework:
                            'O*NET Content Model Worker Requirements - Essential Skills: U.S. Department of Labor (DOL)',
                        targetDescription:
                            'Using logic and reasoning to identify the strengths and weaknesses of alternative solutions, conclusions, or approaches to problems.',
                        targetType: 'ceasn:Competency',
                        targetCode: '2.A.2.a',
                    },
                ],
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
                        'https://fixtures.example.org/frenchfry/achievements/ddf7bc68efd4/transfer/rubric',
                    achievedLevel:
                        'https://fixtures.example.org/frenchfry/achievements/ddf7bc68efd4/transfer/rubric/proficient',
                    status: 'Completed',
                },
                {
                    type: ['Result'],
                    resultDescription:
                        'https://fixtures.example.org/frenchfry/achievements/ddf7bc68efd4/transfer/rubric/functional-checks',
                    value: '9',
                    status: 'Completed',
                },
            ],
        },
        evidence: [
            {
                id: 'https://fixtures.example.org/frenchfry/evidence/ddf7bc68efd4/transfer',
                type: ['Evidence'],
                name: 'Independent project dossier; Classification worksheet and explanation',
                description:
                    'Adapt this task to a new fictional setting: Classify synthetic suspicious email examples; evaluation considered: Identify cues without following links or sharing secrets; compare two alternative approaches and justify one under time and resource constraints.',
                narrative:
                    'Adapt this task to a new fictional setting: Classify synthetic suspicious email examples; evaluation considered: Identify cues without following links or sharing secrets; compare two alternative approaches and justify one under time and resource constraints.',
                genre: 'Portfolio',
                audience: 'Assessors',
            },
            {
                id: 'https://fixtures.example.org/frenchfry/evidence/ddf7bc68efd4/transfer-review',
                type: ['Evidence'],
                name: 'Revision and peer critique record',
                narrative:
                    'An initial approach was reviewed; the learner documented assumptions, evaluated an alternative and revised the work.',
                genre: 'Reflective critique',
            },
        ],
    },
};
