import { readFileSync } from 'node:fs';

import { describe, expect, it, vi } from 'vitest';

// TEST-ONLY cross-service imports of the reviewed C1 verifier. These are never
// imported by brain-service production code; they exist purely to prove the
// token/claim/hash contract interoperates with the real C1 implementation.
import { computeShareContentRequestHash } from '../../learn-cloud-service/src/helpers/share-content-auth/canonical';
import { resolveShareContentTrustConfig } from '../../learn-cloud-service/src/helpers/share-content-auth/config';
import { createShareContentAuthorizationVerifier } from '../../learn-cloud-service/src/helpers/share-content-auth/verifier';
import type { PresentationVerifier } from '../../learn-cloud-service/src/helpers/share-content-auth/types';

import {
    computeShareContentRequestBodyHash,
    createShareContentClient,
    resolveShareContentClientConfig,
    type ShareContentPutRequest,
    type ShareContentTuple,
} from '@helpers/share-content-client';

/**
 * LC-2187 Task C5 → C1 interop contract.
 *
 * The Brain client's signer is a REAL DIDKit holder-signed VP JWT (checked-in
 * WASM, did:key fixture), and the token it produces over HTTP is accepted by the
 * actual reviewed C1 authorization verifier with a real DIDKit signature check.
 * This is the strongest available evidence that the fixed cross-task contract
 * interoperates; it is not a mock echo.
 */

type DidkitWasm = {
    initSync: (input: { module: Buffer | Uint8Array }) => void;
    generateEd25519KeyFromBytes: (seed: Uint8Array) => string;
    keyToDID: (method: string, jwk: string) => string;
    issuePresentation: (
        presentation: string,
        proofOptions: string,
        key: string,
        context: string
    ) => Promise<string>;
    verifyPresentation: (
        presentation: string,
        proofOptions: string,
        context: string
    ) => Promise<string>;
};

let didkitPromise: Promise<DidkitWasm> | null = null;

const loadDidkit = (): Promise<DidkitWasm> => {
    didkitPromise ??= (async () => {
        const wasmModule =
            (await import('../../../../packages/plugins/didkit/src/didkit/pkg/didkit_wasm.js')) as unknown as DidkitWasm;

        wasmModule.initSync({
            module: readFileSync(
                new URL(
                    '../../../../packages/plugins/didkit/src/didkit/pkg/didkit_wasm_bg.wasm',
                    import.meta.url
                )
            ),
        });

        return wasmModule;
    })();

    return didkitPromise;
};

const makeDidkitIdentity = async (fill: number): Promise<{ jwk: string; did: string }> => {
    const didkit = await loadDidkit();
    const seed = new Uint8Array(32).fill(fill);
    const jwk = didkit.generateEd25519KeyFromBytes(seed);

    return { jwk, did: didkit.keyToDID('key', jwk) };
};

const issueRealPresentation = async (
    identity: { jwk: string; did: string },
    claims: Record<string, unknown>
): Promise<string> => {
    const didkit = await loadDidkit();

    return didkit.issuePresentation(
        JSON.stringify({
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiablePresentation'],
            holder: identity.did,
            verifiableCredential: [],
        }),
        JSON.stringify({
            proofPurpose: 'authentication',
            proofFormat: 'jwt',
            challenge: JSON.stringify(claims),
        }),
        identity.jwk,
        '{}'
    );
};

const realDidkitVerifier: PresentationVerifier = async token => {
    const didkit = await loadDidkit();
    const result = await didkit.verifyPresentation(
        token,
        JSON.stringify({ proofFormat: 'jwt' }),
        '{}'
    );

    return JSON.parse(result) as Awaited<ReturnType<PresentationVerifier>>;
};

const kidOf = (token: string): string => {
    const [headerPart] = token.split('.');
    const header = JSON.parse(Buffer.from(headerPart ?? '', 'base64url').toString('utf8'));

    return header.kid as string;
};

const AUDIENCE = 'did:web:learncloud.test';
const NAMESPACE = 'test-namespace';

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

describe('share-content canonical request hash matches C1', () => {
    it.each([
        [{ a: 1, b: 'two', c: [true, null] }],
        [{ namespace: NAMESPACE, ownerProfileId: 'owner-1', contentVersion: 2 }],
        [
            {
                envelope: { v: 1, alg: 'A256GCM', iv: 'aa', ct: 'bb' },
                ownerEncryptedRecovery: { protected: 'p', iv: 'i', ciphertext: 'c', tag: 't' },
            },
        ],
    ])('agrees on %#', body => {
        expect(computeShareContentRequestBodyHash(body)).toBe(computeShareContentRequestHash(body));
    });

    it('rejects the same unsupported values as C1', () => {
        expect(() => computeShareContentRequestBodyHash({ bad: undefined })).toThrow();
        expect(() => computeShareContentRequestHash({ bad: undefined })).toThrow();
    });
});

