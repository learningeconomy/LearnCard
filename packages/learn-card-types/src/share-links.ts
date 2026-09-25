import { z } from 'zod/v4';

import { JWEValidator } from './crypto';
import { PaginationResponseValidator } from './mongo';
import { VCValidator, VPValidator } from './vc';

/**
 * LC-2187 multi-credential share-link protocol types.
 *
 * This module is the single source of truth for the *recipient* payload grammar
 * and the owner-facing recovery/API shapes. It is deliberately storage-agnostic:
 * it defines bytes and structure, never where those bytes live.
 *
 * Security boundaries encoded here (see planning/lc-2187/task-a-contract.md and
 * task-a2-review.md):
 * - A share id / content key / IV / ciphertext is accepted only when it is
 *   canonical base64url: alphabet, no `=`, exact decoded byte length, and a
 *   re-encode round trip. Permissive decoders accept unused padding bits, so one
 *   byte string would otherwise have several spellings and could defeat an AAD
 *   or signature binding keyed on the string.
 * - The recipient manifest never carries source URIs. Credentials are referenced
 *   by local index into the holder-signed presentation only.
 * - Envelope authenticity (AES-GCM) only proves a key holder produced the bytes.
 *   It is NOT issuer identity. Signed VP/credential verification is a separate,
 *   later step (see `ShareManifestProofVerifier` in learn-card-base).
 */

/** Raw byte length of the opaque share id (128 bits). */
export const SHARE_LINK_ID_BYTES = 16;
/** Raw byte length of the symmetric content key (256 bits). */
export const SHARE_CONTENT_KEY_BYTES = 32;
/** AES-GCM nonce length (96 bits). */
export const SHARE_IV_BYTES = 12;
/** AES-GCM authentication tag length (128 bits). */
export const SHARE_TAG_BYTES = 16;
/** Maximum decoded ciphertext length, tag included (512 KiB). */
export const MAX_SHARE_CIPHERTEXT_BYTES = 512 * 1024;
/** Maximum UTF-8 length of the serialized owner recovery JWE (64 KiB). */
export const MAX_SHARE_RECOVERY_JWE_BYTES = 64 * 1024;
/** Maximum number of selected credentials in one share (50). */
export const MAX_SELECTED_CREDENTIALS = 50;
/** Maximum number of public endorsements attached to one share (200). */
export const MAX_ENDORSEMENTS = 200;
/**
 * Conservative total bound on holder-signed VP members (selected + endorsements).
 * The sum is intentional: the two collections are disjoint and every member must
 * be classified exactly once, so their maximums bound the VP.
 */
export const MAX_VP_MEMBERS = MAX_SELECTED_CREDENTIALS + MAX_ENDORSEMENTS;
/** Maximum length of an owner-private source URI in recovery. */
export const MAX_SHARE_SOURCE_URI_CHARS = 2048;
/**
 * Maximum UTF-8 byte length of one complete owner share-link request body,
 * measured raw (before Zod strips unknown fields). This is the transport-level
 * bound enforced ahead of schema parsing; individual field bounds are not a
 * substitute for it.
 */
export const MAX_SHARE_LINK_REQUEST_BYTES = 1024 * 1024;

/** Recipient plaintext protocol id. */
export const SHARE_LINK_PROTOCOL = 'lc-share/v1';
/** Owner recovery plaintext protocol id. */
export const SHARE_RECOVERY_PROTOCOL = 'lc-share-recovery/v1';
/** Domain-separation prefix for the AES-GCM AAD. */
export const SHARE_AAD_PREFIX = 'lc-share:v1';

const BASE64URL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** Reverse lookup for the base64url alphabet; -1 marks an invalid character. */
const BASE64URL_LOOKUP = (() => {
    const table = new Int16Array(128).fill(-1);
    for (let index = 0; index < BASE64URL_ALPHABET.length; index += 1) {
        table[BASE64URL_ALPHABET.charCodeAt(index)] = index;
    }
    return table;
})();

/**
 * Encode bytes as unpadded base64url. Browser/Node isomorphic on purpose: no
 * `Buffer`, and no dependency on `btoa`/`atob` encoding quirks.
 */
