import { createHash } from 'node:crypto';

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
 * Canonical hash of the full validated request bound to an operation record.
 *
 * The caller passes the *validated* request including the opaque envelope and the
 * owner-encrypted recovery: the hash therefore covers the encrypted recovery even
 * though no ciphertext is ever persisted in Neo4j. `clientRequestId` is the
 * operation key identity and is deliberately excluded from the payload hash; all
 * other fields, including `opKind`, are covered.
 */
export const computeShareLinkRequestHash = (
    opKind: ShareLinkOperationKind,
    request: Record<string, unknown>
): string => {
    const { clientRequestId: _clientRequestId, ...requestPayload } = request;

    return createHash('sha256')
        .update(canonicalizeJson({ opKind, request: requestPayload }))
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