describe('real DIDKit signer token is accepted by the reviewed C1 verifier', () => {
    it('signs over the fixed put body and authorizes end-to-end', async () => {
        const brain = await makeDidkitIdentity(3);
        const request = basePutRequest();
        let capturedToken: string | null = null;
        let capturedBody: Record<string, unknown> | null = null;

        const fetchImpl = vi.fn(async (_url: unknown, init?: RequestInit) => {
            const headers = (init?.headers ?? {}) as Record<string, string>;
            capturedToken = (headers.authorization ?? '').slice('Bearer '.length);
            capturedBody = JSON.parse(String(init?.body));

            return new Response(
                JSON.stringify({
                    ok: true,
                    value: {
                        status: 'created',
                        record: {
                            kind: 'active',
                            namespace: request.namespace,
                            ownerProfileId: request.ownerProfileId,
                            shareId: request.shareId,
                            contentVersion: request.contentVersion,
                            objectId: request.objectId,
                            operationId: request.operationId,
                            contentHash: 'a'.repeat(64),
                            payloadHash: 'b'.repeat(64),
                            ciphertextBytes: 32,
                            recoveryBytes: 53,
                            createdAt: '2026-09-20T00:00:00.000Z',
                        },
                    },
                }),
                { status: 200, headers: { 'content-type': 'application/json' } }
            );
        });

        const client = createShareContentClient(
            resolveShareContentClientConfig({
                enabled: true,
                origin: 'https://learncloud.test',
                namespace: NAMESPACE,
                audience: AUDIENCE,
                signerDid: brain.did,
                signer: claims => issueRealPresentation(brain, claims),
                fetchImpl,
                sleep: async () => undefined,
            })
        );

        const result = await client.put(request);

        expect(result.ok).toBe(true);
        expect(capturedToken).not.toBeNull();
        expect(capturedBody).not.toBeNull();

        const token = capturedToken as unknown as string;
        const body = capturedBody as unknown as Record<string, unknown>;
        const kid = kidOf(token);

        expect(kid.startsWith(`${brain.did}#`)).toBe(true);

        const verifier = createShareContentAuthorizationVerifier({
            config: resolveShareContentTrustConfig({
                enabled: true,
                audience: AUDIENCE,
                serviceDids: [brain.did],
                verificationMethods: [kid],
                clockSkewSeconds: 5,
                maxTokenTtlSeconds: 60,
            }),
            verifyPresentation: realDidkitVerifier,
            replayStore: {
                consumeOnce: vi.fn(async () => true),
            },
        });

        const authorized = await verifier.authorize(
            {
                namespace: NAMESPACE,
                op: 'put',
                shareId: request.shareId,
                contentVersion: request.contentVersion,
                ownerProfileId: request.ownerProfileId,
                objectId: request.objectId,
                operationId: request.operationId,
                requestHash: computeShareContentRequestHash(body),
            },
            token
        );

        expect(authorized.ok).toBe(true);
        if (authorized.ok) {
            expect(authorized.context.signerDid).toBe(brain.did);
            expect(authorized.context.claims.aud).toBe(AUDIENCE);
            expect(authorized.context.claims.purpose).toBe('lc-share-content/v1');
            expect(authorized.context.claims.requestHash).toBe(
                computeShareContentRequestHash(body)
            );
        }

        // A different tuple must be rejected even with a valid signature.
        const mismatchVerifier = createShareContentAuthorizationVerifier({
            config: resolveShareContentTrustConfig({
                enabled: true,
                audience: AUDIENCE,
                serviceDids: [brain.did],
                verificationMethods: [kid],
            }),
            verifyPresentation: realDidkitVerifier,
            replayStore: { consumeOnce: vi.fn(async () => true) },
        });

        const mismatch = await mismatchVerifier.authorize(
            {
                namespace: NAMESPACE,
                op: 'put',
                shareId: request.shareId,
                contentVersion: request.contentVersion,
                ownerProfileId: request.ownerProfileId,
                objectId: 'x'.repeat(43),
                operationId: request.operationId,
                requestHash: computeShareContentRequestHash(body),
            },
            token
        );

        expect(mismatch).toEqual({ ok: false, reason: 'REQUEST_BINDING_MISMATCH' });
    });

    it('is rejected by C1 when the request hash does not match the body', async () => {
        const brain = await makeDidkitIdentity(7);
        const request = basePutRequest();
        let capturedToken = '';

        const fetchImpl = vi.fn(async (_url: unknown, init?: RequestInit) => {
            const headers = (init?.headers ?? {}) as Record<string, string>;
            capturedToken = (headers.authorization ?? '').slice('Bearer '.length);

            return new Response(JSON.stringify({ ok: false, error: 'CONFLICT' }), {
                status: 409,
                headers: { 'content-type': 'application/json' },
            });
        });

        const client = createShareContentClient(
            resolveShareContentClientConfig({
                enabled: true,
                origin: 'https://learncloud.test',
                namespace: NAMESPACE,
                audience: AUDIENCE,
                signerDid: brain.did,
                signer: claims => issueRealPresentation(brain, claims),
                fetchImpl,
                sleep: async () => undefined,
                maxAttempts: 1,
            })
        );

        await client.put(request);

        const kid = kidOf(capturedToken);
        const verifier = createShareContentAuthorizationVerifier({
            config: resolveShareContentTrustConfig({
                enabled: true,
                audience: AUDIENCE,
                serviceDids: [brain.did],
                verificationMethods: [kid],
            }),
            verifyPresentation: realDidkitVerifier,
            replayStore: { consumeOnce: vi.fn(async () => true) },
        });

        const result = await verifier.authorize(
            {
                namespace: NAMESPACE,
                op: 'put',
                shareId: request.shareId,
                contentVersion: request.contentVersion,
                ownerProfileId: request.ownerProfileId,
                objectId: request.objectId,
                operationId: request.operationId,
                requestHash: '0'.repeat(64),
            },
            capturedToken
        );

        expect(result).toEqual({ ok: false, reason: 'REQUEST_HASH_MISMATCH' });
    });
});