export const encodeBase64Url = (bytes: Uint8Array): string => {
    let output = '';

    for (let index = 0; index < bytes.length; index += 3) {
        const first = bytes[index];
        const second = bytes[index + 1];
        const third = bytes[index + 2];

        output += BASE64URL_ALPHABET[first >> 2];
        output += BASE64URL_ALPHABET[((first & 0b11) << 4) | ((second ?? 0) >> 4)];
        if (second === undefined) break;
        output += BASE64URL_ALPHABET[((second & 0b1111) << 2) | ((third ?? 0) >> 6)];
        if (third === undefined) break;
        output += BASE64URL_ALPHABET[third & 0b111111];
    }

    return output;
};

/**
 * Decode unpadded base64url to bytes. Returns `null` for any non-alphabet,
 * padding or otherwise malformed input. This step is intentionally more lenient
 * about trailing padding bits than {@link isCanonicalBase64Url}; callers that
 * need one unambiguous spelling must re-encode and compare.
 */
export const decodeBase64Url = (value: string): Uint8Array | null => {
    if (typeof value !== 'string') return null;

    const output = new Uint8Array(Math.floor((value.length * 6) / 8));
    let bits = 0;
    let bitCount = 0;
    let outputIndex = 0;

    for (let index = 0; index < value.length; index += 1) {
        const code = value.charCodeAt(index);
        const digit = code < 128 ? BASE64URL_LOOKUP[code] : -1;
        if (digit < 0) return null;

        bits = (bits << 6) | digit;
        bitCount += 6;

        if (bitCount >= 8) {
            bitCount -= 8;
            output[outputIndex] = (bits >> bitCount) & 0xff;
            outputIndex += 1;
        }
    }

    return output;
};

/**
 * Strict canonicity check: valid alphabet, no padding, and
 * `encode(decode(value)) === value`. When `expectedBytes` is supplied the decoded
 * length must match exactly.
 */
export const isCanonicalBase64Url = (value: unknown, expectedBytes?: number): boolean => {
    if (typeof value !== 'string') return false;
    if (expectedBytes !== undefined && value.length !== Math.ceil((expectedBytes * 4) / 3))
        return false;

    const decoded = decodeBase64Url(value);
    if (decoded === null) return false;
    if (expectedBytes !== undefined && decoded.length !== expectedBytes) return false;

    return encodeBase64Url(decoded) === value;
};

/** Base64url-encoded byte length without materializing the decoded string. */
export const decodedBase64UrlByteLength = (value: string): number | null =>
    decodeBase64Url(value)?.length ?? null;

/** UTF-8 byte length, independent of the platform's string length semantics. */
export const utf8ByteLength = (value: string): number => new TextEncoder().encode(value).length;

const canonicalBase64Url = (bytes: number) =>
    z.string().refine(value => isCanonicalBase64Url(value, bytes), {
        message: `must be canonical base64url for exactly ${bytes} bytes`,
    });

/** 16-byte / 22-character share id. */
export const ShareLinkIdValidator = canonicalBase64Url(SHARE_LINK_ID_BYTES);
export type ShareLinkId = z.infer<typeof ShareLinkIdValidator>;

/** 32-byte / 43-character symmetric content key. */
export const ShareContentKeyValidator = canonicalBase64Url(SHARE_CONTENT_KEY_BYTES);
export type ShareContentKey = z.infer<typeof ShareContentKeyValidator>;

/** 12-byte / 16-character AES-GCM nonce. */
export const ShareIvValidator = canonicalBase64Url(SHARE_IV_BYTES);
export type ShareIv = z.infer<typeof ShareIvValidator>;

/**
 * Ciphertext||tag as canonical base64url. The decoded length includes the
 * 16-byte GCM tag, must be at least that tag, and is capped at
 * {@link MAX_SHARE_CIPHERTEXT_BYTES}.
 */
export const ShareCiphertextValidator = z.string().refine(
    value => {
        if (value.length > Math.ceil((MAX_SHARE_CIPHERTEXT_BYTES * 4) / 3)) return false;
        const decoded = decodeBase64Url(value);
        if (decoded === null) return false;
        if (encodeBase64Url(decoded) !== value) return false;
        return decoded.length >= SHARE_TAG_BYTES && decoded.length <= MAX_SHARE_CIPHERTEXT_BYTES;
    },
    {
        message: `must be canonical base64url decoding to ${SHARE_TAG_BYTES}..${MAX_SHARE_CIPHERTEXT_BYTES} bytes`,
    }
);
export type ShareCiphertext = z.infer<typeof ShareCiphertextValidator>;

