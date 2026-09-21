import {
    MAX_SHARE_CIPHERTEXT_BYTES,
    SHARE_AAD_PREFIX,
    SHARE_CONTENT_KEY_BYTES,
    SHARE_IV_BYTES,
    SHARE_LINK_ID_BYTES,
    SHARE_TAG_BYTES,
    ShareContentKeyValidator,
    ShareEnvelopeValidator,
    ShareLinkIdValidator,
    decodeBase64Url,
    encodeBase64Url,
    type ShareEnvelope,
} from '@learncard/types';

import { ShareLinkError } from './errors';

/**
 * Pure browser-compatible AES-256-GCM helpers for the LC-2187 share protocol.
 *
 * Only WebCrypto (`globalThis.crypto.subtle`), `TextEncoder`/`TextDecoder` and
 * typed arrays are used: there is no Node-only import and no added crypto
 * dependency. Freshness of the nonce is guaranteed here — callers cannot inject
 * an IV through the public API.
 */

const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder('utf-8', { fatal: true });

/**
 * TS 5.7+ types `Uint8Array` over an ArrayBufferLike parameter; DOM's WebCrypto
 * expects `BufferSource`. The cast is sound here because these views are always
 * freshly allocated and never shared.
 */
const asBufferSource = (bytes: Uint8Array): BufferSource => bytes as unknown as BufferSource;

/** Cryptographically secure random bytes of `length`. */
export const randomBytes = (length: number): Uint8Array => {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytes;
};

/** CSPRNG 16-byte share id, canonical base64url (22 chars). */
export const generateShareLinkId = (): string => encodeBase64Url(randomBytes(SHARE_LINK_ID_BYTES));

/** CSPRNG 32-byte symmetric content key, canonical base64url (43 chars). */
export const generateShareContentKey = (): string =>
    encodeBase64Url(randomBytes(SHARE_CONTENT_KEY_BYTES));

const parseShareId = (value: unknown): string => {
    const result = ShareLinkIdValidator.safeParse(value);
    if (!result.success) throw new ShareLinkError('INVALID_SHARE_ID', 'share id is not canonical');
    return result.data;
};

const parseContentVersion = (value: unknown): number => {
    if (!Number.isSafeInteger(value) || (value as number) < 1 || (value as number) > 2 ** 31 - 1) {
        throw new ShareLinkError(
            'INVALID_CONTENT_VERSION',
            'content version is not a positive safe integer'
        );
    }
    return value as number;
};

const decodeCanonicalBytes = (
    value: unknown,
    expectedBytes: number,
    code: 'INVALID_CONTENT_KEY' | 'INVALID_IV'
): Uint8Array => {
    if (typeof value !== 'string') throw new ShareLinkError(code, 'value is not a string');

    if (value.length !== Math.ceil((expectedBytes * 4) / 3)) {
        throw new ShareLinkError(code, 'value has an invalid encoded length');
    }
    const decoded = decodeBase64Url(value);
    if (decoded === null) {
        throw new ShareLinkError(code, 'value is not valid base64url');
    }
    if (decoded.length !== expectedBytes || encodeBase64Url(decoded) !== value) {
        throw new ShareLinkError(
            code,
            `value must be canonical base64url for ${expectedBytes} bytes`
        );
    }

    return decoded;
};

/**
 * AAD binding the ciphertext to the exact share id and content version:
 * UTF-8 of `lc-share:v1:{shareId}:{contentVersion}`. The canonical base64url
 * alphabet excludes `:`, so the fields are unambiguous.
 */
export const buildShareLinkAad = (shareId: string, contentVersion: number): Uint8Array => {
    const id = parseShareId(shareId);
    const version = parseContentVersion(contentVersion);
    return utf8Encoder.encode(`${SHARE_AAD_PREFIX}:${id}:${version}`);
};

export interface EncryptSharePayloadInput {
    shareId: string;
    contentVersion: number;
    key: string;
    payload: unknown;
}

/**
 * Encrypt a recipient manifest with a fresh 12-byte IV and a 128-bit GCM tag.
 * Returns a schema-validated, canonical envelope.
 */
