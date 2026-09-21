import { createHash } from 'node:crypto';

import { SHARE_CONTENT_OPERATIONS, type ShareContentOperation } from './types';

/**
 * Canonicalization / identifier primitives for the LC-2187 service auth module.
 *
 * Every value that reaches a hash or a comparison is validated here with strict
 * (not permissive) rules. `Buffer.from(x, 'base64url')` is lenient, so the
 * canonical base64url check re-encodes and requires an exact round trip, which
 * rejects alternative spellings that merely decode to the same bytes.
 */

export const DEFAULT_MAX_CANONICAL_REQUEST_BYTES = 2 * 1024 * 1024;
export const DEFAULT_MAX_CANONICAL_DEPTH = 32;

const BASE64URL_RE = /^[A-Za-z0-9_-]+$/;
const OPAQUE_IDENTIFIER_RE = /^[A-Za-z0-9._~-]+$/;
const JTI_RE = /^[A-Za-z0-9_-]+$/;
const SHA256_HEX_RE = /^[0-9a-f]{64}$/;

// Unpaired UTF-16 surrogates are not valid UTF-8; Node would silently replace
// them with U+FFFD during hashing, so two distinct strings could collide.
const LONE_SURROGATE_RE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

export class ShareContentCanonicalizationError extends Error {
    readonly code = 'UNSUPPORTED_REQUEST_VALUE';

    constructor(message: string) {
        super(message);
        this.name = 'ShareContentCanonicalizationError';
    }
}

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

const serializeCanonical = (
    value: unknown,
    seen: Set<object>,
    depth: number,
    maxDepth: number
): string => {
    if (value === null) return 'null';

    switch (typeof value) {
        case 'boolean':
            return value ? 'true' : 'false';

        case 'string': {
            if (LONE_SURROGATE_RE.test(value)) {
                throw new ShareContentCanonicalizationError(
                    'string contains an unpaired surrogate'
                );
            }

            return JSON.stringify(value);
        }

        case 'number': {
            // Only safe integers (and never negative zero) so that every accepted
            // value has exactly one canonical decimal spelling.
            if (!Number.isSafeInteger(value) || Object.is(value, -0)) {
                throw new ShareContentCanonicalizationError(
                    'numbers must be safe integers without a negative-zero sign'
                );
            }

            return String(value);
        }

        case 'undefined':
        case 'function':
        case 'symbol':
        case 'bigint':
        case 'object': {
            if (typeof value !== 'object' || value === null) {
                throw new ShareContentCanonicalizationError(
                    `unsupported value type: ${typeof value}`
                );
            }

            if (depth >= maxDepth) {
                throw new ShareContentCanonicalizationError(
                    'value exceeds the maximum nesting depth'
                );
            }

            if (seen.has(value)) {
                throw new ShareContentCanonicalizationError('cyclic value is not supported');
            }

            seen.add(value);

            try {
                if (Array.isArray(value)) {
                    const items: string[] = [];

                    for (let index = 0; index < value.length; index += 1) {
                        if (!(index in value)) {
                            throw new ShareContentCanonicalizationError(
                                'sparse arrays are not supported'
                            );
                        }

                        items.push(serializeCanonical(value[index], seen, depth + 1, maxDepth));
                    }

                    return `[${items.join(',')}]`;
                }

                const prototype = Object.getPrototypeOf(value);

                if (prototype !== Object.prototype && prototype !== null) {
                    throw new ShareContentCanonicalizationError('only plain objects are supported');
                }

                const record = value as Record<string, unknown>;

                const entries = Object.keys(record)
                    .sort()
                    .map(key => {
                        if (LONE_SURROGATE_RE.test(key)) {
                            throw new ShareContentCanonicalizationError(
                                'object key contains an unpaired surrogate'
                            );
                        }

                        return `${JSON.stringify(key)}:${serializeCanonical(
                            record[key],
                            seen,
                            depth + 1,
                            maxDepth
                        )}`;
                    });

                return `{${entries.join(',')}}`;
            } finally {
                seen.delete(value);
            }
        }
    }

    throw new ShareContentCanonicalizationError(`unsupported value type: ${typeof value}`);
};

/**
 * Deterministic UTF-8 canonical serialization of a request body. Rejects
 * unsupported values (floats, undefined, functions, class instances, cycles,
 * sparse arrays, unpaired surrogates, excessive nesting) instead of coercing
 * them.
 */
export const canonicalizeShareContentRequestBody = (
    body: unknown,
    options: { maxBytes?: number; maxDepth?: number } = {}
): string => {
    const maxBytes = options.maxBytes ?? DEFAULT_MAX_CANONICAL_REQUEST_BYTES;
    const maxDepth = options.maxDepth ?? DEFAULT_MAX_CANONICAL_DEPTH;
    const serialized = serializeCanonical(body, new Set(), 0, maxDepth);

    if (Buffer.byteLength(serialized, 'utf8') > maxBytes) {
        throw new ShareContentCanonicalizationError('canonical request exceeds the maximum size');
    }

    return serialized;
};

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
