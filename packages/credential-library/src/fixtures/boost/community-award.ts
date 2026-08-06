import type { CredentialFixture } from '../../types';

export const boostCommunityAward: CredentialFixture = {
    id: 'boost/community-award',
    name: 'Community Leadership Award Boost',
    description:
        'A LearnCard Boost credential recognizing community leadership contributions, with skills and evidence. Represents real-world community recognition use cases on the LearnCard network.',
    spec: 'obv3',
    profile: 'boost',
    features: ['evidence', 'skills', 'image'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    tags: ['boost', 'community', 'leadership', 'recognition', 'learncard'],

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        id: 'urn:uuid:d8c4f2a1-3b67-4e89-a1d0-5f9e7c2b8a43',
        type: ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
        name: 'Community Leadership Award',
        description:
            'Awarded for outstanding community leadership, demonstrating commitment to mentoring, volunteer coordination, and community engagement over the past year.',
        image: {
            id: 'https://network.learncard.com/boosts/community-leadership/badge.png',
            type: 'Image',
            caption: 'Community Leadership Award badge',
        },
        credentialSubject: {
            id: 'did:example:community-leader-042',
            type: ['AchievementSubject'],
            achievement: {
                id: 'https://network.learncard.com/boosts/community-leadership',
                type: ['Achievement'],
                achievementType: 'Badge',
                name: 'Community Leadership Award',
                description:
                    'Recognizes individuals who have made exceptional contributions to their community through leadership, mentoring, and volunteer coordination. Recipients demonstrate initiative, empathy, and the ability to mobilize others toward shared goals.',
                criteria: {
                    id: 'https://network.learncard.com/boosts/community-leadership/criteria',
                    narrative:
                        'Nominated by at least 3 community members and approved by the Community Advisory Board. Must demonstrate: (1) Active mentoring of at least 5 community members, (2) Organization of at least 2 community events, (3) Consistent participation over at least 6 months.',
                },
                image: {
                    id: 'https://network.learncard.com/boosts/community-leadership/badge.png',
                    type: 'Image',
                    caption: 'Community Leadership Award badge',
                },
                creator: {
                    id: 'did:web:network.learncard.com:organizations:community-hub',
                    type: ['Profile'],
                    name: 'LearnCard Community Hub',
                    url: 'https://network.learncard.com/organizations/community-hub',
                    description: 'The LearnCard Community Hub connects learners, educators, and community leaders.',
                },
                tag: [
                    'leadership',
                    'mentoring',
                    'community-engagement',
                    'volunteer',
                    'collaboration',
                    'communication',
                    'project-management',
                ],
            },
        },
        issuer: {
            id: 'did:web:network.learncard.com:organizations:community-hub',
            type: ['Profile'],
            name: 'LearnCard Community Hub',
            url: 'https://network.learncard.com/organizations/community-hub',
            image: {
                id: 'https://network.learncard.com/organizations/community-hub/logo.png',
                type: 'Image',
                caption: 'LearnCard Community Hub logo',
            },
        },
        validFrom: '2025-03-01T00:00:00Z',
        evidence: [
            {
                id: 'https://network.learncard.com/evidence/community-leader-042/mentoring-log',
                type: ['Evidence'],
                narrative:
                    'Mentored 8 new community members over 9 months, providing weekly 1-on-1 sessions covering career development, technical skills, and networking strategies.',
            },
            {
                id: 'https://network.learncard.com/evidence/community-leader-042/events',
                type: ['Evidence'],
                narrative:
                    'Organized and led 4 community events: two technical workshops (Introduction to Web3, Building with Verifiable Credentials), one networking mixer, and one community hackathon with 45 participants.',
            },
        ],
    },
};