export const encryptSharePayload = async ({
    shareId,
    contentVersion,
    key,
    payload,
}: EncryptSharePayloadInput): Promise<ShareEnvelope> => {
    const id = parseShareId(shareId);
    const version = parseContentVersion(contentVersion);
    const keyBytes = decodeCanonicalBytes(key, SHARE_CONTENT_KEY_BYTES, 'INVALID_CONTENT_KEY');
    const serialized = JSON.stringify(payload);
    if (serialized === undefined)
        throw new ShareLinkError('INVALID_PLAINTEXT', 'payload must be JSON');
    const plaintext = utf8Encoder.encode(serialized);
    if (plaintext.length + SHARE_TAG_BYTES > MAX_SHARE_CIPHERTEXT_BYTES) {
        throw new ShareLinkError('CIPHERTEXT_TOO_LARGE', 'payload exceeds the ciphertext byte cap');
    }
    const iv = randomBytes(SHARE_IV_BYTES);

    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        asBufferSource(keyBytes),
        { name: 'AES-GCM' },
        false,
        ['encrypt']
    );

    const ciphertext = new Uint8Array(
        await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: asBufferSource(iv),
                additionalData: asBufferSource(buildShareLinkAad(id, version)),
                tagLength: 128,
            },
            cryptoKey,
            asBufferSource(plaintext)
        )
    );

    if (ciphertext.length > MAX_SHARE_CIPHERTEXT_BYTES) {
        throw new ShareLinkError(
            'CIPHERTEXT_TOO_LARGE',
            `ciphertext is ${ciphertext.length} bytes, over the ${MAX_SHARE_CIPHERTEXT_BYTES} byte cap`
        );
    }

    return ShareEnvelopeValidator.parse({
        v: 1,
        alg: 'A256GCM',
        iv: encodeBase64Url(iv),
        ct: encodeBase64Url(ciphertext),
    });
};

export interface DecryptSharePayloadInput {
    shareId: string;
    contentVersion: number;
    key: string;
    envelope: unknown;
}

/**
 * Decrypt a recipient manifest. Unknown version/algorithm, non-canonical fields,
 * an oversized/undersized ciphertext, a wrong key, tampering, or id/version
 * substitution all throw a {@link ShareLinkError} before any plaintext is used.
 *
 * A successful decrypt proves only that the caller held the link key. It is not
 * issuer verification — see `ShareManifestProofVerifier`.
 */
export const decryptSharePayload = async ({
    shareId,
    contentVersion,
    key,
    envelope,
}: DecryptSharePayloadInput): Promise<unknown> => {
    const id = parseShareId(shareId);
    const version = parseContentVersion(contentVersion);
    const keyBytes = decodeCanonicalBytes(key, SHARE_CONTENT_KEY_BYTES, 'INVALID_CONTENT_KEY');

    const candidate = envelope as Partial<ShareEnvelope> | null;

    if (candidate === null || typeof candidate !== 'object') {
        throw new ShareLinkError('INVALID_ENVELOPE', 'envelope must be an object');
    }
    if (candidate.v !== 1) {
        throw new ShareLinkError(
            'UNSUPPORTED_VERSION',
            `unsupported envelope version: ${String(candidate.v)}`
        );
    }
    if (candidate.alg !== 'A256GCM') {
        throw new ShareLinkError(
            'UNSUPPORTED_ALGORITHM',
            `unsupported envelope algorithm: ${String(candidate.alg)}`
        );
    }

    const parsed = ShareEnvelopeValidator.safeParse(candidate);
    if (!parsed.success) {
        throw new ShareLinkError('INVALID_ENVELOPE', 'envelope fields are not canonical');
    }

    const decodedIv = decodeCanonicalBytes(parsed.data.iv, SHARE_IV_BYTES, 'INVALID_IV');
    const decodedCt = decodeBase64Url(parsed.data.ct);

    // The schema already checked the range; re-check so the crypto boundary is
    // independent of a future schema change.
    if (decodedCt === null || decodedCt.length < SHARE_TAG_BYTES) {
        throw new ShareLinkError('CIPHERTEXT_TOO_SHORT', 'ciphertext is shorter than the GCM tag');
    }
    if (decodedCt.length > MAX_SHARE_CIPHERTEXT_BYTES) {
        throw new ShareLinkError('CIPHERTEXT_TOO_LARGE', 'ciphertext exceeds the decoded byte cap');
    }

    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        asBufferSource(keyBytes),
        { name: 'AES-GCM' },
        false,
        ['decrypt']
    );

    let plaintext: ArrayBuffer;
    try {
        plaintext = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: asBufferSource(decodedIv),
                additionalData: asBufferSource(buildShareLinkAad(id, version)),
                tagLength: 128,
            },
            cryptoKey,
            asBufferSource(decodedCt)
        );
    } catch {
        throw new ShareLinkError('DECRYPT_FAILED', 'ciphertext failed authentication');
    }

    try {
        return JSON.parse(utf8Decoder.decode(plaintext));
    } catch {
        throw new ShareLinkError('INVALID_PLAINTEXT', 'decrypted payload is not valid JSON');
    }
};
