import { UnsignedAchievementCredentialValidator } from '@learncard/types';

import type { CredentialFixture } from '../../types';

export const obv3PlugfestJff2: CredentialFixture = {
    id: 'obv3/plugfest-jff2',
    name: 'JFF x vc-edu PlugFest 2 Interoperability Badge',
    description:
        'Real-world OBv3 credential from the JFF PlugFest 2 interoperability event, demonstrating cross-wallet compatibility',
    spec: 'obv3',
    profile: 'badge',
    features: ['image'],
    source: 'plugfest',
    signed: false,
    validity: 'valid',
    validator: UnsignedAchievementCredentialValidator,
    tags: ['jff', 'interop', 'plugfest'],

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        id: 'urn:uuid:d4e5f6a7-0004-4000-8000-000000000001',
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        name: 'JFF x vc-edu PlugFest 2 Interoperability',
        issuer: {
            type: ['Profile'],
            id: 'did:example:jff',
            name: 'Jobs for the Future (JFF)',
            image: {
                id: 'https://w3c-ccg.github.io/vc-ed/plugfest-1-2022/images/JFF_LogoLockup.png',
                type: 'Image',
            },
        },
        validFrom: '2023-01-01T00:00:00Z',
        credentialSubject: {
            type: ['AchievementSubject'],
            id: 'did:example:subject456',
            achievement: {
                id: 'urn:uuid:d4e5f6a7-0004-4000-8000-000000000002',
                type: ['Achievement'],
                name: 'JFF x vc-edu PlugFest 2 Interoperability',
                description:
                    'This credential solution supports the use of OBv3 and w3c Verifiable Credentials and is interoperable with at least two other solutions. This was demonstrated successfully during JFF x vc-edu PlugFest 2.',
                criteria: {
                    narrative:
                        'Solutions providers earned this badge by demonstrating interoperability between multiple providers based on the OBv3 candidate final standard, with some additional required fields. Credential issuers earning this badge successfully issued a credential into at least two wallets. Wallet implementers earning this badge successfully displayed credentials issued by at least two different credential issuers.',
                },
                image: {
                    id: 'https://w3c-ccg.github.io/vc-ed/plugfest-2-2022/images/JFF-VC-EDU-PLUGFEST2-badge-image.png',
                    type: 'Image',
                },
            },
        },
    },
};