/**
 * AES-256-GCM envelope. `v`/`alg` are literals so an unknown version or
 * algorithm is rejected by the schema before any decryption is attempted.
 */
export const ShareEnvelopeValidator = z
    .object({
        v: z.literal(1),
        alg: z.literal('A256GCM'),
        iv: ShareIvValidator,
        ct: ShareCiphertextValidator,
    })
    .strict();
export type ShareEnvelope = z.infer<typeof ShareEnvelopeValidator>;

const safeVersion = z
    .number()
    .int()
    .min(1)
    .max(2 ** 31 - 1);
const safeCredentialIndex = z
    .number()
    .int()
    .min(0)
    .max(MAX_VP_MEMBERS - 1);

/** Index-only reference to a selected credential inside the signed VP. */
export const ShareSelectionEntryValidator = z
    .object({ credentialIndex: safeCredentialIndex })
    .strict();
export type ShareSelectionEntry = z.infer<typeof ShareSelectionEntryValidator>;

/**
 * Index-only reference to an endorsement credential, plus the selected credential
 * it endorses. Extra keys (for example a source `ref`/`uri`) are rejected so a
 * recipient payload can never leak the owner's private source index.
 */
export const ShareEndorsementEntryValidator = z
    .object({ credentialIndex: safeCredentialIndex, targetCredentialIndex: safeCredentialIndex })
    .strict();
export type ShareEndorsementEntry = z.infer<typeof ShareEndorsementEntryValidator>;

export const ShareSharerValidator = z
    .object({
        profileId: z.string().min(1).max(128),
        displayName: z.string().min(1).max(120),
        avatar: z.string().max(2048).optional(),
    })
    .strict();
export type ShareSharer = z.infer<typeof ShareSharerValidator>;

/**
 * Holder-signed presentation carried by the manifest. `verifiableCredential` is a
 * required non-empty array so the local indices are always resolvable. Individual
 * credentials keep the existing permissive VC shape (`.catchall`) — no signed
 * credential field is stripped or rewritten by validation.
 */
const presentationShape = VPValidator.extend({
    verifiableCredential: VCValidator.array().min(1).max(MAX_VP_MEMBERS),
});

/** Bound nested CLR credentials and JSON depth before schema traversal. */
const hasBoundedPresentation = (value: unknown): boolean => {
    let credentialCount = 0;
    const ancestors = new Set<object>();
    const visit = (node: unknown, depth: number): boolean => {
        if (node === null || typeof node !== 'object') return true;
        if (depth > 32 || ancestors.has(node)) return false;
        ancestors.add(node);
        try {
            for (const [key, child] of Object.entries(node)) {
                if (key === 'verifiableCredential') {
                    credentialCount += Array.isArray(child) ? child.length : 1;
                    if (credentialCount > MAX_VP_MEMBERS) return false;
                }
                if (!visit(child, depth + 1)) return false;
            }
            return true;
        } finally {
            ancestors.delete(node);
        }
    };
    return visit(value, 0);
};

// Validate without returning Zod's parsed copy: nested VC schemas may strip
// extension fields, which would change the signed document before verification.
export const ShareManifestPresentationValidator = z.custom<z.infer<typeof presentationShape>>(
    value => hasBoundedPresentation(value) && presentationShape.safeParse(value).success,
    { message: 'invalid share presentation' }
);
export type ShareManifestPresentation = z.infer<typeof ShareManifestPresentationValidator>;

export const SharePayloadValidatorShape = z
    .object({
        protocol: z.literal(SHARE_LINK_PROTOCOL),
        shareId: ShareLinkIdValidator,
        contentVersion: safeVersion,
        createdAt: z.iso.datetime(),
        sharer: ShareSharerValidator,
        presentation: ShareManifestPresentationValidator,
        selection: ShareSelectionEntryValidator.array().min(1).max(MAX_SELECTED_CREDENTIALS),
        endorsements: ShareEndorsementEntryValidator.array().max(MAX_ENDORSEMENTS).default([]),
    })
    .strict();
export type SharePayloadShape = z.infer<typeof SharePayloadValidatorShape>;

