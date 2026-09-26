import {
    MAX_SHARE_RECOVERY_JWE_BYTES,
    SHARE_RECOVERY_PROTOCOL,
    ShareOwnerRecoveryValidator,
    ShareRecoveryPlaintextValidator,
    utf8ByteLength,
    type ShareOwnerRecovery,
    type ShareRecoveryEndorsement,
    type ShareRecoveryPlaintext,
    type ShareRecoverySelection,
} from '@learncard/types';

import { ShareLinkError } from './errors';

/**
 * Owner recovery schema and serialization.
 *
 * Recovery plaintext is the ONLY place the content key and the private source
 * URIs/order live. It is encrypted with the wallet's existing DAG-JWE primitive
 * through the narrowly typed {@link ShareRecoveryJweAdapter}; this module never
 * implements its own encryption. If no wallet adapter is injected, the crypto
 * operations fail explicitly (`RECOVERY_ADAPTER_UNAVAILABLE`) instead of
 * degrading to a dummy scheme.
 */

export interface BuildShareRecoveryInput {
    shareId: string;
    ownerProfileId: string;
    createdAt: string;
    latest: { contentVersion: number; key: string };
    selection: readonly ShareRecoverySelection[];
    endorsements?: readonly ShareRecoveryEndorsement[];
}

/** Build the owner-private recovery plaintext without mutating the inputs. */
export const buildShareRecovery = ({
    shareId,
    ownerProfileId,
    createdAt,
    latest,
    selection,
    endorsements = [],
}: BuildShareRecoveryInput): ShareRecoveryPlaintext => ({
    protocol: SHARE_RECOVERY_PROTOCOL,
    shareId,
    ownerProfileId,
    createdAt,
    latest: { contentVersion: latest.contentVersion, key: latest.key },
    selection: selection.map(entry => ({ ref: entry.ref, order: entry.order })),
    endorsements: endorsements.map(entry => ({ targetRef: entry.targetRef })),
});

const parseRecoveryPlaintext = (value: unknown): ShareRecoveryPlaintext => {
    const parsed = ShareRecoveryPlaintextValidator.safeParse(value);
    if (!parsed.success) {
        throw new ShareLinkError(
            'INVALID_RECOVERY',
            parsed.error.issues[0]?.message ?? 'invalid recovery'
        );
    }
    return parsed.data;
};

/** Serialize a validated recovery plaintext to deterministic JSON text. */
export const serializeShareRecovery = (recovery: unknown): string =>
    JSON.stringify(parseRecoveryPlaintext(recovery));

/** UTF-8 bytes of the serialized recovery plaintext. */
export const serializeShareRecoveryBytes = (recovery: unknown): Uint8Array =>
    new TextEncoder().encode(serializeShareRecovery(recovery));

/** UTF-8 byte length of a serialized recovery value (never `String.length`). */
export const shareRecoveryUtf8ByteLength = (serialized: string): number =>
    utf8ByteLength(serialized);

/** Parse a serialized recovery JSON string back into a validated plaintext. */
export const parseShareRecovery = (serialized: string): ShareRecoveryPlaintext => {
    if (typeof serialized !== 'string') {
        throw new ShareLinkError('INVALID_RECOVERY', 'serialized recovery must be a string');
    }

    let candidate: unknown;
    try {
        candidate = JSON.parse(serialized);
    } catch {
        throw new ShareLinkError('INVALID_RECOVERY', 'serialized recovery is not valid JSON');
    }

    return parseRecoveryPlaintext(candidate);
};

export type ShareRecoveryBindingFailureCode =
    'RECOVERY_SHARE_ID_MISMATCH' | 'RECOVERY_OWNER_MISMATCH' | 'RECOVERY_VERSION_MISMATCH';

export type ShareRecoveryBindingResult =
    { ok: true } | { ok: false; code: ShareRecoveryBindingFailureCode; message: string };

export interface ShareRecoveryBindingContext {
    shareId: string;
    ownerProfileId: string;
    contentVersion: number;
}

/**
 * Bind recovery to the share, owner profile and latest content version it
 * describes. A recovery that decrypts but names another share/owner/version is
 * rejected before it can overwrite state.
 */
