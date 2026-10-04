import { UnsignedAchievementCredentialValidator } from '@learncard/types';

import type { CredentialFixture } from '../../types';

// Example corpus provenance and alignment attribution: ../../../SOURCES.md.
export const obv3FoodAllergenFacilitator: CredentialFixture = {
    id: 'obv3/food-allergen-facilitator',
    name: 'Food Allergen Control Facilitation',
    description:
        'Matched teaching-performance assessment with an instructor role and O*NET Instructing alignment.',
    spec: 'obv3',
    profile: 'generic',
    features: ['evidence', 'alignment', 'results', 'expiration'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    validator: UnsignedAchievementCredentialValidator,
    tags: ['food-safety', 'instructor', 'role-scope'],

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        id: 'urn:uuid:04adda59-747f-5d5b-b287-1a9b1943b2ba',
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        name: 'Teaching Food allergen control — facilitator performance',
        description:
            'Train a simulated food-preparation team on cross-contact communication in a fictional order. Assesses teaching performance; independent learner skill is outside this assessment.',
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
                id: 'https://fixtures.example.org/frenchfry/achievements/d56d0c592ac6/facilitator',
                type: ['Achievement'],
                achievementType: 'Assessment',
                name: 'Teaching Food allergen control — facilitator performance',
                description:
                    'Train a simulated food-preparation team on cross-contact communication in a fictional order. Assesses teaching performance; independent learner skill is outside this assessment.',
                criteria: {
                    narrative:
                        'Use a shared-tool counterexample and observe whether the team escalates uncertainty without making medical claims.',
                },
                fieldOfStudy: 'vocational',
                inLanguage: 'en',
                tag: ['vocational', 'Food allergen control', 'instructor'],
                resultDescription: [
                    {
                        id: 'https://fixtures.example.org/frenchfry/achievements/d56d0c592ac6/facilitator/rubric',
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
                        'https://fixtures.example.org/frenchfry/achievements/d56d0c592ac6/facilitator/rubric',
                    value: 'Proficient',
                    status: 'Completed',
                },
            ],
        },
        evidence: [
            {
                id: 'https://fixtures.example.org/frenchfry/evidence/d56d0c592ac6/facilitator',
                type: ['Evidence'],
                name: 'Cross-contact training tabletop and communication rubric',
                description:
                    'Train a simulated food-preparation team on cross-contact communication in a fictional order; evaluation considered: Use a shared-tool counterexample and observe whether the team escalates uncertainty without making medical claims.',
                narrative:
                    'Train a simulated food-preparation team on cross-contact communication in a fictional order; evaluation considered: Use a shared-tool counterexample and observe whether the team escalates uncertainty without making medical claims.',
                genre: 'Portfolio',
                audience: 'Assessors',
            },
        ],
    },
};