/** Structured classification failure raised by {@link classifyShareManifest}. */
export type ShareManifestClassificationCode =
    | 'NO_PRESENTATION_MEMBERS'
    | 'TOO_MANY_VP_MEMBERS'
    | 'BAD_SELECTION'
    | 'BAD_ENDORSEMENTS'
    | 'SELECTION_INDEX_OUT_OF_BOUNDS'
    | 'SELECTION_INDEX_DUPLICATE'
    | 'ENDORSEMENT_INDEX_OUT_OF_BOUNDS'
    | 'VP_MEMBER_CLASSIFIED_TWICE'
    | 'ENDORSEMENT_TARGET_NOT_SELECTED'
    | 'ENDORSEMENT_TARGET_UNBOUND'
    | 'UNCLASSIFIED_VP_MEMBER';

export interface ShareManifestClassification {
    /** Ordered selected VP member indices, exactly as the manifest declares them. */
    selectedIndices: number[];
    /** Endorsement VP member indices (unordered classification helper). */
    endorsementIndices: number[];
    /** Total VP members, all of which are classified. */
    memberCount: number;
}

export type ShareManifestClassificationResult =
    | { ok: true; classification: ShareManifestClassification }
    | {
          ok: false;
          code: ShareManifestClassificationCode;
          message: string;
          path: (string | number)[];
      };

const classificationFailure = (
    code: ShareManifestClassificationCode,
    message: string,
    path: (string | number)[] = []
): ShareManifestClassificationResult => ({ ok: false, code, message, path });

/** Read a credential's self-declared target id from either endorsement claim shape. */
const readSignedClaimId = (member: unknown): unknown => {
    if (member === null || typeof member !== 'object') return undefined;

    const record = member as Record<string, unknown>;
    const claim = record.credentialSubject ?? record.endorsement;
    if (claim === null || typeof claim !== 'object') return undefined;

    const claimRecord = claim as Record<string, unknown>;
    const nested = claimRecord.endorsement;
    const nestedId =
        nested !== null && typeof nested === 'object'
            ? (nested as Record<string, unknown>).id
            : undefined;

    return claimRecord.id ?? nestedId;
};

/**
 * Structurally classify every holder-signed VP member exactly once.
 *
 * This is *structural* validation only: it proves each member is either selected
 * or an endorsement of a selected member and that no member is smuggled. It does
 * not verify any cryptographic proof. Endorsement target binding here reads the
 * endorsement's own signed claim (`credentialSubject.id` / `endorsement.id`); it
 * is still not signature verification.
 */