export const validateShareRecoveryBinding = (
    recovery: ShareRecoveryPlaintext,
    { shareId, ownerProfileId, contentVersion }: ShareRecoveryBindingContext
): ShareRecoveryBindingResult => {
    if (recovery.shareId !== shareId) {
        return {
            ok: false,
            code: 'RECOVERY_SHARE_ID_MISMATCH',
            message: 'recovery share id does not match the expected share id',
        };
    }
    if (recovery.ownerProfileId !== ownerProfileId) {
        return {
            ok: false,
            code: 'RECOVERY_OWNER_MISMATCH',
            message: 'recovery owner does not match the authenticated owner',
        };
    }
    if (recovery.latest.contentVersion !== contentVersion) {
        return {
            ok: false,
            code: 'RECOVERY_VERSION_MISMATCH',
            message: 'recovery content version does not match the visible version',
        };
    }
    return { ok: true };
};

/**
 * Narrow adapter over the wallet's existing DAG-JWE helpers. Implementations
 * delegate to `createDagJwe`/`decryptDagJwe` (or the equivalent wallet plugin
 * method); this module owns no key material and no cipher.
 */
export interface ShareRecoveryJweAdapter {
    encrypt(
        plaintext: ShareRecoveryPlaintext,
        recipientDids: readonly string[]
    ): Promise<ShareOwnerRecovery>;
    decrypt(jwe: ShareOwnerRecovery, recipientDids: readonly string[]): Promise<unknown>;
}

const assertAdapter = (
    adapter: ShareRecoveryJweAdapter | null | undefined
): ShareRecoveryJweAdapter => {
    if (!adapter) {
        throw new ShareLinkError(
            'RECOVERY_ADAPTER_UNAVAILABLE',
            'wallet DAG-JWE adapter is required; owner recovery encryption is not implemented here'
        );
    }
    return adapter;
};

const assertWithinRecoveryJweCap = (jwe: unknown): number => {
    let serialized: string;
    try {
        serialized = JSON.stringify(jwe);
    } catch {
        throw new ShareLinkError('INVALID_RECOVERY', 'recovery JWE is not serializable');
    }

    const bytes = utf8ByteLength(serialized);
    if (bytes > MAX_SHARE_RECOVERY_JWE_BYTES) {
        throw new ShareLinkError(
            'RECOVERY_TOO_LARGE',
            `serialized recovery JWE is ${bytes} bytes, over the ${MAX_SHARE_RECOVERY_JWE_BYTES} byte cap`
        );
    }
    return bytes;
};

/** Validate that an owner recovery JWE has the expected shape and byte cap. */
export const validateShareRecoveryJwe = (jwe: unknown): ShareOwnerRecovery => {
    assertWithinRecoveryJweCap(jwe);

    const parsed = ShareOwnerRecoveryValidator.safeParse(jwe);
    if (!parsed.success) {
        throw new ShareLinkError(
            'INVALID_RECOVERY',
            parsed.error.issues[0]?.message ?? 'invalid recovery JWE'
        );
    }
    return parsed.data;
};

/**
 * Encrypt recovery plaintext for the owner's DID via the injected adapter.
 * Validates the plaintext and the resulting JWE (shape and 64 KiB serialized cap).
 */
export const encryptShareRecovery = async (
    recovery: unknown,
    ownerDid: string,
    adapter: ShareRecoveryJweAdapter | null | undefined
): Promise<ShareOwnerRecovery> => {
    const plaintext = parseRecoveryPlaintext(recovery);
    const jwe = await assertAdapter(adapter).encrypt(plaintext, [ownerDid]);

    return validateShareRecoveryJwe(jwe);
};

/** Decrypt an owner recovery JWE via the injected adapter and validate the plaintext. */
export const decryptShareRecovery = async (
    jwe: unknown,
    ownerDid: string,
    adapter: ShareRecoveryJweAdapter | null | undefined
): Promise<ShareRecoveryPlaintext> => {
    const parsedJwe = validateShareRecoveryJwe(jwe);
    const plaintext = await assertAdapter(adapter).decrypt(parsedJwe, [ownerDid]);

    return parseRecoveryPlaintext(plaintext);
};
