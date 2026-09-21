import { randomBytes } from 'node:crypto';

import { computeShareContentRequestBodyHash } from './canonical';
import {
    parseShareContentContentProjection,
    parseShareContentDeleteValue,
    parseShareContentPutValue,
    parseShareContentRecoveryProjection,
    parseShareContentResponseEnvelope,
    parseShareContentStatValue,
} from './responses';
import {
    MAX_SHARE_CONTENT_RETRY_BACKOFF_MS,
    MAX_SHARE_CONTENT_TOKEN_TTL_SECONDS,
    SHARE_CONTENT_AUTH_PURPOSE,
    isTransientShareContentError,
    type ShareContentAuthorizationClaims,
    type ShareContentClient,
    type ShareContentClientConfig,
    type ShareContentClientErrorCode,
    type ShareContentClientResult,
    type ShareContentContentProjection,
    type ShareContentDeleteValue,
    type ShareContentEnvelope,
    type ShareContentOperation,
    type ShareContentPutRequest,
    type ShareContentPutValue,
    type ShareContentRecoveryProjection,
    type ShareContentStatValue,
    type ShareContentTuple,
} from './types';

const OPAQUE_IDENTIFIER_RE = /^[A-Za-z0-9._~-]+$/;

const isOpaqueIdentifier = (value: unknown): value is string =>
    typeof value === 'string' &&
    value.length >= 1 &&
    value.length <= 128 &&
    OPAQUE_IDENTIFIER_RE.test(value);

const isSafeVersion = (value: unknown): value is number =>
    typeof value === 'number' && Number.isSafeInteger(value) && value >= 1 && value <= 2 ** 31 - 1;

const isValidTuple = (tuple: ShareContentTuple): boolean =>
    isOpaqueIdentifier(tuple.namespace) &&
    isOpaqueIdentifier(tuple.ownerProfileId) &&
    isOpaqueIdentifier(tuple.shareId) &&
    isSafeVersion(tuple.contentVersion) &&
    isOpaqueIdentifier(tuple.objectId) &&
    isOpaqueIdentifier(tuple.operationId);

const isValidEnvelope = (envelope: unknown): envelope is ShareContentEnvelope => {
    if (typeof envelope !== 'object' || envelope === null || Array.isArray(envelope)) return false;

    const candidate = envelope as Record<string, unknown>;

    return (
        candidate.v === 1 &&
        candidate.alg === 'A256GCM' &&
        typeof candidate.iv === 'string' &&
        candidate.iv.length > 0 &&
        typeof candidate.ct === 'string' &&
        candidate.ct.length > 0
    );
};

/** Fresh CSPRNG nonce for every transport attempt (never reused across retries). */
const generateJti = (): string => randomBytes(24).toString('base64url');

const buildRequestBody = (
    request: ShareContentPutRequest | ShareContentTuple
): Record<string, unknown> => {
    const body: Record<string, unknown> = {
        namespace: request.namespace,
        ownerProfileId: request.ownerProfileId,
        shareId: request.shareId,
        contentVersion: request.contentVersion,
        objectId: request.objectId,
        operationId: request.operationId,
    };

    if ('envelope' in request && 'ownerEncryptedRecovery' in request) {
        body.envelope = request.envelope;
        body.ownerEncryptedRecovery = request.ownerEncryptedRecovery;
    }

    return body;
};

const buildUrl = (config: ShareContentClientConfig, op: ShareContentOperation): string =>
    `${config.origin}/internal/share-content/${op}`;

const mapStatusToError = (status: number): ShareContentClientErrorCode => {
    switch (status) {
        case 400:
            return 'INVALID_INPUT';
        case 401:
            return 'UNAUTHORIZED';
        case 404:
            return 'NOT_FOUND';
        case 409:
            return 'CONFLICT';
        case 413:
            return 'PAYLOAD_TOO_LARGE';
        case 503:
            return 'UNAVAILABLE';
        default:
            return 'UNEXPECTED_STATUS';
    }
};

const responseTupleMatches = (
    value: {
        namespace: string;
        ownerProfileId: string;
        shareId: string;
        contentVersion: number;
        objectId: string;
        operationId: string;
    },
    tuple: ShareContentTuple
): boolean =>
    value.namespace === tuple.namespace &&
    value.ownerProfileId === tuple.ownerProfileId &&
    value.shareId === tuple.shareId &&
    value.contentVersion === tuple.contentVersion &&
    value.objectId === tuple.objectId &&
    value.operationId === tuple.operationId;