export const classifyShareManifest = (
    payload: Pick<SharePayloadShape, 'presentation' | 'selection' | 'endorsements'>
): ShareManifestClassificationResult => {
    const members = payload.presentation?.verifiableCredential;

    if (!Array.isArray(members) || members.length === 0) {
        return classificationFailure('NO_PRESENTATION_MEMBERS', 'presentation has no credentials');
    }
    if (members.length > MAX_VP_MEMBERS) {
        return classificationFailure(
            'TOO_MANY_VP_MEMBERS',
            `presentation has ${members.length} members, over the ${MAX_VP_MEMBERS} bound`
        );
    }

    const selection = payload.selection;
    const endorsements = payload.endorsements ?? [];

    if (
        !Array.isArray(selection) ||
        selection.length < 1 ||
        selection.length > MAX_SELECTED_CREDENTIALS
    ) {
        return classificationFailure('BAD_SELECTION', 'selection must contain 1..50 entries');
    }
    if (!Array.isArray(endorsements) || endorsements.length > MAX_ENDORSEMENTS) {
        return classificationFailure(
            'BAD_ENDORSEMENTS',
            'endorsements must contain at most 200 entries'
        );
    }

    const selectedIndices: number[] = [];
    const selected = new Set<number>();

    for (let index = 0; index < selection.length; index += 1) {
        const entry = selection[index];
        const credentialIndex = entry?.credentialIndex;

        if (
            !Number.isSafeInteger(credentialIndex) ||
            credentialIndex < 0 ||
            credentialIndex >= members.length
        ) {
            return classificationFailure(
                'SELECTION_INDEX_OUT_OF_BOUNDS',
                `selection[${index}].credentialIndex is out of bounds`,
                ['selection', index, 'credentialIndex']
            );
        }
        if (selected.has(credentialIndex)) {
            return classificationFailure(
                'SELECTION_INDEX_DUPLICATE',
                `selection[${index}].credentialIndex is duplicated`,
                ['selection', index, 'credentialIndex']
            );
        }

        selected.add(credentialIndex);
        selectedIndices.push(credentialIndex);
    }

    const classified = new Set<number>(selected);
    const endorsementIndices: number[] = [];

    for (let index = 0; index < endorsements.length; index += 1) {
        const entry = endorsements[index];
        const credentialIndex = entry?.credentialIndex;
        const targetIndex = entry?.targetCredentialIndex;

        if (
            !Number.isSafeInteger(credentialIndex) ||
            credentialIndex < 0 ||
            credentialIndex >= members.length
        ) {
            return classificationFailure(
                'ENDORSEMENT_INDEX_OUT_OF_BOUNDS',
                `endorsements[${index}].credentialIndex is out of bounds`,
                ['endorsements', index, 'credentialIndex']
            );
        }
        if (classified.has(credentialIndex)) {
            return classificationFailure(
                'VP_MEMBER_CLASSIFIED_TWICE',
                `endorsements[${index}].credentialIndex was already classified`,
                ['endorsements', index, 'credentialIndex']
            );
        }
        if (!selected.has(targetIndex)) {
            return classificationFailure(
                'ENDORSEMENT_TARGET_NOT_SELECTED',
                `endorsements[${index}].targetCredentialIndex must reference a selected credential`,
                ['endorsements', index, 'targetCredentialIndex']
            );
        }

        const referenced = readSignedClaimId(members[credentialIndex]);
        const target = members[targetIndex];
        const targetId: unknown =
            target !== null && typeof target === 'object'
                ? (target as Record<string, unknown>).id
                : undefined;

        if (
            typeof referenced !== 'string' ||
            typeof targetId !== 'string' ||
            referenced !== targetId
        ) {
            return classificationFailure(
                'ENDORSEMENT_TARGET_UNBOUND',
                `endorsements[${index}] claim does not reference the target credential id`,
                ['endorsements', index]
            );
        }

        classified.add(credentialIndex);
        endorsementIndices.push(credentialIndex);
    }

    if (classified.size !== members.length) {
        return classificationFailure(
            'UNCLASSIFIED_VP_MEMBER',
            'every presentation member must be classified exactly once',
            ['presentation', 'verifiableCredential']
        );
    }

    return {
        ok: true,
        classification: { selectedIndices, endorsementIndices, memberCount: members.length },
    };
};

/**
 * Manifest validator. Beyond the strict shape it enforces the full structural
 * classification, so a parsed manifest is guaranteed to classify every VP member
 * exactly once with in-bounds indices and claim-bound endorsement targets.
 */
export const SharePayloadValidator = SharePayloadValidatorShape.superRefine((payload, ctx) => {
    const result = classifyShareManifest(payload);
    if (!result.ok) {
        ctx.addIssue({
            code: 'custom',
            message: result.message,
            path: result.path,
            params: { shareLinkCode: result.code },
        });
    }
});
export type SharePayload = z.infer<typeof SharePayloadValidatorShape>;

/** Ordered selected source reference. Source URIs live only in owner recovery. */
export const ShareRecoverySelectionValidator = z
    .object({
        ref: z.string().min(1).max(MAX_SHARE_SOURCE_URI_CHARS),
        order: z
            .number()
            .int()
            .min(0)
            .max(MAX_SELECTED_CREDENTIALS - 1),
    })
    .strict();
export type ShareRecoverySelection = z.infer<typeof ShareRecoverySelectionValidator>;

export const ShareRecoveryEndorsementValidator = z
    .object({ targetRef: z.string().min(1).max(MAX_SHARE_SOURCE_URI_CHARS) })
    .strict();
export type ShareRecoveryEndorsement = z.infer<typeof ShareRecoveryEndorsementValidator>;

