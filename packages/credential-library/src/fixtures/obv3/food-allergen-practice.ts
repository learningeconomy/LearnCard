import { UnsignedAchievementCredentialValidator } from '@learncard/types';

import type { CredentialFixture } from '../../types';

// Example corpus provenance and alignment attribution: ../../../SOURCES.md.
export const obv3FoodAllergenPractice: CredentialFixture = {
    id: 'obv3/food-allergen-practice',
    name: 'Food Allergen Control Practice',
    description:
        'Observed food-preparation practice with a RubricScore result, evidence, and ESCO alignment.',
    spec: 'obv3',
    profile: 'generic',
    features: ['evidence', 'alignment', 'results', 'expiration'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    validator: UnsignedAchievementCredentialValidator,
    tags: ['food-safety', 'rubric-score', 'learner'],

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        id: 'urn:uuid:7cc497f9-092a-5ea2-8cdb-7a2e60c25e68',
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        name: 'Food allergen control — observed practice',
        description:
            'Plan preparation for a fictional allergen-sensitive order. Demonstrate a controlled practice task with observer feedback.',
        issuer: {
            id: 'https://fixtures.example.org/frenchfry/issuers/vocational',
            type: ['Profile'],
            name: 'Example Vocational Institute',
        },
        validFrom: '2026-09-01T00:00:00Z',
        validUntil: '2028-09-01T00:00:00Z',
        credentialSubject: {
            id: 'https://fixtures.example.org/frenchfry/personas/d56d0c592ac6',
            type: ['AchievementSubject'],
            achievement: {
                id: 'https://fixtures.example.org/frenchfry/achievements/d56d0c592ac6/practice',
                type: ['Achievement'],
                achievementType: 'Assessment',
                name: 'Food allergen control — observed practice',
                description:
                    'Plan preparation for a fictional allergen-sensitive order. Demonstrate a controlled practice task with observer feedback.',
                criteria: {
                    narrative: 'Identify cross-contact routes and communication steps',
                },
                fieldOfStudy: 'vocational',
                inLanguage: 'en',
                tag: ['vocational', 'Food allergen control', 'learner'],
                resultDescription: [
                    {
                        id: 'https://fixtures.example.org/frenchfry/achievements/d56d0c592ac6/practice/rubric',
                        type: ['ResultDescription'],
                        name: 'Observed task rubric points',
                        resultType: 'RubricScore',
                        valueMin: '0',
                        valueMax: '4',
                        requiredValue: '3',
                    },
                ],
                alignment: [
                    {
                        type: ['Alignment'],
                        targetName: 'food safety principles',
                        targetUrl:
                            'http://data.europa.eu/esco/skill/3f4e4eab-a8e0-4aed-b8bb-79afe7c890e3',
                        targetFramework: 'ESCO (requested dataset v1.2.0)',
                        targetDescription:
                            'Scientific background of food safety which includes preparation, handling, and storage of food to minimise the risk of foodborne illness and other health hazards.',
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
                        'https://fixtures.example.org/frenchfry/achievements/d56d0c592ac6/practice/rubric',
                    value: '4',
                    status: 'Completed',
                },
            ],
        },
        evidence: [
            {
                id: 'https://fixtures.example.org/frenchfry/evidence/d56d0c592ac6/practice',
                type: ['Evidence'],
                name: 'Kitchen simulation checklist',
                description:
                    'Plan preparation for a fictional allergen-sensitive order; evaluation considered: Identify cross-contact routes and communication steps',
                narrative:
                    'Plan preparation for a fictional allergen-sensitive order; evaluation considered: Identify cross-contact routes and communication steps',
                genre: 'Observation record',
                audience: 'Assessors',
            },
        ],
    },
};
