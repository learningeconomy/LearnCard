import { z } from 'zod/v4';

import { UnsignedVCValidator, VCValidator } from './vc';
import { JWEValidator } from './crypto';

/**
 * Shared contracts for managed credential refresh (LC-2117, LC-2135, LC-2136).
 *
 * The generic `RefreshServiceValidator` in vc.ts intentionally remains permissive so
 * unknown third-party refresh services keep parsing. These validators model the
 * LearnCard-managed `1EdTechCredentialRefresh` service, its allocation/publication
 * lifecycle, the holder-facing response envelopes, and safe refresh outcomes.
 */

/** LearnCard DID-auth extension descriptor for a managed refresh service */
export const LearnCardRefreshAuthorizationValidator = z
    .object({ type: z.literal('LearnCardDIDAuth') })
    .catchall(z.any());
export type LearnCardRefreshAuthorization = z.infer<typeof LearnCardRefreshAuthorizationValidator>;

/**
 * Managed refresh service descriptor.
 *
 * Requires a resolvable `id` and the standard 1EdTech type, and optionally carries a
 * LearnCard authorization descriptor (permitted by the extensible 1EdTech model).
 */
export const ManagedCredentialRefreshServiceValidator = z
    .object({
        id: z.string().min(1),
        type: z.literal('1EdTechCredentialRefresh'),
        authorization: LearnCardRefreshAuthorizationValidator.optional(),
    })
    .catchall(z.any());
export type ManagedCredentialRefreshService = z.infer<
    typeof ManagedCredentialRefreshServiceValidator
>;

// --- Allocation (before signing) -------------------------------------------

export const AllocateCredentialRefreshInputValidator = z.object({
    holder: z.object({
        profileId: z.string().optional(),
        did: z.string().min(1),
    }),
    credentialId: z.string().min(1),
});
export type AllocateCredentialRefreshInput = z.infer<
    typeof AllocateCredentialRefreshInputValidator
>;

export const AllocateCredentialRefreshResultValidator = z.object({
    refreshId: z.string().min(1),
    refreshService: ManagedCredentialRefreshServiceValidator.extend({
        authorization: LearnCardRefreshAuthorizationValidator,
    }),
});
export type AllocateCredentialRefreshResult = z.infer<
    typeof AllocateCredentialRefreshResultValidator
>;

// --- Publication ------------------------------------------------------------

export const CredentialRefreshSigningModeValidator = z.enum(['issuer-signed', 'signing-authority']);
export type CredentialRefreshSigningMode = z.infer<typeof CredentialRefreshSigningModeValidator>;

const PublishCredentialRefreshBaseFields = {
    refreshId: z.string().min(1),
    notifyHolder: z.boolean().optional(),
    updateSummary: z.string().optional(),
    idempotencyKey: z.string().optional(),
};

/** Issuer-signed mode: the caller supplies a fully signed updated VC */
export const PublishIssuerSignedRefreshValidator = z.object({
    ...PublishCredentialRefreshBaseFields,
    mode: z.literal('issuer-signed'),
    signedCredential: VCValidator,
});
export type PublishIssuerSignedRefresh = z.infer<typeof PublishIssuerSignedRefreshValidator>;

/** Signing-authority mode: the caller supplies updated unsigned claims and brain-service signs */
export const PublishSigningAuthorityRefreshValidator = z.object({
    ...PublishCredentialRefreshBaseFields,
    mode: z.literal('signing-authority'),
    credential: UnsignedVCValidator,
    signingAuthority: z
        .object({
            type: z.string().min(1),
        })
        .catchall(z.any()),
});
export type PublishSigningAuthorityRefresh = z.infer<
    typeof PublishSigningAuthorityRefreshValidator
>;

export const PublishCredentialRefreshInputValidator = z.discriminatedUnion('mode', [
    PublishIssuerSignedRefreshValidator,
    PublishSigningAuthorityRefreshValidator,
]);
export type PublishCredentialRefreshInput = z.infer<typeof PublishCredentialRefreshInputValidator>;

export const PublishCredentialRefreshNotificationValidator = z.enum([
    'queued',
    'suppressed',
    'not-applicable',
]);
export type PublishCredentialRefreshNotification = z.infer<
    typeof PublishCredentialRefreshNotificationValidator
>;

export const PublishCredentialRefreshResultValidator = z.object({
    refreshId: z.string().min(1),
    version: z.number().int().positive(),
    publishedAt: z.string().min(1),
    notification: PublishCredentialRefreshNotificationValidator,
});
export type PublishCredentialRefreshResult = z.infer<
    typeof PublishCredentialRefreshResultValidator
>;

// --- Version history (metadata only, never credential bodies) ----------------

