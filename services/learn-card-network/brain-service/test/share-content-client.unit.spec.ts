import { generateKeyPairSync, sign as cryptoSign, verify as cryptoVerify } from 'node:crypto';

import { describe, expect, it, vi } from 'vitest';

import {
    computeShareContentRequestBodyHash,
    createShareContentClient,
    resolveShareContentClientConfig,
    type ShareContentPutRequest,
    type ShareContentTuple,
} from '@helpers/share-content-client';

/**
 * Transport tests for the LC-2187 LearnCloud client.
 *
 * Every request is validated by a fake HTTP service that independently verifies
 * the Ed25519 JWS, the JOSE header allowlist, the signed claims binding and the
 * canonical body hash. The client's token is produced by a real Ed25519 signer,
 * so these are genuine signatures, not a stub that merely echoes.
 */

const { publicKey, privateKey } = generateKeyPairSync('ed25519');

const SIGNER_DID = 'did:web:brain.test';
const KID = `${SIGNER_DID}#key-1`;
const AUDIENCE = 'did:web:learncloud.test';
const NAMESPACE = 'test-namespace';

const encodePart = (value: unknown): string =>
    Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');

const signClaims = async (claims: Record<string, unknown>): Promise<string> => {
    const header = { alg: 'EdDSA', kid: KID };
    const payload = {
        iss: claims.iss,
        vp: { holder: claims.iss },
        nonce: JSON.stringify(claims),
    };
    const signingInput = `${encodePart(header)}.${encodePart(payload)}`;
    const signature = cryptoSign(null, Buffer.from(signingInput, 'utf8'), privateKey);

    return `${signingInput}.${signature.toString('base64url')}`;
};

type DecodedToken = {
    header: Record<string, unknown>;
    payload: Record<string, unknown>;
    claims: Record<string, unknown>;
    signatureValid: boolean;
};

const decodeToken = (token: string): DecodedToken => {
    const [headerPart, payloadPart, signaturePart] = token.split('.');

    const header = JSON.parse(Buffer.from(headerPart ?? '', 'base64url').toString('utf8'));
    const payload = JSON.parse(Buffer.from(payloadPart ?? '', 'base64url').toString('utf8'));
    const signatureValid = cryptoVerify(
        null,
        Buffer.from(`${headerPart}.${payloadPart}`, 'utf8'),
        publicKey,
        Buffer.from(signaturePart ?? '', 'base64url')
    );

    return { header, payload, claims: JSON.parse(payload.nonce), signatureValid };
};

const baseTuple = (): ShareContentTuple => ({
    namespace: NAMESPACE,
    ownerProfileId: 'owner-1',
    shareId: Buffer.alloc(16, 1).toString('base64url'),
    contentVersion: 1,
    objectId: 'o'.repeat(43),
    operationId: '11111111-1111-4111-8111-111111111111',
});

const basePutRequest = (): ShareContentPutRequest => ({
    ...baseTuple(),
    envelope: {
        v: 1,
        alg: 'A256GCM',
        iv: Buffer.alloc(12, 2).toString('base64url'),
        ct: Buffer.alloc(32, 3).toString('base64url'),
    },
    ownerEncryptedRecovery: { protected: 'a', iv: 'b', ciphertext: 'c', tag: 'd' },
});

const jsonResponse = (body: unknown, status = 200): Response =>
    new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
    });

const activeSummary = (tuple: ShareContentTuple, overrides: Record<string, unknown> = {}) => ({
    kind: 'active',
    ...tuple,
    contentHash: 'a'.repeat(64),
    payloadHash: 'b'.repeat(64),
    ciphertextBytes: 32,
    recoveryBytes: 12,
    createdAt: '2026-09-20T00:00:00.000Z',
    ...overrides,
});

type HandlerContext = {
    op: string;
    body: Record<string, unknown>;
    token: string;
    claims: Record<string, unknown>;
    signal: AbortSignal | null | undefined;
    attempt: number;
};

