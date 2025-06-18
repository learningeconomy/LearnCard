import type { UnsignedVC } from '@learncard/types';

export const testUnsignedBoost: UnsignedVC = {
    '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
        {
            type: '@type',
            xsd: 'https://www.w3.org/2001/XMLSchema#',
            lcn: 'https://docs.learncard.com/definitions#',
            BoostCredential: {
                '@id': 'lcn:boostCredential',
                '@context': {
                    boostId: { '@id': 'lcn:boostId', '@type': 'xsd:string' },
                    display: {
                        '@id': 'lcn:boostDisplay',
                        '@context': {
                            backgroundImage: {
                                '@id': 'lcn:boostBackgroundImage',
                                '@type': 'xsd:string',
                            },
                            backgroundColor: {
                                '@id': 'lcn:boostBackgroundColor',
                                '@type': 'xsd:string',
                            },
                        },
                    },
                    image: { '@id': 'lcn:boostImage', '@type': 'xsd:string' },
                    attachments: {
                        '@id': 'lcn:boostAttachments',
                        '@container': '@set',
                        '@context': {
                            type: { '@id': 'lcn:boostAttachmentType', '@type': 'xsd:string' },
                            title: { '@id': 'lcn:boostAttachmentTitle', '@type': 'xsd:string' },
                            url: { '@id': 'lcn:boostAttachmentUrl', '@type': 'xsd:string' },
                        },
                    },
                },
            },
        },
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
    issuer: 'did:web:localhost%3A3000:users:test',
    issuanceDate: '2020-08-19T21:41:50Z',
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
