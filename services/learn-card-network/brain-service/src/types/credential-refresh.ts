import { z } from 'zod';

import { CredentialRefreshSigningModeValidator } from '@learncard/types';

/**
 * Types for the managed credential refresh aggregate (LC-2117 / LC-2135 / LC-2136).
 *
 * The aggregate persists metadata only. Credential version payloads are stored on
 * immutable Credential nodes as holder-encrypted JWE JSON — never plaintext VC JSON.
 */

export const CredentialRefreshStateValidator = z.enum(['awaiting_claim', 'active', 'revoked']);
export type CredentialRefreshState = z.infer<typeof CredentialRefreshStateValidator>;

/** The managed refresh aggregate node (metadata only — no credential bodies) */
export const CredentialRefreshRecordValidator = z.object({
    /** Cryptographically random, unguessable public route identifier */
    refreshId: z.string().min(1),
    issuerProfileId: z.string().min(1),
    issuerDid: z.string().min(1),
    holderProfileId: z.string().min(1).optional(),
    holderDid: z.string().min(1),
    /** Stable nonempty VC identifier shared by every version */
    credentialId: z.string().min(1),
    state: CredentialRefreshStateValidator,
    /** Monotonic managed version number; starts at 1 for the original */
    currentVersion: z.number().int().positive(),
    /** Opaque validator derived from the current encrypted response */
    etag: z.string().optional(),
    /** Server-keyed digest of the canonical user-visible content projection */
    materialDigest: z.string().optional(),
    signingMode: CredentialRefreshSigningModeValidator.optional(),
    /** Idempotency key that produced the current version */
    idempotencyKey: z.string().optional(),
    /** Issuer-authored, privacy-safe update summary */
    updateSummary: z.string().optional(),
    lastPublishedAt: z.string().optional(),
    /** Notification delivery window key used to collapse repeat notifications */
    notificationWindowKey: z.string().optional(),
    lastNotificationId: z.string().optional(),
    lastNotificationAt: z.string().optional(),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
});
export type CredentialRefreshRecord = z.infer<typeof CredentialRefreshRecordValidator>;

export const CreateCredentialRefreshParamsValidator = z.object({
    issuerProfileId: z.string().min(1),
    issuerDid: z.string().min(1),
    holderDid: z.string().min(1),
    holderProfileId: z.string().min(1).optional(),
    credentialId: z.string().min(1),
    /** Storage id of the immutable Credential node holding the original (version 1) */
    rootCredentialNodeId: z.string().min(1),
    etag: z.string().optional(),
    materialDigest: z.string().optional(),
    signingMode: CredentialRefreshSigningModeValidator.optional(),
    idempotencyKey: z.string().optional(),
    updateSummary: z.string().optional(),
});
export type CreateCredentialRefreshParams = z.infer<typeof CreateCredentialRefreshParamsValidator>;

/**
 * An immutable credential version node. `credential` holds holder-encrypted JWE JSON
 * (stringified), never plaintext VC JSON. `refreshVersionKey` enforces one node per
 * (refreshId, version) pair, which is what guarantees a single concurrent writer.
 */
export const CredentialRefreshVersionNodeValidator = z.object({
    id: z.string().min(1),
    credential: z.string().min(1),
    refreshId: z.string().min(1),
    version: z.number().int().positive(),
    refreshVersionKey: z.string().min(1),
    publishedAt: z.string().min(1),
    effectiveAt: z.string().optional(),
    etag: z.string().optional(),
    signingMode: CredentialRefreshSigningModeValidator,
    updateSummary: z.string().optional(),
});
export type CredentialRefreshVersionNode = z.infer<typeof CredentialRefreshVersionNodeValidator>;

/** Metadata-only projection of a version node (issuer/holder history — no payload) */
export const CredentialRefreshVersionRecordValidator = CredentialRefreshVersionNodeValidator.omit({
    credential: true,
});
export type CredentialRefreshVersionRecord = z.infer<
    typeof CredentialRefreshVersionRecordValidator
>;

export const AdvanceCredentialRefreshHeadParamsValidator = z.object({
    refreshId: z.string().min(1),
    /** Version read before preparing the publication; advance only if it still matches */
    expectedVersion: z.number().int().positive(),
    /** Holder-encrypted JWE JSON string for the new immutable version */
    encryptedCredential: z.string().min(1),
    publishedAt: z.string().min(1).optional(),
    effectiveAt: z.string().optional(),
    etag: z.string().optional(),
    materialDigest: z.string().optional(),
    signingMode: CredentialRefreshSigningModeValidator,
    updateSummary: z.string().optional(),
    idempotencyKey: z.string().optional(),
});
export type AdvanceCredentialRefreshHeadParams = z.infer<
    typeof AdvanceCredentialRefreshHeadParamsValidator
>;

export const AdvanceCredentialRefreshHeadStatusValidator = z.enum([
    /** New immutable version created and head advanced */
    'advanced',
    /** Idempotent retry: a previous call with the same key already succeeded */
    'replay',
    /** expectedVersion no longer matches (or aggregate missing); nothing was written */
    'conflict',
]);
export type AdvanceCredentialRefreshHeadStatus = z.infer<
    typeof AdvanceCredentialRefreshHeadStatusValidator
>;

export const AdvanceCredentialRefreshHeadResultValidator = z.object({
    status: AdvanceCredentialRefreshHeadStatusValidator,
    refreshId: z.string().min(1),
    version: z.number().int().positive(),
    publishedAt: z.string().optional(),
});
export type AdvanceCredentialRefreshHeadResult = z.infer<
    typeof AdvanceCredentialRefreshHeadResultValidator
>;
