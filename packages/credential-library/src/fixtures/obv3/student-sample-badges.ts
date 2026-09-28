import {
    UnsignedAchievementCredentialValidator,
    type Achievement,
    type Evidence,
} from '@learncard/types';

import type { CredentialFixture } from '../../types';

type StudentSampleBadgeOptions = {
    fixtureId: string;
    fixtureName: string;
    fixtureDescription: string;
    issuerDid: string;
    validFrom: string;
    achievement: Achievement;
    evidence?: Evidence[];
};

const createStudentSampleBadge = ({
    fixtureId,
    fixtureName,
    fixtureDescription,
    issuerDid,
    validFrom,
    achievement,
    evidence,
}: StudentSampleBadgeOptions): CredentialFixture => ({
    id: fixtureId,
    name: fixtureName,
    description: fixtureDescription,
    spec: 'obv3',
    profile: 'badge',
    features: ['alignment', 'image', ...(evidence ? (['evidence'] as const) : [])],
    source: 'real-world',
    signed: false,
    validity: 'valid',
    validator: UnsignedAchievementCredentialValidator,
    tags: ['student-persona'],
    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        issuer: { id: issuerDid },
        credentialSubject: {
            id: 'did:example:student',
            achievement,
            type: ['AchievementSubject'],
        },
        name: achievement.name,
        validFrom,
        ...(evidence ? { evidence } : {}),
    },
});

export const obv3StudentAfterschoolProgramMentor = createStudentSampleBadge({
    fixtureId: 'obv3/student-afterschool-program-mentor',
    fixtureName: 'Student Persona — Afterschool Program Mentor',
    fixtureDescription:
        'A LearnCard social badge recognizing volunteer mentorship in a local afterschool program.',
    issuerDid: 'did:web:network.learncard.com:users:hillvalleyhigh',
    validFrom: '2026-07-06T03:02:55.786Z',
    achievement: {
        achievementType: 'CommunityService',
        tag: ['lc:category:Social Badge', 'lc:subtype:Community Champ', 'lc:displayType:award'],
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
});

export const obv3StudentEnvironmentBadge = createStudentSampleBadge({
    fixtureId: 'obv3/student-environment-badge',
    fixtureName: 'Student Persona — Environment Badge',
    fixtureDescription:
        'A LearnCard badge recognizing completion of the World Scout Environment training course.',
    issuerDid: 'did:web:network.learncard.com:users:scouting2',
    validFrom: '2026-07-06T02:58:48.995Z',
    achievement: {
        achievementType: 'Badge',
        tag: [
            'lc:category:Social Badge',
            'lc:subtype:Challenge Maker',
            'lc:displayType:award',
            'lc:bgImage:https://cdn.filestackcontent.com/5ZNtFOOZRUeDlYrFBP0f',
        ],
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
                targetCode: '8.3',
                targetDescription:
                    'The ability to be eager and open to learning new things, seeking out new information, and asking questions to better understand and solve problems.',
                targetFramework: 'Pathsmith™ Durable Skills Starter Edition',
                targetName: 'Curiosity',
                targetUrl:
                    'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-kegwjzu5x',
                type: ['Alignment'],
            },
            {
                targetCode: '2.2',
                targetDescription:
                    'The ability to motivate and guide a group of people toward achieving a common goal or objective.',
                targetFramework: 'Pathsmith™ Durable Skills Starter Edition',
                targetName: 'Leadership',
                targetUrl:
                    'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-purc6ulo5',
                type: ['Alignment'],
            },
            {
                targetCode: '7.3',
                targetDescription:
                    'The ability to think beyond the present, and envision and plan for a future state.',
                targetFramework: 'Pathsmith™ Durable Skills Starter Edition',
                targetName: 'Visionary',
                targetUrl:
                    'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-waljh6t43',
                type: ['Alignment'],
            },
        ],
        criteria: {
            narrative:
                'To earn this boost, you need to successfully complete all modules and activities of the World Scout Environment training course, demonstrating a commitment to environmental awareness and stewardship.',
        },
        description: 'Awarded for completing the World Scout Environment Badge training course.',
        id: 'urn:uuid:31b76aa3-8e03-4e41-b58e-5a080584ba60',
        image: 'https://cdn.filestackcontent.com/WjDskz3RZ20cbHoxNKZT',
        name: 'Environment Badge',
        type: ['Achievement'],
    },
});

