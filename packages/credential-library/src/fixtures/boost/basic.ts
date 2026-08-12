import { UnsignedAchievementCredentialValidator } from '@learncard/types';

import type { CredentialFixture } from '../../types';

export const boostBasic: CredentialFixture = {
    id: 'boost/basic',
    name: 'Basic LearnCard Boost',
    description:
        'LearnCard BoostCredential — an OBv3-compatible badge with the BoostCredential extension context',
    spec: 'obv3',
    profile: 'boost',
    features: ['display'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    validator: UnsignedAchievementCredentialValidator,
    tags: ['learncard', 'boost'],

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            'https://ctx.learncard.com/boosts/1.0.3.json',
        ],
        id: 'urn:uuid:b8c9d0e1-0008-4000-8000-000000000001',
        type: ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
        name: 'Community Contributor',
        issuer: { id: 'did:example:orgABC' },
        validFrom: '2024-07-01T00:00:00Z',
        credentialSubject: {
            id: 'did:example:member42',
            type: ['AchievementSubject'],
            achievement: {
                id: 'urn:uuid:b8c9d0e1-0008-4000-8000-000000000002',
                type: ['Achievement'],
                achievementType: 'Badge',
                name: 'Community Contributor',
                description: 'Recognized for making meaningful contributions to the community.',
                image: 'https://example.com/badges/contributor.png',
                criteria: {
                    narrative: 'Contribute to at least 3 community projects.',
                },
            },
        },
        display: {
            backgroundColor: '#2563EB',
            backgroundImage: '',
        },
    },
};
