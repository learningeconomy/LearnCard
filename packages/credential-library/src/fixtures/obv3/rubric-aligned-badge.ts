import { UnsignedAchievementCredentialValidator } from '@learncard/types';

import type { CredentialFixture } from '../../types';

const RESULT_DESCRIPTION_ID = 'urn:uuid:7cc1519e-87f4-4cae-b7a5-786ec15db769';
const PROFICIENT_LEVEL_ID = 'urn:uuid:eb753d86-9277-478d-b9c4-3d589c82aff8';

export const obv3RubricAlignedBadge: CredentialFixture = {
    id: 'obv3/rubric-aligned-badge',
    name: 'Rubric-Aligned OBv3 Badge',
    description:
        'Open Badges v3 credential with rubric levels, an achieved level, and a CTDL result alignment',
    spec: 'obv3',
    profile: 'badge',
    features: ['alignment', 'results'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    validator: UnsignedAchievementCredentialValidator,
    tags: ['rubric', 'open-skill-alignment'],

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        id: 'urn:uuid:b3e5babd-f68e-4095-979d-3e910a444e73',
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        name: 'Applied Data Analysis',
        description: 'Recognizes applied data analysis at the proficient rubric level.',
        issuer: {
            id: 'did:example:issuer123',
            type: ['Profile'],
            name: 'Example Skills Institute',
            url: 'https://example.org',
        },
        validFrom: '2026-01-15T00:00:00Z',
        credentialSubject: {
            id: 'did:example:learner456',
            type: ['AchievementSubject'],
            achievement: {
                id: 'urn:uuid:e736a10c-aa36-466f-99af-e52440f32d8e',
                type: ['Achievement'],
                achievementType: 'Badge',
                name: 'Applied Data Analysis',
                description: 'Analyze a real-world dataset and communicate supported conclusions.',
                criteria: {
                    narrative:
                        'Submit an analysis that meets at least the proficient rubric level.',
                },
                resultDescription: [
                    {
                        id: RESULT_DESCRIPTION_ID,
                        type: ['ResultDescription'],
                        name: 'Data Analysis Rubric',
                        resultType: 'RubricCriterionLevel',
                        valueMin: '1',
                        valueMax: '4',
                        rubricCriterionLevel: [
                            {
                                id: 'urn:uuid:a4993932-d453-4417-b5aa-52b1bc1ea80e',
                                type: ['RubricCriterionLevel'],
                                name: 'Developing',
                                level: '2',
                                points: '2',
                            },
                            {
                                id: PROFICIENT_LEVEL_ID,
                                type: ['RubricCriterionLevel'],
                                name: 'Proficient',
                                level: '3',
                                points: '3',
                            },
                            {
                                id: 'urn:uuid:217fc04f-383b-48a0-a2e5-1cf1b016f7d4',
                                type: ['RubricCriterionLevel'],
                                name: 'Advanced',
                                level: '4',
                                points: '4',
                            },
                        ],
                        alignment: [
                            {
                                type: ['Alignment'],
                                targetName: 'Analyze data using appropriate methods',
                                targetUrl:
                                    'https://credentialengineregistry.org/resources/ce-2f5dce8d-29ad-40cb-a9e1-5a5517ff79a7',
                                targetType: 'CTDL',
                                targetFramework: 'Credential Engine Registry',
                            },
                        ],
                    },
                ],
            },
            result: [
                {
                    type: ['Result'],
                    resultDescription: RESULT_DESCRIPTION_ID,
                    value: '3',
                    achievedLevel: PROFICIENT_LEVEL_ID,
                },
            ],
        },
    },
};
