import type { UnsignedVC } from '@learncard/types';
import type { CredentialFixture } from '../../types';
import { clrMilitaryTrainingRecord } from './military-training-record';

const base = structuredClone(clrMilitaryTrainingRecord.credential);
const subject = base.credentialSubject as { id: string; verifiableCredential: UnsignedVC[] };
const context = [
    'https://www.w3.org/ns/credentials/v2',
    'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
];
const issuer = {
    id: 'did:example:meridian-qualifications',
    type: ['Profile'],
    name: 'Meridian Qualifications Board (Fictional)',
};
const evaluationIssuer = {
    id: 'did:example:meridian-assessment',
    type: ['Profile'],
    name: 'Meridian Independent Assessments (Fictional)',
};

/** Synthetic unsigned renderer fixture. No real service, rank, or equivalence claims. */
export const clrMilitaryComprehensiveRecord: CredentialFixture = {
    ...clrMilitaryTrainingRecord,
    id: 'clr/military-comprehensive-record',
    name: 'Military Training and Qualifications — Comprehensive',
    description:
        'Six source-backed children covering training, fieldwork, award, competency, assessment, and qualification with distinct issuers.',
    tags: [...(clrMilitaryTrainingRecord.tags ?? []), 'lc-2215'],
    credential: {
        ...base,
        id: 'urn:uuid:7293fe71-4b24-4428-9f6f-60923687184c',
        name: 'Military Training and Qualifications — Comprehensive',
        credentialSubject: {
            ...subject,
            verifiableCredential: [
                ...subject.verifiableCredential,
                {
                    '@context': context,
                    id: 'urn:uuid:89a65d6b-3d7b-43f9-a545-82979d22b874',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    issuer: evaluationIssuer,
                    validFrom: '2026-03-01T12:00:00Z',
                    credentialSubject: {
                        id: subject.id,
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'urn:uuid:e6b5c726-4f43-4cec-8099-fd5d476c91c0',
                            type: ['Achievement'],
                            achievementType: 'Competency',
                            name: 'Safe logistics coordination',
                            description:
                                'Demonstrated coordination in a fictional training exercise.',
                            criteria: {
                                narrative: 'Explain and demonstrate the supplied safety checklist.',
                            },
                            alignment: [
                                {
                                    type: ['Alignment'],
                                    targetName: 'Safe coordination',
                                    targetUrl: 'https://skills.example/safe-coordination',
                                    targetCode: 'SAFE-101',
                                },
                            ],
                        },
                    },
                    evidence: [
                        {
                            type: ['Evidence'],
                            name: 'Observation notes',
                            narrative:
                                'The learner demonstrated the checklist in a supervised simulation.',
                        },
                    ],
                },
                {
                    '@context': context,
                    id: 'urn:uuid:676e976f-0e91-4c4c-a2d4-1cac83672875',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    issuer: evaluationIssuer,
                    validFrom: '2026-03-02T12:00:00Z',
                    credentialSubject: {
                        id: subject.id,
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'urn:uuid:027361d1-5945-4292-85a6-2d8204b3e876',
                            type: ['Achievement'],
                            achievementType: 'Assessment',
                            name: 'Coordination knowledge assessment',
                            description: 'Synthetic knowledge assessment.',
                            criteria: { narrative: 'Answer the scenario questions.' },
                            resultDescription: [
                                {
                                    id: 'urn:uuid:3b6af4be-5b0f-44f1-9d58-a8f8bd1a2877',
                                    type: ['ResultDescription'],
                                    name: 'Knowledge score',
                                    resultType: 'RawScore',
                                    valueMin: '0',
                                    valueMax: '100',
                                    requiredValue: '70',
                                },
                            ],
                        },
                        result: [
                            {
                                type: ['Result'],
                                resultDescription: 'urn:uuid:3b6af4be-5b0f-44f1-9d58-a8f8bd1a2877',
                                value: '86',
                            },
                        ],
                    },
                },
                {
                    '@context': context,
                    id: 'urn:uuid:492bb221-9dca-46a4-bce1-205537633878',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    issuer,
                    awardedDate: '2026-03-03T12:00:00Z',
                    validFrom: '2026-04-01T12:00:00Z',
                    validUntil: '2027-04-01T12:00:00Z',
                    credentialSubject: {
                        id: subject.id,
                        type: ['AchievementSubject'],
                        licenseNumber: 'SYN-LOG-2048',
                        achievement: {
                            id: 'urn:uuid:8067ec9d-6fae-41f0-aa5f-6356f7a96879',
                            type: ['Achievement'],
                            achievementType: 'License',
                            name: 'Simulated logistics qualification',
                            description: 'Fictional qualification for display testing only.',
                            criteria: {
                                narrative:
                                    'Demonstrate the training objectives and complete the assessment.',
                            },
                            otherIdentifier: [
                                {
                                    type: 'IdentifierEntry',
                                    identifier: 'SYN-QUAL-48',
                                    identifierType: 'identifier',
                                },
                            ],
                        },
                    },
                    evidence: [
                        {
                            type: ['Evidence'],
                            name: 'Qualification review',
                            narrative: 'Synthetic review of training and assessment evidence.',
                        },
                    ],
                },
            ],
        },
    },
};
