import { UnsignedVC, UnsignedAchievementCredential } from '@learncard/types';

import { VcTemplates } from './types';

/** @group VC Templates Plugin */
export const VC_TEMPLATES: { [Key in keyof VcTemplates]: (args: VcTemplates[Key]) => UnsignedVC } =
    {
        basic: ({
            did = 'did:example:d23dd687a7dc6787646f2eb98d0',
            subject = 'did:example:d23dd687a7dc6787646f2eb98d0',
            issuanceDate = '2020-08-19T21:41:50Z',
        } = {}) => ({
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            id: 'http://example.org/credentials/3731',
            type: ['VerifiableCredential'],
            issuer: did,
            issuanceDate,
            credentialSubject: { id: subject },
        }),
        achievement: ({
            did = 'did:example:d23dd687a7dc6787646f2eb98d0',
            subject = 'did:example:d23dd687a7dc6787646f2eb98d0',
            name = 'Teamwork Badge',
            achievementName = 'Teamwork',
            description = 'This badge recognizes the development of the capacity to collaborate within a group environment.',
            criteriaNarrative = 'Team members are nominated for this badge by their peers and recognized upon review by Example Corp management.',
            issuanceDate = '2020-08-19T21:41:50Z',
        } = {}): UnsignedAchievementCredential => ({
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.1.json',
            ],
            id: 'http://example.com/credentials/3527',
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
            issuer: did,
            issuanceDate,
            name,
            credentialSubject: {
                id: subject,
                type: ['AchievementSubject'],
                achievement: {
                    id: 'https://example.com/achievements/21st-century-skills/teamwork',
                    type: ['Achievement'],
                    criteria: { narrative: criteriaNarrative },
                    description,
                    name: achievementName,
                },
            },
        }),
        jff2: ({
            did = 'did:example:d23dd687a7dc6787646f2eb98d0',
            subject = 'did:example:d23dd687a7dc6787646f2eb98d0',
            issuanceDate = '2020-08-19T21:41:50Z',
        } = {}) => ({
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
                'https://w3id.org/security/suites/ed25519-2020/v1',
            ],
            id: 'urn:uuid:a63a60be-f4af-491c-87fc-2c8fd3007a58',
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
            name: 'JFF x vc-edu PlugFest 2 Interoperability',
            issuer: {
                type: ['Profile'],
                id: did,
                name: 'Jobs for the Future (JFF)',
                image: {
                    id: 'https://w3c-ccg.github.io/vc-ed/plugfest-1-2022/images/JFF_LogoLockup.png',
                    type: 'Image',
                },
            },
            issuanceDate: issuanceDate,
            credentialSubject: {
                type: ['AchievementSubject'],
                id: subject,
                achievement: {
                    id: 'urn:uuid:bd6d9316-f7ae-4073-a1e5-2f7f5bd22922',
                    type: ['Achievement'],
                    name: 'JFF x vc-edu PlugFest 2 Interoperability',
                    description:
                        'This credential solution supports the use of OBv3 and w3c Verifiable Credentials and is interoperable with at least two other solutions.  This was demonstrated successfully during JFF x vc-edu PlugFest 2.',
                    criteria: {
                        narrative:
                            'Solutions providers earned this badge by demonstrating interoperability between multiple providers based on the OBv3 candidate final standard, with some additional required fields. Credential issuers earning this badge successfully issued a credential into at least two wallets.  Wallet implementers earning this badge successfully displayed credentials issued by at least two different credential issuers.',
                    },
                    image: {
                        id: 'https://w3c-ccg.github.io/vc-ed/plugfest-2-2022/images/JFF-VC-EDU-PLUGFEST2-badge-image.png',
                        type: 'Image',
                    },
                },
            },
        }),
        boost: ({
            did = 'did:example:d23dd687a7dc6787646f2eb98d0',
            subject = 'did:example:d23dd687a7dc6787646f2eb98d0',
            issuanceDate = '2020-08-19T21:41:50Z',
            expirationDate,
            boostName = 'Example Boost',
            boostId = 'urn:uuid:boost:example:555',
            boostImage,
            achievementId = 'urn:uuid:123',
            achievementType = 'Influencer',
            achievementName = 'Awesome Badge',
            achievementDescription = 'Awesome People Earn Awesome Badge',
            achievementNarrative = 'Earned by being awesome.',
            achievementImage = '',
            attachments,
            display,
        } = {}) => ({
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
                {
                    // id: '@id',
                    type: '@type',
                    xsd: 'https://www.w3.org/2001/XMLSchema#',
                    lcn: 'https://docs.learncard.com/definitions#',
                    BoostCredential: {
                        '@id': 'lcn:boostCredential',
                        '@context': {
                            boostId: {
                                '@id': 'lcn:boostId',
                                '@type': 'xsd:string',
                            },
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
                            image: {
                                '@id': 'lcn:boostImage',
                                '@type': 'xsd:string',
                            },
                            attachments: {
                                '@id': 'lcn:boostAttachments',
                                '@container': '@set',
                                '@context': {
                                    type: {
                                        '@id': 'lcn:boostAttachmentType',
                                        '@type': 'xsd:string',
                                    },
                                    title: {
                                        '@id': 'lcn:boostAttachmentTitle',
                                        '@type': 'xsd:string',
                                    },
                                    url: {
                                        '@id': 'lcn:boostAttachmentUrl',
                                        '@type': 'xsd:string',
                                    },
                                },
                            },
                            address: {
                                '@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#Address',
                            },
                        },
                    },
                },
            ],
            type: ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
            issuer: did,
            issuanceDate,
            name: boostName,
            expirationDate,
            credentialSubject: {
                id: subject,
                type: ['AchievementSubject'],
                achievement: {
                    id: achievementId,
                    type: ['Achievement'],
                    achievementType: achievementType,
                    name: achievementName,
                    description: achievementDescription,
                    image: achievementImage,
                    criteria: {
                        narrative: achievementNarrative,
                    },
                },
            },
            display,
            image: boostImage,
            attachments,
        }),
        boostID: ({
            did = 'did:example:d23dd687a7dc6787646f2eb98d0',
            subject = 'did:example:d23dd687a7dc6787646f2eb98d0',
            issuanceDate = '2020-08-19T21:41:50Z',
            expirationDate,
            boostName = 'Example Boost',
            boostId = 'urn:uuid:boost:example:555',
            boostImage,
            achievementId = 'urn:uuid:123',
            achievementType = 'Influencer',
            achievementName = 'Awesome Badge',
            achievementDescription = 'Awesome People Earn Awesome Badge',
            achievementNarrative = 'Earned by being awesome.',
            achievementImage = '',
            address,
            attachments,
            display,
            boostID,
        } = {}) => ({
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
                {
                    // id: '@id',
                    type: '@type',
                    xsd: 'https://www.w3.org/2001/XMLSchema#',
                    lcn: 'https://docs.learncard.com/definitions#',
                    BoostCredential: {
                        '@id': 'lcn:boostCredential',
                        '@context': {
                            boostId: {
                                '@id': 'lcn:boostId',
                                '@type': 'xsd:string',
                            },
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
                            image: {
                                '@id': 'lcn:boostImage',
                                '@type': 'xsd:string',
                            },
                            attachments: {
                                '@id': 'lcn:boostAttachments',
                                '@container': '@set',
                                '@context': {
                                    type: {
                                        '@id': 'lcn:boostAttachmentType',
                                        '@type': 'xsd:string',
                                    },
                                    title: {
                                        '@id': 'lcn:boostAttachmentTitle',
                                        '@type': 'xsd:string',
                                    },
                                    url: {
                                        '@id': 'lcn:boostAttachmentUrl',
                                        '@type': 'xsd:string',
                                    },
                                },
                            },
                            address: {
                                '@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#Address',
                            },
                        },
                    },
                },
                {
                    type: '@type',
                    xsd: 'https://www.w3.org/2001/XMLSchema#',
                    lcn: 'https://docs.learncard.com/definitions#',
                    BoostID: {
                        '@id': 'lcn:boostID',
                        '@context': {
                            boostID: {
                                '@id': 'lcn:boostIDField',
                                '@context': {
                                    fontColor: {
                                        '@id': 'lcn:boostIDFontColor',
                                        '@type': 'xsd:string',
                                    },
                                    accentColor: {
                                        '@id': 'lcn:boostIDAccentColor',
                                        '@type': 'xsd:string',
                                    },
                                    backgroundImage: {
                                        '@id': 'lcn:boostIDBackgroundImage',
                                        '@type': 'xsd:string',
                                    },
                                    dimBackgroundImage: {
                                        '@id': 'lcn:boostIDDimBackgroundImage',
                                        '@type': 'xsd:boolean',
                                    },
                                    issuerThumbnail: {
                                        '@id': 'lcn:boostIDIssuerThumbnail',
                                        '@type': 'xsd:string',
                                    },
                                    showIssuerThumbnail: {
                                        '@id': 'lcn:boostIDShowIssuerThumbnail',
                                        '@type': 'xsd:boolean',
                                    },
                                },
                            },
                        },
                    },
                },
            ],
            type: ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential', 'BoostID'],
            issuer: did,
            issuanceDate,
            name: boostName,
            expirationDate,
            credentialSubject: {
                id: subject,
                type: ['AchievementSubject'],
                achievement: {
                    id: achievementId,
                    type: ['Achievement'],
                    achievementType: achievementType,
                    name: achievementName,
                    description: achievementDescription,
                    image: achievementImage,
                    criteria: {
                        narrative: achievementNarrative,
                    },
                },
            },
            address,
            display,
            image: boostImage,
            attachments,
            boostID,
        }),
    };