export const CredentialRefreshVersionMetadataValidator = z.object({
    version: z.number().int().positive(),
    publishedAt: z.string().min(1),
    effectiveAt: z.string().optional(),
    etag: z.string().optional(),
    signingMode: CredentialRefreshSigningModeValidator.optional(),
    updateSummary: z.string().optional(),
});
export type CredentialRefreshVersionMetadata = z.infer<
    typeof CredentialRefreshVersionMetadataValidator
>;

export const GetCredentialRefreshHistoryInputValidator = z.object({
    refreshId: z.string().min(1),
    cursor: z.string().optional(),
    limit: z.number().int().positive().optional(),
});
export type GetCredentialRefreshHistoryInput = z.infer<
    typeof GetCredentialRefreshHistoryInputValidator
>;

export const GetCredentialRefreshHistoryResultValidator = z.object({
    records: CredentialRefreshVersionMetadataValidator.array(),
    hasMore: z.boolean(),
    cursor: z.string().optional(),
});
export type GetCredentialRefreshHistoryResult = z.infer<
    typeof GetCredentialRefreshHistoryResultValidator
>;

// --- Holder authentication challenge ------------------------------------------

/**
 * Short-lived, single-use challenge returned by a managed refresh endpoint. Contains
 * no holder, issuer, credential, or lifecycle information.
 */
export const CredentialRefreshChallengeValidator = z.object({
    challenge: z.string().min(1),
    expiresAt: z.string().min(1),
    domain: z.string().optional(),
    scheme: z.literal('LearnCardDIDAuth').optional(),
});
export type CredentialRefreshChallenge = z.infer<typeof CredentialRefreshChallengeValidator>;

// --- Response envelopes --------------------------------------------------------

/** Plain (interoperable) response: an unencrypted signed VC */
export const PublicCredentialRefreshEnvelopeValidator = z.object({
    format: z.literal('vc'),
    credential: VCValidator,
    etag: z.string().optional(),
});
export type PublicCredentialRefreshEnvelope = z.infer<
    typeof PublicCredentialRefreshEnvelopeValidator
>;

/** Managed response: the credential encrypted to the holder as a JWE */
export const JweCredentialRefreshEnvelopeValidator = z.object({
    format: z.literal('jwe'),
    jwe: JWEValidator,
    etag: z.string().optional(),
});
export type JweCredentialRefreshEnvelope = z.infer<typeof JweCredentialRefreshEnvelopeValidator>;

export const CredentialRefreshResponseEnvelopeValidator = z.discriminatedUnion('format', [
    PublicCredentialRefreshEnvelopeValidator,
    JweCredentialRefreshEnvelopeValidator,
]);
export type CredentialRefreshResponseEnvelope = z.infer<
    typeof CredentialRefreshResponseEnvelopeValidator
>;

// --- Refresh outcomes ----------------------------------------------------------

/**
 * Safe, machine-readable failure codes. Raw response bodies are never surfaced.
 */
export const CredentialRefreshFailureCodeValidator = z.enum([
    'UNAVAILABLE',
    'TIMEOUT',
    'UNSUPPORTED_SERVICE',
    'UNAUTHORIZED',
    'MALFORMED_RESPONSE',
    'INVALID_PROOF',
    'ISSUER_MISMATCH',
    'ID_MISMATCH',
    'ROLLBACK',
    'REVOKED',
    'UNSAFE_ENDPOINT',
]);
export type CredentialRefreshFailureCode = z.infer<typeof CredentialRefreshFailureCodeValidator>;

export const CredentialRefreshUpdatedResultValidator = z.object({
    status: z.literal('updated'),
    credential: VCValidator,
    etag: z.string().optional(),
    managedVersion: z.number().int().positive().optional(),
});
export type CredentialRefreshUpdatedResult = z.infer<
    typeof CredentialRefreshUpdatedResultValidator
>;

export const CredentialRefreshUnchangedResultValidator = z.object({
    status: z.literal('unchanged'),
    checkedAt: z.string().min(1),
    etag: z.string().optional(),
});
export type CredentialRefreshUnchangedResult = z.infer<
    typeof CredentialRefreshUnchangedResultValidator
>;

export const CredentialRefreshUnsupportedResultValidator = z.object({
    status: z.literal('unsupported'),
});
export type CredentialRefreshUnsupportedResult = z.infer<
    typeof CredentialRefreshUnsupportedResultValidator
>;

export const CredentialRefreshFailedResultValidator = z.object({
    status: z.literal('failed'),
    code: CredentialRefreshFailureCodeValidator,
    retryable: z.boolean(),
});
export type CredentialRefreshFailedResult = z.infer<typeof CredentialRefreshFailedResultValidator>;

export const CredentialRefreshResultValidator = z.discriminatedUnion('status', [
    CredentialRefreshUpdatedResultValidator,
    CredentialRefreshUnchangedResultValidator,
    CredentialRefreshUnsupportedResultValidator,
    CredentialRefreshFailedResultValidator,
]);
export type CredentialRefreshResult = z.infer<typeof CredentialRefreshResultValidator>;