export const obv3StudentRockClimbingMentor = createStudentSampleBadge({
    fixtureId: 'obv3/student-rock-climbing-mentor',
    fixtureName: 'Student Persona — Rock Climbing Mentor',
    fixtureDescription: 'A LearnCard badge recognizing beginner rock-climbing mentorship.',
    issuerDid: 'did:web:network.learncard.com:users:roycharles2',
    validFrom: '2026-07-06T03:06:03.724Z',
    evidence: [
        {
            id: 'https://cdn.filestackcontent.com/OJBHRYPKS2qY0L94E0uc',
            type: ['Evidence'],
            name: 'Olivia & friends climbing in California',
            description: 'rock climb pic.png · PNG · 1813.1 kB',
            genre: 'photo',
        },
    ],
    achievement: {
        achievementType: 'CommunityService',
        tag: [
            'lc:category:Social Badge',
            'lc:subtype:Expert',
            'lc:displayType:award',
            'lc:bgImage:https://cdn.filestackcontent.com/PTeHv2CTQmKWboDbWBso',
        ],
        alignment: [
            {
                targetCode: '6.2',
                targetDescription:
                    'The ability to stay driven, focused, and committed to achieving goals and delivering results without the need for constant direction and supervision.',
                targetFramework: 'Pathsmith™ Durable Skills Starter Edition',
                targetName: 'Self-Motivation',
                targetUrl:
                    'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-11fyf81e8',
                type: ['Alignment'],
            },
            {
                targetCode: '3.6',
                targetDescription:
                    'The ability to be flexible to changing circumstances and understand the impact of changes to task timelines in order to adjust plans efficiently',
                targetFramework: 'Pathsmith™ Durable Skills Starter Edition',
                targetName: 'Adaptability',
                targetUrl:
                    'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-7nubyoxde',
                type: ['Alignment'],
            },
            {
                targetCode: '8.1',
                targetDescription:
                    'The ability to work independently and take initiative to complete tasks without external direction or motivation.',
                targetFramework: 'Pathsmith™ Durable Skills Starter Edition',
                targetName: 'Self-Starter',
                targetUrl:
                    'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-86nd9j00d',
                type: ['Alignment'],
            },
            {
                targetCode: '9.4',
                targetDescription:
                    'The ability to understand and share the feelings, perspectives, and experiences of others.',
                targetFramework: 'Pathsmith™ Durable Skills Starter Edition',
                targetName: 'Patience',
                targetUrl:
                    'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-frahf8h7k',
                type: ['Alignment'],
            },
            {
                targetCode: '10.1',
                targetDescription:
                    'The ability to respond in the face of adversity in order to successfully recover from unexpected situations and resume or revise a plan to achieve the desired outcome of the original task.',
                targetFramework: 'Pathsmith™ Durable Skills Starter Edition',
                targetName: 'Resilience',
                targetUrl:
                    'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-gshg45jlj',
                type: ['Alignment'],
            },
            {
                targetCode: '3.7',
                targetDescription:
                    'The ability to establish clear and achievable objectives and to develop a plan to achieve them.',
                targetFramework: 'Pathsmith™ Durable Skills Starter Edition',
                targetName: 'Goal Setting',
                targetUrl:
                    'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-tkv7qhywf',
                type: ['Alignment'],
            },
            {
                targetCode: '10.6',
                targetDescription:
                    "The ability to regulate one's actions and emotions in order to stay committed to achieving a goal and keep oneself accountable for their responsibilities",
                targetFramework: 'Pathsmith™ Durable Skills Starter Edition',
                targetName: 'Self-Discipline',
                targetUrl:
                    'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-w4yyfkxzt',
                type: ['Alignment'],
            },
            {
                targetCode: '10.4',
                targetDescription:
                    'The ability to stay focused on the process and have unwavering determination when completing a task. The ability to exhibit passion and persistence in the face of adversity',
                targetFramework: 'Pathsmith™ Durable Skills Starter Edition',
                targetName: 'Tenacity',
                targetUrl:
                    'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-wq45d7y7r',
                type: ['Alignment'],
            },
            {
                targetCode: '10.7',
                targetDescription:
                    'The ability to stay composed and level-headed when faced with challenging or high-pressure situations.',
                targetFramework: 'Pathsmith™ Durable Skills Starter Edition',
                targetName: 'Calmness Under Pressure',
                targetUrl:
                    'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-xniik052a',
                type: ['Alignment'],
            },
            {
                targetCode: '10.8',
                targetDescription:
                    "The ability to trust one's abilities and present information with poise. The ability to have realistic confidence in one's judgment while knowing when to ask for assistance.",
                targetFramework: 'Pathsmith™ Durable Skills Starter Edition',
                targetName: 'Self-Confident',
                targetUrl:
                    'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-zjgotktn9',
                type: ['Alignment'],
            },
        ],
        criteria: {
            narrative:
                'You earn this boost by dedicating your time and effort to teach someone the fundamental skills of rock climbing, helping them build confidence and competence on the rock wall.',
        },
        description: 'Awarded for teaching the basics of rock climbing to a beginner.',
        id: 'urn:uuid:758dc921-2350-4861-b346-713f9c99cc92',
        image: 'https://cdn.filestackcontent.com/XqtIkkd3QMqR4ZvyUoWp',
        name: 'Rock Climbing Mentor',
        type: ['Achievement'],
    },
});

