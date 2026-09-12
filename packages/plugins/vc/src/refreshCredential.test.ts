/* eslint-disable @typescript-eslint/no-explicit-any -- refresh protocol tests use intentionally partial wallet and credential doubles */
import { readFile } from 'node:fs/promises';

import { vi } from 'vitest';

import type { CredentialRefreshResult, JWKWithPrivateKey, VC } from '@learncard/types';
import { getDidKitPlugin } from '@learncard/didkit-plugin';

import { getVCPlugin } from './vc';
import { refreshCredential } from './refreshCredential';
import type { PinnedAddress } from './refreshCredential.fetch';
import type { RefreshCredentialOptions } from './types';

const guardedTransportMock = vi.hoisted(() =>
    vi.fn((url: URL, init: RequestInit, _pinnedAddress?: PinnedAddress) =>
        globalThis.fetch(url.href, init)
    )
);

vi.mock('./refreshCredential.fetch', () => ({ fetchWithPinnedAddress: guardedTransportMock }));

const PUBLIC_IP = '93.184.216.34';
const SECOND_PUBLIC_IP = '142.250.72.14';
const REFRESH_SERVICE_ID = 'https://refresh.example.com/refresh/refresh-1';

const okCheck: { checks: string[]; warnings: string[]; errors: string[] } = {
    checks: ['proof'],
    warnings: [],
    errors: [],
};

