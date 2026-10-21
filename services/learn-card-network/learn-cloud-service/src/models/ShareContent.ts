import { z } from 'zod';
import {
    JWEValidator,
    MAX_SHARE_CIPHERTEXT_BYTES,
    MAX_SHARE_RECOVERY_JWE_BYTES,
    ShareEnvelopeValidator,
    ShareLinkIdValidator,
    ShareOwnerRecoveryValidator,
    decodedBase64UrlByteLength,
    type ShareEnvelope,
    type ShareOwnerRecovery,
    utf8ByteLength,
} from '@learncard/types';

import {
    computeShareContentRequestHash,
    isOpaqueIdentifier,
    isSafeContentVersion,
} from '@helpers/share-content-auth/canonical';

/**
 * LC-2187 dedicated LearnCloud `share_content` collection.
 *
 * This module defines the *storage* grammar for an immutable encrypted share
 * object plus its permanent deletion tombstone. It is deliberately separate
 * from the recipient manifest owners in `@learncard/types`: it never models
 * plaintext, source URIs or keys, only opaque bindings and the already-encrypted
 * envelope/recovery bytes.
 *
 * Security invariants encoded here:
 * - The immutable identity is `(namespace, objectId)`. Every other binding
 *   (`ownerProfileId`, `shareId`, `contentVersion`, `operationId`) is part of
 *   the exact tuple and must match on every read/mutation.
 * - `contentHash` is *derived* by {@link computeShareContentHash} over the full
 *   validated immutable record (all bindings plus the ciphertext envelope and
 *   the owner-encrypted recovery). A caller-supplied hash is never accepted, so
 *   a forged hash cannot mask divergent bytes.
 * - The recovery projection is deliberately owner-only at the route layer. The
 *   stored recovery JWE is strict at the top level: unknown metadata/URL fields
 *   are rejected, not persisted.
 * - Bound sizes: decoded ciphertext (tag included) is at most
 *   {@link MAX_SHARE_CIPHERTEXT_BYTES}; the serialized recovery JWE is at most
 *   {@link MAX_SHARE_RECOVERY_JWE_BYTES}.
 */

/** MongoDB collection name for immutable encrypted share content. */
export const SHARE_CONTENT_COLLECTION = 'share_content';

const SHARE_CONTENT_HASH_PATTERN = /^[0-9a-f]{64}$/;

/** Opaque, URL-safe binding identifier. Deliberately not a UUID-only check. */
const opaqueIdentifier = (label: string, maxLength = 128) =>
    z.string().refine(value => isOpaqueIdentifier(value, maxLength), {
        message: `${label} must be an opaque URL-safe identifier of 1..${maxLength} characters`,
    });

/** Service/network/tenant namespace. Opaque; not a URL or host. */
export const ShareContentNamespaceValidator = opaqueIdentifier('namespace');
export type ShareContentNamespace = z.infer<typeof ShareContentNamespaceValidator>;

/** Opaque owner profile id (existing ids are opaque strings, not necessarily UUIDs). */
export const ShareContentOwnerProfileIdValidator = opaqueIdentifier('ownerProfileId');
export type ShareContentOwnerProfileId = z.infer<typeof ShareContentOwnerProfileIdValidator>;

/** Opaque immutable object id reserved by Brain. Never a URI. */
export const ShareContentObjectIdValidator = opaqueIdentifier('objectId');
export type ShareContentObjectId = z.infer<typeof ShareContentObjectIdValidator>;

/** Opaque operation/idempotency id that owns the immutable object. */
export const ShareContentOperationIdValidator = opaqueIdentifier('operationId');
export type ShareContentOperationId = z.infer<typeof ShareContentOperationIdValidator>;

/** Positive safe-integer content version (`1..2^31-1`). */
export const ShareContentVersionValidator = z
    .number()
    .refine(isSafeContentVersion, { message: 'contentVersion must be a safe integer >= 1' });
export type ShareContentContentVersion = z.infer<typeof ShareContentVersionValidator>;

/** Lowercase hex SHA-256 of the derived immutable record. */
export const ShareContentHashValidator = z
    .string()
    .regex(SHARE_CONTENT_HASH_PATTERN, { message: 'contentHash must be lowercase hex sha256' });
export type ShareContentHash = z.infer<typeof ShareContentHashValidator>;

/**
 * Strict top-level owner recovery JWE. Wraps the shared
 * {@link ShareOwnerRecoveryValidator} (which enforces the serialized 64 KiB cap)
 * and additionally rejects unknown top-level keys so arbitrary metadata or URLs
 * can never be persisted alongside the opaque recovery.
 */
