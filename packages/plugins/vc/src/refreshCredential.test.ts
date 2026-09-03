import { vi } from 'vitest';

import type { CredentialRefreshResult, VC } from '@learncard/types';

import { getVCPlugin } from './vc';
import { refreshCredential } from './refreshCredential';
import type { RefreshCredentialOptions } from './types';

const PUBLIC_IP = '93.184.216.34';
const REFRESH_SERVICE_ID = 'https://refresh.example.com/refresh/refresh-1';

const okCheck = { checks: ['proof'], warnings: [], errors: [] };

const makeCredential = (overrides: Record<string, any> = {}): Record<string, any> => ({
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    id: 'urn:uuid:credential-1',
    type: ['VerifiableCredential'],
    issuer: 'did:example:issuer',
    validFrom: '2026-01-01T00:00:00.000Z',
    credentialSubject: { id: 'did:example:holder', achievement: { name: 'Provisional' } },
    refreshService: { id: REFRESH_SERVICE_ID, type: '1EdTechCredentialRefresh' },
    proof: {
        type: 'DataIntegrityProof',
        created: '2026-01-01T00:00:00Z',
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:example:issuer#key-1',
        proofValue: 'z111',
    },
    ...overrides,
});

const currentCredential = makeCredential();

const updatedCredential = makeCredential({
    validFrom: '2026-02-01T00:00:00.000Z',
    credentialSubject: { id: 'did:example:holder', achievement: { name: 'Final' } },
    proof: {
        type: 'DataIntegrityProof',
        created: '2026-02-01T00:00:00Z',
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:example:issuer#key-1',
        proofValue: 'z222',
    },
});

const validJwe = { protected: 'a', iv: 'b', ciphertext: 'c', tag: 'd' };

const getLearnCard = (overrides: Record<string, any> = {}) => ({
    id: { did: () => 'did:example:holder' },
    invoke: {
        verifyCredential: vi.fn(async (credential: any) =>
            credential?.proof?.type === 'DataIntegrityProof'
                ? okCheck
                : { checks: [], warnings: [], errors: ['proof'] }
        ),
        getDidAuthVp: vi.fn(
            async (options: any) => `signed-vp:${options?.challenge ?? ''}:${options?.domain ?? ''}`
        ),
        decryptDagJwe: vi.fn(async () => updatedCredential),
        ...overrides,
    },
});

const jsonResponse = (
    body: unknown,
    init: { status?: number; headers?: Record<string, string> } = {}
) =>
    new Response(typeof body === 'string' ? body : JSON.stringify(body), {
        status: init.status ?? 200,
        headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
    });