const makeCredential = (overrides: Record<string, any> = {}): Record<string, any> => ({
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    id: 'urn:uuid:credential-1',
    type: ['VerifiableCredential'],
    issuer: 'did:example:issuer',
    validFrom: '2026-01-01T00:00:00.000Z',
    credentialSubject: { id: 'did:example:holder', achievement: { name: 'Provisional' } },
    refreshService: { id: REFRESH_SERVICE_ID, type: 'LearnCardCredentialRefresh2026' },
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

    it('refreshes a standard JSON credential without a credential ID', async () => {
        const service = { id: REFRESH_SERVICE_ID, type: '1EdTechCredentialRefresh' };
        const held = makeCredential({ id: undefined, refreshService: service });
        const next = makeCredential({
            id: undefined,
            refreshService: service,
            validFrom: '2026-03-01T00:00:00Z',
        });
        fetchMock.mockResolvedValue(jsonResponse(next));
        expect(await runRefresh(held)).toMatchObject({ status: 'updated' });
    });

    it('does not sign a LearnCard challenge from a standard service', async () => {
        fetchMock.mockResolvedValue(jsonResponse({}, { status: 401 }));
        const held = makeCredential({
            refreshService: { id: REFRESH_SERVICE_ID, type: '1EdTechCredentialRefresh' },
        });
        expect(await runRefresh(held)).toMatchObject({ status: 'failed', code: 'UNAUTHORIZED' });
        expect(learnCard.invoke.getDidAuthVp).not.toHaveBeenCalled();
    });

    it('rejects a managed envelope advertised as a standard service', async () => {
        fetchMock.mockResolvedValue(jsonResponse({ format: 'jwe', jwe: validJwe }));
        const held = makeCredential({
            refreshService: { id: REFRESH_SERVICE_ID, type: '1EdTechCredentialRefresh' },
        });
        expect(await runRefresh(held)).toMatchObject({ status: 'failed' });
        expect(learnCard.invoke.decryptDagJwe).not.toHaveBeenCalled();
    });

    beforeEach(() => {
        fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        guardedTransportMock.mockClear();
        learnCard = getLearnCard();
    });

    afterEach(() => {
        vi.useRealTimers();
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
            expect((init.headers as Record<string, string>).accept).not.toContain(
                'application/jwt'
            );
            expect((init.headers as Record<string, string>).accept).not.toContain(
                'application/vc+jwt'
            );
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

        it('keeps the timeout active until the response body has been consumed', async () => {
            fetchMock.mockImplementation((_url: string, init: RequestInit) => {
                const stream = new ReadableStream<Uint8Array>({
                    start(controller) {
                        init.signal?.addEventListener('abort', () => {
                            controller.error(
                                new DOMException('The operation was aborted', 'AbortError')
                            );
                        });
                    },
                });

                return Promise.resolve(
                    new Response(stream, {
                        status: 200,
                        headers: { 'content-type': 'application/json' },
                    })
                );
            });

            const result = await Promise.race([
                runRefresh(currentCredential, { timeoutMs: 25 }),
                new Promise<'body-still-pending'>(resolve =>
                    setTimeout(() => resolve('body-still-pending'), 100)
                ),
            ]);

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

        it.each(['application/jwt', 'application/vc+jwt'])(
            'does not accept advertised compact JWT media type %s as JSON',
            async contentType => {
                fetchMock.mockResolvedValue(
                    jsonResponse(updatedCredential, {
                        headers: { 'content-type': contentType },
                    })
                );

                const result = await runRefresh();

                expect(result).toEqual({
                    status: 'failed',
                    code: 'MALFORMED_RESPONSE',
                    retryable: false,
                });
            }
        );

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

        it('requires the current credential verification to report a proof check', async () => {
            learnCard.invoke.verifyCredential.mockResolvedValue({
                checks: [],
                warnings: [],
                errors: [],
            });

            const result = await runRefresh();

            expect(result).toEqual({ status: 'failed', code: 'INVALID_PROOF', retryable: false });
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('rejects a current credential whose proof verification reports a warning', async () => {
            learnCard.invoke.verifyCredential.mockResolvedValue({
                checks: ['proof'],
                warnings: ['The issuer did not authorize this signing key'],
                errors: [],
            });

            const result = await runRefresh();

            expect(result).toEqual({ status: 'failed', code: 'INVALID_PROOF', retryable: false });
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('requires the replacement verification to report a proof check', async () => {
            learnCard.invoke.verifyCredential
                .mockResolvedValueOnce(okCheck)
                .mockResolvedValueOnce({ checks: [], warnings: [], errors: [] });
            fetchMock.mockResolvedValue(jsonResponse(updatedCredential));

            const result = await runRefresh();

            expect(result).toEqual({ status: 'failed', code: 'INVALID_PROOF', retryable: false });
        });

        it('rejects a replacement whose proof verification reports a warning', async () => {
            learnCard.invoke.verifyCredential.mockResolvedValueOnce(okCheck).mockResolvedValueOnce({
                checks: ['proof'],
                warnings: ['The issuer did not authorize this signing key'],
                errors: [],
            });
            fetchMock.mockResolvedValue(jsonResponse(updatedCredential));

            const result = await runRefresh();

            expect(result).toEqual({ status: 'failed', code: 'INVALID_PROOF', retryable: false });
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
                    type: 'LearnCardCredentialRefresh2026',
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
            ['IPv4-mapped IPv6 loopback', 'https://[::ffff:127.0.0.1]/refresh/x'],
            [
                'expanded IPv4-mapped IPv6 metadata address',
                'https://[0:0:0:0:0:ffff:a9fe:a9fe]/latest/meta-data',
            ],
            ['NAT64 well-known prefix', 'https://[64:ff9b::a9fe:a9fe]/latest/meta-data'],
            ['NAT64 local-use prefix', 'https://[64:ff9b:1::a9fe:a9fe]/latest/meta-data'],
            ['6to4 transition prefix', 'https://[2002:a9fe:a9fe::]/latest/meta-data'],
        ])('rejects %s host literals as UNSAFE_ENDPOINT', async (_label, id) => {
            const credential = makeCredential({
                refreshService: { id, type: 'LearnCardCredentialRefresh2026' },
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

        it('allows a private address only with the explicit local-development opt-in', async () => {
            const credential = makeCredential({
                refreshService: {
                    id: 'http://localhost:4000/refresh/refresh-1',
                    type: 'LearnCardCredentialRefresh2026',
                },
            });

            fetchMock.mockResolvedValue(jsonResponse(updatedCredential));

            const result = await runRefresh(credential, {
                allowInsecureHttp: true,
                allowPrivateAddresses: true,
                resolveHost: async () => ['127.0.0.1'],
            });

            expect(result.status).toBe('updated');
            expect(guardedTransportMock).toHaveBeenCalledWith(
                new URL('http://localhost:4000/refresh/refresh-1'),
                expect.objectContaining({ method: 'GET' }),
                { address: '127.0.0.1', family: 4 }
            );
        });

        it('passes the validated DNS address to the connection transport', async () => {
            const resolveHost = vi.fn(async () => [PUBLIC_IP]);

            fetchMock.mockResolvedValue(jsonResponse(updatedCredential));

            const result = await runRefresh(currentCredential, { resolveHost });

            expect(result.status).toBe('updated');
            expect(resolveHost).toHaveBeenCalledTimes(1);
            expect(guardedTransportMock).toHaveBeenCalledWith(
                new URL(REFRESH_SERVICE_ID),
                expect.objectContaining({ method: 'GET' }),
                { address: PUBLIC_IP, family: 4 }
            );
        });

        it.each(['::ffff:7f00:1', '0:0:0:0:0:ffff:a9fe:a9fe'])(
            'rejects a private IPv4-mapped DNS answer in canonical form (%s)',
            async mappedAddress => {
                const result = await runRefresh(currentCredential, {
                    resolveHost: async () => [mappedAddress],
                });

                expect(result).toEqual({
                    status: 'failed',
                    code: 'UNSAFE_ENDPOINT',
                    retryable: false,
                });
                expect(fetchMock).not.toHaveBeenCalled();
            }
        );

        it.each(['64:ff9b::a9fe:a9fe', '64:ff9b:1::a9fe:a9fe', '2002:a9fe:a9fe::'])(
            'rejects an IPv4 transition/translation DNS answer (%s)',
            async translatedAddress => {
                const result = await runRefresh(currentCredential, {
                    resolveHost: async () => [translatedAddress],
                });

                expect(result).toEqual({
                    status: 'failed',
                    code: 'UNSAFE_ENDPOINT',
                    retryable: false,
                });
                expect(fetchMock).not.toHaveBeenCalled();
            }
        );

        it.each([
            [
                'literal',
                makeCredential({
                    refreshService: {
                        id: 'https://[2606:4700:4700::1111]/refresh/x',
                        type: 'LearnCardCredentialRefresh2026',
                    },
                }),
                {},
            ],
            [
                'DNS answer',
                currentCredential,
                { resolveHost: async () => ['2606:4700:4700::1111'] },
            ],
        ])('allows an ordinary public IPv6 %s', async (_label, credential, options) => {
            fetchMock.mockResolvedValue(jsonResponse(updatedCredential));

            const result = await runRefresh(credential, options);

            expect(result.status).toBe('updated');
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it('allows plain HTTP only with the explicit local-development opt-in', async () => {
            const credential = makeCredential({
                refreshService: {
                    id: 'http://refresh.example.com/refresh/refresh-1',
                    type: 'LearnCardCredentialRefresh2026',
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

        it('pins the separately validated address for every redirect target', async () => {
            const resolveHost = vi.fn(async (hostname: string) =>
                hostname === 'refresh.example.com' ? [PUBLIC_IP] : [SECOND_PUBLIC_IP]
            );

            fetchMock
                .mockResolvedValueOnce(
                    new Response(null, {
                        status: 302,
                        headers: { location: 'https://other.example.com/refresh/refresh-2' },
                    })
                )
                .mockResolvedValueOnce(jsonResponse(updatedCredential));

            const result = await runRefresh(currentCredential, { resolveHost });

            expect(result.status).toBe('updated');
            expect(resolveHost).toHaveBeenCalledTimes(2);
            expect(guardedTransportMock.mock.calls.map(call => call[2])).toEqual([
                { address: PUBLIC_IP, family: 4 },
                { address: SECOND_PUBLIC_IP, family: 4 },
            ]);
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

    it('shares one timeout budget across redirect hops', async () => {
        vi.useFakeTimers();
        fetchMock
            .mockImplementationOnce(
                () =>
                    new Promise(resolve => {
                        setTimeout(
                            () =>
                                resolve(
                                    new Response(null, {
                                        status: 302,
                                        headers: { location: '/next' },
                                    })
                                ),
                            15
                        );
                    })
            )
            .mockImplementationOnce(
                (_url, init) =>
                    new Promise((_resolve, reject) => {
                        init.signal.addEventListener('abort', () =>
                            reject(new DOMException('aborted', 'AbortError'))
                        );
                    })
            );
        const pending = runRefresh(currentCredential, { timeoutMs: 25 });
        await vi.advanceTimersByTimeAsync(25);
        const secondSignal = fetchMock.mock.calls[1]?.[1].signal;
        expect(secondSignal?.aborted).toBe(true);
        expect(await pending).toEqual({ status: 'failed', code: 'TIMEOUT', retryable: true });
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

        it('does not sign for a cross-origin redirect target', async () => {
            fetchMock
                .mockResolvedValueOnce(
                    new Response(null, {
                        status: 302,
                        headers: { location: 'https://other.example.com/refresh/1' },
                    })
                )
                .mockResolvedValueOnce(
                    challengeResponse({
                        'www-authenticate':
                            'LearnCardDIDAuth challenge="other", domain="other.example.com"',
                    })
                );
            expect(await runRefresh()).toEqual({
                status: 'failed',
                code: 'UNAUTHORIZED',
                retryable: false,
            });
            expect(learnCard.invoke.getDidAuthVp).not.toHaveBeenCalled();
            expect(fetchMock).toHaveBeenCalledTimes(2);
        });

        it('bounds live challenge retention and frees expired capacity', async () => {
            let now = Date.now();
            vi.spyOn(Date, 'now').mockImplementation(() => now);
            const method = refreshCredential({} as never);
            const options = { resolveHost: async () => [PUBLIC_IP] };
            const queueChallenge = (index: number) =>
                fetchMock.mockResolvedValueOnce(
                    challengeResponse(
                        { 'www-authenticate': 'LearnCardDIDAuth' },
                        {
                            ...challengeBody,
                            challenge: `bounded-${index}`,
                            expiresAt: new Date(now + 1000).toISOString(),
                        }
                    )
                );
            for (let index = 0; index < 1024; index += 1) {
                queueChallenge(index).mockResolvedValueOnce(jsonResponse(updatedCredential));
                expect(
                    (await method(learnCard as never, currentCredential as VC, options)).status
                ).toBe('updated');
            }
            queueChallenge(1024);
            expect(await method(learnCard as never, currentCredential as VC, options)).toEqual({
                status: 'failed',
                code: 'UNAUTHORIZED',
                retryable: false,
            });
            expect(learnCard.invoke.getDidAuthVp).toHaveBeenCalledTimes(1024);
            now += 1001;
            queueChallenge(1025).mockResolvedValueOnce(jsonResponse(updatedCredential));
            expect(
                (await method(learnCard as never, currentCredential as VC, options)).status
            ).toBe('updated');
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

        it('rejects a challenge whose audience does not match the validated endpoint', async () => {
            fetchMock.mockResolvedValue(
                challengeResponse(
                    {
                        'www-authenticate':
                            'LearnCardDIDAuth challenge="srv-challenge-1", domain="attacker.example"',
                        'content-type': 'application/json',
                    },
                    { ...challengeBody, domain: 'attacker.example' }
                )
            );

            const result = await runRefresh();

            expect(result).toEqual({ status: 'failed', code: 'UNAUTHORIZED', retryable: false });
            expect(learnCard.invoke.getDidAuthVp).not.toHaveBeenCalled();
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it('rejects conflicting header and body challenge audiences without signing', async () => {
            fetchMock.mockResolvedValue(
                challengeResponse(
                    {
                        'www-authenticate':
                            'LearnCardDIDAuth challenge="srv-challenge-1", domain="refresh.example.com"',
                        'content-type': 'application/json',
                    },
                    { ...challengeBody, domain: 'attacker.example' }
                )
            );

            const result = await runRefresh();

            expect(result).toEqual({ status: 'failed', code: 'UNAUTHORIZED', retryable: false });
            expect(learnCard.invoke.getDidAuthVp).not.toHaveBeenCalled();
        });

        it('requires an exact LearnCardDIDAuth authentication scheme', async () => {
            fetchMock.mockResolvedValue(
                challengeResponse(
                    {
                        'www-authenticate':
                            'LearnCardDIDAuthRelay challenge="srv-challenge-1", domain="refresh.example.com"',
                        'content-type': 'application/json',
                    },
                    challengeBody
                )
            );

            const result = await runRefresh();

            expect(result).toEqual({ status: 'failed', code: 'UNAUTHORIZED', retryable: false });
            expect(learnCard.invoke.getDidAuthVp).not.toHaveBeenCalled();
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

        it('allows an authenticated redirect within the original service origin', async () => {
            const redirectedChallengeBody = {
                ...challengeBody,
                domain: 'refresh.example.com',
            };
            const redirectedChallengeHeaders = {
                'www-authenticate':
                    'LearnCardDIDAuth challenge="srv-challenge-1", domain="refresh.example.com"',
                'content-type': 'application/json',
            };

            fetchMock
                .mockResolvedValueOnce(
                    new Response(null, {
                        status: 302,
                        headers: { location: 'https://refresh.example.com/refresh/redirected' },
                    })
                )
                .mockResolvedValueOnce(
                    challengeResponse(redirectedChallengeHeaders, redirectedChallengeBody)
                )
                .mockResolvedValueOnce(jsonResponse(updatedCredential));

            const result = await runRefresh(currentCredential, {
                resolveHost: async hostname => [
                    hostname === 'refresh.example.com' ? PUBLIC_IP : SECOND_PUBLIC_IP,
                ],
            });

            expect(learnCard.invoke.getDidAuthVp).toHaveBeenCalledWith({
                proofFormat: 'jwt',
                challenge: 'srv-challenge-1',
                domain: 'refresh.example.com',
            });

            const [retryUrl, retryInit] = fetchMock.mock.calls[2] as [string, RequestInit];

            expect(retryUrl).toBe('https://refresh.example.com/refresh/redirected');
            expect((retryInit.headers as Record<string, string>).authorization).toBe(
                'Bearer signed-vp:srv-challenge-1:refresh.example.com'
            );
            expect(result.status).toBe('updated');
        });
    });

    describe('real signed VC-JWT refresh (LC-2195 Task 3)', () => {
        const FIXTURE_SEED = new Uint8Array(32).fill(31);
        const OTHER_SEED = new Uint8Array(32).fill(32);

        const didKitCard = {
            context: { resolveDocument: async (_url: string) => undefined },
            debug: () => undefined,
        } as never;

        let plugin: Awaited<ReturnType<typeof getDidKitPlugin>>;
        let key: JWKWithPrivateKey;
        let did: string;
        let verificationMethod: string;
        let otherKey: JWKWithPrivateKey;
        let otherDid: string;

        const issueOptions = () => ({
            proofFormat: 'jwt',
            verificationMethod,
            proofPurpose: 'assertionMethod',
        });

        const issueJwt = async (credential: Record<string, unknown>): Promise<string> =>
            (await plugin.methods.issueCredential(
                didKitCard,
                credential as never,
                issueOptions() as never,
                key
            )) as unknown as string;

        const didKitVerifier = {
            invoke: {
                verifyCredential: (credential: VC | string, options?: unknown) =>
                    plugin.methods.verifyCredential(didKitCard, credential, options as never),
                verifyCredentialForRenewal: (credential: string, options?: unknown) =>
                    plugin.methods.verifyCredentialForRenewal(
                        didKitCard,
                        credential,
                        options as never
                    ),
            },
        };

        const decodePayload = (token: string): Record<string, unknown> =>
            JSON.parse(Buffer.from(token.split('.')[1]!, 'base64url').toString('utf8'));

        const projectionOf = (
            token: string,
            overrides: Record<string, unknown> = {}
        ): Record<string, unknown> => ({
            ...(decodePayload(token).vc as Record<string, unknown>),
            proof: { type: 'JwtProof2020', jwt: token },
            ...overrides,
        });

        const service = (type = '1EdTechCredentialRefresh') => ({
            id: REFRESH_SERVICE_ID,
            type,
        });

        // JSON-LD holders/candidates are verified by a mock in the transition tests,
        // but VCValidator still requires a proof envelope to accept them.
        const jsonProof = () => ({
            type: 'DataIntegrityProof',
            created: '2026-01-01T00:00:00Z',
            proofPurpose: 'assertionMethod',
            verificationMethod: 'did:example:issuer#key-1',
            proofValue: 'z1',
        });

        const v1Unsigned = (overrides: Record<string, unknown> = {}) => ({
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            id: 'urn:uuid:11111111-1111-1111-1111-111111111111',
            type: ['VerifiableCredential'],
            issuer: did,
            issuanceDate: '2026-01-01T00:00:00Z',
            refreshService: service(),
            credentialSubject: { id: 'did:example:holder', achievement: { name: 'V1' } },
            ...overrides,
        });

        const v2Unsigned = (overrides: Record<string, unknown> = {}) => ({
            '@context': ['https://www.w3.org/ns/credentials/v2'],
            id: 'urn:uuid:22222222-2222-2222-2222-222222222222',
            type: ['VerifiableCredential'],
            issuer: did,
            validFrom: '2026-01-01T00:00:00Z',
            refreshService: service(),
            credentialSubject: { id: 'did:example:holder', achievement: { name: 'V2' } },
            ...overrides,
        });

        const refreshWith = (
            held: VC | string,
            options: RefreshCredentialOptions = {},
            init: unknown = didKitVerifier,
            lc: unknown = didKitVerifier
        ) =>
            refreshCredential(init as never)(lc as never, held as never, {
                resolveHost: async () => [PUBLIC_IP],
                ...options,
            });

        const textResponse = (
            body: string,
            init: { status?: number; headers?: Record<string, string> } = {}
        ) =>
            new Response(body, {
                status: init.status ?? 200,
                headers: { 'content-type': 'text/plain', ...(init.headers ?? {}) },
            });

        beforeAll(async () => {
            const wasmBytes = new Uint8Array(
                await readFile(
                    new URL('../../didkit/src/didkit/pkg/didkit_wasm_bg.wasm', import.meta.url)
                )
            );

            plugin = await getDidKitPlugin(wasmBytes);

            key = plugin.methods.generateEd25519KeyFromBytes(
                didKitCard,
                FIXTURE_SEED
            ) as JWKWithPrivateKey;
            did = plugin.methods.keyToDid(didKitCard, 'key', key);
            verificationMethod = await plugin.methods.keyToVerificationMethod(
                didKitCard,
                'key',
                key
            );

            otherKey = plugin.methods.generateEd25519KeyFromBytes(
                didKitCard,
                OTHER_SEED
            ) as JWKWithPrivateKey;
            otherDid = plugin.methods.keyToDid(didKitCard, 'key', otherKey);
        });

        it('refreshes a valid VCDM 1.1 VC-JWT from a text/plain 1EdTech endpoint', async () => {
            const held = await issueJwt(v1Unsigned());
            const replacement = await issueJwt(
                v1Unsigned({
                    credentialSubject: {
                        id: 'did:example:holder',
                        achievement: { name: 'V1 updated' },
                    },
                })
            );

            fetchMock.mockResolvedValue(
                textResponse(replacement, { headers: { etag: 'W/"jwt-2"' } })
            );

            const result = await refreshWith(held);

            expect(result.status).toBe('updated');
            if (result.status !== 'updated') return;

            // The exact verified wire bytes survive in the returned representation.
            expect((result.credential.proof as any).jwt).toBe(replacement);
            expect(result.etag).toBe('W/"jwt-2"');

            const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
            expect(url).toBe(REFRESH_SERVICE_ID);
            expect((init.headers as Record<string, string>).accept).toContain('text/plain');
        });

        it('refreshes a supported VCDM 2.0 VC-JWT from a text/plain endpoint', async () => {
            const held = await issueJwt(v2Unsigned());
            const replacement = await issueJwt(
                v2Unsigned({
                    credentialSubject: {
                        id: 'did:example:holder',
                        achievement: { name: 'V2 updated' },
                    },
                })
            );

            fetchMock.mockResolvedValue(textResponse(replacement));

            const result = await refreshWith(held);

            expect(result.status).toBe('updated');
            if (result.status !== 'updated') return;
            expect((result.credential.proof as any).jwt).toBe(replacement);
        });

        it('accepts text/plain with an explicit charset parameter and rejects unsupported charsets', async () => {
            const held = await issueJwt(v1Unsigned());
            const replacement = await issueJwt(
                v1Unsigned({
                    credentialSubject: {
                        id: 'did:example:holder',
                        achievement: { name: 'charset ok' },
                    },
                })
            );

            fetchMock.mockResolvedValue(
                textResponse(replacement, {
                    headers: { 'content-type': 'text/plain; charset=UTF-8' },
                })
            );

            expect((await refreshWith(held)).status).toBe('updated');

            fetchMock.mockReset();
            fetchMock.mockResolvedValue(
                textResponse(replacement, {
                    headers: { 'content-type': 'text/plain; charset=utf-16' },
                })
            );

            expect(await refreshWith(held)).toEqual({
                status: 'failed',
                code: 'MALFORMED_RESPONSE',
                retryable: false,
            });
        });

        it('uses the token refreshService and identity, not mutated display metadata', async () => {
            const held = await issueJwt(v1Unsigned());
            const replacement = await issueJwt(
                v1Unsigned({
                    credentialSubject: {
                        id: 'did:example:holder',
                        achievement: { name: 'display mutation ignored' },
                    },
                })
            );

            const mutated = projectionOf(held, {
                id: 'urn:uuid:attacker',
                issuer: 'did:example:attacker',
                issuanceDate: '1990-01-01T00:00:00Z',
                credentialSubject: { id: 'did:example:attacker' },
                refreshService: {
                    id: 'https://attacker.example/refresh/x',
                    type: '1EdTechCredentialRefresh',
                },
            });

            fetchMock.mockResolvedValue(textResponse(replacement));

            const result = await refreshWith(mutated as VC);

            expect(result.status).toBe('updated');
            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect((fetchMock.mock.calls[0] as [string])[0]).toBe(REFRESH_SERVICE_ID);
        });

        it('never contacts the endpoint when the held token signature is invalid', async () => {
            const held = await issueJwt(v1Unsigned());
            const [header, payload, signature] = held.split('.');
            const forged = `${header}.${payload}.${signature!.slice(0, -4)}AAAA`;

            const result = await refreshWith(forged);

            expect(result).toEqual({ status: 'failed', code: 'INVALID_PROOF', retryable: false });
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('renews an expired held token from a text/plain endpoint with a valid replacement', async () => {
            const held = await issueJwt(
                v1Unsigned({
                    issuanceDate: '2019-01-01T00:00:00Z',
                    expirationDate: '2020-01-01T00:00:00Z',
                })
            );
            const replacement = await issueJwt(
                v1Unsigned({
                    issuanceDate: '2026-06-01T00:00:00Z',
                    expirationDate: '2100-01-01T00:00:00Z',
                    credentialSubject: {
                        id: 'did:example:holder',
                        achievement: { name: 'renewed' },
                    },
                })
            );

            fetchMock.mockResolvedValueOnce(textResponse(replacement));

            const result = await refreshWith(held);

            expect(result.status).toBe('updated');
            if (result.status !== 'updated') return;
            expect((result.credential.proof as any).jwt).toBe(replacement);
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it('rejects a future-nbf held token even in renewal mode', async () => {
            const held = await issueJwt(
                v1Unsigned({
                    issuanceDate: '2100-01-01T00:00:00Z',
                    expirationDate: '2101-01-01T00:00:00Z',
                })
            );

            const result = await refreshWith(held);

            expect(result).toEqual({ status: 'failed', code: 'INVALID_PROOF', retryable: false });
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('survives a persistence round trip and a second refresh with the exact token', async () => {
            const held = await issueJwt(
                v1Unsigned({
                    credentialSubject: { id: 'did:example:holder', achievement: { name: 'one' } },
                })
            );
            const second = await issueJwt(
                v1Unsigned({
                    credentialSubject: { id: 'did:example:holder', achievement: { name: 'two' } },
                })
            );
            const third = await issueJwt(
                v1Unsigned({
                    credentialSubject: {
                        id: 'did:example:holder',
                        achievement: { name: 'three' },
                    },
                })
            );

            fetchMock.mockResolvedValueOnce(textResponse(second));
            const first = await refreshWith(held);

            expect(first.status).toBe('updated');
            if (first.status !== 'updated') return;
            expect((first.credential.proof as any).jwt).toBe(second);

            // Simulate store/read/export: serialize, then re-project the candidate.
            const stored = JSON.parse(JSON.stringify(first.credential)) as VC;
            const projected = projectionOf((stored.proof as any).jwt) as VC;

            fetchMock.mockResolvedValueOnce(textResponse(third));
            const refreshedAgain = await refreshWith(projected);

            expect(refreshedAgain.status).toBe('updated');
            if (refreshedAgain.status !== 'updated') return;
            expect((refreshedAgain.credential.proof as any).jwt).toBe(third);
        });

        it('rejects a validly-signed replacement that changes the issuer', async () => {
            const held = await issueJwt(v1Unsigned());
            const otherVerificationMethod = await plugin.methods.keyToVerificationMethod(
                didKitCard,
                'key',
                otherKey
            );
            const replacement = (await plugin.methods.issueCredential(
                didKitCard,
                v1Unsigned({ issuer: otherDid }) as never,
                {
                    proofFormat: 'jwt',
                    verificationMethod: otherVerificationMethod,
                    proofPurpose: 'assertionMethod',
                } as never,
                otherKey
            )) as unknown as string;

            fetchMock.mockResolvedValue(textResponse(replacement));

            expect(await refreshWith(held)).toEqual({
                status: 'failed',
                code: 'ISSUER_MISMATCH',
                retryable: false,
            });
        });

        it('rejects a replacement that changes the holder or credential ID', async () => {
            const held = await issueJwt(v1Unsigned());

            fetchMock.mockResolvedValue(
                textResponse(
                    await issueJwt(v1Unsigned({ credentialSubject: { id: 'did:example:mallory' } }))
                )
            );
            expect(await refreshWith(held)).toEqual({
                status: 'failed',
                code: 'ID_MISMATCH',
                retryable: false,
            });

            fetchMock.mockReset();
            fetchMock.mockResolvedValue(
                textResponse(
                    await issueJwt(
                        v1Unsigned({ id: 'urn:uuid:33333333-3333-3333-3333-333333333333' })
                    )
                )
            );
            expect(await refreshWith(held)).toEqual({
                status: 'failed',
                code: 'ID_MISMATCH',
                retryable: false,
            });
        });

        it('rejects a rollback replacement with an older verified issuance time', async () => {
            const held = await issueJwt(v1Unsigned({ issuanceDate: '2026-06-01T00:00:00Z' }));
            const replacement = await issueJwt(
                v1Unsigned({
                    issuanceDate: '2025-06-01T00:00:00Z',
                    credentialSubject: {
                        id: 'did:example:holder',
                        achievement: { name: 'rollback' },
                    },
                })
            );

            fetchMock.mockResolvedValue(textResponse(replacement));

            expect(await refreshWith(held)).toEqual({
                status: 'failed',
                code: 'ROLLBACK',
                retryable: false,
            });
        });

        it('rejects forged and expired replacement tokens', async () => {
            const held = await issueJwt(v1Unsigned());

            const forgedReplacement = await issueJwt(
                v1Unsigned({
                    credentialSubject: {
                        id: 'did:example:holder',
                        achievement: { name: 'forged' },
                    },
                })
            );
            const [header, payload, signature] = forgedReplacement.split('.');
            fetchMock.mockResolvedValue(
                textResponse(`${header}.${payload}.${signature!.slice(0, -4)}AAAA`)
            );
            expect(await refreshWith(held)).toEqual({
                status: 'failed',
                code: 'INVALID_PROOF',
                retryable: false,
            });

            fetchMock.mockReset();
            fetchMock.mockResolvedValue(
                textResponse(
                    await issueJwt(
                        v1Unsigned({
                            issuanceDate: '2019-01-01T00:00:00Z',
                            expirationDate: '2020-01-01T00:00:00Z',
                            credentialSubject: {
                                id: 'did:example:holder',
                                achievement: { name: 'expired' },
                            },
                        })
                    )
                )
            );
            expect(await refreshWith(held)).toEqual({
                status: 'failed',
                code: 'INVALID_PROOF',
                retryable: false,
            });
        });

        it('rejects malformed and oversized text/plain bodies', async () => {
            const held = await issueJwt(v1Unsigned());

            fetchMock.mockResolvedValue(textResponse('this is not a compact jwt'));
            expect(await refreshWith(held)).toEqual({
                status: 'failed',
                code: 'MALFORMED_RESPONSE',
                retryable: false,
            });

            fetchMock.mockReset();
            fetchMock.mockResolvedValue(textResponse('x'.repeat(4096)));
            expect(await refreshWith(held, { maxResponseBytes: 100 })).toEqual({
                status: 'failed',
                code: 'MALFORMED_RESPONSE',
                retryable: false,
            });
        });

        it('does not accept text/plain for a managed service', async () => {
            const held = await issueJwt(
                v1Unsigned({ refreshService: service('LearnCardCredentialRefresh2026') })
            );

            fetchMock.mockResolvedValue(textResponse(await issueJwt(v1Unsigned())));

            expect(await refreshWith(held)).toEqual({
                status: 'failed',
                code: 'MALFORMED_RESPONSE',
                retryable: false,
            });
        });

        it('rejects a managed JWT held credential without a stable ID before fetching', async () => {
            const { id: _omit, ...rest } = v1Unsigned();
            const held = await issueJwt({
                ...rest,
                refreshService: service('LearnCardCredentialRefresh2026'),
            });

            const result = await refreshWith(held);

            expect(result).toEqual({ status: 'failed', code: 'ID_MISMATCH', retryable: false });
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('accepts a JSON-held credential and a JWT replacement with the same verified identity', async () => {
            const replacement = await issueJwt(
                v1Unsigned({
                    credentialSubject: {
                        id: 'did:example:holder',
                        achievement: { name: 'from json' },
                    },
                })
            );
            const jsonHeld = {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                id: 'urn:uuid:11111111-1111-1111-1111-111111111111',
                type: ['VerifiableCredential'],
                issuer: did,
                issuanceDate: '2026-01-01T00:00:00Z',
                refreshService: service(),
                credentialSubject: { id: 'did:example:holder', achievement: { name: 'json held' } },
                proof: jsonProof(),
            } as VC;
            const jsonVerifier = { invoke: { verifyCredential: vi.fn(async () => okCheck) } };

            fetchMock.mockResolvedValue(textResponse(replacement));

            const result = await refreshWith(jsonHeld, {}, didKitVerifier, jsonVerifier);

            expect(result.status).toBe('updated');
            if (result.status !== 'updated') return;
            expect((result.credential.proof as any).jwt).toBe(replacement);
        });

        it('accepts a JWT-held credential and a JSON replacement with the same verified identity', async () => {
            const held = await issueJwt(
                v1Unsigned({
                    credentialSubject: {
                        id: 'did:example:holder',
                        achievement: { name: 'jwt held' },
                    },
                })
            );
            const jsonReplacement = {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                id: 'urn:uuid:11111111-1111-1111-1111-111111111111',
                type: ['VerifiableCredential'],
                issuer: did,
                issuanceDate: '2026-02-01T00:00:00Z',
                credentialSubject: {
                    id: 'did:example:holder',
                    achievement: { name: 'json replacement' },
                },
                proof: jsonProof(),
            } as VC;
            const jsonVerifier = { invoke: { verifyCredential: vi.fn(async () => okCheck) } };

            fetchMock.mockResolvedValue(jsonResponse(jsonReplacement));

            const result = await refreshWith(held, {}, didKitVerifier, jsonVerifier);

            expect(result.status).toBe('updated');
            if (result.status !== 'updated') return;
            expect(result.credential).toEqual(jsonReplacement);
        });

        it('renews an expired JSON-held credential only after its proof verifies', async () => {
            const jsonVerifier = { invoke: { verifyCredential: vi.fn(async () => okCheck) } };
            const held = {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                id: 'urn:uuid:44444444-4444-4444-4444-444444444444',
                type: ['VerifiableCredential'],
                issuer: did,
                issuanceDate: '2019-01-01T00:00:00Z',
                expirationDate: '2020-01-01T00:00:00Z',
                refreshService: service(),
                credentialSubject: {
                    id: 'did:example:holder',
                    achievement: { name: 'expired json' },
                },
                proof: jsonProof(),
            } as VC;
            const replacement = {
                ...held,
                issuanceDate: '2026-02-01T00:00:00Z',
                expirationDate: undefined,
                credentialSubject: {
                    id: 'did:example:holder',
                    achievement: { name: 'renewed json' },
                },
            } as VC;

            fetchMock.mockResolvedValue(jsonResponse(replacement));

            const result = await refreshWith(held, {}, didKitVerifier, jsonVerifier);

            expect(result.status).toBe('updated');
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it('never contacts the endpoint for an expired JSON-held credential whose proof fails', async () => {
            const jsonVerifier = {
                invoke: {
                    verifyCredential: vi.fn(async () => ({
                        checks: [],
                        warnings: [],
                        errors: ['signature verification failed'],
                    })),
                },
            };
            const held = {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                id: 'urn:uuid:55555555-5555-5555-5555-555555555555',
                type: ['VerifiableCredential'],
                issuer: did,
                issuanceDate: '2019-01-01T00:00:00Z',
                expirationDate: '2020-01-01T00:00:00Z',
                refreshService: service(),
                credentialSubject: { id: 'did:example:holder' },
                proof: jsonProof(),
            } as VC;

            const result = await refreshWith(held, {}, didKitVerifier, jsonVerifier);

            expect(result).toEqual({ status: 'failed', code: 'INVALID_PROOF', retryable: false });
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('refreshes a standard ID-less VCDM 1.1 JSON credential', async () => {
            const jsonVerifier = { invoke: { verifyCredential: vi.fn(async () => okCheck) } };
            const held = {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiableCredential'],
                issuer: did,
                issuanceDate: '2026-01-01T00:00:00Z',
                refreshService: service(),
                credentialSubject: { id: 'did:example:holder', achievement: { name: 'v1 no id' } },
                proof: jsonProof(),
            } as VC;
            const replacement = {
                ...held,
                issuanceDate: '2026-02-01T00:00:00Z',
                credentialSubject: {
                    id: 'did:example:holder',
                    achievement: { name: 'v1 no id updated' },
                },
                proof: jsonProof(),
            } as VC;

            fetchMock.mockResolvedValue(jsonResponse(replacement));

            const result = await refreshWith(held, {}, didKitVerifier, jsonVerifier);

            expect(result.status).toBe('updated');
            expect((fetchMock.mock.calls[0] as [string, RequestInit])[1].headers).toMatchObject({
                accept: expect.stringContaining('text/plain'),
            });
        });
    });
});
