import { createHash, createHmac } from 'node:crypto';

import { getShareLinkRequestHashRuntimeEnvironment } from '@environment';

import type { ShareLinkOperationKind } from './types';

/**
 * Deterministic JSON encoding used for the canonical operation request hash.
 *
 * Object keys are sorted recursively so two semantically identical requests that
 * differ only in key insertion order hash the same. Values that are not valid JSON
 * (undefined, functions, bigint, symbols) are rejected instead of being silently
 * dropped: a dropped field would weaken the "same request id, different request"
 * conflict check.
 */
export const canonicalizeJson = (
    value: unknown,
    ancestors = new Set<object>(),
    depth = 0
): string => {
    if (depth > 32) throw new TypeError('canonical JSON exceeds depth bound');
    if (value === null) return 'null';

    switch (typeof value) {
        case 'boolean':
            return value ? 'true' : 'false';
        case 'number':
            if (!Number.isSafeInteger(value) || Object.is(value, -0)) {
                throw new TypeError('canonicalizeJson only supports finite numbers');
            }
            return JSON.stringify(value);
        case 'string':
            return JSON.stringify(value);
        case 'object': {
            if (ancestors.has(value)) throw new TypeError('cyclic JSON');
            ancestors.add(value);
            if (Array.isArray(value)) {
                try {
                    const entries: string[] = [];
                    for (let i = 0; i < value.length; i++) {
                        if (!(i in value)) throw new TypeError('sparse JSON array');
                        entries.push(canonicalizeJson(value[i], ancestors, depth + 1));
                    }
                    return `[${entries.join(',')}]`;
                } finally {
                    ancestors.delete(value);
                }
            }
            if (
                Object.getPrototypeOf(value) !== Object.prototype &&
                Object.getPrototypeOf(value) !== null
            ) {
                throw new TypeError('only plain JSON objects supported');
            }

            const record = value as Record<string, unknown>;
            const keys = Object.keys(record).sort();
            const entries = keys
                .filter(key => record[key] !== undefined)
                .map(
                    key =>
                        `${JSON.stringify(key)}:${canonicalizeJson(record[key], ancestors, depth + 1)}`
                );

            ancestors.delete(value);
            return `{${entries.join(',')}}`;
        }
        default:
            throw new TypeError(`canonicalizeJson cannot encode a ${typeof value} value`);
    }
};

/**
 * Dedicated key for operation fingerprints. It must be stable across every Brain
 * instance and deploy, otherwise an in-flight retry could become a conflict.
 *
 * Test runs use a fixed, test-only key. Enabled non-test deployments must
 * provision an independent secret before serving share-link owner requests.
 */
export const getShareLinkRequestHashSecret = (): string => {
    const runtime = getShareLinkRequestHashRuntimeEnvironment();
    const secret = runtime.SHARE_LINK_REQUEST_HASH_SECRET;
    if (secret && Buffer.byteLength(secret, 'utf8') >= 32) return secret;
    if (runtime.NODE_ENV === 'test') return 'share-link-test-only-request-hash-secret';
    throw new Error('SHARE_LINK_REQUEST_HASH_SECRET must contain at least 32 bytes');
};

/**
 * Canonical fingerprint of the full validated request.
 *
 * The caller passes the *validated* request including the opaque envelope and the
 * owner-encrypted recovery: the hash therefore covers the encrypted recovery even
 * though no ciphertext is ever persisted in Neo4j. `clientRequestId` is the
 * operation key identity and is deliberately excluded from the payload hash; all
 * other fields, including `opKind`, are covered. Protected requests use a
 * server-keyed HMAC so a persisted fingerprint cannot become a fast offline
 * oracle for a short passcode. Unprotected requests retain the previous SHA-256
 * format so their in-flight operation retries remain compatible.
 */
export const computeShareLinkRequestHash = (
    opKind: ShareLinkOperationKind,
    request: Record<string, unknown>
): string => {
    const { clientRequestId: _clientRequestId, ...requestPayload } = request;

    const canonical = canonicalizeJson({ opKind, request: requestPayload });
    if (typeof requestPayload.passcode !== 'string') {
        return createHash('sha256').update(canonical).digest('hex');
    }
    return createHmac('sha256', getShareLinkRequestHashSecret())
        .update('share-link-request:protected:v2\0')
        .update(canonical)
        .digest('hex');
};

/** Digest of validated opaque content, computable before reserving object IDs.
 * Compare this with LearnCloud stat.payloadHash, not its identity-bound contentHash.
 */
export const computeShareLinkPayloadHash = (payload: {
    envelope: unknown;
    ownerEncryptedRecovery: unknown;
}): string =>
    createHash('sha256')
        .update(
            canonicalizeJson({
                envelope: payload.envelope,
                ownerEncryptedRecovery: payload.ownerEncryptedRecovery,
            })
        )
        .digest('hex');
