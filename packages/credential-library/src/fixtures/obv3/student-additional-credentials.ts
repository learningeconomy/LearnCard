import { UnsignedAchievementCredentialValidator } from '@learncard/types';

import type { CredentialFixture } from '../../types';

type StudentCredentialFixtureInput = Pick<
    CredentialFixture,
    'id' | 'name' | 'description' | 'profile' | 'features' | 'credential'
>;

const createStudentCredentialFixture = (
    input: StudentCredentialFixtureInput
): CredentialFixture => ({
    ...input,
    spec: 'obv3',
    source: 'real-world',
    signed: false,
    validity: 'valid',
    validator: UnsignedAchievementCredentialValidator,
    tags: ['student-persona'],
});

export const obv3StudentAdditionalCredentials: CredentialFixture[] = [
    createStudentCredentialFixture({
        'id': 'obv3/student-first-place-science-fair',
        'name': 'Student Persona — First Place in a Science Fair',
        'description':
            'Olivia’s fascination with scientific exploration fueled her innovative science project. Her creativity, rigorous research, and engaging presentation earned her a distinguished spot among the top-ranked entries.',
        'profile': 'badge',
        'features': ['alignment', 'image'],
        'credential': {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            'type': ['VerifiableCredential', 'OpenBadgeCredential'],
            'issuer': {
                'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
            },
            'credentialSubject': {
                'id': 'did:example:student',
                'achievement': {
                    'achievementType': 'Award',
                    'alignment': [
                        {
                            'targetCode': '3.1',
                            'targetDescription':
                                'The ability to pay close attention to the small details of a task and to be aware of all details impactful to a task.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Detail-Oriented',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-3j08m18y6',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '3.6',
                            'targetDescription':
                                'The ability to be flexible to changing circumstances and understand the impact of changes to task timelines in order to adjust plans efficiently',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Adaptability',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-7nubyoxde',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.2',
                            'targetDescription':
                                'The ability to gather and analyze information systematically to gain insights and solve problems.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Research',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-a0c15t0yh',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.8',
                            'targetDescription':
                                'The ability to work independently, take ownership of tasks, and complete them with minimal or no supervision or guidance.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Self-Sufficiency',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-dsmt6dwcc',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.2',
                            'targetDescription':
                                'The ability to take initiative and anticipate potential issues or opportunities before they arise.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Proactivity',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-eennwwysa',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.7',
                            'targetDescription':
                                'The ability to evaluate and interpret complex information to draw insights and make informed decisions.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Analytical Thinking',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-locv0itx1',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '3.7',
                            'targetDescription':
                                'The ability to establish clear and achievable objectives and to develop a plan to achieve them.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Goal Setting',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-tkv7qhywf',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.5',
                            'targetDescription':
                                'The ability to analyze and evaluate information in order to make objective and informed decisions.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Critical Thinking',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-urpvvber5',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.4',
                            'targetDescription':
                                'The ability to quickly find effective solutions to problems, even in situations where resources may be limited or unclear.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Resourcefulness',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-ye6tas5rw',
                            'type': ['Alignment'],
                        },
                    ],
                    'criteria': {
                        'narrative':
                            'Acknowledges a top-ranking science project recognized for creativity, scientific rigor, and an effective presentation.',
                    },
                    'description':
                        'Olivia’s fascination with scientific exploration fueled her innovative science project. Her creativity, rigorous research, and engaging presentation earned her a distinguished spot among the top-ranked entries.',
                    'id': 'urn:uuid:4d563be3-41d1-4062-ae53-97cbe478926b',
                    'image': 'https://cdn.filestackcontent.com/UoWbVpaTjOuC0VXDwIUO',
                    'name': 'First Place in a Science Fair',
                    'type': ['Achievement'],
                    'tag': [
                        'lc:category:Achievement',
                        'lc:subtype:First Place',
                        'lc:displayType:award',
                        'lc:bgImage:https://cdn.filestackcontent.com/7A2FhJCTStShKZ4b2Rj4',
                    ],
                },
                'type': ['AchievementSubject'],
            },
            'name': 'First Place in a Science Fair',
            'validFrom': '2026-07-05T19:59:59.855Z',
        },
    }),
    createStudentCredentialFixture({
        'id': 'obv3/student-toefl-certification',
        'name': 'Student Persona — TOEFL Certification',
        'description':
            'Eager to excel in communication, Olivia dedicated herself to honing her reading, writing, speaking, and listening skills. Her hard work was recognized with a top-tier English proficiency certification. ',
        'profile': 'certificate',
        'features': ['alignment', 'image'],
        'credential': {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            'type': ['VerifiableCredential', 'OpenBadgeCredential'],
            'issuer': {
                'id': 'did:web:network.learncard.com:users:toefl2',
            },
            'credentialSubject': {
                'id': 'did:example:student',
                'achievement': {
                    'achievementType': 'Certification',
                    'alignment': [
                        {
                            'targetCode': '1.4',
                            'targetDescription':
                                'The ability to verbally convey information, thoughts, or ideas to others.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Verbal Communication',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-284nuop3u',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '3.6',
                            'targetDescription':
                                'The ability to be flexible to changing circumstances and understand the impact of changes to task timelines in order to adjust plans efficiently',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Adaptability',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-7nubyoxde',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '1.8',
                            'targetDescription':
                                'The ability to effectively deliver a message to engage, inform, and persuade an audience.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Public Speaking',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-e5img3d05',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '1.3',
                            'targetDescription':
                                'The ability to convey information, thoughts, or ideas in written form to others.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Written Communication',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-ebfgl4nam',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '9.6',
                            'targetDescription':
                                "The ability to fully concentrate on, understand, and respond to verbal and/ or nonverbal communication in order to comprehend the speaker's message, and demonstrate engagement and interest in the conversation.",
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Emotional Intelligence',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-eesahmda4',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '10.1',
                            'targetDescription':
                                'The ability to respond in the face of adversity in order to successfully recover from unexpected situations and resume or revise a plan to achieve the desired outcome of the original task.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Resilience',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-gshg45jlj',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.3',
                            'targetDescription':
                                'The ability to be eager and open to learning new things, seeking out new information, and asking questions to better understand and solve problems.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Curiosity',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-kegwjzu5x',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '9.8',
                            'targetDescription':
                                'The ability to have the self-esteem to understand that even though you are doing well, you do not have to brag about it.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Cultural Sensitivity',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-mgcymug5q',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '9.5',
                            'targetDescription':
                                'The ability to maintain a calm and composed attitude in the face of challenging situations and to persevere through difficulties or delays while maintaining a positive and productive outlook.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Active Listening',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-rsuxnbcgp',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '10.6',
                            'targetDescription':
                                "The ability to regulate one's actions and emotions in order to stay committed to achieving a goal and keep oneself accountable for their responsibilities",
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Self-Discipline',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-w4yyfkxzt',
                            'type': ['Alignment'],
                        },
                    ],
                    'criteria': {
                        'narrative':
                            "Certifies Olivia's high-level English language skills in reading, writing, speaking, and listening.",
                    },
                    'description':
                        'Eager to excel in communication, Olivia dedicated herself to honing her reading, writing, speaking, and listening skills. Her hard work was recognized with a top-tier English proficiency certification. ',
                    'id': 'urn:uuid:48a17d17-ce4b-4ead-9331-a348e14e10ca',
                    'image': 'https://cdn.filestackcontent.com/U7cxzj5hQBeINu2krh4F',
                    'name': 'TOEFL Certification',
                    'type': ['Achievement'],
                    'tag': [
                        'lc:category:Achievement',
                        'lc:subtype:Achievements',
                        'lc:displayType:certificate',
                        'lc:bgImage:https://cdn.filestackcontent.com/7EzPWKWgQIKRkr0JAOKx',
                    ],
                },
                'type': ['AchievementSubject'],
            },
            'name': 'TOEFL Certification',
            'validFrom': '2026-07-05T20:06:07.722Z',
        },
    }),
    createStudentCredentialFixture({
        'id': 'obv3/student-senior-capstone-project',
        'name': 'Student Persona — Senior Capstone Project',
        'description':
            'In her senior year, Olivia delved into a complex research topic for her culminating project. She applied newly acquired skills to produce a thoughtful final presentation that showcased deep subject-matter expertise.',
        'profile': 'badge',
        'features': ['alignment', 'image'],
        'credential': {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            'type': ['VerifiableCredential', 'OpenBadgeCredential'],
            'issuer': {
                'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
            },
            'credentialSubject': {
                'id': 'did:example:student',
                'achievement': {
                    'achievementType': 'Assignment',
                    'alignment': [
                        {
                            'targetCode': '4.2',
                            'targetDescription':
                                'The ability to gather and analyze information systematically to gain insights and solve problems.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Research',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-a0c15t0yh',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.1',
                            'targetDescription':
                                'The ability to define a problem, determine the cause of the problem, evaluate alternatives for a solution, and implement a solution.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Problem-Solving',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-a4g6gz6e1',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.7',
                            'targetDescription':
                                'The ability to evaluate and interpret complex information to draw insights and make informed decisions.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Analytical Thinking',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-locv0itx1',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.5',
                            'targetDescription':
                                'The ability to analyze and evaluate information in order to make objective and informed decisions.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Critical Thinking',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-urpvvber5',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.4',
                            'targetDescription':
                                'The ability to gather and analyze information from various sources to identify and resolve problems or issues.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Investigation',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-xpt0uc9ih',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.6',
                            'targetDescription':
                                'The ability to show willingness and desire to seek knowledge and understand new information by asking questions, exploring ideas, and continuously learning.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Intellectual Curiosity',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-yxppea8f5',
                            'type': ['Alignment'],
                        },
                    ],
                    'criteria': {
                        'narrative':
                            'Culminating high school project showcasing applied research and subject-matter expertise.',
                    },
                    'description':
                        'In her senior year, Olivia delved into a complex research topic for her culminating project. She applied newly acquired skills to produce a thoughtful final presentation that showcased deep subject-matter expertise.',
                    'id': 'urn:uuid:5ed66d1a-a1e2-485d-b008-a0b33a8d3042',
                    'image': 'https://cdn.filestackcontent.com/nGmsluYQpyw8QTUIsmUh',
                    'name': 'Senior Capstone Project',
                    'type': ['Achievement'],
                    'tag': [
                        'lc:category:Achievement',
                        'lc:subtype:Achievements',
                        'lc:displayType:badge',
                        'lc:bgImage:https://cdn.filestackcontent.com/8eE2IyevRMeN2c3lhcrD',
                    ],
                },
                'type': ['AchievementSubject'],
            },
            'name': 'Senior Capstone Project',
            'validFrom': '2026-07-05T20:17:23.961Z',
        },
    }),
    createStudentCredentialFixture({
        'id': 'obv3/student-sat-score',
        'name': 'Student Persona — SAT Score',
        'description':
            'Countless hours of study paid off when Olivia received exceptional scores in mathematics, reading, and analytical writing. This recognition highlighted both her discipline and her natural aptitude for problem-solving.',
        'profile': 'certificate',
        'features': ['alignment', 'image'],
        'credential': {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            'type': ['VerifiableCredential', 'OpenBadgeCredential'],
            'issuer': {
                'id': 'did:web:network.learncard.com:users:collegeboard2',
            },
            'credentialSubject': {
                'id': 'did:example:student',
                'achievement': {
                    'achievementType': 'Assessment',
                    'alignment': [
                        {
                            'targetCode': '3.5',
                            'targetDescription':
                                'The ability to estimate how long it takes to complete a task, to assess the progress of a task against the timeline for completion.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Time Management',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-36eykqtyb',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '3.1',
                            'targetDescription':
                                'The ability to pay close attention to the small details of a task and to be aware of all details impactful to a task.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Detail-Oriented',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-3j08m18y6',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.7',
                            'targetDescription':
                                'The ability to meet or exceed specific goals and objectives, and focus on the outcomes rather than the process it takes to get there.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Results-Focused',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-7wpzq5som',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.1',
                            'targetDescription':
                                'The ability to work independently and take initiative to complete tasks without external direction or motivation.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Self-Starter',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-86nd9j00d',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.1',
                            'targetDescription':
                                'The ability to define a problem, determine the cause of the problem, evaluate alternatives for a solution, and implement a solution.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Problem-Solving',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-a4g6gz6e1',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '1.3',
                            'targetDescription':
                                'The ability to convey information, thoughts, or ideas in written form to others.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Written Communication',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-ebfgl4nam',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.2',
                            'targetDescription':
                                'The ability to take initiative and anticipate potential issues or opportunities before they arise.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Proactivity',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-eennwwysa',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '10.2',
                            'targetDescription':
                                'The ability to use contextually appropriate strategies and tactics to elicit a desired reaction from a group that contributes to achieving the common goals of a group.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Motivational Skills',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-gkqk5tclu',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '10.1',
                            'targetDescription':
                                'The ability to respond in the face of adversity in order to successfully recover from unexpected situations and resume or revise a plan to achieve the desired outcome of the original task.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Resilience',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-gshg45jlj',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.7',
                            'targetDescription':
                                'The ability to evaluate and interpret complex information to draw insights and make informed decisions.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Analytical Thinking',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-locv0itx1',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '10.6',
                            'targetDescription':
                                "The ability to regulate one's actions and emotions in order to stay committed to achieving a goal and keep oneself accountable for their responsibilities",
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Self-Discipline',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-w4yyfkxzt',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '10.7',
                            'targetDescription':
                                'The ability to stay composed and level-headed when faced with challenging or high-pressure situations.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Calmness Under Pressure',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-xniik052a',
                            'type': ['Alignment'],
                        },
                    ],
                    'criteria': {
                        'narrative':
                            'Demonstrates strong standardized test performance in mathematics, reading, and analytical writing.',
                    },
                    'description':
                        'Countless hours of study paid off when Olivia received exceptional scores in mathematics, reading, and analytical writing. This recognition highlighted both her discipline and her natural aptitude for problem-solving.',
                    'id': 'urn:uuid:b7aa6692-0bf4-4063-8238-01c88b982966',
                    'image': 'https://cdn.filestackcontent.com/s4YRNyhNQimPZG8YpVsH',
                    'name': 'SAT Score',
                    'type': ['Achievement'],
                    'tag': [
                        'lc:category:Achievement',
                        'lc:subtype:Achievements',
                        'lc:displayType:certificate',
                        'lc:bgImage:https://cdn.filestackcontent.com/9JoBhCclQG64sNbByIlS',
                    ],
                },
                'type': ['AchievementSubject'],
            },
            'name': 'SAT Score',
            'validFrom': '2026-07-05T20:09:56.393Z',
        },
    }),
    createStudentCredentialFixture({
        'id': 'obv3/student-hill-valley-high-school-diploma',
        'name': 'Student Persona — Hill Valley High School Diploma',
        'description':
            'Proof of completion of 4 years of rigorous academic study, extracurricular activities, and community engagement at Hill Valley High School.',
        'profile': 'diploma',
        'features': ['alignment', 'image'],
        'credential': {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            'type': ['VerifiableCredential', 'OpenBadgeCredential'],
            'issuer': {
                'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
            },
            'credentialSubject': {
                'id': 'did:example:student',
                'achievement': {
                    'achievementType': 'SecondarySchoolDiploma',
                    'alignment': [
                        {
                            'targetCode': '6.5',
                            'targetDescription':
                                'The ability to consistently produce high-quality work and fulfill commitments to others.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Reliability',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-0dhuncc3w',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '5.4',
                            'targetDescription':
                                "The ability to effectively organize a team through actions that contribute to the team's cohesiveness by enhancing relationships, celebrating strengths, acknowledging weaknesses, and actively participating in team experiences and events.",
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Team-Building',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-0vm22kkgh',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '1.6',
                            'targetDescription':
                                'The ability to create, manage, and leverage social media platforms to reach and engage with a target audience, promote brand awareness, and drive business objectives',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Social Media',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-0y1926shy',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '6.2',
                            'targetDescription':
                                'The ability to stay driven, focused, and committed to achieving goals and delivering results without the need for constant direction and supervision.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Self-Motivation',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-11fyf81e8',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '1.4',
                            'targetDescription':
                                'The ability to verbally convey information, thoughts, or ideas to others.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Verbal Communication',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-284nuop3u',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '6.6',
                            'targetDescription':
                                'The ability to consistently act in accordance with a set of values and principles, and be honest and transparent with others.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Personal Integrity',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-2dq4yrivs',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '3.5',
                            'targetDescription':
                                'The ability to estimate how long it takes to complete a task, to assess the progress of a task against the timeline for completion.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Time Management',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-36eykqtyb',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '3.1',
                            'targetDescription':
                                'The ability to pay close attention to the small details of a task and to be aware of all details impactful to a task.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Detail-Oriented',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-3j08m18y6',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '5.2',
                            'targetDescription':
                                "The ability to contribute to a team by clearly communicating one's work, leveraging one's unique strengths, and being adaptable in the face of change to continue working towards the common goal.",
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Coordinating',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-3p44mrdm2',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '5.1',
                            'targetDescription':
                                'The ability to understand priorities and apply them to the organization of time, people, and resources to achieve a common goal.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Interpersonal Relationships',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-487j1k9l1',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '2.5',
                            'targetDescription':
                                'The ability to use specific knowledge, skills, tools, and techniques to achieve specific project objectives and deliver value.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Project Management',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-4hojwv31x',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '3.6',
                            'targetDescription':
                                'The ability to be flexible to changing circumstances and understand the impact of changes to task timelines in order to adjust plans efficiently',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Adaptability',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-7nubyoxde',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.7',
                            'targetDescription':
                                'The ability to meet or exceed specific goals and objectives, and focus on the outcomes rather than the process it takes to get there.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Results-Focused',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-7wpzq5som',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.1',
                            'targetDescription':
                                'The ability to work independently and take initiative to complete tasks without external direction or motivation.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Self-Starter',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-86nd9j00d',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '7.2',
                            'targetDescription':
                                'The ability to approach problems or tasks in a non- traditional way, and generate new ideas and solutions that can lead to improved outcomes.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Creative Thinking',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-8n0kmlyf2',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '2.4',
                            'targetDescription':
                                'The ability to analyze information, evaluate options, and make logical decisions that align with goals and objectives.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Decision Making',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-97ggmsg60',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.2',
                            'targetDescription':
                                'The ability to gather and analyze information systematically to gain insights and solve problems.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Research',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-a0c15t0yh',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.1',
                            'targetDescription':
                                'The ability to define a problem, determine the cause of the problem, evaluate alternatives for a solution, and implement a solution.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Problem-Solving',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-a4g6gz6e1',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '1.1',
                            'targetDescription':
                                'The ability to effectively exchange information, thoughts, and ideas with others in various environments (virtual and in-person) using various channels such as verbal, written, and non-verbal.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Communications (hybrid/remote)',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-a5g6jzb6x',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '10.5',
                            'targetDescription':
                                'The ability to confidently and willingly advocate for oneself while engaging in constructive discourse without being aggressive.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Assertiveness',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-aikd04t7r',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '7.4',
                            'targetDescription':
                                'The ability to generate and develop new ideas with the aim of addressing business challenges.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Ideation',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-b7x0qgw95',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '5.3',
                            'targetDescription':
                                'The ability to manage time and resource constraints in order to plan for the completion of tasks in a way that maximizes the efficiency of the plan and does not create a burden for those involved in the scheduled events.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Teamwork/Team-Oriented',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-bsc9c7cle',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '7.6',
                            'targetDescription':
                                'The ability to contribute to group problemsolving with spontaneous contribution of ideas.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Brainstorming',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-bxqloqmio',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.3',
                            'targetDescription':
                                'The ability to effectively organize and manage tasks according to their level of importance and urgency.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Prioritization',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-cgaaxwhe3',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '6.4',
                            'targetDescription':
                                'The ability to navigate situations with sensitivity, behaving and communicating in a way that is respectful and considerate of others.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Tactfulness',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-cwwivx3db',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '5.5',
                            'targetDescription':
                                "The ability to prioritize the common goal of a group over one's personal goals for the benefit of the larger group and be flexible to complete a task being asked of you.",
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Cooperation',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-d89eknulo',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '2.3',
                            'targetDescription':
                                'The ability to provide guidance and support to others in their personal and professional development.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Mentorship',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-dd5lbteul',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.8',
                            'targetDescription':
                                'The ability to work independently, take ownership of tasks, and complete them with minimal or no supervision or guidance.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Self-Sufficiency',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-dsmt6dwcc',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '1.8',
                            'targetDescription':
                                'The ability to effectively deliver a message to engage, inform, and persuade an audience.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Public Speaking',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-e5img3d05',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '1.3',
                            'targetDescription':
                                'The ability to convey information, thoughts, or ideas in written form to others.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Written Communication',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-ebfgl4nam',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '9.6',
                            'targetDescription':
                                "The ability to fully concentrate on, understand, and respond to verbal and/ or nonverbal communication in order to comprehend the speaker's message, and demonstrate engagement and interest in the conversation.",
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Emotional Intelligence',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-eesahmda4',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '9.2',
                            'targetDescription':
                                'The ability to provide friendly, attentive, and welcoming service to customers or clients.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Compassion',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-eu4suos08',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '9.4',
                            'targetDescription':
                                'The ability to understand and share the feelings, perspectives, and experiences of others.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Patience',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-frahf8h7k',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.6',
                            'targetDescription':
                                'The ability to take initiative, set goals, and actively work towards achieving them.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Action-Oriented',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-fxm6dc0lp',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '10.2',
                            'targetDescription':
                                'The ability to use contextually appropriate strategies and tactics to elicit a desired reaction from a group that contributes to achieving the common goals of a group.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Motivational Skills',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-gkqk5tclu',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '10.1',
                            'targetDescription':
                                'The ability to respond in the face of adversity in order to successfully recover from unexpected situations and resume or revise a plan to achieve the desired outcome of the original task.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Resilience',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-gshg45jlj',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '2.8',
                            'targetDescription':
                                "The ability to develop and communicate innovative and insightful ideas and perspectives that position an individual or organization as a trusted authority in one's industry or field.",
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Thought Leadership',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-hvha7jidz',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '1.5',
                            'targetDescription':
                                'The ability to strategically guide a discussion between two or more parties aimed at reaching an agreement or a solution.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Negotiation',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-j0fxnka8b',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '7.1',
                            'targetDescription':
                                'The ability to generate new ideas and creatively apply them to drive business growth and/or solve problems in a unique and effective way.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Innovation',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-j29aya1uh',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.3',
                            'targetDescription':
                                'The ability to be eager and open to learning new things, seeking out new information, and asking questions to better understand and solve problems.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Curiosity',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-kegwjzu5x',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '3.2',
                            'targetDescription':
                                'The ability to envision the end goal and the process required to achieve the goal.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Planning',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-ld9haqlk2',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.7',
                            'targetDescription':
                                'The ability to evaluate and interpret complex information to draw insights and make informed decisions.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Analytical Thinking',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-locv0itx1',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '9.8',
                            'targetDescription':
                                'The ability to have the self-esteem to understand that even though you are doing well, you do not have to brag about it.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Cultural Sensitivity',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-mgcymug5q',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '7.5',
                            'targetDescription':
                                'The ability to appropriately use the iterative process of testing and validating ideas, products, and services.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Experimentation',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-qdoil8ata',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '3.8',
                            'targetDescription':
                                'The ability to provide specific and actionable feedback to colleagues or employees with theaim of improving their performance and achieving organizational goals.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Constructive Feedback',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-qobpeka3y',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '6.3',
                            'targetDescription':
                                'The ability to demonstrate honesty, reliability, and ethical behavior during interactions, and consistently follow through on commitments and promises made to others.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Trustworthy',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-rcjmkv2qj',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '9.5',
                            'targetDescription':
                                'The ability to maintain a calm and composed attitude in the face of challenging situations and to persevere through difficulties or delays while maintaining a positive and productive outlook.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Active Listening',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-rsuxnbcgp',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '9.7',
                            'targetDescription':
                                "The ability to recognize, understand, and manage one's emotions, as well as empathize with and effectively communicate with others.",
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Humility',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-tgb0d9y7o',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '3.7',
                            'targetDescription':
                                'The ability to establish clear and achievable objectives and to develop a plan to achieve them.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Goal Setting',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-tkv7qhywf',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.5',
                            'targetDescription':
                                'The ability to analyze and evaluate information in order to make objective and informed decisions.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Critical Thinking',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-urpvvber5',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '10.6',
                            'targetDescription':
                                "The ability to regulate one's actions and emotions in order to stay committed to achieving a goal and keep oneself accountable for their responsibilities",
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Self-Discipline',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-w4yyfkxzt',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '9.3',
                            'targetDescription':
                                'The ability to empathize and show kindness and understanding toward others.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Empathy',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-w96zstc5o',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '7.3',
                            'targetDescription':
                                'The ability to think beyond the present, and envision and plan for a future state.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Visionary',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-waljh6t43',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '10.4',
                            'targetDescription':
                                'The ability to stay focused on the process and have unwavering determination when completing a task. The ability to exhibit passion and persistence in the face of adversity',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Tenacity',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-wq45d7y7r',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '10.7',
                            'targetDescription':
                                'The ability to stay composed and level-headed when faced with challenging or high-pressure situations.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Calmness Under Pressure',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-xniik052a',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.4',
                            'targetDescription':
                                'The ability to gather and analyze information from various sources to identify and resolve problems or issues.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Investigation',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-xpt0uc9ih',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '6.1',
                            'targetDescription':
                                "The ability to take ownership of responsibilities, meet expectations, take corrective action when needed, and accept the consequences of one's actions or decisions.",
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Accountability',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-xtr4xd1pf',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.4',
                            'targetDescription':
                                'The ability to quickly find effective solutions to problems, even in situations where resources may be limited or unclear.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Resourcefulness',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-ye6tas5rw',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '1.2',
                            'targetDescription':
                                'The ability to effectively convey ideas or information to an audience.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Presentation',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-yk22wcj2j',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.6',
                            'targetDescription':
                                'The ability to show willingness and desire to seek knowledge and understand new information by asking questions, exploring ideas, and continuously learning.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Intellectual Curiosity',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-yxppea8f5',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '10.8',
                            'targetDescription':
                                "The ability to trust one's abilities and present information with poise. The ability to have realistic confidence in one's judgment while knowing when to ask for assistance.",
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Self-Confident',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-zjgotktn9',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '10.3',
                            'targetDescription':
                                'The ability to maintain a positive attitude and focus on the best possible outcomes for events and tasks..',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Optimism',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-zoiwtqzij',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '',
                            'targetDescription':
                                'The ability to manage time and resource\nconstraints in order to plan for the\ncompletion of tasks in a way that maximizes the efficiency of the plan and does not create a burden for those involved in the scheduled events.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Scheduling',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1775837398456-odop6377i',
                            'type': ['Alignment'],
                        },
                    ],
                    'criteria': {
                        'narrative': 'Completed 4 years of coursework with exemplary marks.',
                    },
                    'description':
                        'Proof of completion of 4 years of rigorous academic study, extracurricular activities, and community engagement at Hill Valley High School.',
                    'id': 'urn:uuid:2b0da533-d233-4dd4-83e7-6a0de195bff4',
                    'image': 'https://cdn.filestackcontent.com/btcinBSRoCv5pzD3zOYo',
                    'name': 'Hill Valley High School Diploma',
                    'type': ['Achievement'],
                    'tag': [
                        'lc:category:Achievement',
                        'lc:subtype:Diploma',
                        'lc:displayType:certificate',
                        'lc:bgImage:https://cdn.filestackcontent.com/fu1JG0dSI61FQgbD7oJL',
                    ],
                },
                'type': ['AchievementSubject'],
            },
            'name': 'Hill Valley High School Diploma',
            'validFrom': '2026-07-05T20:14:07.111Z',
        },
    }),
    createStudentCredentialFixture({
        'id': 'obv3/student-biology-101',
        'name': 'Student Persona — Biology 101',
        'description':
            'In her study of life sciences, Olivia explored cell structures, genetics, and ecological systems. This course provided the bedrock for future scientific pursuits.',
        'profile': 'course',
        'features': ['alignment', 'image'],
        'credential': {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            'type': ['VerifiableCredential', 'OpenBadgeCredential'],
            'issuer': {
                'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
            },
            'credentialSubject': {
                'id': 'did:example:student',
                'achievement': {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'targetCode': '3.1',
                            'targetDescription':
                                'The ability to pay close attention to the small details of a task and to be aware of all details impactful to a task.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Detail-Oriented',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-3j08m18y6',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.2',
                            'targetDescription':
                                'The ability to gather and analyze information systematically to gain insights and solve problems.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Research',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-a0c15t0yh',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.3',
                            'targetDescription':
                                'The ability to be eager and open to learning new things, seeking out new information, and asking questions to better understand and solve problems.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Curiosity',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-kegwjzu5x',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.5',
                            'targetDescription':
                                'The ability to analyze and evaluate information in order to make objective and informed decisions.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Critical Thinking',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-urpvvber5',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.4',
                            'targetDescription':
                                'The ability to gather and analyze information from various sources to identify and resolve problems or issues.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Investigation',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-xpt0uc9ih',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.6',
                            'targetDescription':
                                'The ability to show willingness and desire to seek knowledge and understand new information by asking questions, exploring ideas, and continuously learning.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Intellectual Curiosity',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-yxppea8f5',
                            'type': ['Alignment'],
                        },
                    ],
                    'criteria': {
                        'narrative':
                            'Foundational life sciences course covering cellular biology, genetics, and ecology.',
                    },
                    'description':
                        'In her study of life sciences, Olivia explored cell structures, genetics, and ecological systems. This course provided the bedrock for future scientific pursuits.',
                    'id': 'urn:uuid:21d68fee-c994-4383-bb90-f059ca8e6189',
                    'image': 'https://cdn.filestackcontent.com/gkkuqW0GQnOvUnKN86ur',
                    'name': 'Biology 101',
                    'type': ['Achievement'],
                    'tag': [
                        'lc:category:Learning History',
                        'lc:subtype:Class',
                        'lc:displayType:certificate',
                        'lc:bgImage:https://cdn.filestackcontent.com/6UO9ghxsQjGe4gqzNWc7',
                    ],
                },
                'type': ['AchievementSubject'],
            },
            'name': 'Biology 101',
            'validFrom': '2026-07-05T21:01:54.024Z',
        },
    }),
    createStudentCredentialFixture({
        'id': 'obv3/student-ai-fundamentals',
        'name': 'Student Persona — AI Fundamentals',
        'description':
            'Curious about emerging technologies, Olivia enrolled in an introductory class on artificial intelligence. She learned about machine learning, ethical considerations, and the limitless potential of AI.',
        'profile': 'course',
        'features': ['alignment', 'image'],
        'credential': {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            'type': ['VerifiableCredential', 'OpenBadgeCredential'],
            'issuer': {
                'id': 'did:web:network.learncard.com:users:arcadia2',
            },
            'credentialSubject': {
                'id': 'did:example:student',
                'achievement': {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'targetCode': '6.5',
                            'targetDescription':
                                'The ability to consistently produce high-quality work and fulfill commitments to others.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Reliability',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-0dhuncc3w',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '1.6',
                            'targetDescription':
                                'The ability to create, manage, and leverage social media platforms to reach and engage with a target audience, promote brand awareness, and drive business objectives',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Social Media',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-0y1926shy',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '6.6',
                            'targetDescription':
                                'The ability to consistently act in accordance with a set of values and principles, and be honest and transparent with others.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Personal Integrity',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-2dq4yrivs',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '3.1',
                            'targetDescription':
                                'The ability to pay close attention to the small details of a task and to be aware of all details impactful to a task.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Detail-Oriented',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-3j08m18y6',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '5.2',
                            'targetDescription':
                                "The ability to contribute to a team by clearly communicating one's work, leveraging one's unique strengths, and being adaptable in the face of change to continue working towards the common goal.",
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Coordinating',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-3p44mrdm2',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '3.6',
                            'targetDescription':
                                'The ability to be flexible to changing circumstances and understand the impact of changes to task timelines in order to adjust plans efficiently',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Adaptability',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-7nubyoxde',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.2',
                            'targetDescription':
                                'The ability to gather and analyze information systematically to gain insights and solve problems.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Research',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-a0c15t0yh',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.1',
                            'targetDescription':
                                'The ability to define a problem, determine the cause of the problem, evaluate alternatives for a solution, and implement a solution.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Problem-Solving',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-a4g6gz6e1',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '1.3',
                            'targetDescription':
                                'The ability to convey information, thoughts, or ideas in written form to others.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Written Communication',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-ebfgl4nam',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '9.6',
                            'targetDescription':
                                "The ability to fully concentrate on, understand, and respond to verbal and/ or nonverbal communication in order to comprehend the speaker's message, and demonstrate engagement and interest in the conversation.",
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Emotional Intelligence',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-eesahmda4',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '3.7',
                            'targetDescription':
                                'The ability to establish clear and achievable objectives and to develop a plan to achieve them.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Goal Setting',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-tkv7qhywf',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.5',
                            'targetDescription':
                                'The ability to analyze and evaluate information in order to make objective and informed decisions.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Critical Thinking',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-urpvvber5',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '3.4',
                            'targetDescription':
                                'The ability to identify the appropriate resources needed to complete a task and implement those resources effectively to facilitate the thorough completion of a task.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Organizational Skills',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-wo2jj0vvu',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '5.6',
                            'targetDescription':
                                'The ability to effectively collaborate and build relationships with team members who are not in the same physical location.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Remote/Virtual Teams',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-y2e0zby0l',
                            'type': ['Alignment'],
                        },
                    ],
                    'criteria': {
                        'narrative':
                            'Introductory course covering basic AI algorithms, ethical considerations, and real-world use cases.',
                    },
                    'description':
                        'Curious about emerging technologies, Olivia enrolled in an introductory class on artificial intelligence. She learned about machine learning, ethical considerations, and the limitless potential of AI.',
                    'id': 'urn:uuid:98fe3408-7cd5-4116-a816-7ac8ce046ba1',
                    'image': 'https://cdn.filestackcontent.com/aNI8yHPSi6uKBAzFfAru',
                    'name': 'AI Fundamentals',
                    'type': ['Achievement'],
                    'tag': [
                        'lc:category:Learning History',
                        'lc:subtype:Training',
                        'lc:displayType:badge',
                        'lc:bgImage:https://cdn.filestackcontent.com/JFlEuwTTIWKVfTFTrsDQ',
                    ],
                },
                'type': ['AchievementSubject'],
            },
            'name': 'AI Fundamentals',
            'validFrom': '2026-07-05T21:10:18.671Z',
        },
    }),
    createStudentCredentialFixture({
        'id': 'obv3/student-technical-bootcamp',
        'name': 'Student Persona — Technical Bootcamp',
        'description':
            'Eager to deepen her programming expertise, Olivia completed a rigorous bootcamp. Long coding sprints, team collaborations, and real-world projects culminated in strong software engineering skills.',
        'profile': 'certificate',
        'features': ['alignment', 'image'],
        'credential': {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            'type': ['VerifiableCredential', 'OpenBadgeCredential'],
            'issuer': {
                'id': 'did:web:network.learncard.com:users:coderise2',
            },
            'credentialSubject': {
                'id': 'did:example:student',
                'achievement': {
                    'achievementType': 'LearningProgram',
                    'alignment': [
                        {
                            'targetCode': '3.1',
                            'targetDescription':
                                'The ability to pay close attention to the small details of a task and to be aware of all details impactful to a task.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Detail-Oriented',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-3j08m18y6',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '3.6',
                            'targetDescription':
                                'The ability to be flexible to changing circumstances and understand the impact of changes to task timelines in order to adjust plans efficiently',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Adaptability',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-7nubyoxde',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.1',
                            'targetDescription':
                                'The ability to define a problem, determine the cause of the problem, evaluate alternatives for a solution, and implement a solution.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Problem-Solving',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-a4g6gz6e1',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.3',
                            'targetDescription':
                                'The ability to effectively organize and manage tasks according to their level of importance and urgency.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Prioritization',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-cgaaxwhe3',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '3.2',
                            'targetDescription':
                                'The ability to envision the end goal and the process required to achieve the goal.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Planning',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-ld9haqlk2',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.7',
                            'targetDescription':
                                'The ability to evaluate and interpret complex information to draw insights and make informed decisions.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Analytical Thinking',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-locv0itx1',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '6.3',
                            'targetDescription':
                                'The ability to demonstrate honesty, reliability, and ethical behavior during interactions, and consistently follow through on commitments and promises made to others.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Trustworthy',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-rcjmkv2qj',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '6.1',
                            'targetDescription':
                                "The ability to take ownership of responsibilities, meet expectations, take corrective action when needed, and accept the consequences of one's actions or decisions.",
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Accountability',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-xtr4xd1pf',
                            'type': ['Alignment'],
                        },
                    ],
                    'criteria': {
                        'narrative':
                            'Intensive coding program focusing on web development, software engineering, and collaborative projects.',
                    },
                    'description':
                        'Eager to deepen her programming expertise, Olivia completed a rigorous bootcamp. Long coding sprints, team collaborations, and real-world projects culminated in strong software engineering skills.',
                    'id': 'urn:uuid:7eb6950e-9366-43c9-a0ae-aae70d9dc6e9',
                    'image': 'https://cdn.filestackcontent.com/hQFVQJwTPakN1Ul2AYSR',
                    'name': 'Technical Bootcamp',
                    'type': ['Achievement'],
                    'tag': [
                        'lc:category:Learning History',
                        'lc:subtype:Bootcamp',
                        'lc:displayType:badge',
                        'lc:bgImage:https://cdn.filestackcontent.com/aixYSCFSCe3hhtYfpTxd',
                    ],
                },
                'type': ['AchievementSubject'],
            },
            'name': 'Technical Bootcamp',
            'validFrom': '2026-07-05T21:06:42.449Z',
        },
    }),
    createStudentCredentialFixture({
        'id': 'obv3/student-ba-interactive-media-design',
        'name': 'Student Persona — B.A., Interactive Media Design',
        'description':
            'When Olivia began her academic journey, she immersed herself in courses covering digital design, emerging tech, and user experience. Through late-night study sessions and countless creative projects, she honed her skills and proudly earned this bachelor’s degree—symbolizing her dedication to blending aesthetics with cutting-edge innovation. ',
        'profile': 'degree',
        'features': ['alignment', 'image'],
        'credential': {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            'type': ['VerifiableCredential', 'OpenBadgeCredential'],
            'issuer': {
                'id': 'did:web:network.learncard.com:users:redwoodvalley2',
            },
            'credentialSubject': {
                'id': 'did:example:student',
                'achievement': {
                    'achievementType': 'BachelorDegree',
                    'alignment': [
                        {
                            'targetCode': '6.5',
                            'targetDescription':
                                'The ability to consistently produce high-quality work and fulfill commitments to others.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Reliability',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-0dhuncc3w',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '6.2',
                            'targetDescription':
                                'The ability to stay driven, focused, and committed to achieving goals and delivering results without the need for constant direction and supervision.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Self-Motivation',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-11fyf81e8',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '1.4',
                            'targetDescription':
                                'The ability to verbally convey information, thoughts, or ideas to others.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Verbal Communication',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-284nuop3u',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '3.5',
                            'targetDescription':
                                'The ability to estimate how long it takes to complete a task, to assess the progress of a task against the timeline for completion.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Time Management',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-36eykqtyb',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '5.2',
                            'targetDescription':
                                "The ability to contribute to a team by clearly communicating one's work, leveraging one's unique strengths, and being adaptable in the face of change to continue working towards the common goal.",
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Coordinating',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-3p44mrdm2',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '2.5',
                            'targetDescription':
                                'The ability to use specific knowledge, skills, tools, and techniques to achieve specific project objectives and deliver value.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Project Management',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-4hojwv31x',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '3.6',
                            'targetDescription':
                                'The ability to be flexible to changing circumstances and understand the impact of changes to task timelines in order to adjust plans efficiently',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Adaptability',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-7nubyoxde',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.7',
                            'targetDescription':
                                'The ability to meet or exceed specific goals and objectives, and focus on the outcomes rather than the process it takes to get there.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Results-Focused',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-7wpzq5som',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.1',
                            'targetDescription':
                                'The ability to work independently and take initiative to complete tasks without external direction or motivation.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Self-Starter',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-86nd9j00d',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '7.2',
                            'targetDescription':
                                'The ability to approach problems or tasks in a non- traditional way, and generate new ideas and solutions that can lead to improved outcomes.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Creative Thinking',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-8n0kmlyf2',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '1.1',
                            'targetDescription':
                                'The ability to effectively exchange information, thoughts, and ideas with others in various environments (virtual and in-person) using various channels such as verbal, written, and non-verbal.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Communications (hybrid/remote)',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-a5g6jzb6x',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '7.4',
                            'targetDescription':
                                'The ability to generate and develop new ideas with the aim of addressing business challenges.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Ideation',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-b7x0qgw95',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '7.6',
                            'targetDescription':
                                'The ability to contribute to group problemsolving with spontaneous contribution of ideas.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Brainstorming',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-bxqloqmio',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '5.5',
                            'targetDescription':
                                "The ability to prioritize the common goal of a group over one's personal goals for the benefit of the larger group and be flexible to complete a task being asked of you.",
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Cooperation',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-d89eknulo',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '10.1',
                            'targetDescription':
                                'The ability to respond in the face of adversity in order to successfully recover from unexpected situations and resume or revise a plan to achieve the desired outcome of the original task.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Resilience',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-gshg45jlj',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '2.8',
                            'targetDescription':
                                "The ability to develop and communicate innovative and insightful ideas and perspectives that position an individual or organization as a trusted authority in one's industry or field.",
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Thought Leadership',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-hvha7jidz',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.3',
                            'targetDescription':
                                'The ability to be eager and open to learning new things, seeking out new information, and asking questions to better understand and solve problems.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Curiosity',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-kegwjzu5x',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '3.2',
                            'targetDescription':
                                'The ability to envision the end goal and the process required to achieve the goal.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Planning',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-ld9haqlk2',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '10.6',
                            'targetDescription':
                                "The ability to regulate one's actions and emotions in order to stay committed to achieving a goal and keep oneself accountable for their responsibilities",
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Self-Discipline',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-w4yyfkxzt',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '7.3',
                            'targetDescription':
                                'The ability to think beyond the present, and envision and plan for a future state.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Visionary',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-waljh6t43',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '5.6',
                            'targetDescription':
                                'The ability to effectively collaborate and build relationships with team members who are not in the same physical location.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Remote/Virtual Teams',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-y2e0zby0l',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '1.2',
                            'targetDescription':
                                'The ability to effectively convey ideas or information to an audience.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Presentation',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-yk22wcj2j',
                            'type': ['Alignment'],
                        },
                    ],
                    'criteria': {
                        'narrative':
                            "Awarded for completing a bachelor's program focusing on interactive digital design, user experience, and emerging technologies.",
                    },
                    'description':
                        'When Olivia began her academic journey, she immersed herself in courses covering digital design, emerging tech, and user experience. Through late-night study sessions and countless creative projects, she honed her skills and proudly earned this bachelor’s degree—symbolizing her dedication to blending aesthetics with cutting-edge innovation. ',
                    'id': 'urn:uuid:41515303-81bb-4ce6-813f-d3f69df68cd0',
                    'image': 'https://cdn.filestackcontent.com/Hm24dMReRRaeJxs4dirv',
                    'name': 'B.A., Interactive Media Design',
                    'type': ['Achievement'],
                    'tag': [
                        'lc:category:Learning History',
                        'lc:subtype:Degree',
                        'lc:displayType:certificate',
                        'lc:bgImage:https://cdn.filestackcontent.com/DJcAcspR60utsd4NYYAb',
                    ],
                },
                'type': ['AchievementSubject'],
            },
            'name': 'B.A., Interactive Media Design',
            'validFrom': '2026-07-05T20:03:17.622Z',
        },
    }),
    createStudentCredentialFixture({
        'id': 'obv3/student-ap-math-course',
        'name': 'Student Persona — AP Math Course',
        'description':
            'With a love for numbers, Olivia tackled advanced calculus topics at a college level. Her perseverance in this course opened pathways for future academic credit.',
        'profile': 'course',
        'features': ['alignment', 'image'],
        'credential': {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            'type': ['VerifiableCredential', 'OpenBadgeCredential'],
            'issuer': {
                'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
            },
            'credentialSubject': {
                'id': 'did:example:student',
                'achievement': {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'targetCode': '3.1',
                            'targetDescription':
                                'The ability to pay close attention to the small details of a task and to be aware of all details impactful to a task.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Detail-Oriented',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-3j08m18y6',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '3.6',
                            'targetDescription':
                                'The ability to be flexible to changing circumstances and understand the impact of changes to task timelines in order to adjust plans efficiently',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Adaptability',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-7nubyoxde',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.1',
                            'targetDescription':
                                'The ability to define a problem, determine the cause of the problem, evaluate alternatives for a solution, and implement a solution.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Problem-Solving',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-a4g6gz6e1',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.3',
                            'targetDescription':
                                'The ability to effectively organize and manage tasks according to their level of importance and urgency.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Prioritization',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-cgaaxwhe3',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.7',
                            'targetDescription':
                                'The ability to evaluate and interpret complex information to draw insights and make informed decisions.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Analytical Thinking',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-locv0itx1',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.5',
                            'targetDescription':
                                'The ability to analyze and evaluate information in order to make objective and informed decisions.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Critical Thinking',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-urpvvber5',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '10.6',
                            'targetDescription':
                                "The ability to regulate one's actions and emotions in order to stay committed to achieving a goal and keep oneself accountable for their responsibilities",
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Self-Discipline',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-w4yyfkxzt',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '10.4',
                            'targetDescription':
                                'The ability to stay focused on the process and have unwavering determination when completing a task. The ability to exhibit passion and persistence in the face of adversity',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Tenacity',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-wq45d7y7r',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.6',
                            'targetDescription':
                                'The ability to show willingness and desire to seek knowledge and understand new information by asking questions, exploring ideas, and continuously learning.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Intellectual Curiosity',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-yxppea8f5',
                            'type': ['Alignment'],
                        },
                    ],
                    'criteria': {
                        'narrative':
                            'Advanced Placement course offering college-level math curriculum and potential college credit.',
                    },
                    'description':
                        'With a love for numbers, Olivia tackled advanced calculus topics at a college level. Her perseverance in this course opened pathways for future academic credit.',
                    'id': 'urn:uuid:8381f66c-aff7-4bd9-bdb7-a7c2a99a08f6',
                    'image': 'https://cdn.filestackcontent.com/V1l17mddR4evzPDrptmZ',
                    'name': 'AP Math Course',
                    'type': ['Achievement'],
                    'tag': [
                        'lc:category:Learning History',
                        'lc:subtype:Class',
                        'lc:displayType:certificate',
                        'lc:bgImage:https://cdn.filestackcontent.com/ciMvwE5ZTqKDcS9hPbtG',
                    ],
                },
                'type': ['AchievementSubject'],
            },
            'name': 'AP Math Course',
            'validFrom': '2026-07-05T21:14:01.405Z',
        },
    }),
    createStudentCredentialFixture({
        'id': 'obv3/student-animated-short',
        'name': 'Student Persona — Animated Short',
        'description': 'An animated video featuring heroes from the Super Skills League.',
        'profile': 'badge',
        'features': ['alignment', 'image', 'evidence'],
        'credential': {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            'type': ['VerifiableCredential', 'OpenBadgeCredential'],
            'issuer': {
                'id': 'did:web:network.learncard.com:users:lefdemoschool',
            },
            'credentialSubject': {
                'id': 'did:example:student',
                'achievement': {
                    'achievementType': 'Assignment',
                    'alignment': [
                        {
                            'targetCode': '7.2',
                            'targetDescription':
                                'The ability to approach problems or tasks in a non- traditional way, and generate new ideas and solutions that can lead to improved outcomes.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Creative Thinking',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-8n0kmlyf2',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '7.4',
                            'targetDescription':
                                'The ability to generate and develop new ideas with the aim of addressing business challenges.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Ideation',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-b7x0qgw95',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.3',
                            'targetDescription':
                                'The ability to be eager and open to learning new things, seeking out new information, and asking questions to better understand and solve problems.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Curiosity',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-kegwjzu5x',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '7.3',
                            'targetDescription':
                                'The ability to think beyond the present, and envision and plan for a future state.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Visionary',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-waljh6t43',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.4',
                            'targetDescription':
                                'The ability to quickly find effective solutions to problems, even in situations where resources may be limited or unclear.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Resourcefulness',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-ye6tas5rw',
                            'type': ['Alignment'],
                        },
                    ],
                    'criteria': {
                        'narrative': 'Designing, animating, writing and voicing an animated short.',
                    },
                    'description':
                        'An animated video featuring heroes from the Super Skills League.',
                    'id': 'urn:uuid:8a9acb07-b8bc-441f-9c06-454b7b8b4a6f',
                    'image': 'https://cdn.filestackcontent.com/8OIEKhtHTAutM1nzlKkT',
                    'name': 'Animated Short',
                    'type': ['Achievement'],
                    'tag': [
                        'lc:category:Accomplishment',
                        'lc:subtype:Content',
                        'lc:displayType:media',
                    ],
                },
                'type': ['AchievementSubject'],
            },
            'name': 'Animated Short',
            'validFrom': '2026-07-05T21:24:36.619Z',
            'evidence': [
                {
                    'id': 'https://youtu.be/1Sjs-eKmuXE',
                    'name': 'Animated Short',
                    'genre': 'video',
                    'type': ['Evidence'],
                },
            ],
        },
    }),
    createStudentCredentialFixture({
        'id': 'obv3/student-capstone-project',
        'name': 'Student Persona — Capstone Project',
        'description':
            'Drawing on her entire academic journey, Olivia tackled a comprehensive real-world problem for her final capstone project. Her research, design thinking, and engaging presentation showcased her readiness for professional challenges. ',
        'profile': 'badge',
        'features': ['alignment', 'image'],
        'credential': {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            'type': ['VerifiableCredential', 'OpenBadgeCredential'],
            'issuer': {
                'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
            },
            'credentialSubject': {
                'id': 'did:example:student',
                'achievement': {
                    'achievementType': 'Assignment',
                    'alignment': [
                        {
                            'targetCode': '7.2',
                            'targetDescription':
                                'The ability to approach problems or tasks in a non- traditional way, and generate new ideas and solutions that can lead to improved outcomes.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Creative Thinking',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-8n0kmlyf2',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.2',
                            'targetDescription':
                                'The ability to gather and analyze information systematically to gain insights and solve problems.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Research',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-a0c15t0yh',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '7.4',
                            'targetDescription':
                                'The ability to generate and develop new ideas with the aim of addressing business challenges.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Ideation',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-b7x0qgw95',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.7',
                            'targetDescription':
                                'The ability to evaluate and interpret complex information to draw insights and make informed decisions.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Analytical Thinking',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-locv0itx1',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '7.5',
                            'targetDescription':
                                'The ability to appropriately use the iterative process of testing and validating ideas, products, and services.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Experimentation',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-qdoil8ata',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '4.5',
                            'targetDescription':
                                'The ability to analyze and evaluate information in order to make objective and informed decisions.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Critical Thinking',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-urpvvber5',
                            'type': ['Alignment'],
                        },
                    ],
                    'criteria': {
                        'narrative':
                            'Culminating academic project integrating research, design, and presentation to solve a real-world problem.',
                    },
                    'description':
                        'Drawing on her entire academic journey, Olivia tackled a comprehensive real-world problem for her final capstone project. Her research, design thinking, and engaging presentation showcased her readiness for professional challenges. ',
                    'id': 'urn:uuid:c03a96dd-79b0-408d-9a8b-472466f19719',
                    'image': 'https://cdn.filestackcontent.com/W6nqpwFySGO5EwFi4dAk',
                    'name': 'Capstone Project',
                    'type': ['Achievement'],
                    'tag': [
                        'lc:category:Accomplishment',
                        'lc:subtype:Project',
                        'lc:displayType:badge',
                        'lc:bgImage:https://cdn.filestackcontent.com/OQWyjlSauKQAD3Z2qwEw',
                    ],
                },
                'type': ['AchievementSubject'],
            },
            'name': 'Capstone Project',
            'validFrom': '2026-07-05T21:17:34.181Z',
        },
    }),
    createStudentCredentialFixture({
        'id': 'obv3/student-skyway-magazine',
        'name': 'Student Persona — Skyway Magazine',
        'description':
            'The Skyway Magazine, which highlights the Skyway, an initative which aims to establish a new organizational model and methodology for driving the global learning ecosystem.',
        'profile': 'badge',
        'features': ['alignment', 'image', 'evidence'],
        'credential': {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            'type': ['VerifiableCredential', 'OpenBadgeCredential'],
            'issuer': {
                'id': 'did:web:network.learncard.com:users:lefdemoschool',
            },
            'credentialSubject': {
                'id': 'did:example:student',
                'achievement': {
                    'achievementType': 'Assignment',
                    'alignment': [
                        {
                            'targetCode': '1.6',
                            'targetDescription':
                                'The ability to create, manage, and leverage social media platforms to reach and engage with a target audience, promote brand awareness, and drive business objectives',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Social Media',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-0y1926shy',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '1.4',
                            'targetDescription':
                                'The ability to verbally convey information, thoughts, or ideas to others.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Verbal Communication',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-284nuop3u',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '5.2',
                            'targetDescription':
                                "The ability to contribute to a team by clearly communicating one's work, leveraging one's unique strengths, and being adaptable in the face of change to continue working towards the common goal.",
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Coordinating',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-3p44mrdm2',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.7',
                            'targetDescription':
                                'The ability to meet or exceed specific goals and objectives, and focus on the outcomes rather than the process it takes to get there.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Results-Focused',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-7wpzq5som',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '7.2',
                            'targetDescription':
                                'The ability to approach problems or tasks in a non- traditional way, and generate new ideas and solutions that can lead to improved outcomes.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Creative Thinking',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-8n0kmlyf2',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '7.4',
                            'targetDescription':
                                'The ability to generate and develop new ideas with the aim of addressing business challenges.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Ideation',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-b7x0qgw95',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '7.6',
                            'targetDescription':
                                'The ability to contribute to group problemsolving with spontaneous contribution of ideas.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Brainstorming',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-bxqloqmio',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '1.3',
                            'targetDescription':
                                'The ability to convey information, thoughts, or ideas in written form to others.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Written Communication',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-ebfgl4nam',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.2',
                            'targetDescription':
                                'The ability to take initiative and anticipate potential issues or opportunities before they arise.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Proactivity',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-eennwwysa',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '5.6',
                            'targetDescription':
                                'The ability to effectively collaborate and build relationships with team members who are not in the same physical location.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Remote/Virtual Teams',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-y2e0zby0l',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.4',
                            'targetDescription':
                                'The ability to quickly find effective solutions to problems, even in situations where resources may be limited or unclear.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Resourcefulness',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-ye6tas5rw',
                            'type': ['Alignment'],
                        },
                    ],
                    'criteria': {
                        'narrative':
                            'Awarded for writing, editing, compiling and publishing the Skyway Magazine.',
                    },
                    'description':
                        'The Skyway Magazine, which highlights the Skyway, an initative which aims to establish a new organizational model and methodology for driving the global learning ecosystem.',
                    'id': 'urn:uuid:22fe1670-9ff2-4cd2-8cd9-eb1589033934',
                    'image': 'https://cdn.filestackcontent.com/8OIEKhtHTAutM1nzlKkT',
                    'name': 'Skyway Magazine',
                    'type': ['Achievement'],
                    'tag': [
                        'lc:category:Accomplishment',
                        'lc:subtype:Content',
                        'lc:displayType:media',
                    ],
                },
                'type': ['AchievementSubject'],
            },
            'name': 'Skyway Magazine',
            'validFrom': '2026-07-05T21:27:14.073Z',
            'evidence': [
                {
                    'id': 'https://cdn.filestackcontent.com/WZBwix1iQxekTlKJVLwL',
                    'name': 'Skyway Magazine.pdf',
                    'genre': 'document',
                    'type': ['Evidence'],
                    'description': 'Skyway Magazine.pdf · PDF · 19107.8 kB',
                },
            ],
        },
    }),
    createStudentCredentialFixture({
        'id': 'obv3/student-photo-contest-award',
        'name': 'Student Persona — Photo Contest Award',
        'description':
            'Awarded for winning 1st place in the Albuquerque Balloon Fiesta Photo Competition.',
        'profile': 'badge',
        'features': ['alignment', 'image', 'evidence'],
        'credential': {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            'type': ['VerifiableCredential', 'OpenBadgeCredential'],
            'issuer': {
                'id': 'did:web:network.learncard.com:users:oliviatcreative',
            },
            'credentialSubject': {
                'id': 'did:example:student',
                'achievement': {
                    'achievementType': 'Award',
                    'alignment': [
                        {
                            'targetCode': '7.2',
                            'targetDescription':
                                'The ability to approach problems or tasks in a non- traditional way, and generate new ideas and solutions that can lead to improved outcomes.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Creative Thinking',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-8n0kmlyf2',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '7.6',
                            'targetDescription':
                                'The ability to contribute to group problemsolving with spontaneous contribution of ideas.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Brainstorming',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-bxqloqmio',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '7.3',
                            'targetDescription':
                                'The ability to think beyond the present, and envision and plan for a future state.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Visionary',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-waljh6t43',
                            'type': ['Alignment'],
                        },
                    ],
                    'criteria': {
                        'narrative':
                            'Awarded to the best photo of the Albuquerque International Balloon Fiesta, as judged by a panel of photographers and community members. ',
                    },
                    'description':
                        'Awarded for winning 1st place in the Albuquerque Balloon Fiesta Photo Competition.',
                    'id': 'urn:uuid:50b0b303-88c1-4596-9f6b-2e6e692b87f5',
                    'image': 'https://cdn.filestackcontent.com/8OIEKhtHTAutM1nzlKkT',
                    'name': 'Photo Contest Award',
                    'type': ['Achievement'],
                    'tag': [
                        'lc:category:Accomplishment',
                        'lc:subtype:Award',
                        'lc:displayType:media',
                    ],
                },
                'type': ['AchievementSubject'],
            },
            'name': 'Photo Contest Award',
            'validFrom': '2026-07-05T21:21:38.347Z',
            'evidence': [
                {
                    'id': 'https://cdn.filestackcontent.com/VfjRsyyoR4FfnDJJ41EQ',
                    'name': 'photocontest.jpeg',
                    'genre': 'photo',
                    'type': ['Evidence'],
                    'description': 'photocontest.jpeg · JPEG · 1744.6 kB',
                },
            ],
        },
    }),
    createStudentCredentialFixture({
        'id': 'obv3/student-design-portfolio',
        'name': 'Student Persona — Design Portfolio',
        'description':
            'Design Portfolio for Olivia Trujillo, including multiple different styles and media. This portfolio is the culmination of years of design work and study.',
        'profile': 'badge',
        'features': ['alignment', 'image', 'evidence'],
        'credential': {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            'type': ['VerifiableCredential', 'OpenBadgeCredential'],
            'issuer': {
                'id': 'did:web:network.learncard.com:users:oliviatcreative',
            },
            'credentialSubject': {
                'id': 'did:example:student',
                'achievement': {
                    'achievementType': 'Achievement',
                    'alignment': [
                        {
                            'targetCode': '1.6',
                            'targetDescription':
                                'The ability to create, manage, and leverage social media platforms to reach and engage with a target audience, promote brand awareness, and drive business objectives',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Social Media',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-0y1926shy',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '6.2',
                            'targetDescription':
                                'The ability to stay driven, focused, and committed to achieving goals and delivering results without the need for constant direction and supervision.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Self-Motivation',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-11fyf81e8',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '3.1',
                            'targetDescription':
                                'The ability to pay close attention to the small details of a task and to be aware of all details impactful to a task.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Detail-Oriented',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-3j08m18y6',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.1',
                            'targetDescription':
                                'The ability to work independently and take initiative to complete tasks without external direction or motivation.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Self-Starter',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-86nd9j00d',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '7.2',
                            'targetDescription':
                                'The ability to approach problems or tasks in a non- traditional way, and generate new ideas and solutions that can lead to improved outcomes.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Creative Thinking',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-8n0kmlyf2',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '7.4',
                            'targetDescription':
                                'The ability to generate and develop new ideas with the aim of addressing business challenges.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Ideation',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-b7x0qgw95',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '7.6',
                            'targetDescription':
                                'The ability to contribute to group problemsolving with spontaneous contribution of ideas.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Brainstorming',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-bxqloqmio',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.8',
                            'targetDescription':
                                'The ability to work independently, take ownership of tasks, and complete them with minimal or no supervision or guidance.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Self-Sufficiency',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-dsmt6dwcc',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '1.3',
                            'targetDescription':
                                'The ability to convey information, thoughts, or ideas in written form to others.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Written Communication',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-ebfgl4nam',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.2',
                            'targetDescription':
                                'The ability to take initiative and anticipate potential issues or opportunities before they arise.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Proactivity',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-eennwwysa',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '7.1',
                            'targetDescription':
                                'The ability to generate new ideas and creatively apply them to drive business growth and/or solve problems in a unique and effective way.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Innovation',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-j29aya1uh',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.3',
                            'targetDescription':
                                'The ability to be eager and open to learning new things, seeking out new information, and asking questions to better understand and solve problems.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Curiosity',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-kegwjzu5x',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '3.2',
                            'targetDescription':
                                'The ability to envision the end goal and the process required to achieve the goal.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Planning',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-ld9haqlk2',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '7.3',
                            'targetDescription':
                                'The ability to think beyond the present, and envision and plan for a future state.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Visionary',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-waljh6t43',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '3.4',
                            'targetDescription':
                                'The ability to identify the appropriate resources needed to complete a task and implement those resources effectively to facilitate the thorough completion of a task.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Organizational Skills',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-wo2jj0vvu',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.4',
                            'targetDescription':
                                'The ability to quickly find effective solutions to problems, even in situations where resources may be limited or unclear.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Resourcefulness',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-ye6tas5rw',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '1.2',
                            'targetDescription':
                                'The ability to effectively convey ideas or information to an audience.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Presentation',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-yk22wcj2j',
                            'type': ['Alignment'],
                        },
                    ],
                    'criteria': {
                        'narrative': 'Compiling a portfolio of creative work.',
                    },
                    'description':
                        'Design Portfolio for Olivia Trujillo, including multiple different styles and media. This portfolio is the culmination of years of design work and study.',
                    'id': 'urn:uuid:9fc219a3-4bc7-4145-8605-8b78a0b3e44f',
                    'image': 'https://cdn.filestackcontent.com/8OIEKhtHTAutM1nzlKkT',
                    'name': 'Design Portfolio',
                    'type': ['Achievement'],
                    'tag': [
                        'lc:category:Accomplishment',
                        'lc:subtype:Content',
                        'lc:displayType:media',
                    ],
                },
                'type': ['AchievementSubject'],
            },
            'name': 'Design Portfolio',
            'validFrom': '2026-07-05T21:29:14.933Z',
            'evidence': [
                {
                    'id': 'https://cdn.filestackcontent.com/eikSh4iOS02UBi6JrwfS',
                    'name': 'oliviat design.pdf',
                    'genre': 'document',
                    'type': ['Evidence'],
                    'description': 'oliviat design.pdf · PDF · 19490.3 kB',
                },
            ],
        },
    }),
    createStudentCredentialFixture({
        'id': 'obv3/student-workplace-ergonomic-assessment',
        'name': 'Student Persona — Workplace Ergonomic Assessment',
        'description':
            'Through collaboration with career advisors, Olivia received personalized suggestions to adjust her workspace. These modifications enhanced her comfort and productivity at her place of employment.',
        'profile': 'badge',
        'features': ['alignment', 'image'],
        'credential': {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            'type': ['VerifiableCredential', 'OpenBadgeCredential'],
            'issuer': {
                'id': 'did:web:network.learncard.com:users:summit-accessibility-office',
            },
            'credentialSubject': {
                'id': 'did:example:student',
                'achievement': {
                    'achievementType': 'Assessment',
                    'alignment': [
                        {
                            'targetCode': '10.1',
                            'targetDescription':
                                'The ability to respond in the face of adversity in order to successfully recover from unexpected situations and resume or revise a plan to achieve the desired outcome of the original task.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Resilience',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-gshg45jlj',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '10.4',
                            'targetDescription':
                                'The ability to stay focused on the process and have unwavering determination when completing a task. The ability to exhibit passion and persistence in the face of adversity',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Tenacity',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-wq45d7y7r',
                            'type': ['Alignment'],
                        },
                    ],
                    'criteria': {
                        'narrative':
                            "Document outlining recommended adjustments for Olivia's work environment, promoting comfort and productivity.",
                    },
                    'description':
                        'Through collaboration with career advisors, Olivia received personalized suggestions to adjust her workspace. These modifications enhanced her comfort and productivity at her place of employment.',
                    'id': 'urn:uuid:8cac18be-95a2-4636-ab93-d26334f92c54',
                    'image': 'https://cdn.filestackcontent.com/g4KsPArTSnS8fdICVzAB',
                    'name': 'Workplace Ergonomic Assessment',
                    'type': ['Achievement'],
                    'tag': [
                        'lc:category:Accommodation',
                        'lc:subtype:Special Equipment',
                        'lc:displayType:badge',
                        'lc:bgImage:https://cdn.filestackcontent.com/YKWxR03OShyB5ACaI8tO',
                    ],
                },
                'type': ['AchievementSubject'],
            },
            'name': 'Workplace Ergonomic Assessment',
            'validFrom': '2026-07-05T21:37:24.307Z',
        },
    }),
    createStudentCredentialFixture({
        'id': 'obv3/student-iep-documentation',
        'name': 'Student Persona — IEP Documentation',
        'description':
            'A thorough assessment helped establish Olivia’s goals and the accommodations needed for her ADHD and physical accessibility. This official plan paved the way for a fully supportive learning environment.',
        'profile': 'badge',
        'features': ['image'],
        'credential': {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            'type': ['VerifiableCredential', 'OpenBadgeCredential'],
            'issuer': {
                'id': 'did:web:network.learncard.com:users:summit-accessibility-office',
            },
            'credentialSubject': {
                'id': 'did:example:student',
                'achievement': {
                    'achievementType': 'Achievement',
                    'criteria': {
                        'narrative':
                            'Official plan detailing individualized educational goals and accommodations for ADHD and physical accessibility needs.',
                    },
                    'description':
                        'A thorough assessment helped establish Olivia’s goals and the accommodations needed for her ADHD and physical accessibility. This official plan paved the way for a fully supportive learning environment.',
                    'id': 'urn:uuid:c96ac32b-f5d0-4feb-8412-ed5b6f48f5ba',
                    'image': 'https://cdn.filestackcontent.com/xqKimytdSrSmxZsqFhJ1',
                    'name': 'IEP Documentation',
                    'type': ['Achievement'],
                    'tag': [
                        'lc:category:Accommodation',
                        'lc:subtype:Medical Record',
                        'lc:displayType:badge',
                        'lc:bgImage:https://cdn.filestackcontent.com/C0yZx0iQsOsM8LQXRtvX',
                    ],
                },
                'type': ['AchievementSubject'],
            },
            'name': 'IEP Documentation',
            'validFrom': '2026-07-05T21:43:24.554Z',
        },
    }),
    createStudentCredentialFixture({
        'id': 'obv3/student-accessibility-services-registration',
        'name': 'Student Persona — Accessibility Services Registration',
        'description':
            'To ensure Olivia’s success, her school provided documentation confirming services such as tutoring and adaptive technology, reinforcing that her academic path would remain equitable.',
        'profile': 'badge',
        'features': ['alignment', 'image'],
        'credential': {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            'type': ['VerifiableCredential', 'OpenBadgeCredential'],
            'issuer': {
                'id': 'did:web:network.learncard.com:users:summit-accessibility-office',
            },
            'credentialSubject': {
                'id': 'did:example:student',
                'achievement': {
                    'achievementType': 'Membership',
                    'alignment': [
                        {
                            'targetCode': '3.6',
                            'targetDescription':
                                'The ability to be flexible to changing circumstances and understand the impact of changes to task timelines in order to adjust plans efficiently',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Adaptability',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-7nubyoxde',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '3.4',
                            'targetDescription':
                                'The ability to identify the appropriate resources needed to complete a task and implement those resources effectively to facilitate the thorough completion of a task.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Organizational Skills',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-wo2jj0vvu',
                            'type': ['Alignment'],
                        },
                    ],
                    'criteria': {
                        'narrative':
                            'Confirmation of services ensuring equitable access to educational or workplace settings.',
                    },
                    'description':
                        'To ensure Olivia’s success, her school provided documentation confirming services such as tutoring and adaptive technology, reinforcing that her academic path would remain equitable.',
                    'id': 'urn:uuid:45cdbdaf-5a8d-43b0-9a56-45f96e31a5cb',
                    'image': 'https://cdn.filestackcontent.com/BfNxlkjXRiGg3tPxS1Un',
                    'name': 'Accessibility Services Registration',
                    'type': ['Achievement'],
                    'tag': [
                        'lc:category:Accommodation',
                        'lc:subtype:Medical Record',
                        'lc:displayType:badge',
                        'lc:bgImage:https://cdn.filestackcontent.com/fosPgfpLRGqy4C1jGn8k',
                    ],
                },
                'type': ['AchievementSubject'],
            },
            'name': 'Accessibility Services Registration',
            'validFrom': '2026-07-05T21:40:12.334Z',
        },
    }),
    createStudentCredentialFixture({
        'id': 'obv3/student-extended-time-on-exams-approval',
        'name': 'Student Persona — Extended Time on Exams Approval',
        'description':
            'Recognizing that fair evaluation often requires flexible timing, Olivia was officially granted extra time on exams. This assurance leveled the playing field and supported her success.',
        'profile': 'badge',
        'features': ['image'],
        'credential': {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            'type': ['VerifiableCredential', 'OpenBadgeCredential'],
            'issuer': {
                'id': 'did:web:network.learncard.com:users:summit-accessibility-office',
            },
            'credentialSubject': {
                'id': 'did:example:student',
                'achievement': {
                    'achievementType': 'Achievement',
                    'criteria': {
                        'narrative':
                            'Official permission granting additional time for assessments, ensuring fair evaluation of academic abilities.',
                    },
                    'description':
                        'Recognizing that fair evaluation often requires flexible timing, Olivia was officially granted extra time on exams. This assurance leveled the playing field and supported her success.',
                    'id': 'urn:uuid:35c06dbf-a31e-4f1e-99b7-1b6951e26a26',
                    'image': 'https://cdn.filestackcontent.com/FEalmuXXTsulMohu2zZl',
                    'name': 'Extended Time on Exams Approval',
                    'type': ['Achievement'],
                    'tag': [
                        'lc:category:Accommodation',
                        'lc:subtype:Exam Adjustments',
                        'lc:displayType:badge',
                        'lc:bgImage:https://cdn.filestackcontent.com/7yHMI0OPQ9ymycibeUv2',
                    ],
                },
                'type': ['AchievementSubject'],
            },
            'name': 'Extended Time on Exams Approval',
            'validFrom': '2026-07-05T21:42:08.626Z',
        },
    }),
    createStudentCredentialFixture({
        'id': 'obv3/student-mental-health-accommodation-letter',
        'name': 'Student Persona — Mental Health Accommodation Letter',
        'description':
            'Understanding the importance of well-being, Olivia secured professional recommendations for stress management and academic accommodations. This documentation helped her thrive under pressure. ',
        'profile': 'badge',
        'features': ['alignment', 'image'],
        'credential': {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            'type': ['VerifiableCredential', 'OpenBadgeCredential'],
            'issuer': {
                'id': 'did:web:network.learncard.com:users:summit-accessibility-office',
            },
            'credentialSubject': {
                'id': 'did:example:student',
                'achievement': {
                    'achievementType': 'Achievement',
                    'alignment': [
                        {
                            'targetCode': '10.1',
                            'targetDescription':
                                'The ability to respond in the face of adversity in order to successfully recover from unexpected situations and resume or revise a plan to achieve the desired outcome of the original task.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Resilience',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-gshg45jlj',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '10.4',
                            'targetDescription':
                                'The ability to stay focused on the process and have unwavering determination when completing a task. The ability to exhibit passion and persistence in the face of adversity',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Tenacity',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-wq45d7y7r',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '10.8',
                            'targetDescription':
                                "The ability to trust one's abilities and present information with poise. The ability to have realistic confidence in one's judgment while knowing when to ask for assistance.",
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Self-Confident',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-zjgotktn9',
                            'type': ['Alignment'],
                        },
                    ],
                    'criteria': {
                        'narrative':
                            "Professional documentation specifying recommended adjustments to support Olivia's mental health in an academic/work setting.",
                    },
                    'description':
                        'Understanding the importance of well-being, Olivia secured professional recommendations for stress management and academic accommodations. This documentation helped her thrive under pressure. ',
                    'id': 'urn:uuid:dd8930a6-2eec-4d27-a91e-4878a68f5a3f',
                    'image': 'https://cdn.filestackcontent.com/hUOlsgatSva0qnkQGKo5',
                    'name': 'Mental Health Accommodation Letter',
                    'type': ['Achievement'],
                    'tag': [
                        'lc:category:Accommodation',
                        'lc:subtype:Exam Adjustments',
                        'lc:displayType:badge',
                        'lc:bgImage:https://cdn.filestackcontent.com/UVqK4fWcTaaXSDsqE7Qh',
                    ],
                },
                'type': ['AchievementSubject'],
            },
            'name': 'Mental Health Accommodation Letter',
            'validFrom': '2026-07-05T21:33:50.227Z',
        },
    }),
    createStudentCredentialFixture({
        'id': 'obv3/student-study-abroad-program',
        'name': 'Student Persona — Study Abroad Program',
        'description':
            'Olivia ventured abroad, embracing new languages and cultural perspectives. She expanded her worldview, built international friendships, and strengthened her communication skills in real-life settings.',
        'profile': 'certificate',
        'features': ['alignment', 'image'],
        'credential': {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            'type': ['VerifiableCredential', 'OpenBadgeCredential'],
            'issuer': {
                'id': 'did:web:network.learncard.com:users:kikuhana2',
            },
            'credentialSubject': {
                'id': 'did:example:student',
                'achievement': {
                    'achievementType': 'LearningProgram',
                    'alignment': [
                        {
                            'targetCode': '1.4',
                            'targetDescription':
                                'The ability to verbally convey information, thoughts, or ideas to others.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Verbal Communication',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-284nuop3u',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '1.8',
                            'targetDescription':
                                'The ability to effectively deliver a message to engage, inform, and persuade an audience.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Public Speaking',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-e5img3d05',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.2',
                            'targetDescription':
                                'The ability to take initiative and anticipate potential issues or opportunities before they arise.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Proactivity',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-eennwwysa',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '9.6',
                            'targetDescription':
                                "The ability to fully concentrate on, understand, and respond to verbal and/ or nonverbal communication in order to comprehend the speaker's message, and demonstrate engagement and interest in the conversation.",
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Emotional Intelligence',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-eesahmda4',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '10.1',
                            'targetDescription':
                                'The ability to respond in the face of adversity in order to successfully recover from unexpected situations and resume or revise a plan to achieve the desired outcome of the original task.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Resilience',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-gshg45jlj',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.3',
                            'targetDescription':
                                'The ability to be eager and open to learning new things, seeking out new information, and asking questions to better understand and solve problems.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Curiosity',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-kegwjzu5x',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '9.8',
                            'targetDescription':
                                'The ability to have the self-esteem to understand that even though you are doing well, you do not have to brag about it.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Cultural Sensitivity',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-mgcymug5q',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '9.5',
                            'targetDescription':
                                'The ability to maintain a calm and composed attitude in the face of challenging situations and to persevere through difficulties or delays while maintaining a positive and productive outlook.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Active Listening',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-rsuxnbcgp',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '10.7',
                            'targetDescription':
                                'The ability to stay composed and level-headed when faced with challenging or high-pressure situations.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Calmness Under Pressure',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-xniik052a',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.4',
                            'targetDescription':
                                'The ability to quickly find effective solutions to problems, even in situations where resources may be limited or unclear.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Resourcefulness',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-ye6tas5rw',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '10.8',
                            'targetDescription':
                                "The ability to trust one's abilities and present information with poise. The ability to have realistic confidence in one's judgment while knowing when to ask for assistance.",
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Self-Confident',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-zjgotktn9',
                            'type': ['Alignment'],
                        },
                    ],
                    'criteria': {
                        'narrative':
                            'International exchange experience focusing on global perspectives, language immersion, and networking opportunities.',
                    },
                    'description':
                        'Olivia ventured abroad, embracing new languages and cultural perspectives. She expanded her worldview, built international friendships, and strengthened her communication skills in real-life settings.',
                    'id': 'urn:uuid:92e80694-df76-4b8e-a058-bdb3f2a26dc5',
                    'image': 'https://cdn.filestackcontent.com/RcDcjnaTWcgRAH7WbUAc',
                    'name': 'Study Abroad Program',
                    'type': ['Achievement'],
                    'tag': [
                        'lc:category:Work History',
                        'lc:subtype:Study Abroad',
                        'lc:displayType:certificate',
                        'lc:bgImage:https://cdn.filestackcontent.com/ruy8siz5SuyS8TlK5shK',
                    ],
                },
                'type': ['AchievementSubject'],
            },
            'name': 'Study Abroad Program',
            'validFrom': '2026-07-05T22:00:42.627Z',
        },
    }),
    createStudentCredentialFixture({
        'id': 'obv3/student-camp-counselor',
        'name': 'Student Persona — Camp Counselor',
        'description':
            'Working as a mentor and organizer for diverse campers, Olivia designed inclusive activities and guided them through outdoor adventures. Her leadership and empathy created a safe, memorable camp environment. ',
        'profile': 'badge',
        'features': ['alignment', 'image'],
        'credential': {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            'type': ['VerifiableCredential', 'OpenBadgeCredential'],
            'issuer': {
                'id': 'did:web:network.learncard.com:users:camptallpines2',
            },
            'credentialSubject': {
                'id': 'did:example:student',
                'achievement': {
                    'achievementType': 'Fieldwork',
                    'alignment': [
                        {
                            'targetCode': '3.6',
                            'targetDescription':
                                'The ability to be flexible to changing circumstances and understand the impact of changes to task timelines in order to adjust plans efficiently',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Adaptability',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-7nubyoxde',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '3.3',
                            'targetDescription':
                                'The ability to effectively impart or convey knowledge, skills, and/or values to others.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Teaching',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-c5ujdubx3',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.8',
                            'targetDescription':
                                'The ability to work independently, take ownership of tasks, and complete them with minimal or no supervision or guidance.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Self-Sufficiency',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-dsmt6dwcc',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '9.6',
                            'targetDescription':
                                "The ability to fully concentrate on, understand, and respond to verbal and/ or nonverbal communication in order to comprehend the speaker's message, and demonstrate engagement and interest in the conversation.",
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Emotional Intelligence',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-eesahmda4',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '9.2',
                            'targetDescription':
                                'The ability to provide friendly, attentive, and welcoming service to customers or clients.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Compassion',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-eu4suos08',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '9.4',
                            'targetDescription':
                                'The ability to understand and share the feelings, perspectives, and experiences of others.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Patience',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-frahf8h7k',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.6',
                            'targetDescription':
                                'The ability to take initiative, set goals, and actively work towards achieving them.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Action-Oriented',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-fxm6dc0lp',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '3.2',
                            'targetDescription':
                                'The ability to envision the end goal and the process required to achieve the goal.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Planning',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-ld9haqlk2',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '9.5',
                            'targetDescription':
                                'The ability to maintain a calm and composed attitude in the face of challenging situations and to persevere through difficulties or delays while maintaining a positive and productive outlook.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Active Listening',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-rsuxnbcgp',
                            'type': ['Alignment'],
                        },
                    ],
                    'criteria': {
                        'narrative':
                            'Mentored and supervised youth, planned activities, and fostered a safe, inclusive environment for diverse campers.',
                    },
                    'description':
                        'Working as a mentor and organizer for diverse campers, Olivia designed inclusive activities and guided them through outdoor adventures. Her leadership and empathy created a safe, memorable camp environment. ',
                    'id': 'urn:uuid:1e0c36fa-c437-4a3c-9d28-5fe4c3a8ac6b',
                    'image': 'https://cdn.filestackcontent.com/Dv5Qr3AqTGeJVgxCptcU',
                    'name': 'Camp Counselor',
                    'type': ['Achievement'],
                    'tag': [
                        'lc:category:Work History',
                        'lc:subtype:Job',
                        'lc:displayType:badge',
                        'lc:bgImage:https://cdn.filestackcontent.com/fMK1dZqxQ06BCQTQpvqS',
                    ],
                },
                'type': ['AchievementSubject'],
            },
            'name': 'Camp Counselor',
            'validFrom': '2026-07-05T22:05:58.950Z',
        },
    }),
    createStudentCredentialFixture({
        'id': 'obv3/student-president-of-class',
        'name': 'Student Persona — President of Class',
        'description':
            'Elected by her peers, Olivia coordinated school events, championed student interests, and fostered an inclusive campus culture. This role honed her organization and team-building abilities. ',
        'profile': 'badge',
        'features': ['alignment', 'image'],
        'credential': {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            'type': ['VerifiableCredential', 'OpenBadgeCredential'],
            'issuer': {
                'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
            },
            'credentialSubject': {
                'id': 'did:example:student',
                'achievement': {
                    'achievementType': 'Membership',
                    'alignment': [
                        {
                            'targetCode': '5.4',
                            'targetDescription':
                                "The ability to effectively organize a team through actions that contribute to the team's cohesiveness by enhancing relationships, celebrating strengths, acknowledging weaknesses, and actively participating in team experiences and events.",
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Team-Building',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-0vm22kkgh',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '5.2',
                            'targetDescription':
                                "The ability to contribute to a team by clearly communicating one's work, leveraging one's unique strengths, and being adaptable in the face of change to continue working towards the common goal.",
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Coordinating',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-3p44mrdm2',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '5.1',
                            'targetDescription':
                                'The ability to understand priorities and apply them to the organization of time, people, and resources to achieve a common goal.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Interpersonal Relationships',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-487j1k9l1',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '2.5',
                            'targetDescription':
                                'The ability to use specific knowledge, skills, tools, and techniques to achieve specific project objectives and deliver value.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Project Management',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-4hojwv31x',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '2.4',
                            'targetDescription':
                                'The ability to analyze information, evaluate options, and make logical decisions that align with goals and objectives.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Decision Making',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-97ggmsg60',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '5.3',
                            'targetDescription':
                                'The ability to manage time and resource constraints in order to plan for the completion of tasks in a way that maximizes the efficiency of the plan and does not create a burden for those involved in the scheduled events.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Teamwork/Team-Oriented',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-bsc9c7cle',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '2.8',
                            'targetDescription':
                                "The ability to develop and communicate innovative and insightful ideas and perspectives that position an individual or organization as a trusted authority in one's industry or field.",
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Thought Leadership',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-hvha7jidz',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '2.6',
                            'targetDescription':
                                'The ability to defend, promote, and support a cause or issue.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Advocacy',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-lc27zm0qk',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '2.2',
                            'targetDescription':
                                'The ability to motivate and guide a group of people toward achieving a common goal or objective.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Leadership',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-purc6ulo5',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '2.1',
                            'targetDescription':
                                'The ability to plan, organize, and coordinate resources in order to achieve specific goals and objectives.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Management',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-w3j5l2g33',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '',
                            'targetDescription':
                                'The ability to manage time and resource\nconstraints in order to plan for the\ncompletion of tasks in a way that maximizes the efficiency of the plan and does not create a burden for those involved in the scheduled events.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Scheduling',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1775837398456-odop6377i',
                            'type': ['Alignment'],
                        },
                    ],
                    'criteria': {
                        'narrative':
                            'Elected student leader responsible for organizing events, representing student interests, and coordinating peer initiatives.',
                    },
                    'description':
                        'Elected by her peers, Olivia coordinated school events, championed student interests, and fostered an inclusive campus culture. This role honed her organization and team-building abilities. ',
                    'id': 'urn:uuid:33304e79-f117-4723-9aa1-7e8ba039b5d6',
                    'image': 'https://cdn.filestackcontent.com/f9vUJFsiRjCEtOLlXMYN',
                    'name': 'President of Class',
                    'type': ['Achievement'],
                    'tag': [
                        'lc:category:Work History',
                        'lc:subtype:Club',
                        'lc:displayType:certificate',
                        'lc:bgImage:https://cdn.filestackcontent.com/z0zF1alRkGXwJFXfP3cB',
                    ],
                },
                'type': ['AchievementSubject'],
            },
            'name': 'President of Class',
            'validFrom': '2026-07-05T21:57:31.559Z',
        },
    }),
    createStudentCredentialFixture({
        'id': 'obv3/student-resume',
        'name': 'Student Persona — Resume',
        'description': 'Resume documenting the experiences and education of Olivia Trujillo.',
        'profile': 'badge',
        'features': ['alignment', 'image', 'evidence'],
        'credential': {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            'type': ['VerifiableCredential', 'OpenBadgeCredential'],
            'issuer': {
                'id': 'did:web:network.learncard.com:users:oliviatcreative',
            },
            'credentialSubject': {
                'id': 'did:example:student',
                'achievement': {
                    'achievementType': 'Achievement',
                    'alignment': [
                        {
                            'targetCode': '5.4',
                            'targetDescription':
                                "The ability to effectively organize a team through actions that contribute to the team's cohesiveness by enhancing relationships, celebrating strengths, acknowledging weaknesses, and actively participating in team experiences and events.",
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Team-Building',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-0vm22kkgh',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.7',
                            'targetDescription':
                                'The ability to meet or exceed specific goals and objectives, and focus on the outcomes rather than the process it takes to get there.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Results-Focused',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-7wpzq5som',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.1',
                            'targetDescription':
                                'The ability to work independently and take initiative to complete tasks without external direction or motivation.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Self-Starter',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-86nd9j00d',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '7.2',
                            'targetDescription':
                                'The ability to approach problems or tasks in a non- traditional way, and generate new ideas and solutions that can lead to improved outcomes.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Creative Thinking',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-8n0kmlyf2',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '5.3',
                            'targetDescription':
                                'The ability to manage time and resource constraints in order to plan for the completion of tasks in a way that maximizes the efficiency of the plan and does not create a burden for those involved in the scheduled events.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Teamwork/Team-Oriented',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-bsc9c7cle',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '7.6',
                            'targetDescription':
                                'The ability to contribute to group problemsolving with spontaneous contribution of ideas.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Brainstorming',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-bxqloqmio',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '5.5',
                            'targetDescription':
                                "The ability to prioritize the common goal of a group over one's personal goals for the benefit of the larger group and be flexible to complete a task being asked of you.",
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Cooperation',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-d89eknulo',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.2',
                            'targetDescription':
                                'The ability to take initiative and anticipate potential issues or opportunities before they arise.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Proactivity',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-eennwwysa',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.6',
                            'targetDescription':
                                'The ability to take initiative, set goals, and actively work towards achieving them.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Action-Oriented',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-fxm6dc0lp',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '7.3',
                            'targetDescription':
                                'The ability to think beyond the present, and envision and plan for a future state.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Visionary',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-waljh6t43',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.4',
                            'targetDescription':
                                'The ability to quickly find effective solutions to problems, even in situations where resources may be limited or unclear.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Resourcefulness',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-ye6tas5rw',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.5',
                            'targetDescription':
                                'The ability to identify and pursue business opportunities by taking calculated risks, creating innovative solutions, and effectively managing resources.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Entrepreneurship',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-z98eectsq',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '',
                            'targetDescription':
                                'The ability to manage time and resource\nconstraints in order to plan for the\ncompletion of tasks in a way that maximizes the efficiency of the plan and does not create a burden for those involved in the scheduled events.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Scheduling',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1775837398456-odop6377i',
                            'type': ['Alignment'],
                        },
                    ],
                    'criteria': {
                        'narrative': 'Compiled a full list of education, work & life experiences.',
                    },
                    'description':
                        'Resume documenting the experiences and education of Olivia Trujillo.',
                    'id': 'urn:uuid:1f2d8aca-7de5-4b20-b02f-6822df34ee31',
                    'image': 'https://cdn.filestackcontent.com/A3cfrOaQ3StXLw7guVKO',
                    'name': 'Resume',
                    'type': ['Achievement'],
                    'tag': [
                        'lc:category:Work History',
                        'lc:subtype:Resume',
                        'lc:displayType:media',
                    ],
                },
                'type': ['AchievementSubject'],
            },
            'name': 'Resume',
            'validFrom': '2026-07-05T22:03:01.727Z',
            'evidence': [
                {
                    'id': 'https://cdn.filestackcontent.com/XhEorVovQcSwzukF3l80',
                    'name': 'Olivia T Resume-2.pdf',
                    'genre': 'document',
                    'type': ['Evidence'],
                    'description': 'Olivia T Resume-2.pdf · PDF · 379.8 kB',
                },
            ],
        },
    }),
    createStudentCredentialFixture({
        'id': 'obv3/student-internship',
        'name': 'Student Persona — Internship',
        'description':
            'Partnering with industry professionals, Olivia contributed to digital media projects that served real clients. From brainstorming sessions to final deliverables, she gained invaluable hands-on experience. ',
        'profile': 'badge',
        'features': ['alignment', 'image'],
        'credential': {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            'type': ['VerifiableCredential', 'OpenBadgeCredential'],
            'issuer': {
                'id': 'did:web:network.learncard.com:users:summit-marketing',
            },
            'credentialSubject': {
                'id': 'did:example:student',
                'achievement': {
                    'achievementType': 'Fieldwork',
                    'alignment': [
                        {
                            'targetCode': '6.2',
                            'targetDescription':
                                'The ability to stay driven, focused, and committed to achieving goals and delivering results without the need for constant direction and supervision.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Self-Motivation',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-11fyf81e8',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '6.6',
                            'targetDescription':
                                'The ability to consistently act in accordance with a set of values and principles, and be honest and transparent with others.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Personal Integrity',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-2dq4yrivs',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.1',
                            'targetDescription':
                                'The ability to work independently and take initiative to complete tasks without external direction or motivation.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Self-Starter',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-86nd9j00d',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.8',
                            'targetDescription':
                                'The ability to work independently, take ownership of tasks, and complete them with minimal or no supervision or guidance.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Self-Sufficiency',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-dsmt6dwcc',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.2',
                            'targetDescription':
                                'The ability to take initiative and anticipate potential issues or opportunities before they arise.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Proactivity',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-eennwwysa',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.6',
                            'targetDescription':
                                'The ability to take initiative, set goals, and actively work towards achieving them.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Action-Oriented',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-fxm6dc0lp',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '6.3',
                            'targetDescription':
                                'The ability to demonstrate honesty, reliability, and ethical behavior during interactions, and consistently follow through on commitments and promises made to others.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Trustworthy',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-rcjmkv2qj',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': '8.4',
                            'targetDescription':
                                'The ability to quickly find effective solutions to problems, even in situations where resources may be limited or unclear.',
                            'targetFramework': 'Pathsmith™ Durable Skills Starter Edition',
                            'targetName': 'Resourcefulness',
                            'targetUrl':
                                'https://network.learncard.com/frameworks/fw-1772824300325/skills/skill-1772824804950-ye6tas5rw',
                            'type': ['Alignment'],
                        },
                    ],
                    'criteria': {
                        'narrative':
                            'Gained hands-on industry experience in digital media, contributing to real-world projects and client deliverables.',
                    },
                    'description':
                        'Partnering with industry professionals, Olivia contributed to digital media projects that served real clients. From brainstorming sessions to final deliverables, she gained invaluable hands-on experience. ',
                    'id': 'urn:uuid:52a7e4e8-7ea1-4fe3-a9c3-adc5b9b20720',
                    'image': 'https://cdn.filestackcontent.com/P2TlkW1HQAmk78czlLY3',
                    'name': 'Internship',
                    'type': ['Achievement'],
                    'tag': [
                        'lc:category:Work History',
                        'lc:subtype:Internship',
                        'lc:displayType:badge',
                        'lc:bgImage:https://cdn.filestackcontent.com/AhuYSfIsTUmv4KN6cw6t',
                    ],
                },
                'type': ['AchievementSubject'],
            },
            'name': 'Internship',
            'validFrom': '2026-07-05T22:09:37.954Z',
        },
    }),
    createStudentCredentialFixture({
        'id': 'obv3/student-world-scouting-troop-id',
        'name': 'Student Persona — World Scouting Troop ID',
        'description':
            'A verified record of your membership and rank within the troop. It stores badges, achievements, and permissions.',
        'profile': 'id',
        'features': ['image'],
        'credential': {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            'type': ['VerifiableCredential', 'OpenBadgeCredential'],
            'issuer': {
                'id': 'did:web:network.learncard.com:users:world-scouting',
            },
            'credentialSubject': {
                'id': 'did:example:student',
                'achievement': {
                    'achievementType': 'Membership',
                    'criteria': {
                        'narrative': '',
                    },
                    'description':
                        'A verified record of your membership and rank within the troop. It stores badges, achievements, and permissions.',
                    'id': 'urn:uuid:7bae4ea0-216e-4459-96d0-7d67e3ccdacc',
                    'image': 'https://cdn.filestackcontent.com/HRKQyEDZSc2NS01uur0F',
                    'name': 'World Scouting Troop ID',
                    'type': ['Achievement'],
                    'tag': [
                        'lc:category:ID',
                        'lc:subtype:Troop ID',
                        'lc:displayType:id',
                        'lc:bgImage:https://cdn.filestackcontent.com/oF9SXNMKTyGwJ8UaDf4w',
                        'lc:idBackgroundImage:https://cdn.filestackcontent.com/SyKchHHLRucuS087I4rE',
                        'lc:idIssuerThumbnail:https://cdn.filestackcontent.com/KsarfGXWS2uR4xmqEeDD',
                        'lc:idDimBackgroundImage:true',
                    ],
                },
                'type': ['AchievementSubject'],
            },
            'name': 'World Scouting Troop ID',
            'validFrom': '2025-07-19T00:15:15.511Z',
        },
    }),
    createStudentCredentialFixture({
        'id': 'obv3/student-hill-valley-high-school-student-id',
        'name': 'Student Persona — Hill Valley High School Student ID',
        'description':
            'An official digital ID for students, a seamless record of badges, credentials, and verified achievements.\n',
        'profile': 'id',
        'features': ['image'],
        'credential': {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            'type': ['VerifiableCredential', 'OpenBadgeCredential'],
            'issuer': {
                'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
            },
            'credentialSubject': {
                'id': 'did:example:student',
                'achievement': {
                    'achievementType': 'Membership',
                    'criteria': {
                        'narrative': '',
                    },
                    'description':
                        'An official digital ID for students, a seamless record of badges, credentials, and verified achievements.\n',
                    'id': 'urn:uuid:dbc005fa-a737-45ed-b230-28fefbab44b2',
                    'image': 'https://cdn.filestackcontent.com/HRKQyEDZSc2NS01uur0F',
                    'name': 'Hill Valley High School Student ID',
                    'type': ['Achievement'],
                    'tag': [
                        'lc:category:ID',
                        'lc:subtype:School ID',
                        'lc:displayType:id',
                        'lc:bgImage:https://cdn.filestackcontent.com/fhk4ZeaESISPEQ6jXWob',
                        'lc:idBackgroundImage:https://cdn.filestackcontent.com/cKTNAyZ9RGF4oUGTRh2r',
                        'lc:idIssuerThumbnail:https://cdn.filestackcontent.com/Otu9MBWYSemRxEKJQxAB',
                        'lc:idDimBackgroundImage:true',
                    ],
                },
                'type': ['AchievementSubject'],
            },
            'name': 'Hill Valley High School Student ID',
            'validFrom': '2025-07-19T00:13:20.218Z',
        },
    }),
    createStudentCredentialFixture({
        'id': 'obv3/student-motlow-college-id',
        'name': 'Student Persona — Motlow College ID',
        'description':
            'A trusted record of enrollment and seamless campus access. It holds student status, credentials, and benefits.',
        'profile': 'id',
        'features': ['image'],
        'credential': {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            'type': ['VerifiableCredential', 'OpenBadgeCredential'],
            'issuer': {
                'id': 'did:web:network.learncard.com:users:motlowstate2',
            },
            'credentialSubject': {
                'id': 'did:example:student',
                'achievement': {
                    'achievementType': 'Membership',
                    'criteria': {
                        'narrative': '',
                    },
                    'description':
                        'A trusted record of enrollment and seamless campus access. It holds student status, credentials, and benefits.',
                    'id': 'urn:uuid:3979ff28-a03e-4b8f-b709-4327113d0224',
                    'image': 'https://cdn.filestackcontent.com/HRKQyEDZSc2NS01uur0F',
                    'name': 'Motlow College ID',
                    'type': ['Achievement'],
                    'tag': [
                        'lc:category:ID',
                        'lc:subtype:University ID',
                        'lc:displayType:id',
                        'lc:bgImage:https://cdn.filestackcontent.com/kNaIvOQS6W3i6FZ1kvEu',
                        'lc:idBackgroundImage:https://cdn.filestackcontent.com/CnqU0q7xQoOxkwQMliz4',
                        'lc:idIssuerThumbnail:https://cdn.filestackcontent.com/mSjAUhi3Rw2BH2pp4Nah',
                        'lc:idDimBackgroundImage:true',
                    ],
                },
                'type': ['AchievementSubject'],
            },
            'name': 'Motlow College ID',
            'validFrom': '2025-07-19T00:17:39.222Z',
        },
    }),
];
