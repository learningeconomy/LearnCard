import type {
    ShareContentActiveSummary,
    ShareContentContentProjection,
    ShareContentDeleteValue,
    ShareContentEnvelope,
    ShareContentOwnerRecovery,
    ShareContentPutValue,
    ShareContentRecoveryProjection,
    ShareContentStatValue,
    ShareContentTombstoneSummary,
} from './types';

/**
 * Narrow local validators for the LearnCloud JSON response envelope. They are
 * intentionally hand-written (rather than reusing a shared schema) so the
 * transport contract is pinned here: every accepted field is checked, unknown
 * fields are rejected, and no opaque payload is ever coerced or rewritten.
 *
 * Dates arrive as ISO-8601 strings because the C2 repository's `Date` values are
 * JSON-serialized by the route.
 */

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);

const isNonEmptyString = (value: unknown): value is string =>
    typeof value === 'string' && value.length > 0;

const isSafeIntegerAtLeast = (value: unknown, minimum: number): value is number =>
    typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum;

const isSha256Hex = (value: unknown): value is string =>
    typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);

const hasExactKeys = (value: Record<string, unknown>, keys: readonly string[]): boolean => {
    const actual = Object.keys(value);

    return actual.length === keys.length && actual.every(key => keys.includes(key));
};

const parseEnvelope = (value: unknown): ShareContentEnvelope | null => {
    if (!isPlainObject(value) || !hasExactKeys(value, ['v', 'alg', 'iv', 'ct'])) return null;
    if (value.v !== 1 || value.alg !== 'A256GCM') return null;
    if (!isNonEmptyString(value.iv) || !isNonEmptyString(value.ct)) return null;

    return { v: 1, alg: 'A256GCM', iv: value.iv, ct: value.ct };
};

const parseOwnerRecovery = (value: unknown): ShareContentOwnerRecovery | null =>
    isPlainObject(value) ? { ...value } : null;

const parseTupleFields = (
    value: Record<string, unknown>
): {
    namespace: string;
    ownerProfileId: string;
    shareId: string;
    contentVersion: number;
    objectId: string;
    operationId: string;
} | null => {
    if (!isNonEmptyString(value.namespace)) return null;
    if (!isNonEmptyString(value.ownerProfileId)) return null;
    if (!isNonEmptyString(value.shareId)) return null;
    if (!isSafeIntegerAtLeast(value.contentVersion, 1)) return null;
    if (!isNonEmptyString(value.objectId)) return null;
    if (!isNonEmptyString(value.operationId)) return null;

    return {
        namespace: value.namespace,
        ownerProfileId: value.ownerProfileId,
        shareId: value.shareId,
        contentVersion: value.contentVersion,
        objectId: value.objectId,
        operationId: value.operationId,
    };
};

const parseActiveSummary = (value: unknown): ShareContentActiveSummary | null => {
    if (!isPlainObject(value) || value.kind !== 'active') return null;
    if (
        !hasExactKeys(value, [
            'kind',
            'namespace',
            'ownerProfileId',
            'shareId',
            'contentVersion',
            'objectId',
            'operationId',
            'contentHash',
            'payloadHash',
            'ciphertextBytes',
            'recoveryBytes',
            'createdAt',
        ])
    )
        return null;

    const tuple = parseTupleFields(value);

    if (!tuple) return null;
    if (!isSha256Hex(value.contentHash) || !isSha256Hex(value.payloadHash)) return null;
    if (!isSafeIntegerAtLeast(value.ciphertextBytes, 0)) return null;
    if (!isSafeIntegerAtLeast(value.recoveryBytes, 0)) return null;
    if (!isNonEmptyString(value.createdAt)) return null;

    return {
        kind: 'active',
        ...tuple,
        contentHash: value.contentHash,
        payloadHash: value.payloadHash,
        ciphertextBytes: value.ciphertextBytes,
        recoveryBytes: value.recoveryBytes,
        createdAt: value.createdAt,
    };
};

