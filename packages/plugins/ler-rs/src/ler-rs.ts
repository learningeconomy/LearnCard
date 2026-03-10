import {
    VC as VerifiableCredential,
    UnsignedVC,
    VP as VerifiablePresentation,
    UnsignedVP,
} from '@learncard/types';
import {
    LERRSDependentLearnCard,
    LERRSPlugin,
    CreateLerRecordParams,
    CreateLerPresentationParams,
    VerifyLerPresentationParams,
    VerificationResult,
    LerRsRecord,
    LER_RS_CREDENTIAL_CONTEXT_V1,
    LER_RS_VC_CONTEXT_V45,
    LER_RS_TYPE_URI_V45,
    LEGACY_LER_RS_TYPE_URI_V44,
    LEGACY_LER_RS_TYPE_TOKEN,
    TCP_WRAPPER_TYPE,
} from './types';

/**
 * Normalizes verification containers from either:
 * - `verifications: VC[]`
 * - `verifiableCredential: VC`
 */
const getItemVerifications = (item: {
    verifiableCredential?: VerifiableCredential;
    verifications?: VerifiableCredential[];
}): VerifiableCredential[] => {
    if (item.verifications?.length) return item.verifications;
    if (item.verifiableCredential) return [item.verifiableCredential];
    return [];
};

/**
 * Converts scalar-or-array values into a normalized array.
 */
const toArray = <T>(maybe: T | T[] | undefined): T[] =>
    maybe == null ? [] : Array.isArray(maybe) ? maybe : [maybe];

/**
 * Determines whether a VC represents a LER-RS credential (legacy and current forms).
 *
 * Checks:
 * - VC `type` array/token values
 * - `credentialSubject.type`
 * - nested `credentialSubject.lerrsType.type`
 */
const credentialHasLerRsType = (credential: VerifiableCredential): boolean => {
    const typeList = Array.isArray(credential.type) ? credential.type : [credential.type];
    if (
        typeList.some(type =>
            [LEGACY_LER_RS_TYPE_TOKEN, LEGACY_LER_RS_TYPE_URI_V44, LER_RS_TYPE_URI_V45].includes(
                type
            )
        )
    )
        return true;

    const credentialSubject = credential.credentialSubject as Record<string, unknown> | undefined;
    if (!credentialSubject) return false;

    const inlineType = credentialSubject.type;
    if (
        typeof inlineType === 'string' &&
        [LEGACY_LER_RS_TYPE_URI_V44, LER_RS_TYPE_URI_V45].includes(inlineType)
    )
        return true;

    const nestedType = (credentialSubject.lerrsType as Record<string, unknown> | undefined)?.type;
    return (
        typeof nestedType === 'string' &&
        [LEGACY_LER_RS_TYPE_URI_V44, LER_RS_TYPE_URI_V45].includes(nestedType)
    );
};

/**
 * Maps application work history items to LER-RS `employmentHistories` shape.
 */
const buildEmploymentHistories = (
    items: NonNullable<CreateLerRecordParams['workHistory']>
): LerRsRecord['employmentHistories'] => {
    return items.map(item => {
        const {
            narrative,
            verifiableCredential,
            verifications,
            position,
            employer,
            start,
            end,
            ...rest
        } = item;

        const container: Record<string, unknown> = { ...rest };

        if (employer) container.organization = { tradeName: employer };
        if (position || start || end) {
            const ph: Record<string, unknown> = {};
            if (position) ph.title = position;
            if (start) ph.start = start;
            if (end) ph.end = end;
            container.positionHistories = [ph];
        }
        if (narrative) container.narrative = narrative;

        const containerVerifications = getItemVerifications({
            verifiableCredential,
            verifications,
        });
        return {
            ...container,
            ...(containerVerifications.length ? { verifications: containerVerifications } : {}),
        };
    });
};

/**
 * Maps education source items into LER-RS `educationAndLearnings`.
 */
const buildEducationAndLearnings = (
    items: NonNullable<CreateLerRecordParams['educationHistory']>
): LerRsRecord['educationAndLearnings'] => {
    return items.map(item => {
        const {
            narrative,
            verifiableCredential,
            verifications,
            institution,
            start,
            end,
            degree,
            specializations,
            ...rest
        } = item;

        const container: Record<string, unknown> = { ...rest };
        if (institution) container.institution = { name: institution };
        if (start) container.start = start;
        if (end) container.end = end;
        if (degree || specializations) {
            container.educationDegrees = [
                {
                    ...(degree ? { name: degree } : {}),
                    ...(specializations
                        ? {
                              specializations: specializations.map(specialization => ({
                                  name: specialization,
                              })),
                          }
                        : {}),
                },
            ];
        }
        if (narrative) container.narrative = narrative;

        const containerVerifications = getItemVerifications({
            verifiableCredential,
            verifications,
        });
        return {
            ...container,
            ...(containerVerifications.length ? { verifications: containerVerifications } : {}),
        };
    });
};