export const ShareRecoveryPlaintextValidator = z
    .object({
        protocol: z.literal(SHARE_RECOVERY_PROTOCOL),
        shareId: ShareLinkIdValidator,
        ownerProfileId: z.string().min(1).max(128),
        createdAt: z.iso.datetime(),
        latest: z.object({ contentVersion: safeVersion, key: ShareContentKeyValidator }).strict(),
        selection: ShareRecoverySelectionValidator.array().min(1).max(MAX_SELECTED_CREDENTIALS),
        endorsements: ShareRecoveryEndorsementValidator.array().max(MAX_ENDORSEMENTS).default([]),
    })
    .strict()
    .superRefine((recovery, ctx) => {
        const orders = new Set<number>();

        recovery.selection.forEach((entry, index) => {
            if (entry.order >= recovery.selection.length) {
                ctx.addIssue({
                    code: 'custom',
                    message: 'order must be within the selection bounds',
                    path: ['selection', index, 'order'],
                });
            }
            if (orders.has(entry.order)) {
                ctx.addIssue({
                    code: 'custom',
                    message: 'order must be unique within the selection',
                    path: ['selection', index, 'order'],
                });
            }
            orders.add(entry.order);
        });
    });
export type ShareRecoveryPlaintext = z.infer<typeof ShareRecoveryPlaintextValidator>;

/**
 * Owner-encrypted recovery JWE. The cap applies to the *serialized envelope*
 * (UTF-8 of the JWE), not to the plaintext index — see Task A2 review item 7.
 */
export const ShareOwnerRecoveryValidator = JWEValidator.refine(
    value => utf8ByteLength(JSON.stringify(value)) <= MAX_SHARE_RECOVERY_JWE_BYTES,
    { message: `serialized recovery JWE must be at most ${MAX_SHARE_RECOVERY_JWE_BYTES} bytes` }
);
export type ShareOwnerRecovery = z.infer<typeof ShareOwnerRecoveryValidator>;

export const ShareLinkStatusValidator = z.enum(['pending', 'active', 'stopped']);
export type ShareLinkStatus = z.infer<typeof ShareLinkStatusValidator>;

export const ShareContentStateValidator = z.enum(['staging', 'finalized', 'content_missing']);
export type ShareContentState = z.infer<typeof ShareContentStateValidator>;

/**
 * Owner-facing share metadata. Never returned to unauthenticated callers; the
 * public projection below omits age-policy and owner-private fields entirely.
 */
export const ShareLinkValidator = z.object({
    id: ShareLinkIdValidator,
    title: z.string().min(1).max(120),
    note: z.string().max(500).optional(),
    selectedCount: z.number().int().min(1).max(MAX_SELECTED_CREDENTIALS),
    version: safeVersion,
    contentVersion: safeVersion,
    status: ShareLinkStatusValidator,
    contentState: ShareContentStateValidator,
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    expiresAt: z.iso.datetime().nullable(),
    stoppedAt: z.iso.datetime().nullable(),
    lastViewedAt: z.iso.datetime().nullable(),
    viewCount: z.number().int().min(0).optional(),
    passcodeProtected: z.boolean(),
    notifyOnView: z.boolean(),
    minorPolicy: z.object({
        isMinor: z.boolean().nullable(),
        policyResolved: z.boolean(),
        defaultExpiryDays: z.union([z.literal(30), z.literal(365)]),
        viewCountingEnabled: z.boolean(),
    }),
    /**
     * Guarded application/API URL for the content. Optional because owner APIs in
     * D1 have no public resolve/content endpoint yet; it must never be a
     * LearnCloud object URL or carry a fabricated decryption key.
     */
    contentUrl: z.string().optional(),
});
export type ShareLink = z.infer<typeof ShareLinkValidator>;

const clientRequestId = z.string().uuid();

export const CreateShareLinkInputValidator = z
    .object({
        id: ShareLinkIdValidator,
        clientRequestId,
        title: z.string().min(1).max(120),
        note: z.string().max(500).optional(),
        expiresAt: z.iso.datetime().nullable().optional(),
        passcode: z.string().min(4).max(64).optional(),
        notifyOnView: z.boolean().default(false),
        selectedCount: z.number().int().min(1).max(MAX_SELECTED_CREDENTIALS),
        contentVersion: z.literal(1),
        envelope: ShareEnvelopeValidator,
        ownerEncryptedRecovery: ShareOwnerRecoveryValidator,
    })
    .strict();
export type CreateShareLinkInput = z.infer<typeof CreateShareLinkInputValidator>;

/**
 * Dependent fields: a content replacement supplies `contentVersion`,
 * `selectedCount`, `envelope` and `ownerEncryptedRecovery` together, or none of
 * them. A metadata-only update must not touch content.
 */