const makeHarness = (
    handler: (context: HandlerContext) => Response | Promise<Response>,
    configOverrides: Record<string, unknown> = {}
) => {
    const calls: HandlerContext[] = [];
    const seenJtis = new Set<string>();

    const fetchImpl = vi.fn(async (input: unknown, init?: RequestInit) => {
        const url = String(input);
        const op = url.split('/').pop() ?? '';
        const headers = (init?.headers ?? {}) as Record<string, string>;
        const authorization = headers.authorization ?? '';

        expect(authorization.startsWith('Bearer ')).toBe(true);

        const token = authorization.slice('Bearer '.length);
        const decoded = decodeToken(token);

        expect(decoded.signatureValid).toBe(true);
        expect(decoded.header.alg).toBe('EdDSA');
        expect(decoded.header.kid).toBe(KID);
        expect(decoded.payload.iss).toBe(SIGNER_DID);

        const body = JSON.parse(String(init?.body));
        const claims = decoded.claims;

        expect(claims.op).toBe(op);
        expect(claims.aud).toBe(AUDIENCE);
        expect(claims.iss).toBe(SIGNER_DID);
        expect(claims.requestHash).toBe(computeShareContentRequestBodyHash(body));
        expect(claims.namespace).toBe(body.namespace);
        expect(claims.ownerProfileId).toBe(body.ownerProfileId);
        expect(claims.shareId).toBe(body.shareId);
        expect(claims.contentVersion).toBe(body.contentVersion);
        expect(claims.objectId).toBe(body.objectId);
        expect(claims.operationId).toBe(body.operationId);

        // Every transport attempt must carry a fresh CSPRNG nonce.
        expect(typeof claims.jti).toBe('string');
        expect((claims.jti as string).length).toBeGreaterThanOrEqual(16);
        expect(seenJtis.has(claims.jti as string)).toBe(false);
        seenJtis.add(claims.jti as string);

        const context: HandlerContext = {
            op,
            body,
            token,
            claims,
            signal: init?.signal,
            attempt: calls.length,
        };
        calls.push(context);

        return handler(context);
    });

    const config = resolveShareContentClientConfig({
        enabled: true,
        origin: 'https://learncloud.test',
        namespace: NAMESPACE,
        audience: AUDIENCE,
        signerDid: SIGNER_DID,
        signer: signClaims,
        sleep: async () => undefined,
        fetchImpl,
        ...configOverrides,
    });

    return { client: createShareContentClient(config), calls, fetchImpl };
};

describe('share-content-client origin and configuration', () => {
    it('accepts https and explicit loopback http, rejects other insecure origins', () => {
        const make = (options: Record<string, unknown>) =>
            resolveShareContentClientConfig({
                enabled: true,
                origin: 'https://learncloud.test',
                namespace: NAMESPACE,
                audience: AUDIENCE,
                signerDid: SIGNER_DID,
                signer: signClaims,
                ...options,
            });

        expect(make({ origin: 'https://learncloud.test' }).enabled).toBe(true);
        expect(make({ origin: 'http://localhost:3000', allowInsecureLoopback: true }).enabled).toBe(
            true
        );
        expect(make({ origin: 'http://localhost:3000' }).enabled).toBe(false);
        expect(
            make({ origin: 'http://learncloud.test', allowInsecureLoopback: true }).enabled
        ).toBe(false);
        expect(make({ origin: 'https://learncloud.test/api' }).enabled).toBe(false);
        expect(make({ origin: 'https://user:pass@learncloud.test' }).enabled).toBe(false);
        expect(make({ namespace: 'bad%3Anamespace' }).enabled).toBe(false);
        expect(make({ enabled: false }).enabled).toBe(false);
    });

    it('returns DISABLED without any network call when the config is disabled', async () => {
        const fetchImpl = vi.fn();
        const client = createShareContentClient(
            resolveShareContentClientConfig({ enabled: false, fetchImpl })
        );

        const result = await client.put(basePutRequest());

        expect(result).toEqual({ ok: false, error: 'DISABLED' });
        expect(fetchImpl).not.toHaveBeenCalled();
    });
});

