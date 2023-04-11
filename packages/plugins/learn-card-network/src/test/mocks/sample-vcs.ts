import { VC, CredentialRecord } from '@learncard/types';

export const SAMPLE_VCS: Record<string, VC> = {
    VALID_BOOST: {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            {
                'lcn': 'https://docs.learncard.com/definitions#',
                'id': '@id',
                'type': '@type',
                'cred': 'https://www.w3.org/2018/credentials#',
                'CertifiedBoostCredential': {
                    '@context': {
                        '@version': 1.1,
                        'boostCredential': {
                            '@container': '@graph',
                            '@id': 'cred:VerifiableCredential',
                            '@type': '@id',
                        },
                        'boostId': { '@id': 'lcn:boostId', '@type': 'xsd:string' },
                    },
                    '@id': 'lcn:certifiedBoostCredential',
                },
            },
        ],
        'id': 'urn:uuid:8f6579d1-e217-4ad7-bb65-1d2dad2fc9b4',
        'type': ['VerifiableCredential', 'CertifiedBoostCredential'],
        'issuer': 'did:web:localhost%3A3000',
        'issuanceDate': '2023-03-03T17:35:21.531Z',
        'credentialSubject': { 'id': 'did:web:localhost%3A3000' },
        'proof': {
            'type': 'Ed25519Signature2020',
            'created': '2023-03-03T17:35:21.654Z',
            'proofPurpose': 'assertionMethod',
            'verificationMethod': 'did:web:localhost%3A3000#owner',
            '@context': ['https://w3id.org/security/suites/ed25519-2020/v1'],
            'proofValue':
                'z53MJtv7bdGWVkcNkUZyy8xzDQWQkSUx8nY9B7ETdAgLejJGARYQdParKCsV6tNig3k13qP4nFJDfTLWMp94hsN2q',
        },
        'boostCredential': {
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
                {
                    'BoostCredential': {
                        '@context': {
                            'attachments': {
                                '@container': '@set',
                                '@context': {
                                    'title': {
                                        '@id': 'lcn:boostAttachmentTitle',
                                        '@type': 'xsd:string',
                                    },
                                    'type': {
                                        '@id': 'lcn:boostAttachmentType',
                                        '@type': 'xsd:string',
                                    },
                                    'url': {
                                        '@id': 'lcn:boostAttachmentUrl',
                                        '@type': 'xsd:string',
                                    },
                                },
                                '@id': 'lcn:boostAttachments',
                            },
                            'boostId': { '@id': 'lcn:boostId', '@type': 'xsd:string' },
                            'display': {
                                '@context': {
                                    'backgroundColor': {
                                        '@id': 'lcn:boostBackgroundColor',
                                        '@type': 'xsd:string',
                                    },
                                    'backgroundImage': {
                                        '@id': 'lcn:boostBackgroundImage',
                                        '@type': 'xsd:string',
                                    },
                                },
                                '@id': 'lcn:boostDisplay',
                            },
                            'image': { '@id': 'lcn:boostImage', '@type': 'xsd:string' },
                        },
                        '@id': 'lcn:boostCredential',
                    },
                    'lcn': 'https://docs.learncard.com/definitions#',
                    'type': '@type',
                    'xsd': 'https://www.w3.org/2001/XMLSchema#',
                },
            ],
            'boostId':
                'lc:network:localhost%3A3000/trpc:boost:8adff1c1-696d-49b3-bffc-8eea89f72e26',
            'credentialSubject': {
                'achievement': {
                    'achievementType': 'Influencer',
                    'criteria': { 'narrative': 'Earned by being Goody.' },
                    'description': 'Goody People Earn Goody Badge',
                    'id': 'urn:uuid:123',
                    'image': '',
                    'name': 'Goodynwaa',
                    'type': ['Achievement'],
                },
                'id': 'did:web:localhost%3A3000:users:bbb',
                'type': ['AchievementSubject'],
            },
            'issuanceDate': '2020-08-19T21:41:50Z',
            'issuer': 'did:web:localhost%3A3000:users:test',
            'name': 'Goody Boost',
            'proof': {
                '@context': ['https://w3id.org/security/suites/ed25519-2020/v1'],
                'created': '2023-03-03T17:35:19.948Z',
                'proofPurpose': 'assertionMethod',
                'proofValue':
                    'z53NHZJJWogLSDRT8Pqmkd2zkTz7bMhA1FbULc6GWshTDiJgQyu9tQ3VtHMdB7vyHnyaUtczKZWFo57fS5tWfuo6L',
                'type': 'Ed25519Signature2020',
                'verificationMethod': 'did:web:localhost%3A3000:users:test#owner',
            },
            'type': ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
        },
        'boostId': 'lc:network:localhost%3A3000/trpc:boost:8adff1c1-696d-49b3-bffc-8eea89f72e26',
    },
    VALID_BOOST_OUTSIDE_REGISTRY: {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            {
                'lcn': 'https://docs.learncard.com/definitions#',
                'id': '@id',
                'type': '@type',
                'cred': 'https://www.w3.org/2018/credentials#',
                'CertifiedBoostCredential': {
                    '@context': {
                        '@version': 1.1,
                        'boostCredential': {
                            '@container': '@graph',
                            '@id': 'cred:VerifiableCredential',
                            '@type': '@id',
                        },
                        'boostId': { '@id': 'lcn:boostId', '@type': 'xsd:string' },
                    },
                    '@id': 'lcn:certifiedBoostCredential',
                },
            },
        ],
        'id': 'urn:uuid:8f6579d1-e217-4ad7-bb65-1d2dad2fc9b4',
        'type': ['VerifiableCredential', 'CertifiedBoostCredential'],
        'issuer': 'did:web:localhost%3A3000',
        'issuanceDate': '2023-03-03T17:35:21.531Z',
        'credentialSubject': { 'id': 'did:web:localhost%3A3000' },
        'proof': {
            'type': 'Ed25519Signature2020',
            'created': '2023-03-03T17:35:21.654Z',
            'proofPurpose': 'assertionMethod',
            'verificationMethod': 'did:web:localhost%3A3000#owner',
            '@context': ['https://w3id.org/security/suites/ed25519-2020/v1'],
            'proofValue':
                'z53MJtv7bdGWVkcNkUZyy8xzDQWQkSUx8nY9B7ETdAgLejJGARYQdParKCsV6tNig3k13qP4nFJDfTLWMp94hsN2q',
        },
        'boostCredential': {
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
                {
                    'BoostCredential': {
                        '@context': {
                            'attachments': {
                                '@container': '@set',
                                '@context': {
                                    'title': {
                                        '@id': 'lcn:boostAttachmentTitle',
                                        '@type': 'xsd:string',
                                    },
                                    'type': {
                                        '@id': 'lcn:boostAttachmentType',
                                        '@type': 'xsd:string',
                                    },
                                    'url': {
                                        '@id': 'lcn:boostAttachmentUrl',
                                        '@type': 'xsd:string',
                                    },
                                },
                                '@id': 'lcn:boostAttachments',
                            },
                            'boostId': { '@id': 'lcn:boostId', '@type': 'xsd:string' },
                            'display': {
                                '@context': {
                                    'backgroundColor': {
                                        '@id': 'lcn:boostBackgroundColor',
                                        '@type': 'xsd:string',
                                    },
                                    'backgroundImage': {
                                        '@id': 'lcn:boostBackgroundImage',
                                        '@type': 'xsd:string',
                                    },
                                },
                                '@id': 'lcn:boostDisplay',
                            },
                            'image': { '@id': 'lcn:boostImage', '@type': 'xsd:string' },
                        },
                        '@id': 'lcn:boostCredential',
                    },
                    'lcn': 'https://docs.learncard.com/definitions#',
                    'type': '@type',
                    'xsd': 'https://www.w3.org/2001/XMLSchema#',
                },
            ],
            'boostId':
                'lc:network:localhost%3A3000/trpc:boost:8adff1c1-696d-49b3-bffc-8eea89f72e26',
            'credentialSubject': {
                'achievement': {
                    'achievementType': 'Influencer',
                    'criteria': { 'narrative': 'Earned by being Goody.' },
                    'description': 'Goody People Earn Goody Badge',
                    'id': 'urn:uuid:123',
                    'image': '',
                    'name': 'Goodynwaa',
                    'type': ['Achievement'],
                },
                'id': 'did:web:localhost%3A3000:users:bbb',
                'type': ['AchievementSubject'],
            },
            'issuanceDate': '2020-08-19T21:41:50Z',
            'issuer': 'did:web:localhost%3A3000:users:test',
            'name': 'Goody Boost',
            'proof': {
                '@context': ['https://w3id.org/security/suites/ed25519-2020/v1'],
                'created': '2023-03-03T17:35:19.948Z',
                'proofPurpose': 'assertionMethod',
                'proofValue':
                    'z53NHZJJWogLSDRT8Pqmkd2zkTz7bMhA1FbULc6GWshTDiJgQyu9tQ3VtHMdB7vyHnyaUtczKZWFo57fS5tWfuo6L',
                'type': 'Ed25519Signature2020',
                'verificationMethod': 'did:web:localhost%3A3000:users:test#owner',
            },
            'type': ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
        },
        'boostId': 'lc:network:localhost%3A3000/trpc:boost:8adff1c1-696d-49b3-bffc-8eea89f72e26',
    },
    TAMPERED_BOOST_CERTIFICATE: {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            {
                'lcn': 'https://docs.learncard.com/definitions#',
                'id': '@id',
                'type': '@type',
                'cred': 'https://www.w3.org/2018/credentials#',
                'CertifiedBoostCredential': {
                    '@context': {
                        '@version': 1.1,
                        'boostCredential': {
                            '@container': '@graph',
                            '@id': 'cred:VerifiableCredential',
                            '@type': '@id',
                        },
                        'boostId': { '@id': 'lcn:boostId', '@type': 'xsd:string' },
                    },
                    '@id': 'lcn:certifiedBoostCredential',
                },
            },
        ],
        'id': 'urn:uuid:8f6579d1-e217-4ad7-bb65-1d2dad2fc9b4',
        'type': ['VerifiableCredential', 'CertifiedBoostCredential'],
        'issuer': 'did:web:localhost%3A3000',
        'issuanceDate': '2023-03-03T17:35:21.531Z',
        'credentialSubject': { 'id': 'did:web:localhost%3A3000' },
        'proof': {
            'type': 'Ed25519Signature2020',
            'created': '2023-03-03T17:35:21.654Z',
            'proofPurpose': 'assertionMethod',
            'verificationMethod': 'did:web:localhost%3A3000#owner',
            '@context': ['https://w3id.org/security/suites/ed25519-2020/v1'],
            'proofValue':
                'z53MJtv7bdGWVkcNkUZyy8xzDQWQkSUx8nY9B7ETdAgLejJGARYQdParKCsV6tNig3k13qP4nFJDfTLWMp94hsN2q',
        },
        'boostCredential': {
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
                {
                    'BoostCredential': {
                        '@context': {
                            'attachments': {
                                '@container': '@set',
                                '@context': {
                                    'title': {
                                        '@id': 'lcn:boostAttachmentTitle',
                                        '@type': 'xsd:string',
                                    },
                                    'type': {
                                        '@id': 'lcn:boostAttachmentType',
                                        '@type': 'xsd:string',
                                    },
                                    'url': {
                                        '@id': 'lcn:boostAttachmentUrl',
                                        '@type': 'xsd:string',
                                    },
                                },
                                '@id': 'lcn:boostAttachments',
                            },
                            'boostId': { '@id': 'lcn:boostId', '@type': 'xsd:string' },
                            'display': {
                                '@context': {
                                    'backgroundColor': {
                                        '@id': 'lcn:boostBackgroundColor',
                                        '@type': 'xsd:string',
                                    },
                                    'backgroundImage': {
                                        '@id': 'lcn:boostBackgroundImage',
                                        '@type': 'xsd:string',
                                    },
                                },
                                '@id': 'lcn:boostDisplay',
                            },
                            'image': { '@id': 'lcn:boostImage', '@type': 'xsd:string' },
                        },
                        '@id': 'lcn:boostCredential',
                    },
                    'lcn': 'https://docs.learncard.com/definitions#',
                    'type': '@type',
                    'xsd': 'https://www.w3.org/2001/XMLSchema#',
                },
            ],
            'boostId': 'lc:network:localhost%3A3000/trpc:boost:8adff1c1-696d-49b3-bffc-TAMPER',
            'credentialSubject': {
                'achievement': {
                    'achievementType': 'Influencer',
                    'criteria': { 'narrative': 'Earned by being Goody.' },
                    'description': 'Goody People Earn Goody Badge',
                    'id': 'urn:uuid:123',
                    'image': '',
                    'name': 'Goodynwaa',
                    'type': ['Achievement'],
                },
                'id': 'did:web:localhost%3A3000:users:bbb',
                'type': ['AchievementSubject'],
            },
            'issuanceDate': '2020-08-19T21:41:50Z',
            'issuer': 'did:web:localhost%3A3000:users:test',
            'name': 'Goody Boost',
            'proof': {
                '@context': ['https://w3id.org/security/suites/ed25519-2020/v1'],
                'created': '2023-03-03T17:35:19.948Z',
                'proofPurpose': 'assertionMethod',
                'proofValue':
                    'z53NHZJJWogLSDRT8Pqmkd2zkTz7bMhA1FbULc6GWshTDiJgQyu9tQ3VtHMdB7vyHnyaUtczKZWFo57fS5tWfuo6L',
                'type': 'Ed25519Signature2020',
                'verificationMethod': 'did:web:localhost%3A3000:users:test#owner',
            },
            'type': ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
        },
        'boostId': 'lc:network:localhost%3A3000/trpc:boost:8adff1c1-696d-49b3-bffc-8eea89f72e26',
    },
    TAMPERED_BOOST_CREDENTIAL: {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            {
                'lcn': 'https://docs.learncard.com/definitions#',
                'id': '@id',
                'type': '@type',
                'cred': 'https://www.w3.org/2018/credentials#',
                'CertifiedBoostCredential': {
                    '@context': {
                        '@version': 1.1,
                        'boostCredential': {
                            '@container': '@graph',
                            '@id': 'cred:VerifiableCredential',
                            '@type': '@id',
                        },
                        'boostId': { '@id': 'lcn:boostId', '@type': 'xsd:string' },
                    },
                    '@id': 'lcn:certifiedBoostCredential',
                },
            },
        ],
        'id': 'urn:uuid:8f6579d1-e217-4ad7-bb65-1d2dad2fc9b4',
        'type': ['VerifiableCredential', 'CertifiedBoostCredential'],
        'issuer': 'did:web:localhost%3A3000',
        'issuanceDate': '2023-03-03T17:35:21.531Z',
        'credentialSubject': { 'id': 'did:web:localhost%3A3000' },
        'proof': {
            'type': 'Ed25519Signature2020',
            'created': '2023-03-03T17:35:21.654Z',
            'proofPurpose': 'assertionMethod',
            'verificationMethod': 'did:web:localhost%3A3000#owner',
            '@context': ['https://w3id.org/security/suites/ed25519-2020/v1'],
            'proofValue':
                'z53MJtv7bdGWVkcNkUZyy8xzDQWQkSUx8nY9B7ETdAgLejJGARYQdParKCsV6tNig3k13qP4nFJDfTLWMp94hsN2q',
        },
        'boostCredential': {
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
                {
                    'BoostCredential': {
                        '@context': {
                            'attachments': {
                                '@container': '@set',
                                '@context': {
                                    'title': {
                                        '@id': 'lcn:boostAttachmentTitle',
                                        '@type': 'xsd:string',
                                    },
                                    'type': {
                                        '@id': 'lcn:boostAttachmentType',
                                        '@type': 'xsd:string',
                                    },
                                    'url': {
                                        '@id': 'lcn:boostAttachmentUrl',
                                        '@type': 'xsd:string',
                                    },
                                },
                                '@id': 'lcn:boostAttachments',
                            },
                            'boostId': { '@id': 'lcn:boostId', '@type': 'xsd:string' },
                            'display': {
                                '@context': {
                                    'backgroundColor': {
                                        '@id': 'lcn:boostBackgroundColor',
                                        '@type': 'xsd:string',
                                    },
                                    'backgroundImage': {
                                        '@id': 'lcn:boostBackgroundImage',
                                        '@type': 'xsd:string',
                                    },
                                },
                                '@id': 'lcn:boostDisplay',
                            },
                            'image': { '@id': 'lcn:boostImage', '@type': 'xsd:string' },
                        },
                        '@id': 'lcn:boostCredential',
                    },
                    'lcn': 'https://docs.learncard.com/definitions#',
                    'type': '@type',
                    'xsd': 'https://www.w3.org/2001/XMLSchema#',
                },
            ],
            'boostId':
                'lc:network:localhost%3A3000/trpc:boost:8adff1c1-696d-49b3-bffc-8eea89f72e26',
            'credentialSubject': {
                'achievement': {
                    'achievementType': 'Influencer',
                    'criteria': { 'narrative': 'Earned by being Goody.' },
                    'description': 'Goody People Earn Goody Badge',
                    'id': 'urn:uuid:123',
                    'image': '',
                    'name': 'Goodynwaa',
                    'type': ['Achievement'],
                },
                'id': 'did:web:localhost%3A3000:users:bbb',
                'type': ['AchievementSubject'],
            },
            'issuanceDate': '2020-08-19T21:41:50Z',
            'issuer': 'did:web:localhost%3A3000:users:test',
            'name': 'Goody Boost',
            'proof': {
                '@context': ['https://w3id.org/security/suites/ed25519-2020/v1'],
                'created': '2023-03-03T17:35:19.948Z',
                'proofPurpose': 'assertionMethod',
                'proofValue':
                    'z53NHZJJWogLSDRT8Pqmkd2zkTz7bMhA1FbULc6GWshTDiJgQyu9tQ3VtHMdB7vyHnyaUtczKZWFo57fS5tWfuo6L',
                'type': 'Ed25519Signature2020',
                'verificationMethod': 'did:web:localhost%3A3000:users:test#owner',
            },
            'type': ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
        },
        'boostId': 'lc:network:localhost%3A3000/trpc:boost:8adff1c1-696d-49b3-bffc-TAMPER',
    },
    MISMATCHED_BOOST_ID_CREDENTIAL: {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            {
                'lcn': 'https://docs.learncard.com/definitions#',
                'id': '@id',
                'type': '@type',
                'cred': 'https://www.w3.org/2018/credentials#',
                'CertifiedBoostCredential': {
                    '@context': {
                        '@version': 1.1,
                        'boostCredential': {
                            '@container': '@graph',
                            '@id': 'cred:VerifiableCredential',
                            '@type': '@id',
                        },
                        'boostId': { '@id': 'lcn:boostId', '@type': 'xsd:string' },
                    },
                    '@id': 'lcn:certifiedBoostCredential',
                },
            },
        ],
        'id': 'urn:uuid:86d8c5c0-ce4b-4e42-a4e6-3624d65b1631',
        'type': ['VerifiableCredential', 'CertifiedBoostCredential'],
        'issuer': 'did:web:localhost%3A3000',
        'issuanceDate': '2023-03-03T20:44:50.799Z',
        'credentialSubject': { 'id': 'did:web:localhost%3A3000' },
        'proof': {
            'type': 'Ed25519Signature2020',
            'created': '2023-03-03T20:44:50.917Z',
            'proofPurpose': 'assertionMethod',
            'verificationMethod': 'did:web:localhost%3A3000#owner',
            '@context': ['https://w3id.org/security/suites/ed25519-2020/v1'],
            'proofValue':
                'z4eYynEgQwZJDMTmtKrDVLStQyQ6FaqeNKpDmUH8APZVRExqUPLqgYjeabyqNnXbi9MUeNW77hLGU12gHuoXKurRq',
        },
        'boostCredential': {
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
                {
                    'BoostCredential': {
                        '@context': {
                            'attachments': {
                                '@container': '@set',
                                '@context': {
                                    'title': {
                                        '@id': 'lcn:boostAttachmentTitle',
                                        '@type': 'xsd:string',
                                    },
                                    'type': {
                                        '@id': 'lcn:boostAttachmentType',
                                        '@type': 'xsd:string',
                                    },
                                    'url': {
                                        '@id': 'lcn:boostAttachmentUrl',
                                        '@type': 'xsd:string',
                                    },
                                },
                                '@id': 'lcn:boostAttachments',
                            },
                            'boostId': { '@id': 'lcn:boostId', '@type': 'xsd:string' },
                            'display': {
                                '@context': {
                                    'backgroundColor': {
                                        '@id': 'lcn:boostBackgroundColor',
                                        '@type': 'xsd:string',
                                    },
                                    'backgroundImage': {
                                        '@id': 'lcn:boostBackgroundImage',
                                        '@type': 'xsd:string',
                                    },
                                },
                                '@id': 'lcn:boostDisplay',
                            },
                            'image': { '@id': 'lcn:boostImage', '@type': 'xsd:string' },
                        },
                        '@id': 'lcn:boostCredential',
                    },
                    'lcn': 'https://docs.learncard.com/definitions#',
                    'type': '@type',
                    'xsd': 'https://www.w3.org/2001/XMLSchema#',
                },
            ],
            'boostId':
                'lc:network:localhost%3A3000/trpc:boost:8adff1c1-696d-49b3-bffc-8eea89f72e26',
            'credentialSubject': {
                'achievement': {
                    'achievementType': 'Influencer',
                    'criteria': { 'narrative': 'Earned by being Goody.' },
                    'description': 'Goody People Earn Goody Badge',
                    'id': 'urn:uuid:123',
                    'image': '',
                    'name': 'Goodynwaa',
                    'type': ['Achievement'],
                },
                'id': 'did:web:localhost%3A3000:users:bbb',
                'type': ['AchievementSubject'],
            },
            'issuanceDate': '2020-08-19T21:41:50Z',
            'issuer': 'did:web:localhost%3A3000:users:test',
            'name': 'Goody Boost',
            'proof': {
                '@context': ['https://w3id.org/security/suites/ed25519-2020/v1'],
                'created': '2023-03-03T20:44:49.001Z',
                'proofPurpose': 'assertionMethod',
                'proofValue':
                    'z2Uz1KyAwep5h5L3GSubrXSZZ5BpUpnVqwLB4uFHHQENTNZEjZVCqXgwwJkyWMPeRHSX3TWSUHwW1oYaNTq5tsCzQ',
                'type': 'Ed25519Signature2020',
                'verificationMethod': 'did:web:localhost%3A3000:users:test#owner',
            },
            'type': ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
        },
        'boostId':
            'lc:network:localhost%3A3000/trpc:boost:8adff1c1-696d-49b3-bffc-8eea89f72e26MISMATCH',
    },
};
