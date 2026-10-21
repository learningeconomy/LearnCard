import { createHash } from 'node:crypto';
import { canonicalizeShareContentRequestBody } from '@learncard/helpers';

import { SHARE_CONTENT_OPERATIONS, type ShareContentOperation } from './types';

/**
 * Canonicalization / identifier primitives for the LC-2187 service auth module.
 *
 * Every value that reaches a hash or a comparison is validated here with strict
 * (not permissive) rules. `Buffer.from(x, 'base64url')` is lenient, so the
 * canonical base64url check re-encodes and requires an exact round trip, which
 * rejects alternative spellings that merely decode to the same bytes.
 */

export {
    canonicalizeShareContentRequestBody,
    DEFAULT_MAX_CANONICAL_BYTES as DEFAULT_MAX_CANONICAL_REQUEST_BYTES,
    DEFAULT_MAX_CANONICAL_DEPTH,
    ShareContentCanonicalizationError,
} from '@learncard/helpers';

const BASE64URL_RE = /^[A-Za-z0-9_-]+$/;
const OPAQUE_IDENTIFIER_RE = /^[A-Za-z0-9._~-]+$/;
const JTI_RE = /^[A-Za-z0-9_-]+$/;
const SHA256_HEX_RE = /^[0-9a-f]{64}$/;

export const isPlainObject = (value: unknown): value is Record<string, unknown> => {
    if (typeof value !== 'object' || value === null) return false;

    const prototype = Object.getPrototypeOf(value);

    return prototype === Object.prototype || prototype === null;
};

/** Strict canonical base64url: alphabet, no padding, exact round trip, optional byte length. */
export const isCanonicalBase64Url = (value: unknown, expectedBytes?: number): value is string => {
    if (typeof value !== 'string' || value.length === 0) return false;
    if (!BASE64URL_RE.test(value)) return false;

    const decoded = Buffer.from(value, 'base64url');

    if (decoded.toString('base64url') !== value) return false;
    if (expectedBytes !== undefined && decoded.length !== expectedBytes) return false;

    return true;
};

export const isSafeContentVersion = (value: unknown): value is number =>
    typeof value === 'number' && Number.isSafeInteger(value) && value >= 1 && value <= 2 ** 31 - 1;

export const isSafeEpochSecond = (value: unknown): value is number =>
    typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

/**
 * Opaque profile/object/operation/namespace identifier. Deliberately not a UUID
 * check: existing profile ids are opaque URL-safe strings.
 */
export const isOpaqueIdentifier = (value: unknown, maxLength = 128): value is string =>
    typeof value === 'string' &&
    value.length >= 1 &&
    value.length <= maxLength &&
    OPAQUE_IDENTIFIER_RE.test(value);

export const isBoundedNonce = (
    value: unknown,
    minLength: number,
    maxLength: number
): value is string =>
    typeof value === 'string' &&
    value.length >= minLength &&
    value.length <= maxLength &&
    JTI_RE.test(value);

export const isSha256Hex = (value: unknown): value is string =>
    typeof value === 'string' && SHA256_HEX_RE.test(value);

export const isShareContentOperation = (value: unknown): value is ShareContentOperation =>
    typeof value === 'string' && (SHARE_CONTENT_OPERATIONS as readonly string[]).includes(value);

/**
 * SHA-256 (lowercase hex) over the canonical UTF-8 request body. This is the
 * value signed into `claims.requestHash`; it must include the opaque ciphertext
 * envelope and the opaque owner-encrypted recovery for `put`.
 */
export const computeShareContentRequestHash = (
    body: unknown,
    options: { maxBytes?: number; maxDepth?: number } = {}
): string =>
    createHash('sha256')
        .update(canonicalizeShareContentRequestBody(body, options), 'utf8')
        .digest('hex');
