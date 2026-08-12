import { UnsignedAchievementCredentialValidator } from '@learncard/types';

import type { CredentialFixture } from '../../types';

export const obv3WithAlignment: CredentialFixture = {
    id: 'obv3/with-alignment',
    name: 'OBv3 Badge with Competency Alignments',
    description:
        'Open Badges v3 credential with alignment to external competency frameworks (CTDL, CASE)',
    spec: 'obv3',
    profile: 'badge',
    features: ['alignment'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    validator: UnsignedAchievementCredentialValidator,

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        id: 'urn:uuid:e5f6a7b8-0005-4000-8000-000000000001',
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        name: 'Data Science Fundamentals',
        issuer: { id: 'did:example:datauniversity' },
        validFrom: '2024-06-01T00:00:00Z',
        credentialSubject: {
            id: 'did:example:learner101',
            type: ['AchievementSubject'],
            achievement: {
                id: 'urn:uuid:e5f6a7b8-0005-4000-8000-000000000002',
                type: ['Achievement'],
                achievementType: 'Course',
                name: 'Data Science Fundamentals',
                description:
                    'Introductory course covering statistics, machine learning basics, and data visualization.',
                criteria: {
                    narrative: 'Complete all assignments and pass the final exam with 70%+.',
                },
                alignment: [
                    {
                        type: ['Alignment'],
                        targetName: 'Data Analysis',
                        targetUrl: 'https://credentialfinder.org/competency/data-analysis',
                        targetType: 'ceasn:Competency',
                        targetFramework: 'O*NET',
                        targetDescription:
                            'Ability to collect, organize, interpret, and present data.',
                    },
                    {
                        type: ['Alignment'],
                        targetName: 'Statistical Methods',
                        targetUrl: 'https://casenetwork.example.com/cfitems/stat-methods',
                        targetType: 'CFItem',
                        targetFramework: 'CASE Mathematics Framework',
                    },
                ],
            },
        },
    },
};