/** Decode the JOSE header and require it binds exactly the configured signer. */
const validateSignedTokenHeader = (token: string, signerDid: string): boolean => {
    if (typeof token !== 'string') return false;

    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const [headerPart, payloadPart, signaturePart] = parts;
    if (!headerPart || !payloadPart || !signaturePart) return false;

    let header: unknown;

    try {
        header = JSON.parse(Buffer.from(headerPart, 'base64url').toString('utf8'));
    } catch {
        return false;
    }

    if (typeof header !== 'object' || header === null) return false;

    const candidate = header as Record<string, unknown>;

    return (
        candidate.alg === 'EdDSA' &&
        typeof candidate.kid === 'string' &&
        candidate.kid.startsWith(`${signerDid}#`)
    );
};

export const createShareContentClient = (config: ShareContentClientConfig): ShareContentClient => {
    const readBoundedBody = async (
        response: Response,
        maxBytes: number
    ): Promise<{ ok: true; text: string } | { ok: false; error: ShareContentClientErrorCode }> => {
        const body = response.body;

        if (!body || typeof body.getReader !== 'function') {
            try {
                const text = await response.text();
                if (Buffer.byteLength(text, 'utf8') > maxBytes) {
                    return { ok: false, error: 'RESPONSE_TOO_LARGE' };
                }

                return { ok: true, text };
            } catch {
                return { ok: false, error: 'NETWORK_ERROR' };
            }
        }

        const reader = body.getReader();
        const chunks: Uint8Array[] = [];
        let total = 0;

        try {
            for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                if (!value) continue;

                total += value.byteLength;

                if (total > maxBytes) {
                    await reader.cancel().catch(() => undefined);

                    return { ok: false, error: 'RESPONSE_TOO_LARGE' };
                }

                chunks.push(value);
            }
        } catch {
            return { ok: false, error: 'NETWORK_ERROR' };
        }

        return {
            ok: true,
            text: Buffer.concat(chunks.map(chunk => Buffer.from(chunk))).toString('utf8'),
        };
    };

    const attemptOnce = async <T>(
        op: ShareContentOperation,
        bodyText: string,
        requestHash: string,
        expectedTuple: ShareContentTuple,
        parseValue: (value: unknown) => T | null,
        selectTuple: (value: T) => ShareContentTuple
    ): Promise<ShareContentClientResult<T>> => {
        const nowSeconds = Math.floor(config.now() / 1000);
        const claims: ShareContentAuthorizationClaims = {
            iss: config.signerDid,
            aud: config.audience,
            purpose: SHARE_CONTENT_AUTH_PURPOSE,
            namespace: expectedTuple.namespace,
            op,
            shareId: expectedTuple.shareId,
            contentVersion: expectedTuple.contentVersion,
            ownerProfileId: expectedTuple.ownerProfileId,
            objectId: expectedTuple.objectId,
            operationId: expectedTuple.operationId,
            requestHash,
            iat: nowSeconds,
            exp: nowSeconds + MAX_SHARE_CONTENT_TOKEN_TTL_SECONDS,
            jti: generateJti(),
        };

        let token: string;

        try {
            token = await config.signer(claims);
        } catch {
            return { ok: false, error: 'SIGNING_FAILED' };
        }

        if (!validateSignedTokenHeader(token, config.signerDid)) {
            return { ok: false, error: 'SIGNING_FAILED' };
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs);

        try {
            let response: Response;

            try {
                response = await config.fetchImpl(buildUrl(config, op), {
                    method: 'POST',
                    headers: {
                        authorization: `Bearer ${token}`,
                        'content-type': 'application/json',
                        accept: 'application/json',
                        'cache-control': 'no-store',
                    },
                    body: bodyText,
                    redirect: 'manual',
                    signal: controller.signal,
                });
            } catch {
                return {
                    ok: false,
                    error: controller.signal.aborted ? 'TIMEOUT' : 'NETWORK_ERROR',
                };
            }

            if (response.status >= 300 && response.status < 400) {
                return { ok: false, error: 'REDIRECT_REJECTED' };
            }

            if (response.status !== 200) {
                // Drain a bounded amount so the socket can be reused; the body is
                // discarded and never surfaces in the returned error.
                await readBoundedBody(response, config.maxResponseBytes).catch(() => undefined);

                return { ok: false, error: mapStatusToError(response.status) };
            }

            const read = await readBoundedBody(response, config.maxResponseBytes);

            if (!read.ok) {
                if (read.error === 'NETWORK_ERROR' && controller.signal.aborted) {
                    return { ok: false, error: 'TIMEOUT' };
                }

                return { ok: false, error: read.error };
            }

            let parsed: unknown;

            try {
                parsed = JSON.parse(read.text);
            } catch {
                return { ok: false, error: 'MALFORMED_RESPONSE' };
            }

            const envelope = parseShareContentResponseEnvelope(parsed);

            if (!envelope || !envelope.ok) return { ok: false, error: 'MALFORMED_RESPONSE' };

            const value = parseValue(envelope.value);

            if (!value) return { ok: false, error: 'MALFORMED_RESPONSE' };

            if (!responseTupleMatches(selectTuple(value), expectedTuple)) {
                return { ok: false, error: 'RESPONSE_TUPLE_MISMATCH' };
            }

            return { ok: true, value };
        } finally {
            clearTimeout(timer);
        }
    };

    const perform = async <T>(
        op: ShareContentOperation,
        body: Record<string, unknown>,
        expectedTuple: ShareContentTuple,
        parseValue: (value: unknown) => T | null,
        selectTuple: (value: T) => ShareContentTuple
    ): Promise<ShareContentClientResult<T>> => {
        if (!config.enabled) return { ok: false, error: 'DISABLED' };
        if (!isValidTuple(expectedTuple)) return { ok: false, error: 'INVALID_INPUT' };

        let bodyText: string;

        try {
            bodyText = JSON.stringify(body);
        } catch {
            return { ok: false, error: 'INVALID_INPUT' };
        }

        if (typeof bodyText !== 'string') return { ok: false, error: 'INVALID_INPUT' };
        if (Buffer.byteLength(bodyText, 'utf8') > config.maxRequestBytes) {
            return { ok: false, error: 'PAYLOAD_TOO_LARGE' };
        }

        let requestHash: string;

        try {
            requestHash = computeShareContentRequestBodyHash(body, {
                maxBytes: config.maxRequestBytes,
            });
        } catch {
            return { ok: false, error: 'INVALID_INPUT' };
        }

        let lastError: ShareContentClientErrorCode = 'NETWORK_ERROR';

        for (let attempt = 1; attempt <= config.maxAttempts; attempt += 1) {
            const result = await attemptOnce(
                op,
                bodyText,
                requestHash,
                expectedTuple,
                parseValue,
                selectTuple
            );

            if (result.ok) return result;

            lastError = result.error;

            if (!isTransientShareContentError(result.error) || attempt === config.maxAttempts) {
                return result;
            }

            const backoff = Math.min(
                config.retryBackoffMs * 2 ** (attempt - 1),
                MAX_SHARE_CONTENT_RETRY_BACKOFF_MS
            );

            if (backoff > 0) await config.sleep(backoff);
        }

        return { ok: false, error: lastError };
    };

    return {
        config,
        put: async (request: ShareContentPutRequest) => {
            if (!isValidEnvelope(request.envelope)) return { ok: false, error: 'INVALID_INPUT' };

            return perform(
                'put',
                buildRequestBody(request),
                request,
                parseShareContentPutValue,
                value => value.record
            );
        },
        get: async (request: ShareContentTuple) =>
            perform(
                'get',
                buildRequestBody(request),
                request,
                parseShareContentContentProjection,
                value => value
            ),
        stat: async (request: ShareContentTuple) =>
            perform(
                'stat',
                buildRequestBody(request),
                request,
                parseShareContentStatValue,
                value => value
            ),
        delete: async (request: ShareContentTuple) =>
            perform(
                'delete',
                buildRequestBody(request),
                request,
                parseShareContentDeleteValue,
                value => value
            ),
        readRecovery: async (request: ShareContentTuple) =>
            perform(
                'readRecovery',
                buildRequestBody(request),
                request,
                parseShareContentRecoveryProjection,
                value => value
            ),
    };
};

export type { ShareContentClient, ShareContentClientConfig };
export type {
    ShareContentContentProjection,
    ShareContentDeleteValue,
    ShareContentPutValue,
    ShareContentRecoveryProjection,
    ShareContentStatValue,
};
