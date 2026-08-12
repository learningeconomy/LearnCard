import { UnsignedVC } from '@learncard/types';

export const testUnsignedBoost: UnsignedVC = {
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        'https://ctx.learncard.com/boosts/1.0.1.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
    issuer: 'did:web:localhost%3A3000:users:test',
    validFrom: '2020-08-19T21:41:50Z',
    name: 'Example Boost',
    credentialSubject: {
        id: 'did:example:d23dd687a7dc6787646f2eb98d0',
        type: ['AchievementSubject'],
        achievement: {
            id: 'urn:uuid:123',
            type: ['Achievement'],
            achievementType: 'Influencer',
            name: 'Awesome Badge',
            description: 'Awesome People Earn Awesome Badge',
            image: '',
            criteria: { narrative: 'Earned by being awesome.' },
        },
    },
};
