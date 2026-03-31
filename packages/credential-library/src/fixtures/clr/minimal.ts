import { UnsignedClrCredentialValidator } from '@learncard/types';

import type { CredentialFixture } from '../../types';

export const clrMinimal: CredentialFixture = {
    id: 'clr/minimal',
    name: 'Minimal CLR v2 Credential',
    description:
        'Minimal Comprehensive Learner Record v2 wrapping a single achievement, per 1EdTech CLR Standard',
    spec: 'clr-v2',
    profile: 'learner-record',
    features: [],
    source: 'spec-example',
    signed: false,
    validity: 'valid',
    validator: UnsignedClrCredentialValidator,

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            'https://purl.imsglobal.org/spec/clr/v2p0/context-2.0.1.json',
        ],
        id: 'urn:uuid:f6a7b8c9-0006-4000-8000-000000000001',
        type: ['VerifiableCredential', 'ClrCredential'],
        name: 'Academic Record — Spring 2024',
        issuer: {
            id: 'did:example:stateuniversity',
            type: ['Profile'],
            name: 'State University',
        },
        validFrom: '2024-06-15T00:00:00Z',
        credentialSubject: {
            id: 'did:example:student101',
            type: ['ClrSubject'],
            achievement: [
                {
                    id: 'urn:uuid:f6a7b8c9-0006-4000-8000-000000000002',
                    type: ['Achievement'],
                    achievementType: 'Course',
                    name: 'Introduction to Psychology',
                    description: 'Survey course covering major psychological theories and research methods.',
                    criteria: {
                        narrative: 'Complete coursework and pass final exam.',
                    },
                    humanCode: 'PSY-101',
                    fieldOfStudy: 'Psychology',
                    creditsAvailable: 3,
                },
            ],
        },
    },
};
