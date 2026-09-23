import { UnsignedAchievementCredentialValidator } from '@learncard/types';

import type { CredentialFixture } from '../../types';

export const obv3StudentAfterschoolProgramMentor: CredentialFixture = {
    id: 'obv3/student-afterschool-program-mentor',
    name: 'Student Persona — Afterschool Program Mentor',
    description:
        'A LearnCard social badge recognizing volunteer mentorship in a local afterschool program.',
    spec: 'obv3',
    profile: 'badge',
    features: ['alignment', 'image', 'display'],
    source: 'real-world',
    signed: false,
    validity: 'valid',
    validator: UnsignedAchievementCredentialValidator,
    tags: ['student-persona', 'community-service', 'mentoring'],
    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            'https://ctx.learncard.com/boosts/1.0.3.json',
        ],
        id: 'urn:uuid:e06ca594-91b4-4ea0-9d18-c780cf46b76a',
        type: ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
        issuer: {
            id: 'did:web:network.learncard.com:users:hillvalleyhigh',
        },
        credentialSubject: {
            id: 'did:web:network.learncard.com:users:super-fresh-kai',
            achievement: {
                achievementType: 'ext:LCA_CUSTOM:Social Badge:Community_Champ',
                alignment: [
                    {
                        targetCode: '6.6',
                        targetDescription:
                            'The ability to consistently act in accordance with a set of values and principles, and be honest and transparent with others.',
                        targetFramework: 'Pathsmith™ Durable Skills Starter Edition',
                        targetName: 'Personal Integrity',
                        targetUrl:
                            'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-2dq4yrivs',
                        type: ['Alignment'],
                    },
                    {
                        targetCode: '5.1',
                        targetDescription:
                            'The ability to understand priorities and apply them to the organization of time, people, and resources to achieve a common goal.',
                        targetFramework: 'Pathsmith™ Durable Skills Starter Edition',
                        targetName: 'Interpersonal Relationships',
                        targetUrl:
                            'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-487j1k9l1',
                        type: ['Alignment'],
                    },
                    {
                        targetCode: '5.3',
                        targetDescription:
                            'The ability to manage time and resource constraints in order to plan for the completion of tasks in a way that maximizes the efficiency of the plan and does not create a burden for those involved in the scheduled events.',
                        targetFramework: 'Pathsmith™ Durable Skills Starter Edition',
                        targetName: 'Teamwork/Team-Oriented',
                        targetUrl:
                            'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-bsc9c7cle',
                        type: ['Alignment'],
                    },
                    {
                        targetCode: '6.3',
                        targetDescription:
                            'The ability to demonstrate honesty, reliability, and ethical behavior during interactions, and consistently follow through on commitments and promises made to others.',
                        targetFramework: 'Pathsmith™ Durable Skills Starter Edition',
                        targetName: 'Trustworthy',
                        targetUrl:
                            'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-rcjmkv2qj',
                        type: ['Alignment'],
                    },
                    {
                        targetCode: '',
                        targetDescription:
                            'The ability to manage time and resource\nconstraints in order to plan for the\ncompletion of tasks in a way that maximizes the efficiency of the plan and does not create a burden for those involved in the scheduled events.',
                        targetFramework: 'Pathsmith™ Durable Skills Starter Edition',
                        targetName: 'Scheduling',
                        targetUrl:
                            'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1775837398456-odop6377i',
                        type: ['Alignment'],
                    },
                ],
                criteria: {
                    narrative:
                        'Earn this badge by dedicating your time and energy to support and uplift the youth in an afterschool program, showing your commitment to community service and positive influence.',
                },
                description:
                    'Awarded for dedicated volunteer service in a local afterschool program, demonstrating commitment and positive impact on young minds.',
                id: 'urn:uuid:98c0a926-aa97-4009-a42f-970666931fcb',
                image: 'https://cdn.filestackcontent.com/7hs6fs2Qgurpw2wSjuDx',
                name: 'Afterschool Program Mentor',
                type: ['Achievement'],
            },
            type: ['AchievementSubject'],
        },
        name: 'Afterschool Program Mentor',
        validFrom: '2026-07-06T03:02:55.786Z',
        display: {
            backgroundColor: '',
            backgroundImage: '',
            displayType: 'award',
            emoji: {
                activeSkinTone: '',
                imageUrl: '',
                names: [],
                unified: '',
                unifiedWithoutSkinTone: '',
            },
            previewType: 'default',
        },
        groupID: '',
        image: 'https://cdn.filestackcontent.com/7hs6fs2Qgurpw2wSjuDx',
        skills: [],
    },
};