export const obv3StudentParkCleanupHelper = createStudentSampleBadge({
    fixtureId: 'obv3/student-park-cleanup-helper',
    fixtureName: 'Student Persona — Park Cleanup Helper',
    fixtureDescription: 'A LearnCard social badge recognizing volunteer park cleanup work.',
    issuerDid: 'did:web:network.learncard.com:users:roycharles2',
    validFrom: '2026-07-06T02:55:59.957Z',
    evidence: [
        {
            id: 'https://cdn.filestackcontent.com/Me0izbIMQNOkv28irNi5',
            type: ['Evidence'],
            name: 'park cleanup helper.webp',
            description: 'park cleanup helper.webp · WEBP · 561.1 kB',
            genre: 'photo',
        },
    ],
    achievement: {
        achievementType: 'CommunityService',
        tag: [
            'lc:category:Social Badge',
            'lc:subtype:Park Cleanup Helper',
            'lc:displayType:award',
            'lc:bgImage:https://cdn.filestackcontent.com/Ve3UzPtlQOSlRinFlRDI',
        ],
        alignment: [
            {
                targetCode: '5.4',
                targetDescription:
                    "The ability to effectively organize a team through actions that contribute to the team's cohesiveness by enhancing relationships, celebrating strengths, acknowledging weaknesses, and actively participating in team experiences and events.",
                targetFramework: 'Pathsmith™ Durable Skills Starter Edition',
                targetName: 'Team-Building',
                targetUrl:
                    'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-0vm22kkgh',
                type: ['Alignment'],
            },
            {
                targetCode: '8.1',
                targetDescription:
                    'The ability to work independently and take initiative to complete tasks without external direction or motivation.',
                targetFramework: 'Pathsmith™ Durable Skills Starter Edition',
                targetName: 'Self-Starter',
                targetUrl:
                    'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-86nd9j00d',
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
                targetCode: '5.5',
                targetDescription:
                    "The ability to prioritize the common goal of a group over one's personal goals for the benefit of the larger group and be flexible to complete a task being asked of you.",
                targetFramework: 'Pathsmith™ Durable Skills Starter Edition',
                targetName: 'Cooperation',
                targetUrl:
                    'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-d89eknulo',
                type: ['Alignment'],
            },
            {
                targetCode: '8.6',
                targetDescription:
                    'The ability to take initiative, set goals, and actively work towards achieving them.',
                targetFramework: 'Pathsmith™ Durable Skills Starter Edition',
                targetName: 'Action-Oriented',
                targetUrl:
                    'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-fxm6dc0lp',
                type: ['Alignment'],
            },
        ],
        criteria: {
            narrative:
                'Earn this boost by volunteering in local park cleanup activities, dedicating your time and effort to making our community spaces cleaner and more enjoyable for everyone.',
        },
        description:
            'Awarded to individuals who contribute to community cleanliness by helping with local park garbage cleanup events.',
        id: 'urn:uuid:241abe36-4bc8-4ab3-86a1-10ad4ed6f866',
        image: 'https://cdn.filestackcontent.com/HhXLRqTTQQGdng7OWcxO',
        name: 'Park Cleanup Helper',
        type: ['Achievement'],
    },
});
