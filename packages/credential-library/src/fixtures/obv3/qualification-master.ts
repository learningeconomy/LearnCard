import { UnsignedAchievementCredentialValidator } from '@learncard/types';
import type { CredentialFixture } from '../../types';

export const obv3QualificationMaster: CredentialFixture = {
    'id': 'obv3/qualification-master',
    'name': 'Master Electrician Certificate',
    'description': 'LC-2111 MasterCertificate classification and default certificate test.',
    'spec': 'obv3',
    'profile': 'certificate',
    'features': ['expiration', 'image'],
    'source': 'synthetic',
    'signed': false,
    'validity': 'valid',
    validator: UnsignedAchievementCredentialValidator,
    'tags': ['qualifications', 'lc-2111', 'master'],
    'credential': {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        'id': 'urn:uuid:21110000-0000-4000-8000-000000000005',
        'type': ['VerifiableCredential', 'OpenBadgeCredential'],
        'name': 'Master Electrician Certificate',
        'description': 'Recognizes advanced electrical design and supervisory competence.',
        'image': {
            id: 'https://openmoji.org/data/color/svg/1F3C6.svg',
            type: 'Image',
            caption: 'Master qualification illustration — OpenMoji (CC BY-SA 4.0)',
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
                'id': 'https://example.org/qualifications/master',
                'type': ['Achievement'],
                'achievementType': 'MasterCertificate',
                'name': 'Master Electrician Certificate',
                'description': 'Recognizes advanced electrical design and supervisory competence.',
                'image': {
                    id: 'https://openmoji.org/data/color/svg/1F3C6.svg',
                    type: 'Image',
                    caption: 'Master qualification illustration — OpenMoji (CC BY-SA 4.0)',
                },
                'criteria': {
                    'narrative':
                        'Complete the required training and pass the practical assessment.',
                },
            },
        },
    },
};