export const UpdateShareLinkInputValidator = z
    .object({
        id: ShareLinkIdValidator,
        expectedVersion: safeVersion,
        clientRequestId,
        title: z.string().min(1).max(120).optional(),
        note: z.string().max(500).nullable().optional(),
        expiresAt: z.iso.datetime().nullable().optional(),
        /** Omitted preserves the current passcode, null removes it, and a string replaces it. */
        passcode: z.string().min(4).max(64).nullable().optional(),
        notifyOnView: z.boolean().optional(),
        contentVersion: safeVersion.optional(),
        selectedCount: z.number().int().min(1).max(MAX_SELECTED_CREDENTIALS).optional(),
        envelope: ShareEnvelopeValidator.optional(),
        ownerEncryptedRecovery: ShareOwnerRecoveryValidator.optional(),
    })
    .strict()
    .superRefine((value, ctx) => {
        const provided = [
            value.contentVersion,
            value.selectedCount,
            value.envelope,
            value.ownerEncryptedRecovery,
        ].filter(field => field !== undefined).length;

        if (provided !== 0 && provided !== 4) {
            ctx.addIssue({
                code: 'custom',
                message:
                    'content replacement requires contentVersion, selectedCount, envelope and ownerEncryptedRecovery together',
            });
        }
    });
export type UpdateShareLinkInput = z.infer<typeof UpdateShareLinkInputValidator>;

export const ShareLinkIdInputValidator = z.object({ id: ShareLinkIdValidator }).strict();
export type ShareLinkIdInput = z.infer<typeof ShareLinkIdInputValidator>;

/**
 * Owner-scoped retry key. Only the opaque share id and the caller operation id
 * are accepted; the server re-derives every immutable binding (object ref,
 * generation, lease, hashes) from persisted Brain state under the owner's own
 * namespace. This is never a reservation descriptor.
 */
export const ShareLinkOperationKeyInputValidator = z
    .object({ id: ShareLinkIdValidator, operationId: z.string().uuid() })
    .strict();
export type ShareLinkOperationKeyInput = z.infer<typeof ShareLinkOperationKeyInputValidator>;

/**
 * Sanitized owner mutation output. A pending result exposes only the retry key.
 *
 * `completed` means the request reached a recorded terminal outcome; the
 * authoritative share state (`share.status`, e.g. `stopped` after revoke) is
 * carried inside `share` and must never be overwritten by the outer tag.
 */
export const ShareLinkOwnerCommitOutputValidator = z.discriminatedUnion('status', [
    z.object({ status: z.literal('completed'), share: ShareLinkValidator }).strict(),
    z
        .object({
            status: z.literal('pending'),
            id: ShareLinkIdValidator,
            operationId: z.string().uuid(),
        })
        .strict(),
]);
export type ShareLinkOwnerCommitOutput = z.infer<typeof ShareLinkOwnerCommitOutputValidator>;

/**
 * Sanitized owner status output; never a raw coordinator record. `found` means a
 * share snapshot was returned and `share.status` is authoritative (active or
 * stopped); it does not itself assert the share is active.
 */
export const ShareLinkOwnerStatusOutputValidator = z.discriminatedUnion('status', [
    z.object({ status: z.literal('found'), share: ShareLinkValidator }).strict(),
    z
        .object({
            status: z.literal('pending'),
            id: ShareLinkIdValidator,
            operationId: z.string().uuid(),
        })
        .strict(),
    z.object({ status: z.literal('not_found'), id: ShareLinkIdValidator }).strict(),
]);
export type ShareLinkOwnerStatusOutput = z.infer<typeof ShareLinkOwnerStatusOutputValidator>;

/** Owner-only recovery response: the owner-encrypted JWE and nothing else. */
export const ShareLinkOwnerRecoveryOutputValidator = z
    .object({ recovery: ShareOwnerRecoveryValidator })
    .strict();
export type ShareLinkOwnerRecoveryOutput = z.infer<typeof ShareLinkOwnerRecoveryOutputValidator>;

/** Authenticated owner-only ciphertext response; never includes a view receipt or storage refs. */
export const ShareLinkOwnerContentOutputValidator = z
    .object({
        id: ShareLinkIdValidator,
        contentVersion: safeVersion,
        envelope: ShareEnvelopeValidator,
    })
    .strict();
