import { UnsignedAchievementCredentialValidator } from '@learncard/types';

import type { CredentialFixture } from '../../types';

export const obv3WithEndorsement: CredentialFixture = {
    id: 'obv3/with-endorsement',
    name: 'OBv3 Badge with Endorsement',
    description:
        'Open Badges v3 credential containing an embedded endorsement credential from a third party',
    spec: 'obv3',
    profile: 'badge',
    features: ['endorsement'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    validator: UnsignedAchievementCredentialValidator,

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        id: 'urn:uuid:c3d4e5f6-0003-4000-8000-000000000001',
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        name: 'Endorsed Teamwork Badge',
        issuer: { id: 'did:example:issuer123', type: ['Profile'], name: 'Acme Corp' },
        validFrom: '2024-05-01T00:00:00Z',
        credentialSubject: {
            id: 'did:example:employee42',
            type: ['AchievementSubject'],
            achievement: {
                id: 'urn:uuid:c3d4e5f6-0003-4000-8000-000000000002',
                type: ['Achievement'],
                name: 'Teamwork Excellence',
                description: 'Recognizes outstanding collaborative skills in cross-functional teams.',
                criteria: { narrative: 'Nominated by peers and approved by management.' },
            },
        },
        endorsement: [
            {
                '@context': [
                    'https://www.w3.org/ns/credentials/v2',
                    'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                ],
                id: 'urn:uuid:c3d4e5f6-0003-4000-8000-000000000003',
                type: ['VerifiableCredential', 'EndorsementCredential'],
                issuer: {
                    id: 'did:example:endorser999',
                    type: ['Profile'],
                    name: 'Industry Standards Board',
                },
                validFrom: '2024-04-01T00:00:00Z',
                credentialSubject: {
                    id: 'urn:uuid:c3d4e5f6-0003-4000-8000-000000000002',
                    type: ['EndorsementSubject'],
                    endorsementComment:
                        'This badge program meets industry standards for collaborative skill assessment.',
                },
            },
        ],
    },
};