describe('refreshCredential', () => {
    let fetchMock: ReturnType<typeof vi.fn>;
    let learnCard: ReturnType<typeof getLearnCard>;

    const runRefresh = (
        credential: any = currentCredential,
        options: RefreshCredentialOptions = {}
    ): Promise<CredentialRefreshResult> =>
        refreshCredential({} as never)(learnCard as never, credential as VC, {
            resolveHost: async () => [PUBLIC_IP],
            ...options,
        });

    beforeEach(() => {
        fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        learnCard = getLearnCard();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('is registered on the VC plugin', () => {
        const plugin = getVCPlugin(learnCard as never);

        expect(typeof plugin.methods.refreshCredential).toBe('function');
    });

    describe('public services', () => {
        it('returns the verified updated credential on a public GET success', async () => {
            fetchMock.mockResolvedValue(
                jsonResponse(updatedCredential, { headers: { etag: 'W/"v2"' } })
            );

            const result = await runRefresh();

            expect(result).toEqual({
                status: 'updated',
                credential: updatedCredential,
                etag: 'W/"v2"',
            });

            expect(fetchMock).toHaveBeenCalledTimes(1);

            const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

            expect(url).toBe(REFRESH_SERVICE_ID);
            expect(init.method ?? 'GET').toBe('GET');
            expect((init.headers as Record<string, string>).accept).toContain('application/json');
            expect((init.headers as Record<string, string>).authorization).toBeUndefined();
            expect(init.redirect).toBe('manual');
        });

        it('sends If-None-Match when an etag is provided', async () => {
            fetchMock.mockResolvedValue(new Response(null, { status: 304 }));

            await runRefresh(currentCredential, { etag: 'W/"v1"' });

            const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];

            expect((init.headers as Record<string, string>)['if-none-match']).toBe('W/"v1"');
        });

        it('returns unchanged on a 304 response', async () => {
            fetchMock.mockResolvedValue(new Response(null, { status: 304 }));

            const result = await runRefresh(currentCredential, { etag: 'W/"v1"' });

            expect(result.status).toBe('unchanged');

            if (result.status === 'unchanged') {
                expect(typeof result.checkedAt).toBe('string');
                expect(result.etag).toBe('W/"v1"');
            }
        });

        it('returns unchanged when a 200 body has identical proof-insensitive content', async () => {
            const sameContent = makeCredential({
                proof: { ...makeCredential().proof, proofValue: 'z999' },
            });

            fetchMock.mockResolvedValue(jsonResponse(sameContent));

            const result = await runRefresh();

            expect(result.status).toBe('unchanged');
        });

        it('returns unsupported when the service type is not recognized', async () => {
            const credential = makeCredential({
                refreshService: { id: REFRESH_SERVICE_ID, type: 'SomeOtherRefreshService' },
            });

            const result = await runRefresh(credential);

            expect(result).toEqual({ status: 'unsupported' });
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('returns unsupported when no refresh service exists', async () => {
            const { refreshService: _omit, ...credential } = makeCredential();

            const result = await runRefresh(credential);

            expect(result).toEqual({ status: 'unsupported' });
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('returns a retryable UNAVAILABLE failure on a 5xx endpoint failure', async () => {
            fetchMock.mockResolvedValue(jsonResponse({ error: 'boom' }, { status: 500 }));

            const result = await runRefresh();

            expect(result).toEqual({ status: 'failed', code: 'UNAVAILABLE', retryable: true });
        });

        it('returns a non-retryable UNAVAILABLE failure on other error statuses', async () => {
            fetchMock.mockResolvedValue(jsonResponse({ error: 'nope' }, { status: 404 }));

            const result = await runRefresh();

            expect(result).toEqual({ status: 'failed', code: 'UNAVAILABLE', retryable: false });
        });

        it('returns a retryable TIMEOUT failure when the request is aborted', async () => {
            fetchMock.mockImplementation(
                (_url: string, init: RequestInit) =>
                    new Promise((_resolve, reject) => {
                        init.signal?.addEventListener('abort', () =>
                            reject(new DOMException('The operation was aborted', 'AbortError'))
                        );
                    })
            );

            const result = await runRefresh(currentCredential, { timeoutMs: 25 });

            expect(result).toEqual({ status: 'failed', code: 'TIMEOUT', retryable: true });
        });

        it('returns MALFORMED_RESPONSE for invalid JSON', async () => {
            fetchMock.mockResolvedValue(jsonResponse('this is not json'));

            const result = await runRefresh();

            expect(result).toEqual({
                status: 'failed',
                code: 'MALFORMED_RESPONSE',
                retryable: false,
            });
        });

        it('returns MALFORMED_RESPONSE for a wrong content type', async () => {
            fetchMock.mockResolvedValue(
                jsonResponse(updatedCredential, { headers: { 'content-type': 'text/html' } })
            );

            const result = await runRefresh();

            expect(result).toEqual({
                status: 'failed',
                code: 'MALFORMED_RESPONSE',
                retryable: false,
            });
        });

        it('returns MALFORMED_RESPONSE for an oversized streaming response', async () => {
            const stream = new ReadableStream<Uint8Array>({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode('x'.repeat(64)));
                    controller.enqueue(new TextEncoder().encode('y'.repeat(64)));
                    controller.close();
                },
            });

            fetchMock.mockResolvedValue(
                new Response(stream, {
                    status: 200,
                    headers: { 'content-type': 'application/json' },
                })
            );

            const result = await runRefresh(currentCredential, { maxResponseBytes: 100 });

            expect(result).toEqual({
                status: 'failed',
                code: 'MALFORMED_RESPONSE',
                retryable: false,
            });
        });

        it('returns INVALID_PROOF when the replacement proof fails verification', async () => {
            fetchMock.mockResolvedValue(
                jsonResponse({
                    ...updatedCredential,
                    proof: {
                        type: 'Ed25519Signature2020',
                        created: '2026-02-01T00:00:00Z',
                        proofPurpose: 'assertionMethod',
                        verificationMethod: 'did:example:issuer#key-1',
                        proofValue: 'zforged',
                    },
                })
            );

            const result = await runRefresh();

            expect(result).toEqual({ status: 'failed', code: 'INVALID_PROOF', retryable: false });
        });

        it('verifies the current credential first and never fetches when it is invalid', async () => {
            const credential = { ...currentCredential, proof: { type: 'ForgedProof' } };

            const result = await runRefresh(credential);

            expect(result).toEqual({ status: 'failed', code: 'INVALID_PROOF', retryable: false });
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('returns ID_MISMATCH when the candidate changes the credential ID', async () => {
            fetchMock.mockResolvedValue(
                jsonResponse({ ...updatedCredential, id: 'urn:uuid:credential-2' })
            );

            const result = await runRefresh();

            expect(result).toEqual({ status: 'failed', code: 'ID_MISMATCH', retryable: false });
        });

        it('returns ID_MISMATCH without fetching when the current credential has no ID', async () => {
            const { id: _omit, ...credential } = makeCredential();

            const result = await runRefresh(credential);

            expect(result).toEqual({ status: 'failed', code: 'ID_MISMATCH', retryable: false });
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('returns ISSUER_MISMATCH when the candidate changes the issuer', async () => {
            fetchMock.mockResolvedValue(
                jsonResponse({ ...updatedCredential, issuer: 'did:example:mallory' })
            );

            const result = await runRefresh();

            expect(result).toEqual({ status: 'failed', code: 'ISSUER_MISMATCH', retryable: false });
        });

        it('normalizes object-form issuers when comparing issuer identity', async () => {
            fetchMock.mockResolvedValue(
                jsonResponse({ ...updatedCredential, issuer: { id: 'did:example:issuer' } })
            );

            const result = await runRefresh();

            expect(result.status).toBe('updated');
        });

        it('returns ID_MISMATCH when the candidate changes the holder', async () => {
            fetchMock.mockResolvedValue(
                jsonResponse({
                    ...updatedCredential,
                    credentialSubject: { id: 'did:example:mallory' },
                })
            );

            const result = await runRefresh();

            expect(result).toEqual({ status: 'failed', code: 'ID_MISMATCH', retryable: false });
        });

        it('returns ROLLBACK for a strictly older effective timestamp', async () => {
            fetchMock.mockResolvedValue(
                jsonResponse({ ...updatedCredential, validFrom: '2025-06-01T00:00:00.000Z' })
            );

            const result = await runRefresh();

            expect(result).toEqual({ status: 'failed', code: 'ROLLBACK', retryable: false });
        });

        it('accepts an equal timestamp with changed content as an update', async () => {
            fetchMock.mockResolvedValue(
                jsonResponse({ ...updatedCredential, validFrom: currentCredential.validFrom })
            );

            const result = await runRefresh();

            expect(result.status).toBe('updated');
        });

        it('accepts changed content when neither credential carries a timestamp', async () => {
            const { validFrom: _a, ...current } = makeCredential();
            const { validFrom: _b, ...candidate } = { ...updatedCredential };

            fetchMock.mockResolvedValue(jsonResponse(candidate));

            const result = await runRefresh(current);

            expect(result.status).toBe('updated');
        });

        it('rejects plain-HTTP endpoints as UNSAFE_ENDPOINT', async () => {
            const credential = makeCredential({
                refreshService: {
                    id: 'http://refresh.example.com/refresh/refresh-1',
                    type: '1EdTechCredentialRefresh',
                },
            });

            const result = await runRefresh(credential);

            expect(result).toEqual({ status: 'failed', code: 'UNSAFE_ENDPOINT', retryable: false });
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it.each([
            ['loopback', 'https://127.0.0.1/refresh/x'],
            ['link-local metadata', 'https://169.254.169.254/latest/meta-data'],
            ['private range', 'https://10.1.2.3/refresh/x'],
            ['ipv6 loopback', 'https://[::1]/refresh/x'],
        ])('rejects %s host literals as UNSAFE_ENDPOINT', async (_label, id) => {
            const credential = makeCredential({
                refreshService: { id, type: '1EdTechCredentialRefresh' },
            });

            const result = await runRefresh(credential);

            expect(result).toEqual({ status: 'failed', code: 'UNSAFE_ENDPOINT', retryable: false });
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('rejects endpoints whose DNS answers include private addresses', async () => {
            const result = await runRefresh(currentCredential, {
                resolveHost: async () => [PUBLIC_IP, '192.168.1.10'],
            });

            expect(result).toEqual({ status: 'failed', code: 'UNSAFE_ENDPOINT', retryable: false });
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('allows plain HTTP only with the explicit local-development opt-in', async () => {
            const credential = makeCredential({
                refreshService: {
                    id: 'http://refresh.example.com/refresh/refresh-1',
                    type: '1EdTechCredentialRefresh',
                },
            });

            fetchMock.mockResolvedValue(jsonResponse(updatedCredential));

            const result = await runRefresh(credential, { allowInsecureHttp: true });

            expect(result.status).toBe('updated');
        });

        it('follows a same-origin redirect and revalidates the target', async () => {
            fetchMock
                .mockResolvedValueOnce(
                    new Response(null, {
                        status: 302,
                        headers: { location: '/refresh/refresh-2' },
                    })
                )
                .mockResolvedValueOnce(jsonResponse(updatedCredential));

            const result = await runRefresh();

            expect(result.status).toBe('updated');
            expect(fetchMock).toHaveBeenCalledTimes(2);
            expect(fetchMock.mock.calls[1][0]).toBe(
                'https://refresh.example.com/refresh/refresh-2'
            );
        });

        it('rejects redirects to unsafe targets', async () => {
            fetchMock.mockResolvedValue(
                new Response(null, {
                    status: 302,
                    headers: { location: 'https://127.0.0.1/refresh/x' },
                })
            );

            const result = await runRefresh();

            expect(result).toEqual({ status: 'failed', code: 'UNSAFE_ENDPOINT', retryable: false });
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it('caps the number of followed redirects', async () => {
            fetchMock.mockResolvedValue(
                new Response(null, {
                    status: 302,
                    headers: { location: '/refresh/loop' },
                })
            );

            const result = await runRefresh(currentCredential, { maxRedirects: 2 });

            expect(result).toEqual({ status: 'failed', code: 'UNAVAILABLE', retryable: false });
            expect(fetchMock).toHaveBeenCalledTimes(3);
        });
    });

    describe('managed services', () => {
        const challengeHeaders = {
            'www-authenticate':
                'LearnCardDIDAuth challenge="srv-challenge-1", domain="refresh.example.com"',
            'content-type': 'application/json',
        };
        const challengeBody = {
            challenge: 'srv-challenge-1',
            expiresAt: '2099-01-01T00:00:00.000Z',
            domain: 'refresh.example.com',
        };

        const challengeResponse = (headers: Record<string, string>, body?: unknown) =>
            new Response(body === undefined ? null : JSON.stringify(body), {
                status: 401,
                headers,
            });

        it('answers a LearnCardDIDAuth challenge once and decrypts the returned JWE', async () => {
            fetchMock
                .mockResolvedValueOnce(challengeResponse(challengeHeaders, challengeBody))
                .mockResolvedValueOnce(
                    jsonResponse({ format: 'jwe', jwe: validJwe, etag: 'W/"enc-2"', version: 3 })
                );

            const result = await runRefresh();

            expect(fetchMock).toHaveBeenCalledTimes(2);
            expect(learnCard.invoke.getDidAuthVp).toHaveBeenCalledWith({
                proofFormat: 'jwt',
                challenge: 'srv-challenge-1',
                domain: 'refresh.example.com',
            });

            const [retryUrl, retryInit] = fetchMock.mock.calls[1] as [string, RequestInit];
            const retryHeaders = retryInit.headers as Record<string, string>;

            expect(retryUrl).toBe(REFRESH_SERVICE_ID);
            expect(retryHeaders.authorization).toBe(
                'Bearer signed-vp:srv-challenge-1:refresh.example.com'
            );

            expect(learnCard.invoke.decryptDagJwe).toHaveBeenCalledWith(validJwe);
            expect(result).toEqual({
                status: 'updated',
                credential: updatedCredential,
                etag: 'W/"enc-2"',
                managedVersion: 3,
            });
        });

        it('accepts a challenge carried only in the JSON body', async () => {
            fetchMock
                .mockResolvedValueOnce(
                    challengeResponse(
                        {
                            'www-authenticate': 'LearnCardDIDAuth',
                            'content-type': 'application/json',
                        },
                        challengeBody
                    )
                )
                .mockResolvedValueOnce(jsonResponse(updatedCredential));

            const result = await runRefresh();

            expect(learnCard.invoke.getDidAuthVp).toHaveBeenCalledWith({
                proofFormat: 'jwt',
                challenge: 'srv-challenge-1',
                domain: 'refresh.example.com',
            });
            expect(result.status).toBe('updated');
        });

        it('rejects a malformed challenge without signing', async () => {
            fetchMock.mockResolvedValue(
                challengeResponse(
                    {
                        'www-authenticate': 'LearnCardDIDAuth',
                        'content-type': 'application/json',
                    },
                    'not json at all'
                )
            );

            const result = await runRefresh();

            expect(result).toEqual({ status: 'failed', code: 'UNAUTHORIZED', retryable: false });
            expect(learnCard.invoke.getDidAuthVp).not.toHaveBeenCalled();
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it('rejects an expired challenge without signing', async () => {
            fetchMock.mockResolvedValue(
                challengeResponse(challengeHeaders, {
                    ...challengeBody,
                    expiresAt: '2020-01-01T00:00:00.000Z',
                })
            );

            const result = await runRefresh();

            expect(result).toEqual({ status: 'failed', code: 'UNAUTHORIZED', retryable: false });
            expect(learnCard.invoke.getDidAuthVp).not.toHaveBeenCalled();
        });

        it('rejects a replayed challenge value without signing again', async () => {
            const method = refreshCredential({} as never);
            const options: RefreshCredentialOptions = { resolveHost: async () => [PUBLIC_IP] };

            fetchMock
                .mockResolvedValueOnce(challengeResponse(challengeHeaders, challengeBody))
                .mockResolvedValueOnce(jsonResponse(updatedCredential));

            const first = await method(learnCard as never, currentCredential as VC, options);

            expect(first.status).toBe('updated');

            fetchMock.mockResolvedValueOnce(challengeResponse(challengeHeaders, challengeBody));

            const second = await method(learnCard as never, currentCredential as VC, options);

            expect(second).toEqual({ status: 'failed', code: 'UNAUTHORIZED', retryable: false });
            expect(learnCard.invoke.getDidAuthVp).toHaveBeenCalledTimes(1);
        });

        it('allows exactly one authenticated retry', async () => {
            fetchMock
                .mockResolvedValueOnce(challengeResponse(challengeHeaders, challengeBody))
                .mockResolvedValueOnce(
                    challengeResponse(
                        {
                            'www-authenticate':
                                'LearnCardDIDAuth challenge="srv-challenge-2", domain="refresh.example.com"',
                            'content-type': 'application/json',
                        },
                        { ...challengeBody, challenge: 'srv-challenge-2' }
                    )
                );

            const result = await runRefresh();

            expect(result).toEqual({ status: 'failed', code: 'UNAUTHORIZED', retryable: false });
            expect(fetchMock).toHaveBeenCalledTimes(2);
            expect(learnCard.invoke.getDidAuthVp).toHaveBeenCalledTimes(1);
        });

        it('fails a managed JWE response when no decrypt capability exists', async () => {
            learnCard = getLearnCard({ decryptDagJwe: undefined });

            fetchMock.mockResolvedValue(jsonResponse({ format: 'jwe', jwe: validJwe }));

            const result = await runRefresh();

            expect(result).toEqual({
                status: 'failed',
                code: 'UNSUPPORTED_SERVICE',
                retryable: false,
            });
        });

        it('returns REVOKED on a 410 response', async () => {
            fetchMock.mockResolvedValue(
                jsonResponse({ code: 'CREDENTIAL_REVOKED' }, { status: 410 })
            );

            const result = await runRefresh();

            expect(result).toEqual({ status: 'failed', code: 'REVOKED', retryable: false });
        });

        it('never forwards DID authorization to a redirected origin', async () => {
            fetchMock
                .mockResolvedValueOnce(challengeResponse(challengeHeaders, challengeBody))
                .mockResolvedValueOnce(
                    new Response(null, {
                        status: 302,
                        headers: { location: 'https://other.example.com/refresh/refresh-1' },
                    })
                )
                .mockResolvedValueOnce(jsonResponse(updatedCredential));

            const result = await runRefresh();

            expect(fetchMock).toHaveBeenCalledTimes(3);

            const [, crossOriginInit] = fetchMock.mock.calls[2] as [string, RequestInit];

            expect(
                (crossOriginInit.headers as Record<string, string>).authorization
            ).toBeUndefined();
            expect(result.status).toBe('updated');
        });
    });
});
