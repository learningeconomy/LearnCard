import type { CredentialFixture } from '../../types';

export const boostDelegate: CredentialFixture = {
    id: 'boost/delegate',
    name: 'Organization Delegate Credential',
    description:
        'A LearnCard Boost delegate credential granting administrative permissions within an organization on the LearnCard network. Represents the delegation pattern used in network governance.',
    spec: 'obv3',
    profile: 'delegate',
    features: ['expiration'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    tags: ['boost', 'delegate', 'governance', 'admin', 'learncard'],

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        id: 'urn:uuid:e7b3d1f4-9a26-4c58-b0d3-8f1e2c7a9b56',
        type: ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
        name: 'Organization Delegate – TechEd Foundation',
        description:
            'Grants the holder delegate authority to issue credentials, manage members, and configure boost templates on behalf of the TechEd Foundation.',
        credentialSubject: {
            id: 'did:example:delegate-techedfound-007',
            type: ['AchievementSubject'],
            achievement: {
                id: 'https://network.learncard.com/organizations/teched-foundation/delegate',
                type: ['Achievement'],
                achievementType: 'Badge',
                name: 'Organization Delegate',
                description:
                    'Authorized delegate of the TechEd Foundation with permissions to issue credentials, manage organizational members, and configure credential templates.',
                criteria: {
                    id: 'https://network.learncard.com/organizations/teched-foundation/delegate/criteria',
                    narrative:
                        'Appointed by an organization administrator. Delegate status is reviewed annually and may be revoked at any time by an administrator.',
                },
                creator: {
                    id: 'did:web:network.learncard.com:organizations:teched-foundation',
                    type: ['Profile'],
                    name: 'TechEd Foundation',
                    url: 'https://teched-foundation-example.org',
                },
            },
        },
        issuer: {
            id: 'did:web:network.learncard.com:organizations:teched-foundation',
            type: ['Profile'],
            name: 'TechEd Foundation',
            url: 'https://teched-foundation-example.org',
            description:
                'A nonprofit organization dedicated to expanding access to technology education worldwide.',
        },
        validFrom: '2025-01-01T00:00:00Z',
        validUntil: '2026-01-01T00:00:00Z',
    },
};
