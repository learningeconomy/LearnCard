import { UnsignedAchievementCredentialValidator } from '@learncard/types';
import type { CredentialFixture } from '../../types';

export const obv3QualificationExpired: CredentialFixture = {
    'id': 'obv3/qualification-expired',
    'name': 'Expired Safety Certification',
    'description':
        'LC-2111 expiration test. Enable Keep fixture dates in the viewer to retain the past expiration.',
    'spec': 'obv3',
    'profile': 'certificate',
    'features': ['expiration', 'image'],
    'source': 'synthetic',
    'signed': false,
    'validity': 'valid',
    validator: UnsignedAchievementCredentialValidator,
    'tags': ['qualifications', 'lc-2111', 'expired'],
    'credential': {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        'id': 'urn:uuid:21110000-0000-4000-8000-000000000006',
        'type': ['VerifiableCredential', 'OpenBadgeCredential'],
        'name': 'Expired Safety Certification',
        'description': 'An expired qualification that must remain visible and selectable.',
        'image': {
            id: 'https://openmoji.org/data/color/svg/26A0.svg',
            type: 'Image',
            caption: 'Safety warning illustration — OpenMoji (CC BY-SA 4.0)',
        },
        'issuer': {
            'id': 'did:example:qualification-issuer',
            'type': ['Profile'],
            'name': 'Example Professional Training Academy',
        },
        'validFrom': '2023-01-01T00:00:00Z',
        'validUntil': '2024-01-01T00:00:00Z',
        'credentialSubject': {
            'id': 'did:example:qualification-holder',
            'type': ['AchievementSubject'],
            'achievement': {
                'id': 'https://example.org/qualifications/expired',
                'type': ['Achievement'],
                'achievementType': 'Certification',
                'name': 'Expired Safety Certification',
                'description': 'An expired qualification that must remain visible and selectable.',
                'image': {
                    id: 'https://openmoji.org/data/color/svg/26A0.svg',
                    type: 'Image',
                    caption: 'Safety warning illustration — OpenMoji (CC BY-SA 4.0)',
                },
                'criteria': {
                    'narrative':
                        'Complete the safety course; renewal is required after expiration.',
                },
            },
        },
    },
};