export type ShareLinkOwnerContentOutput = z.infer<typeof ShareLinkOwnerContentOutputValidator>;

export const ResolveShareLinkInputValidator = z
    .object({
        id: ShareLinkIdValidator,
        /** Sent only in a POST body; it must never be placed in a share URL. */
        passcode: z.string().min(4).max(64).optional(),
    })
    .strict();
export type ResolveShareLinkInput = z.infer<typeof ResolveShareLinkInputValidator>;

/** Public state. No `isMinor`, `policyResolved`, thresholds or count policy. */
export const ShareLinkPublicStateValidator = z.discriminatedUnion('state', [
    z
        .object({
            state: z.literal('passcode_required'),
            id: ShareLinkIdValidator,
        })
        .strict(),
    z
        .object({
            state: z.literal('active'),
            id: ShareLinkIdValidator,
            title: z.string().max(120),
            note: z.string().max(500).optional(),
            selectedCount: z.number().int().min(1).max(MAX_SELECTED_CREDENTIALS),
            contentVersion: safeVersion,
            contentUrl: z.string(),
            sharer: z.object({
                displayName: z.string().max(120),
                avatar: z.string().max(2048).optional(),
            }),
            createdAt: z.iso.datetime(),
            updatedAt: z.iso.datetime(),
            expiresAt: z.iso.datetime().nullable(),
        })
        .strict(),
    z
        .object({
            state: z.literal('expired'),
            id: ShareLinkIdValidator,
            expiresAt: z.iso.datetime(),
        })
        .strict(),
    z
        .object({
            state: z.literal('stopped'),
            id: ShareLinkIdValidator,
            stoppedAt: z.iso.datetime(),
        })
        .strict(),
    z.object({ state: z.literal('not_found'), id: ShareLinkIdValidator }).strict(),
]);
export type ShareLinkPublicState = z.infer<typeof ShareLinkPublicStateValidator>;

export const ListShareLinksInputValidator = z
    .object({
        limit: z.number().int().min(1).max(50).default(25),
        cursor: z.string().max(512).optional(),
    })
    .strict();
export type ListShareLinksInput = z.infer<typeof ListShareLinksInputValidator>;

export const PaginatedShareLinksValidator = PaginationResponseValidator.extend({
    records: ShareLinkValidator.array(),
});
export type PaginatedShareLinks = z.infer<typeof PaginatedShareLinksValidator>;

export const AcknowledgeViewInputValidator = z
    .object({
        receipt: z
            .string()
            .min(22)
            .max(128)
            .regex(/^[A-Za-z0-9_-]+$/),
    })
    .strict();
export type AcknowledgeViewInput = z.infer<typeof AcknowledgeViewInputValidator>;

/** Uniform response: never reveal eligibility or whether a receipt incremented a count. */
export const AcknowledgeViewOutputValidator = z.object({ ok: z.literal(true) }).strict();
export type AcknowledgeViewOutput = z.infer<typeof AcknowledgeViewOutputValidator>;

/**
 * Fixed short TTL for a persisted view receipt. Acknowledgement binds the
 * receipt to one committed `(namespace, share, owner, contentVersion, object,
 * operation)` tuple; the node is pruned after this window (or once consumed).
 */
export const SHARE_VIEW_RECEIPT_TTL_SECONDS = 10 * 60;

/**
 * Public content response. The envelope and `contentVersion` come from one
 * committed tuple; no object ref, hash, operation id, owner recovery, owner id
 * or policy field is ever returned. `receipt` is ALWAYS present with identical
 * shape/entropy whether or not the owner is eligible for counting: ineligible,
 * unknown, managed, minor or dependency-failure responses carry a CSPRNG
 * padding value that is never persisted, so the response is not an eligibility
 * oracle.
 */
export const ShareLinkPublicContentViewValidator = z
    .object({
        id: ShareLinkIdValidator,
        contentVersion: safeVersion,
        envelope: ShareEnvelopeValidator,
        contentUrl: z.string(),
        receipt: z
            .string()
            .min(22)
            .max(128)
            .regex(/^[A-Za-z0-9_-]+$/),
    })
    .strict();
export type ShareLinkPublicContentView = z.infer<typeof ShareLinkPublicContentViewValidator>;