export const ShareContentOwnerRecoveryValidator = JWEValidator.strict().refine(
    value => ShareOwnerRecoveryValidator.safeParse(value).success,
    { message: 'must be a valid bounded owner-encrypted recovery JWE' }
);
export type ShareContentOwnerRecovery = z.infer<typeof ShareContentOwnerRecoveryValidator>;

/**
 * The exact, immutable object binding. The repository applies this to every
 * operation; a mutation of any single field fails closed.
 */
export const ShareContentObjectBindingValidator = z
    .object({
        namespace: ShareContentNamespaceValidator,
        ownerProfileId: ShareContentOwnerProfileIdValidator,
        shareId: ShareLinkIdValidator,
        contentVersion: ShareContentVersionValidator,
        objectId: ShareContentObjectIdValidator,
        operationId: ShareContentOperationIdValidator,
    })
    .strict();
export type ShareContentObjectBinding = z.infer<typeof ShareContentObjectBindingValidator>;

/**
 * A create-only write. `contentHash` is intentionally absent: the repository
 * derives it, so a caller cannot supply (and therefore cannot forge) it.
 */
export const ShareContentPutInputValidator = ShareContentObjectBindingValidator.extend({
    envelope: ShareEnvelopeValidator,
    ownerEncryptedRecovery: ShareContentOwnerRecoveryValidator,
}).strict();
export type ShareContentPutInput = z.infer<typeof ShareContentPutInputValidator>;

/**
 * Derive the content hash over the complete immutable record: all bindings plus
 * the validated ciphertext envelope and the owner-encrypted recovery. The C1
 * canonical serializer makes the result deterministic and rejects unsupported
 * values instead of coercing them.
 */
export const computeShareContentHash = (input: ShareContentPutInput): string =>
    computeShareContentRequestHash({
        namespace: input.namespace,
        ownerProfileId: input.ownerProfileId,
        shareId: input.shareId,
        contentVersion: input.contentVersion,
        objectId: input.objectId,
        operationId: input.operationId,
        envelope: input.envelope,
        ownerEncryptedRecovery: input.ownerEncryptedRecovery,
    });

/** Hash known before Brain allocates object/operation IDs; reservation binding. */
export const computeSharePayloadHash = (
    input: Pick<ShareContentPutInput, 'envelope' | 'ownerEncryptedRecovery'>
): string =>
    computeShareContentRequestHash({
        envelope: input.envelope,
        ownerEncryptedRecovery: input.ownerEncryptedRecovery,
    });

/**
 * Measure the encoded payload for reconciliation/stats. Assumes `input` already
 * passed {@link ShareContentPutInputValidator}.
 */
export const measureShareContentPayload = (
    input: Pick<ShareContentPutInput, 'envelope' | 'ownerEncryptedRecovery'>
): { ciphertextBytes: number; recoveryBytes: number } => {
    const ciphertextBytes = decodedBase64UrlByteLength(input.envelope.ct);

    if (ciphertextBytes === null) {
        throw new Error('validated envelope ciphertext must be canonical base64url');
    }

    return {
        ciphertextBytes,
        recoveryBytes: utf8ByteLength(JSON.stringify(input.ownerEncryptedRecovery)),
    };
};

/** Immutable active document. */
export const MongoShareContentActiveValidator = ShareContentObjectBindingValidator.extend({
    kind: z.literal('active'),
    contentHash: ShareContentHashValidator,
    payloadHash: ShareContentHashValidator,
    envelope: ShareEnvelopeValidator,
    ownerEncryptedRecovery: ShareContentOwnerRecoveryValidator,
    ciphertextBytes: z.number().int().min(16).max(MAX_SHARE_CIPHERTEXT_BYTES),
    recoveryBytes: z.number().int().min(1).max(MAX_SHARE_RECOVERY_JWE_BYTES),
    createdAt: z.date(),
}).strict();
export type MongoShareContentActive = z.infer<typeof MongoShareContentActiveValidator>;

/**
 * Permanent deletion tombstone. Retains the binding tuple and, where known, the
 * derived hash; never retains ciphertext or recovery. A tombstone blocks every
 * later put for the same `(namespace, objectId)` identity.
 */
export const MongoShareContentTombstoneValidator = ShareContentObjectBindingValidator.extend({
    kind: z.literal('tombstone'),
    contentHash: ShareContentHashValidator.optional(),
    deletedAt: z.date(),
}).strict();
export type MongoShareContentTombstone = z.infer<typeof MongoShareContentTombstoneValidator>;

/** Stored document union. */
export type MongoShareContentDocument = MongoShareContentActive | MongoShareContentTombstone;

/** Raw ciphertext envelope carried by an active object. */
export type { ShareEnvelope, ShareOwnerRecovery };
