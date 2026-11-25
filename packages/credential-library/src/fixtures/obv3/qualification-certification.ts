import { UnsignedAchievementCredentialValidator } from '@learncard/types';
import type { CredentialFixture } from '../../types';

export const obv3QualificationCertification: CredentialFixture = {
    'id': 'obv3/qualification-certification',
    'name': 'Project Management Certification',
    'description': 'LC-2111 Certification classification and default certificate test.',
    'spec': 'obv3',
    'profile': 'certificate',
    'features': ['expiration', 'image'],
    'source': 'synthetic',
    'signed': false,
    'validity': 'valid',
    validator: UnsignedAchievementCredentialValidator,
    'tags': ['qualifications', 'lc-2111', 'certification'],
    'credential': {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        'id': 'urn:uuid:21110000-0000-4000-8000-000000000002',
        'type': ['VerifiableCredential', 'OpenBadgeCredential'],
        'name': 'Project Management Certification',
        'description': 'Demonstrates competency in planning, delivering, and evaluating projects.',
        'image': {
            id: 'https://openmoji.org/data/color/svg/1F4CB.svg',
            type: 'Image',
            caption: 'Project management illustration — OpenMoji (CC BY-SA 4.0)',
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
                'id': 'https://example.org/qualifications/certification',
                'type': ['Achievement'],
                'achievementType': 'Certification',
                'name': 'Project Management Certification',
                'description':
                    'Demonstrates competency in planning, delivering, and evaluating projects.',
                'image': {
                    id: 'https://openmoji.org/data/color/svg/1F4CB.svg',
                    type: 'Image',
                    caption: 'Project management illustration — OpenMoji (CC BY-SA 4.0)',
                },
                'criteria': {
                    'narrative':
                        'Complete the required training and pass the practical assessment.',
                },
            },
        },
    },
};