const parseTombstoneSummary = (value: unknown): ShareContentTombstoneSummary | null => {
    if (!isPlainObject(value) || value.kind !== 'tombstone') return null;

    const allowed = [
        'kind',
        'namespace',
        'ownerProfileId',
        'shareId',
        'contentVersion',
        'objectId',
        'operationId',
        'contentHash',
        'deletedAt',
    ];

    if (Object.keys(value).some(key => !allowed.includes(key))) return null;

    const tuple = parseTupleFields(value);

    if (!tuple) return null;
    if (value.contentHash !== undefined && !isSha256Hex(value.contentHash)) return null;
    if (!isNonEmptyString(value.deletedAt)) return null;

    return {
        kind: 'tombstone',
        ...tuple,
        ...(value.contentHash !== undefined ? { contentHash: value.contentHash } : {}),
        deletedAt: value.deletedAt,
    };
};

export const parseShareContentActiveSummary = parseActiveSummary;
export const parseShareContentTombstoneSummary = parseTombstoneSummary;

export const parseShareContentStatValue = (value: unknown): ShareContentStatValue | null =>
    parseActiveSummary(value) ?? parseTombstoneSummary(value);

export const parseShareContentDeleteValue = (value: unknown): ShareContentDeleteValue | null =>
    parseTombstoneSummary(value);

export const parseShareContentPutValue = (value: unknown): ShareContentPutValue | null => {
    if (!isPlainObject(value) || !hasExactKeys(value, ['status', 'record'])) return null;
    if (value.status !== 'created' && value.status !== 'idempotent') return null;

    const record = parseActiveSummary(value.record);

    if (!record) return null;

    return { status: value.status, record };
};

export const parseShareContentContentProjection = (
    value: unknown
): ShareContentContentProjection | null => {
    if (!isPlainObject(value) || value.kind !== 'active') return null;
    if (
        !hasExactKeys(value, [
            'kind',
            'namespace',
            'ownerProfileId',
            'shareId',
            'contentVersion',
            'objectId',
            'operationId',
            'contentHash',
            'payloadHash',
            'envelope',
            'ciphertextBytes',
            'createdAt',
        ])
    )
        return null;

    const tuple = parseTupleFields(value);
    const envelope = parseEnvelope(value.envelope);

    if (!tuple || !envelope) return null;
    if (!isSha256Hex(value.contentHash) || !isSha256Hex(value.payloadHash)) return null;
    if (!isSafeIntegerAtLeast(value.ciphertextBytes, 0)) return null;
    if (!isNonEmptyString(value.createdAt)) return null;

    return {
        kind: 'active',
        ...tuple,
        contentHash: value.contentHash,
        payloadHash: value.payloadHash,
        envelope,
        ciphertextBytes: value.ciphertextBytes,
        createdAt: value.createdAt,
    };
};

export const parseShareContentRecoveryProjection = (
    value: unknown
): ShareContentRecoveryProjection | null => {
    if (!isPlainObject(value) || value.kind !== 'active') return null;
    if (
        !hasExactKeys(value, [
            'kind',
            'namespace',
            'ownerProfileId',
            'shareId',
            'contentVersion',
            'objectId',
            'operationId',
            'contentHash',
            'payloadHash',
            'ownerEncryptedRecovery',
            'recoveryBytes',
            'createdAt',
        ])
    )
        return null;

    const tuple = parseTupleFields(value);
    const recovery = parseOwnerRecovery(value.ownerEncryptedRecovery);

    if (!tuple || !recovery) return null;
    if (!isSha256Hex(value.contentHash) || !isSha256Hex(value.payloadHash)) return null;
    if (!isSafeIntegerAtLeast(value.recoveryBytes, 0)) return null;
    if (!isNonEmptyString(value.createdAt)) return null;

    return {
        kind: 'active',
        ...tuple,
        contentHash: value.contentHash,
        payloadHash: value.payloadHash,
        ownerEncryptedRecovery: recovery,
        recoveryBytes: value.recoveryBytes,
        createdAt: value.createdAt,
    };
};

/** Parse the fixed `{ok:true,value}` / `{ok:false,error}` JSON envelope. */
export const parseShareContentResponseEnvelope = (
    parsed: unknown
): { ok: true; value: unknown } | { ok: false; error: string } | null => {
    if (!isPlainObject(parsed)) return null;

    if (parsed.ok === true) {
        if (!('value' in parsed)) return null;

        return { ok: true, value: parsed.value };
    }

    if (parsed.ok === false) {
        if (typeof parsed.error !== 'string' || parsed.error.length === 0) return null;

        return { ok: false, error: parsed.error };
    }

    return null;
};
