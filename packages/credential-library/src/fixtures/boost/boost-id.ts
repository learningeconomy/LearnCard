import { UnsignedAchievementCredentialValidator } from '@learncard/types';

import type { CredentialFixture } from '../../types';

export const boostId: CredentialFixture = {
    id: 'boost/boost-id',
    name: 'LearnCard Boost ID',
    description:
        'LearnCard BoostID credential — an identity-style credential with custom display, used for membership cards and IDs',
    spec: 'obv3',
    profile: 'boost-id',
    features: ['display', 'image'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    validator: UnsignedAchievementCredentialValidator,
    tags: ['learncard', 'boost', 'id'],

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            'https://ctx.learncard.com/boosts/1.0.3.json',
            'https://ctx.learncard.com/boostIDs/1.0.0.json',
        ],
        id: 'urn:uuid:c9d0e1f2-0009-4000-8000-000000000001',
        type: ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential', 'BoostID'],
        name: 'Scouts Troop 42 Member ID',
        issuer: { id: 'did:example:troopLeader' },
        validFrom: '2024-09-01T00:00:00Z',
        validUntil: '2025-09-01T00:00:00Z',
        image: 'https://example.com/troop42/badge.png',
        credentialSubject: {
            id: 'did:example:scout123',
            type: ['AchievementSubject'],
            achievement: {
                id: 'urn:uuid:c9d0e1f2-0009-4000-8000-000000000002',
                type: ['Achievement'],
                achievementType: 'Membership',
                name: 'Troop 42 Membership',
                description: 'Active member of Scouts Troop 42.',
                image: '',
                criteria: {
                    narrative: 'Registered and active in the current program year.',
                },
            },
        },
        display: {
            backgroundColor: '#16A34A',
            backgroundImage: '',
        },
        boostID: {
            fontColor: '#FFFFFF',
            accentColor: '#15803D',
            idBackgroundColor: '#16A34A',
            repeatIdBackgroundImage: false,
        },
    },
};
