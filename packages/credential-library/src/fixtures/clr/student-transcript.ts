import { UnsignedClrCredentialValidator } from '@learncard/types';

import type { CredentialFixture } from '../../types';
import { DEMO_SCHOOL_ISSUER, STUDENT_ACHIEVEMENTS } from '../personas/studentAchievements';

export const clrStudentTranscript: CredentialFixture = {
    id: 'clr/student-transcript',
    name: 'Student Persona — Demo School Transcript',
    description:
        'A standards-pure CLR 2.0 transcript that references the Student persona’s three OBv3 achievements.',
    spec: 'clr-v2',
    profile: 'learner-record',
    features: ['alignment', 'skills', 'associations', 'nested-credentials', 'display'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    validator: UnsignedClrCredentialValidator,
    tags: ['student-persona', 'transcript'],
    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            'https://purl.imsglobal.org/spec/clr/v2p0/context.json',
        ],
        id: 'urn:uuid:20000000-0000-4000-8000-000000000001',
        type: ['VerifiableCredential', 'ClrCredential'],
        name: 'Jordan Lee — Demo School Student Transcript',
        description:
            'A learner record showing coursework, leadership, and community achievements completed at Demo School.',
        issuer: DEMO_SCHOOL_ISSUER,
        validFrom: '2025-06-15T00:00:00Z',
        credentialSubject: {
            id: 'did:example:student',
            type: ['ClrSubject'],
            achievement: [
                STUDENT_ACHIEVEMENTS.civicLeadership,
                STUDENT_ACHIEVEMENTS.webDevelopment,
                STUDENT_ACHIEVEMENTS.communityImpact,
            ],
            association: [
                {
                    type: ['Association'],
                    associationType: 'isRelatedTo',
                    sourceId: STUDENT_ACHIEVEMENTS.civicLeadership.id,
                    targetId: STUDENT_ACHIEVEMENTS.webDevelopment.id,
                },
                {
                    type: ['Association'],
                    associationType: 'isRelatedTo',
                    sourceId: STUDENT_ACHIEVEMENTS.communityImpact.id,
                    targetId: STUDENT_ACHIEVEMENTS.civicLeadership.id,
                },
            ],
        },
    },
};