/**
 * Maps certification source items to LER-RS `certifications`.
 */
const buildCertifications = (
    items: NonNullable<CreateLerRecordParams['certifications']>
): LerRsRecord['certifications'] => {
    return items.map(item => {
        const { narrative, verifiableCredential, verifications, ...rest } = item;

        const container: Record<string, unknown> = { ...rest };
        if (narrative) container.narrative = narrative;

        const containerVerifications = getItemVerifications({
            verifiableCredential,
            verifications,
        });
        return {
            ...container,
            ...(containerVerifications.length ? { verifications: containerVerifications } : {}),
        };
    });
};

/**
 * Returns the LearnCard LER-RS plugin with methods for:
 * - issuing LER-RS VCs
 * - packaging/verifying LER presentations
 * - issuing TCP wrapper VCs for resume packages
 */
export const getLerRsPlugin = (initLearnCard: LERRSDependentLearnCard): LERRSPlugin => {
    return {
        name: 'LER-RS',
        displayName: 'LER-RS',
        description:
            'Create, package, and verify Learning & Employment Record Resume (LER-RS) credentials',
        methods: {
            /**
             * Issues a signed LER-RS VC from normalized person/work/education/certification data.
             *
             * The method:
             * 1. Builds a compliant LER-RS `credentialSubject`
             * 2. Applies VC + LER-RS contexts
             * 3. Signs via `invoke.issueCredential`
             */
            createLerRecord: async (_learnCard, params): Promise<VerifiableCredential> => {
                const signer = params.learnCard ?? _learnCard;
                const did = signer.id.did();
                const issuedAt = new Date().toISOString();
                const documentId = crypto.randomUUID();

                const personSection: LerRsRecord['person'] = {
                    name: {
                        given: params.person.givenName,
                        family: params.person.familyName,
                        formattedName:
                            params.person.formattedName ??
                            `${params.person.givenName} ${params.person.familyName}`,
                    },
                };

                const communication: LerRsRecord['communication'] | undefined = params.person.email
                    ? { email: [{ address: params.person.email }] }
                    : undefined;

                const lerRecord: LerRsRecord = {
                    type: LER_RS_TYPE_URI_V45,
                    documentId: { value: documentId },
                    person: personSection,
                    ...(communication ? { communication } : {}),
                    skills: (params.skills || []).map(s => ({ name: s })),
                    employmentHistories: params.workHistory
                        ? buildEmploymentHistories(params.workHistory)
                        : undefined,
                    educationAndLearnings: params.educationHistory
                        ? buildEducationAndLearnings(params.educationHistory)
                        : undefined,
                    certifications: params.certifications
                        ? buildCertifications(params.certifications)
                        : undefined,
                };

                const unsignedVC: UnsignedVC = {
                    '@context': [LER_RS_CREDENTIAL_CONTEXT_V1, LER_RS_VC_CONTEXT_V45],
                    id: `urn:uuid:${documentId}`,
                    type: ['VerifiableCredential', LER_RS_TYPE_URI_V45],
                    issuer: did,
                    issuanceDate: issuedAt,
                    credentialSubject: {
                        id: params.person.id,
                        ...lerRecord,
                    },
                };

                return initLearnCard.invoke.issueCredential(unsignedVC, {
                    proofPurpose: 'assertionMethod',
                });
            },

            /**
             * Issues a VP containing at least one LER-RS credential.
             *
             * Throws if:
             * - credentials list is empty
             * - none of the credentials match LER-RS type checks
             */
            createLerPresentation: async (_learnCard, params): Promise<VerifiablePresentation> => {
                const signer = params.learnCard ?? _learnCard;
                const did = signer.id.did();

                if (!params.credentials.length)
                    throw new Error(
                        'createLerPresentation: credentials array must contain at least one credential'
                    );
                const containsLer = params.credentials.some(credentialHasLerRsType);
                if (!containsLer)
                    throw new Error(
                        'createLerPresentation: credentials must include at least one LER-RS credential'
                    );

                const vp: UnsignedVP = {
                    '@context': [LER_RS_CREDENTIAL_CONTEXT_V1],
                    type: ['VerifiablePresentation'],
                    holder: did,
                    verifiableCredential:
                        params.credentials.length === 1
                            ? params.credentials[0]
                            : params.credentials,
                };

                return initLearnCard.invoke.issuePresentation(vp, {
                    ...(params.domain ? { domain: params.domain } : {}),
                    ...(params.challenge ? { challenge: params.challenge } : {}),
                });
            },

            /**
             * Verifies a LER-focused VP and returns structured result details.
             *
             * Overall `verified` allows explicitly self-issued items when determining
             * final status, while still surfacing per-credential verification results.
             */
            verifyLerPresentation: async (
                _learnCard,
                { presentation, domain, challenge }: VerifyLerPresentationParams
            ): Promise<VerificationResult> => {
                const presCheck = await initLearnCard.invoke.verifyPresentation(presentation, {
                    ...(domain ? { domain } : {}),
                    ...(challenge ? { challenge } : {}),
                });

                const presentationResult = {
                    verified: presCheck.errors.length === 0,
                    errors: presCheck.errors.length ? presCheck.errors : undefined,
                };

                const credentialResults: VerificationResult['credentialResults'] = [];

                if (typeof presentation !== 'string') {
                    const holder = presentation.holder;
                    const vcs = toArray<VerifiableCredential>(
                        presentation.verifiableCredential as any
                    );

                    for (const credential of vcs) {
                        try {
                            const credCheck = await initLearnCard.invoke.verifyCredential(
                                credential
                            );
                            const issuerDid =
                                typeof credential.issuer === 'string'
                                    ? credential.issuer
                                    : credential.issuer?.id;
                            const isSelfIssued =
                                credentialHasLerRsType(credential) ||
                                (!!holder && !!issuerDid && issuerDid === holder);

                            credentialResults.push({
                                credential,
                                verified: credCheck.errors.length === 0,
                                isSelfIssued,
                                errors: credCheck.errors.length ? credCheck.errors : undefined,
                            });
                        } catch (err) {
                            credentialResults.push({
                                credential,
                                verified: false,
                                isSelfIssued: false,
                                errors: [
                                    err instanceof Error
                                        ? err.message
                                        : 'Unknown error verifying credential',
                                ],
                            });
                        }
                    }
                }

                return {
                    verified:
                        presentationResult.verified &&
                        credentialResults.every(r => r.verified || r.isSelfIssued),
                    presentationResult,
                    credentialResults,
                };
            },

            /**
             * Issues a signed TrustedCareerProfile wrapper VC for resume package publishing.
             *
             * Includes:
             * - public PDF URL
             * - PDF SHA-256 hash
             * - included credential references
             * - generation timestamp
             *
             * Co-sign fields are intentionally stubbed for MVP and currently rejected.
             */
            createTcpWrapperVc: async (_learnCard, params): Promise<VerifiableCredential> => {
                const signer = params.learnCard ?? _learnCard;
                const did = signer.id.did();
                const issuedAt = params.issuanceDate ?? new Date().toISOString();
                const generatedAt = params.generatedAt ?? issuedAt;
                const subjectDid = params.subjectDid ?? did;

                if (params.enableCoSign) {
                    throw new Error('createTcpWrapperVc: co-signing is not enabled in MVP');
                }

                if (params.coSignerDid) {
                    throw new Error(
                        'createTcpWrapperVc: coSignerDid is reserved for future co-sign support'
                    );
                }

                // NOTE: We inline the TCP context for local testing while the hosted
                // context URL is not yet available in all environments.
                const inlineTcpContext = {
                    '@version': 1.1,
                    id: '@id',
                    type: '@type',
                    TrustedCareerProfile: 'https://ctx.learncard.com/tcp#TrustedCareerProfile',
                    ResumePackage: 'https://ctx.learncard.com/tcp#ResumePackage',
                    pdfUrl: {
                        '@id': 'https://ctx.learncard.com/tcp#pdfUrl',
                        '@type': '@id',
                    },
                    pdfHash: 'https://ctx.learncard.com/tcp#pdfHash',
                    hashAlgorithm: 'https://ctx.learncard.com/tcp#hashAlgorithm',
                    includedCredentials: {
                        '@id': 'https://ctx.learncard.com/tcp#includedCredentials',
                        '@container': '@set',
                    },
                    category: 'https://ctx.learncard.com/tcp#category',
                    generatedAt: {
                        '@id': 'https://ctx.learncard.com/tcp#generatedAt',
                        '@type': 'http://www.w3.org/2001/XMLSchema#dateTime',
                    },
                };

                const unsignedVC: UnsignedVC = {
                    '@context': [LER_RS_CREDENTIAL_CONTEXT_V1, inlineTcpContext],
                    type: ['VerifiableCredential', TCP_WRAPPER_TYPE],
                    id: params.wrapperId,
                    issuer: did,
                    issuanceDate: issuedAt,
                    credentialSubject: {
                        id: subjectDid,
                        type: 'ResumePackage',
                        pdfUrl: params.pdfUrl,
                        pdfHash: params.pdfHash,
                        hashAlgorithm: 'SHA-256',
                        includedCredentials: params.includedCredentials,
                        generatedAt,
                    },
                };

                return initLearnCard.invoke.issueCredential(unsignedVC, {
                    proofPurpose: 'assertionMethod',
                });
            },
        },
    };
};
