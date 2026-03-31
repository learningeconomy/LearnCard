import { UnsignedClrCredentialValidator } from '@learncard/types';

import type { CredentialFixture } from '../../types';

export const clrMultiAchievement: CredentialFixture = {
    id: 'clr/multi-achievement',
    name: 'CLR v2 with Multiple Achievements and Associations',
    description:
        'Comprehensive Learner Record with multiple achievements linked by associations, demonstrating the full CLR data model',
    spec: 'clr-v2',
    profile: 'learner-record',
    features: ['associations', 'alignment'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    validator: UnsignedClrCredentialValidator,
    tags: ['comprehensive'],

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            'https://purl.imsglobal.org/spec/clr/v2p0/context-2.0.1.json',
        ],
        id: 'urn:uuid:a7b8c9d0-0007-4000-8000-000000000001',
        type: ['VerifiableCredential', 'ClrCredential'],
        name: 'Associate of Science — Computer Science',
        description: 'Full academic transcript for the AS in Computer Science program.',
        issuer: {
            id: 'did:example:communitycollegeXYZ',
            type: ['Profile'],
            name: 'Community College XYZ',
            url: 'https://ccxyz.example.edu',
        },
        validFrom: '2024-12-20T00:00:00Z',
        credentialSubject: {
            id: 'did:example:student202',
            type: ['ClrSubject'],
            achievement: [
                {
                    id: 'urn:uuid:a7b8c9d0-0007-4000-8000-000000000010',
                    type: ['Achievement'],
                    achievementType: 'Course',
                    name: 'Programming I',
                    description: 'Introduction to programming using Python.',
                    humanCode: 'CS-110',
                    fieldOfStudy: 'Computer Science',
                    creditsAvailable: 4,
                    criteria: { narrative: 'Complete all labs and pass final project.' },
                },
                {
                    id: 'urn:uuid:a7b8c9d0-0007-4000-8000-000000000011',
                    type: ['Achievement'],
                    achievementType: 'Course',
                    name: 'Programming II',
                    description: 'Data structures and algorithms in Python.',
                    humanCode: 'CS-210',
                    fieldOfStudy: 'Computer Science',
                    creditsAvailable: 4,
                    criteria: { narrative: 'Complete all labs and pass the final exam.' },
                },
                {
                    id: 'urn:uuid:a7b8c9d0-0007-4000-8000-000000000012',
                    type: ['Achievement'],
                    achievementType: 'Course',
                    name: 'Calculus I',
                    description: 'Limits, derivatives, and integrals.',
                    humanCode: 'MATH-151',
                    fieldOfStudy: 'Mathematics',
                    creditsAvailable: 4,
                    criteria: { narrative: 'Pass midterm and final exams with 60%+.' },
                },
                {
                    id: 'urn:uuid:a7b8c9d0-0007-4000-8000-000000000013',
                    type: ['Achievement'],
                    achievementType: 'AssociateDegree',
                    name: 'Associate of Science in Computer Science',
                    description: 'Two-year degree program in computer science.',
                    humanCode: 'AS-CS',
                    fieldOfStudy: 'Computer Science',
                    creditsAvailable: 60,
                    criteria: {
                        narrative:
                            'Complete all required courses with a cumulative GPA of 2.0 or higher.',
                    },
                    alignment: [
                        {
                            type: ['Alignment'],
                            targetName: 'Computer Science',
                            targetUrl: 'https://nces.ed.gov/cip/110101',
                            targetType: 'CTDL',
                            targetFramework: 'CIP',
                        },
                    ],
                },
            ],
            association: [
                {
                    type: ['Association'],
                    associationType: 'isChildOf',
                    targetId: 'urn:uuid:a7b8c9d0-0007-4000-8000-000000000013',
                    sourceId: 'urn:uuid:a7b8c9d0-0007-4000-8000-000000000010',
                },
                {
                    type: ['Association'],
                    associationType: 'isChildOf',
                    targetId: 'urn:uuid:a7b8c9d0-0007-4000-8000-000000000013',
                    sourceId: 'urn:uuid:a7b8c9d0-0007-4000-8000-000000000011',
                },
                {
                    type: ['Association'],
                    associationType: 'isChildOf',
                    targetId: 'urn:uuid:a7b8c9d0-0007-4000-8000-000000000013',
                    sourceId: 'urn:uuid:a7b8c9d0-0007-4000-8000-000000000012',
                },
                {
                    type: ['Association'],
                    associationType: 'precedes',
                    targetId: 'urn:uuid:a7b8c9d0-0007-4000-8000-000000000011',
                    sourceId: 'urn:uuid:a7b8c9d0-0007-4000-8000-000000000010',
                },
            ],
        },
    },
};