describe('share-content-client request handling', () => {
    it('sends a canonical body hash and returns a validated put result', async () => {
        const { client, calls } = makeHarness(() =>
            jsonResponse({
                ok: true,
                value: { status: 'created', record: activeSummary(baseTuple()) },
            })
        );

        const result = await client.put(basePutRequest());

        expect(result.ok).toBe(true);
        if (result.ok) expect(result.value.record.objectId).toBe(baseTuple().objectId);
        expect(calls).toHaveLength(1);
        expect(calls[0]?.op).toBe('put');
        expect(calls[0]?.claims.iat).toEqual(expect.any(Number));
        expect(calls[0]?.claims.exp).toEqual(expect.any(Number));
    });

    it('never retries a semantic 409 conflict', async () => {
        const { client, fetchImpl } = makeHarness(
            () => jsonResponse({ ok: false, error: 'CONFLICT' }, 409),
            { maxAttempts: 3 }
        );

        const result = await client.put(basePutRequest());

        expect(result).toEqual({ ok: false, error: 'CONFLICT' });
        expect(fetchImpl).toHaveBeenCalledTimes(1);
    });

    it('retries transient 503 with a fresh nonce each attempt', async () => {
        const { client, calls, fetchImpl } = makeHarness(
            context =>
                context.attempt < 2
                    ? jsonResponse({ ok: false, error: 'UNAVAILABLE' }, 503)
                    : jsonResponse({
                          ok: true,
                          value: { status: 'created', record: activeSummary(baseTuple()) },
                      }),
            { maxAttempts: 3 }
        );

        const result = await client.put(basePutRequest());

        expect(result.ok).toBe(true);
        expect(fetchImpl).toHaveBeenCalledTimes(3);
        expect(new Set(calls.map(call => call.claims.jti)).size).toBe(3);
    });

    it('maps every fixed error status without leaking the response body', async () => {
        const cases: Array<[number, string]> = [
            [400, 'INVALID_INPUT'],
            [401, 'UNAUTHORIZED'],
            [404, 'NOT_FOUND'],
            [409, 'CONFLICT'],
            [413, 'PAYLOAD_TOO_LARGE'],
            [503, 'UNAVAILABLE'],
            [500, 'UNEXPECTED_STATUS'],
        ];

        for (const [status, code] of cases) {
            const { client } = makeHarness(
                () => jsonResponse({ ok: false, error: 'secret-internal-detail' }, status),
                { maxAttempts: 1 }
            );

            const result = await client.put(basePutRequest());

            expect(result).toEqual({ ok: false, error: code });
        }
    });

    it('rejects a redirect instead of following it', async () => {
        const { client } = makeHarness(
            () =>
                new Response(null, {
                    status: 302,
                    headers: { location: 'https://evil.test/internal/share-content/put' },
                }),
            { maxAttempts: 1 }
        );

        expect(await client.put(basePutRequest())).toEqual({
            ok: false,
            error: 'REDIRECT_REJECTED',
        });
    });

    it('rejects non-JSON and unmatched-tuple responses', async () => {
        const nonJson = makeHarness(
            () =>
                new Response('not-json', {
                    status: 200,
                    headers: { 'content-type': 'text/plain' },
                }),
            { maxAttempts: 1 }
        );
        expect(await nonJson.client.put(basePutRequest())).toEqual({
            ok: false,
            error: 'MALFORMED_RESPONSE',
        });

        const mismatch = makeHarness(() =>
            jsonResponse({
                ok: true,
                value: {
                    status: 'created',
                    record: activeSummary({ ...baseTuple(), objectId: 'x'.repeat(43) }),
                },
            })
        );
        expect(await mismatch.client.put(basePutRequest())).toEqual({
            ok: false,
            error: 'RESPONSE_TUPLE_MISMATCH',
        });
    });

    it('rejects an oversized response before full allocation', async () => {
        const { client } = makeHarness(
            () =>
                jsonResponse({
                    ok: true,
                    value: {
                        status: 'created',
                        record: activeSummary(baseTuple(), { padding: 'x'.repeat(8192) }),
                    },
                }),
            { maxAttempts: 1, maxResponseBytes: 1024 }
        );

        expect(await client.put(basePutRequest())).toEqual({
            ok: false,
            error: 'RESPONSE_TOO_LARGE',
        });
    });

    it('rejects an oversized request body before any network call', async () => {
        const { client, fetchImpl } = makeHarness(
            () =>
                jsonResponse({
                    ok: true,
                    value: { status: 'created', record: activeSummary(baseTuple()) },
                }),
            { maxAttempts: 1, maxRequestBytes: 1024 }
        );

        const request = basePutRequest();
        request.ownerEncryptedRecovery = { blob: 'x'.repeat(4096) };

        expect(await client.put(request)).toEqual({ ok: false, error: 'PAYLOAD_TOO_LARGE' });
        expect(fetchImpl).not.toHaveBeenCalled();
    });

    it('bounds a hanging transport with a timeout', async () => {
        const { client } = makeHarness(
            (context: HandlerContext) =>
                new Promise<Response>((_resolve, reject) => {
                    context.signal?.addEventListener('abort', () =>
                        reject(new DOMException('aborted', 'AbortError'))
                    );
                }),
            { maxAttempts: 1, requestTimeoutMs: 20 }
        );

        expect(await client.put(basePutRequest())).toEqual({ ok: false, error: 'TIMEOUT' });
    });

    it('surfaces a transport failure as NETWORK_ERROR', async () => {
        const { client } = makeHarness(() => Promise.reject(new TypeError('socket closed')), {
            maxAttempts: 1,
        });

        expect(await client.put(basePutRequest())).toEqual({ ok: false, error: 'NETWORK_ERROR' });
    });

    it('rejects an invalid envelope before any network call', async () => {
        const { client, fetchImpl } = makeHarness(() => jsonResponse({ ok: true, value: {} }));

        const request = basePutRequest();
        request.envelope = { ...request.envelope, alg: 'A128GCM' } as never;

        expect(await client.put(request)).toEqual({ ok: false, error: 'INVALID_INPUT' });
        expect(fetchImpl).not.toHaveBeenCalled();
    });

    it('supports get/stat/delete/readRecovery against the fixed routes', async () => {
        const tuple = baseTuple();
        const { client, calls } = makeHarness(context => {
            if (context.op === 'stat')
                return jsonResponse({
                    ok: true,
                    value: {
                        kind: 'tombstone',
                        ...tuple,
                        deletedAt: '2026-09-20T00:00:00.000Z',
                    },
                });
            if (context.op === 'delete')
                return jsonResponse({
                    ok: true,
                    value: { kind: 'tombstone', ...tuple, deletedAt: '2026-09-20T00:00:00.000Z' },
                });
            if (context.op === 'readRecovery')
                return jsonResponse({
                    ok: true,
                    value: {
                        kind: 'active',
                        ...tuple,
                        contentHash: 'a'.repeat(64),
                        payloadHash: 'b'.repeat(64),
                        ownerEncryptedRecovery: { protected: 'x' },
                        recoveryBytes: 12,
                        createdAt: '2026-09-20T00:00:00.000Z',
                    },
                });

            return jsonResponse({
                ok: true,
                value: {
                    kind: 'active',
                    ...tuple,
                    contentHash: 'a'.repeat(64),
                    payloadHash: 'b'.repeat(64),
                    envelope: basePutRequest().envelope,
                    ciphertextBytes: 32,
                    createdAt: '2026-09-20T00:00:00.000Z',
                },
            });
        });

        expect((await client.get(tuple)).ok).toBe(true);
        const stat = await client.stat(tuple);
        expect(stat.ok && stat.value.kind).toBe('tombstone');
        expect((await client.delete(tuple)).ok).toBe(true);
        expect((await client.readRecovery(tuple)).ok).toBe(true);
        expect(calls.map(call => call.op)).toEqual(['get', 'stat', 'delete', 'readRecovery']);
    });
});
