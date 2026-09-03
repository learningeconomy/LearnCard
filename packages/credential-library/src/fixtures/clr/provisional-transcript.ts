import { UnsignedClrCredentialValidator, type UnsignedVC } from '@learncard/types';

import type { CredentialFixture } from '../../types';

/**
 * Provisional CLR 2.0 transcript with a `1EdTechCredentialRefresh` service, built for
 * the managed credential refresh flow (LC-2117 / LC-2135 / LC-2136).
 *
 * The credential starts as a provisional transcript; `buildFinalTranscriptVariant`
 * produces the final variant WITHOUT changing the credential ID, issuer, or subject,
 * mirroring a registrar publishing the finalized record to the same refresh service.
 *
 * JSON-LD note: neither the VCDM 1.1/2.0 nor the live OBv3/CLR contexts define the
 * term `1EdTechCredentialRefresh` (or the LearnCard `authorization` extension), so
 * the fixture carries an inline context fragment — DIDKit's data-loss detection
 * otherwise refuses to sign.
 */

/** Inline JSON-LD context fragment defining the refresh-service terms inline. */
export const REFRESH_SERVICE_INLINE_CONTEXT = {
    '1EdTechCredentialRefresh': 'https://purl.imsglobal.org/spec/ob/v3p0#1EdTechCredentialRefresh',
    authorization: {
        '@id': 'https://purl.imsglobal.org/spec/ob/v3p0#authorization',
        '@context': {
            LearnCardDIDAuth: 'https://docs.learncard.com/definitions#LearnCardDIDAuth',
        },
    },
} as const;

/**
 * Placeholder refresh service on the unsigned fixture. Callers preparing the fixture
 * for managed issuance replace `refreshService` with the allocated service descriptor
 * (the allocated ID is only known after `allocateCredentialRefresh`).
 */
const PLACEHOLDER_REFRESH_SERVICE = {
    id: 'https://refresh.example.com/refresh/placeholder',
    type: '1EdTechCredentialRefresh',
    authorization: { type: 'LearnCardDIDAuth' },
} as const;

export const clrProvisionalTranscript: CredentialFixture = {
    id: 'clr/provisional-transcript',
    name: 'Provisional Transcript (Refreshable)',
    description:
        'A CLR v2 provisional transcript carrying a 1EdTechCredentialRefresh service. Paired with buildFinalTranscriptVariant, it demonstrates the managed provisional-to-final credential refresh flow.',
    spec: 'clr-v2',
    profile: 'learner-record',
    features: ['refresh-service', 'results'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    validator: UnsignedClrCredentialValidator,
    tags: ['transcript', 'provisional', 'refresh', 'clr', 'managed-refresh'],

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            'https://purl.imsglobal.org/spec/clr/v2p0/context.json',
            REFRESH_SERVICE_INLINE_CONTEXT,
        ],
        id: 'urn:uuid:7d2e9f41-3c58-4e21-9b6a-1f0c5d8e2a47',
        type: ['VerifiableCredential', 'ClrCredential'],
        name: 'Provisional Transcript — Ridgeview Community College',
        description:
            'Provisional record of courses completed to date. This transcript becomes final once the registrar certifies the completed term.',
        issuer: {
            id: 'did:web:registrar.ridgeview-example.edu',
            type: ['Profile'],
            name: 'Ridgeview Community College — Office of the Registrar',
        },
        validFrom: '2026-01-15T00:00:00Z',
        refreshService: PLACEHOLDER_REFRESH_SERVICE,
        credentialSubject: {
            id: 'did:example:student-ridgeview-042',
            type: ['ClrSubject'],
            achievement: [
                {
                    id: 'urn:uuid:7d2e9f41-3c58-4e21-9b6a-1f0c5d8e2a48',
                    type: ['Achievement'],
                    achievementType: 'Course',
                    name: 'BIO 150 — Principles of Biology',
                    description:
                        'Introductory biology covering cell structure, genetics, and evolution.',
                    criteria: { narrative: 'Complete all coursework and the final exam.' },
                    humanCode: 'BIO-150',
                    fieldOfStudy: 'Biology',
                    creditsAvailable: 4,
                    resultDescription: [
                        {
                            id: 'urn:uuid:7d2e9f41-3c58-4e21-9b6a-1f0c5d8e2a49',
                            type: ['ResultDescription'],
                            name: 'Course Status',
                            resultType: 'RawScore',
                        },
                    ],
                },
            ],
            verifiableCredential: [
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    id: 'urn:uuid:7d2e9f41-3c58-4e21-9b6a-1f0c5d8e2a50',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'BIO 150 — Principles of Biology (In Progress)',
                    issuer: {
                        id: 'did:web:registrar.ridgeview-example.edu',
                        type: ['Profile'],
                        name: 'Ridgeview Community College',
                    },
                    validFrom: '2026-01-15T00:00:00Z',
                    credentialSubject: {
                        id: 'did:example:student-ridgeview-042',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'urn:uuid:7d2e9f41-3c58-4e21-9b6a-1f0c5d8e2a48',
                            type: ['Achievement'],
                            achievementType: 'Course',
                            name: 'BIO 150 — Principles of Biology',
                            criteria: {
                                narrative: 'Complete all coursework and the final exam.',
                            },
                            humanCode: 'BIO-150',
                            fieldOfStudy: 'Biology',
                            creditsAvailable: 4,
                        },
                        result: [
                            {
                                type: ['Result'],
                                resultDescription: 'urn:uuid:7d2e9f41-3c58-4e21-9b6a-1f0c5d8e2a49',
                                status: 'InProgress',
                            },
                        ],
                    },
                },
            ],
        },
    },
};

/**
 * Builds the final transcript variant from a prepared provisional credential.
 *
 * Preserves the credential ID, issuer, subject, and refresh service (identity
 * invariants the managed refresh pipeline enforces) while flipping user-visible
 * content to its final state: name/description become final, the nested course
 * credential shows the completed result, and `validFrom` moves forward.
 */
export const buildFinalTranscriptVariant = (
    provisional: UnsignedVC,
    options: { validFrom?: string } = {}
): UnsignedVC => {
    const final = JSON.parse(JSON.stringify(provisional)) as Record<string, any>;

    final.name = 'Final Official Transcript — Ridgeview Community College';
    final.description =
        'Final official transcript certified by the registrar. Supersedes the provisional record.';

    if (options.validFrom) final.validFrom = options.validFrom;

    const subject = final.credentialSubject;

    if (subject && Array.isArray(subject.verifiableCredential)) {
        subject.verifiableCredential = subject.verifiableCredential.map((nested: any) => {
            if (!nested || typeof nested !== 'object') return nested;

            const next = { ...nested };

            if (typeof next.name === 'string') {
                next.name = next.name.replace('(In Progress)', '(Completed)');
            }

            if (next.credentialSubject && Array.isArray(next.credentialSubject.result)) {
                next.credentialSubject = {
                    ...next.credentialSubject,
                    result: next.credentialSubject.result.map((result: any) =>
                        result && typeof result === 'object'
                            ? { ...result, status: 'Completed', value: 'A' }
                            : result
                    ),
                };
            }

            return next;
        });
    }

    return final as UnsignedVC;
};
