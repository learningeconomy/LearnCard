import { UnsignedAchievementCredentialValidator } from '@learncard/types';

import type { CredentialFixture } from '../../types';

export const obv3FullBadge: CredentialFixture = {
    id: 'obv3/full-badge',
    name: 'Full-Featured OBv3 Badge',
    description:
        'Open Badges v3 credential exercising most optional fields: image, evidence, alignment, results, rich issuer profile, expiration',
    spec: 'obv3',
    profile: 'badge',
    features: ['image', 'evidence', 'alignment', 'results', 'expiration'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    validator: UnsignedAchievementCredentialValidator,
    tags: ['comprehensive'],

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        id: 'urn:uuid:b2c3d4e5-0002-4000-8000-000000000001',
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        name: 'Advanced Web Development',
        description: 'Demonstrates mastery of modern web development frameworks and tooling.',
        image: {
            id: 'https://example.com/badges/webdev.png',
            type: 'Image',
            caption: 'Advanced Web Development Badge',
        },
        issuer: {
            id: 'did:example:issuer123',
            type: ['Profile'],
            name: 'Tech Academy',
            url: 'https://techacademy.example.com',
            image: {
                id: 'https://techacademy.example.com/logo.png',
                type: 'Image',
            },
            email: 'badges@techacademy.example.com',
        },
        validFrom: '2024-03-01T00:00:00Z',
        validUntil: '2027-03-01T00:00:00Z',
        credentialSubject: {
            id: 'did:example:student789',
            type: ['AchievementSubject'],
            activityStartDate: '2024-01-15T00:00:00Z',
            activityEndDate: '2024-02-28T00:00:00Z',
            creditsEarned: 3,
            achievement: {
                id: 'urn:uuid:b2c3d4e5-0002-4000-8000-000000000002',
                type: ['Achievement'],
                achievementType: 'Certificate',
                name: 'Advanced Web Development',
                description:
                    'Covers React, TypeScript, Node.js, and modern deployment pipelines.',
                humanCode: 'WEB-401',
                fieldOfStudy: 'Computer Science',
                creditsAvailable: 3,
                criteria: {
                    id: 'https://techacademy.example.com/criteria/web401',
                    narrative:
                        'Complete all 12 modules, pass the final project with 80%+, and submit a capstone portfolio.',
                },
                image: {
                    id: 'https://example.com/badges/webdev.png',
                    type: 'Image',
                },
                alignment: [
                    {
                        type: ['Alignment'],
                        targetName: 'Web Application Development',
                        targetUrl: 'https://credentialfinder.org/competency/12345',
                        targetType: 'ceasn:Competency',
                        targetFramework: 'NICE Cybersecurity Workforce Framework',
                    },
                ],
                resultDescription: [
                    {
                        id: 'urn:uuid:b2c3d4e5-0002-4000-8000-000000000003',
                        type: ['ResultDescription'],
                        name: 'Final Project Score',
                        resultType: 'Percent',
                        valueMin: '0',
                        valueMax: '100',
                    },
                    {
                        id: 'urn:uuid:b2c3d4e5-0002-4000-8000-000000000004',
                        type: ['ResultDescription'],
                        name: 'Completion Status',
                        resultType: 'Status',
                    },
                ],
                tag: ['web-development', 'react', 'typescript', 'nodejs'],
            },
            result: [
                {
                    type: ['Result'],
                    resultDescription: 'urn:uuid:b2c3d4e5-0002-4000-8000-000000000003',
                    value: '92',
                },
                {
                    type: ['Result'],
                    resultDescription: 'urn:uuid:b2c3d4e5-0002-4000-8000-000000000004',
                    status: 'Completed',
                },
            ],
        },
        evidence: [
            {
                type: ['Evidence'],
                id: 'https://techacademy.example.com/evidence/student789/capstone',
                name: 'Capstone Portfolio',
                description: 'Student capstone portfolio demonstrating applied web development skills.',
                narrative: 'Reviewed and approved by course instructor on 2024-02-28.',
            },
        ],
    },
};
