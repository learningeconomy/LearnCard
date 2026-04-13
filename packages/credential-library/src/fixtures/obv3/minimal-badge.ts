import { UnsignedAchievementCredentialValidator } from '@learncard/types';

import type { CredentialFixture } from '../../types';

export const obv3MinimalBadge: CredentialFixture = {
    id: 'obv3/minimal-badge',
    name: 'Minimal OBv3 Badge',
    description:
        'Open Badges v3 achievement credential with only required fields per the 1EdTech spec',
    spec: 'obv3',
    profile: 'badge',
    features: [],
    source: 'spec-example',
    signed: false,
    validity: 'valid',
    validator: UnsignedAchievementCredentialValidator,

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        id: 'urn:uuid:a1b2c3d4-0001-4000-8000-000000000001',
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        issuer: { id: 'did:example:issuer123' },
        validFrom: '2024-01-01T00:00:00Z',
        name: 'Minimal Badge',
        credentialSubject: {
            id: 'did:example:subject456',
            type: ['AchievementSubject'],
            achievement: {
                id: 'urn:uuid:a1b2c3d4-0001-4000-8000-000000000002',
                type: ['Achievement'],
                name: 'Participation',
                description: 'Awarded for attending the event.',
                criteria: { narrative: 'Must attend the event.' },
            },
        },
    },
};
