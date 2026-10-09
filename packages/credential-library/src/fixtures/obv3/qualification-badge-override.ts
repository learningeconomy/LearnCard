import { UnsignedAchievementCredentialValidator } from '@learncard/types';
import type { CredentialFixture } from '../../types';

export const obv3QualificationBadgeOverride: CredentialFixture = {
    'id': 'obv3/qualification-badge-override',
    'name': 'Safety Certification — Badge Layout',
    'description': 'LC-2111 Certification classification and explicit display override test.',
    'spec': 'obv3',
    'profile': 'certificate',
    'features': ['expiration', 'display', 'image'],
    'source': 'synthetic',
    'signed': false,
    'validity': 'valid',
    validator: UnsignedAchievementCredentialValidator,
    'tags': ['qualifications', 'lc-2111', 'badge-override'],
    'credential': {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            'https://ctx.learncard.com/boosts/1.0.3.json',
        ],
        'id': 'urn:uuid:21110000-0000-4000-8000-000000000007',
        'type': ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
        'name': 'Safety Certification — Badge Layout',
        'description':
            'A qualification with an explicit badge layout instead of the default certificate.',
        'image': {
            id: 'https://openmoji.org/data/color/svg/1F6E1.svg',
            type: 'Image',
            caption: 'Safety certification illustration — OpenMoji (CC BY-SA 4.0)',
        },
        'issuer': {
            'id': 'did:example:qualification-issuer',
            'type': ['Profile'],
            'name': 'Example Professional Training Academy',
        },
        'validFrom': '2023-01-01T00:00:00Z',
        'validUntil': '2037-01-01T00:00:00Z',
        'credentialSubject': {
            'id': 'did:example:qualification-holder',
            'type': ['AchievementSubject'],
            'achievement': {
                'id': 'https://example.org/qualifications/badge-override',
                'type': ['Achievement'],
                'achievementType': 'Certification',
                'name': 'Safety Certification — Badge Layout',
                'description':
                    'A qualification with an explicit badge layout instead of the default certificate.',
                'image': {
                    id: 'https://openmoji.org/data/color/svg/1F6E1.svg',
                    type: 'Image',
                    caption: 'Safety certification illustration — OpenMoji (CC BY-SA 4.0)',
                },
                'criteria': {
                    'narrative':
                        'Complete the required training and pass the practical assessment.',
                },
            },
        },
        'display': {
            'displayType': 'badge',
        },
    },
};
