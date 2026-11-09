import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    clearDidWebDocumentFetchCache,
    didWebToDocumentUrl,
    getDidWebDocumentFetchCacheStats,
    installDidWebDocumentFetchCache,
    invalidateDidWebDocument,
    isDidWebDocumentUrl,
    resetDidWebDocumentFetchCacheForTests,
} from './didWebDocumentCache';
import { getDidKitPlugin } from './plugin';

const DOC_URL = 'https://network.learncard.com/users/playwright-test-demo-boi/did.json';
const DOC_BODY = JSON.stringify({
    '@context': 'https://www.w3.org/ns/did/v1',
    id: 'did:web:network.learncard.com:users:playwright-test-demo-boi',
    verificationMethod: [],
});
const AUTH_BODY = JSON.stringify({
    '@context': 'https://www.w3.org/ns/did/v1',
    id: 'did:web:network.learncard.com:users:playwright-test-demo-boi',
    verificationMethod: [{ id: 'authed' }],
});

const wasmPath = join(
    dirname(fileURLToPath(import.meta.url)),
    'didkit',
    'pkg',
    'didkit_wasm_bg.wasm'
);

describe('didWebDocumentCache', () => {
    const originalFetch = globalThis.fetch;
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        resetDidWebDocumentFetchCacheForTests();
        fetchMock = vi.fn(
            async () =>
                new Response(DOC_BODY, {
                    status: 200,
                    headers: { 'content-type': 'application/json' },
                })
        );
        // Give mocked responses a URL when possible (undici/Response may ignore).
        fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
            const url =
                typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
            const response = new Response(DOC_BODY, {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
            try {
                Object.defineProperty(response, 'url', { value: url, configurable: true });
            } catch {
                /* ignore */
            }
            return response;
        });
        globalThis.fetch = fetchMock as unknown as typeof fetch;
        installDidWebDocumentFetchCache({ ttlMs: 50, maxEntries: 3, force: true });
    });

    afterEach(() => {
        resetDidWebDocumentFetchCacheForTests();
        globalThis.fetch = originalFetch;
    });

    it('maps did:web DIDs to document URLs the same way as ssi did-web', () => {
        expect(didWebToDocumentUrl('did:web:example.com')).toBe(
            'https://example.com/.well-known/did.json'
        );
        expect(didWebToDocumentUrl('did:web:example.com:u:bob')).toBe(
            'https://example.com/u/bob/did.json'
        );
        expect(
            didWebToDocumentUrl('did:web:network.learncard.com:users:playwright-test-demo-boi')
        ).toBe(DOC_URL);
        expect(isDidWebDocumentUrl(DOC_URL)).toBe(true);
        expect(isDidWebDocumentUrl('https://example.com/api')).toBe(false);
    });

    it('dedupes concurrent GETs for the same did.json URL to a single network fetch', async () => {
        let release!: (value: Response) => void;
        const gate = new Promise<Response>(resolve => {
            release = resolve;
        });
        fetchMock.mockImplementationOnce((input: RequestInfo | URL) => {
            expect(input).toBeInstanceOf(Request);
            expect((input as Request).signal).toBeInstanceOf(AbortSignal);
            return gate;
        });

        const requests = Array.from({ length: 25 }, () => fetch(DOC_URL));
        await Promise.resolve();
        expect(getDidWebDocumentFetchCacheStats().inflightEntries).toBe(1);

        const gated = new Response(DOC_BODY, { status: 200 });
        Object.defineProperty(gated, 'url', { value: DOC_URL, configurable: true });
        release!(gated);
        const responses = await Promise.all(requests);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(responses).toHaveLength(25);
        for (const response of responses) {
            expect(response.status).toBe(200);
            expect(response.url).toBe(DOC_URL);
            expect(await response.json()).toEqual(JSON.parse(DOC_BODY));
        }
    });

    it('serves TTL cache hits without refetching, then refetches after expiry', async () => {
        const first = await fetch(DOC_URL);
        expect(await first.json()).toEqual(JSON.parse(DOC_BODY));
        expect(fetchMock).toHaveBeenCalledTimes(1);

        const second = await fetch(DOC_URL);
        expect(await second.json()).toEqual(JSON.parse(DOC_BODY));
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(getDidWebDocumentFetchCacheStats().successEntries).toBe(1);

        await new Promise(resolve => setTimeout(resolve, 60));

        const third = await fetch(DOC_URL);
        expect(await third.json()).toEqual(JSON.parse(DOC_BODY));
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('does not cache failed resolutions', async () => {
        fetchMock.mockResolvedValueOnce(new Response('missing', { status: 404 }));

        const failed = await fetch(DOC_URL);
        expect(failed.status).toBe(404);
        expect(getDidWebDocumentFetchCacheStats().successEntries).toBe(0);

        const recovered = await fetch(DOC_URL);
        expect(recovered.status).toBe(200);
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('does not cache thrown network errors; the next call retries', async () => {
        fetchMock.mockRejectedValueOnce(new Error('network down'));

        await expect(fetch(DOC_URL)).rejects.toThrow('network down');
        expect(getDidWebDocumentFetchCacheStats().successEntries).toBe(0);
        expect(getDidWebDocumentFetchCacheStats().inflightEntries).toBe(0);

        const recovered = await fetch(DOC_URL);
        expect(recovered.status).toBe(200);
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('invalidates a DID document so noCache-style callers refetch', async () => {
        await fetch(DOC_URL);
        expect(fetchMock).toHaveBeenCalledTimes(1);

        invalidateDidWebDocument('did:web:network.learncard.com:users:playwright-test-demo-boi');
        expect(getDidWebDocumentFetchCacheStats().successEntries).toBe(0);

        await fetch(DOC_URL);
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('clearDidWebDocumentFetchCache drops success entries', async () => {
        await fetch(DOC_URL);
        expect(getDidWebDocumentFetchCacheStats().successEntries).toBe(1);
        clearDidWebDocumentFetchCache();
        expect(getDidWebDocumentFetchCacheStats().successEntries).toBe(0);

        await fetch(DOC_URL);
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('leaves non-did.json traffic untouched', async () => {
        await fetch('https://network.learncard.com/api/health');
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(getDidWebDocumentFetchCacheStats().successEntries).toBe(0);
    });

    it('bypasses the success cache for cache: "no-store" requests', async () => {
        await fetch(DOC_URL);
        expect(fetchMock).toHaveBeenCalledTimes(1);

        await fetch(DOC_URL, { cache: 'no-store' });
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('keys Authorization separately so unauthenticated GETs do not reuse authed bodies', async () => {
        fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
            const req = input instanceof Request ? input : new Request(input, init);
            const headers = new Headers(req.headers);
            const body = headers.get('authorization') ? AUTH_BODY : DOC_BODY;
            const response = new Response(body, { status: 200 });
            Object.defineProperty(response, 'url', { value: DOC_URL, configurable: true });
            return response;
        });

        const authed = await fetch(DOC_URL, { headers: { Authorization: 'Bearer secret' } });
        expect(await authed.json()).toEqual(JSON.parse(AUTH_BODY));
        expect(fetchMock).toHaveBeenCalledTimes(1);

        const anon = await fetch(DOC_URL);
        expect(await anon.json()).toEqual(JSON.parse(DOC_BODY));
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(getDidWebDocumentFetchCacheStats().successEntries).toBe(2);
    });

    it('caches WASM-style Accept: application/json requests instead of bypassing them', async () => {
        const wasmHeaders = { Accept: 'application/json', 'User-Agent': 'did-web/0.2.0' };
        await fetch(DOC_URL, { headers: wasmHeaders });
        await fetch(DOC_URL, { headers: wasmHeaders });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(getDidWebDocumentFetchCacheStats().successEntries).toBe(1);
    });

    it('preserves credentials and mode on the shared network call', async () => {
        await fetch(DOC_URL, { credentials: 'omit', mode: 'cors' });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const req1 = fetchMock.mock.calls[0]![0] as Request;
        expect(req1).toBeInstanceOf(Request);
        expect(req1.credentials).toBe('omit');
        expect(req1.mode).toBe('cors');

        // Different credentials => different key => new fetch.
        await fetch(DOC_URL, { credentials: 'include', mode: 'cors' });
        expect(fetchMock).toHaveBeenCalledTimes(2);
        const req2 = fetchMock.mock.calls[1]![0] as Request;
        expect(req2.credentials).toBe('include');
    });

    it('preserves response.url on rebuilt/cached responses', async () => {
        const response = await fetch(DOC_URL);
        expect(response.url).toBe(DOC_URL);
        const cached = await fetch(DOC_URL);
        expect(cached.url).toBe(DOC_URL);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('honors response Cache-Control: no-store and max-age', async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(DOC_BODY, {
                status: 200,
                headers: { 'cache-control': 'no-store' },
            })
        );
        await fetch(DOC_URL);
        expect(getDidWebDocumentFetchCacheStats().successEntries).toBe(0);

        fetchMock.mockImplementationOnce(async () => {
            const response = new Response(DOC_BODY, {
                status: 200,
                headers: { 'cache-control': 'max-age=1' },
            });
            Object.defineProperty(response, 'url', { value: DOC_URL, configurable: true });
            return response;
        });
        await fetch(DOC_URL);
        expect(getDidWebDocumentFetchCacheStats().successEntries).toBe(1);
        await fetch(DOC_URL);
        expect(fetchMock).toHaveBeenCalledTimes(2);

        await new Promise(resolve => setTimeout(resolve, 1100));
        await fetch(DOC_URL);
        expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('does not join or repopulate from in-flight work after clear/invalidate', async () => {
        let release!: (value: Response) => void;
        const gate = new Promise<Response>(resolve => {
            release = resolve;
        });
        fetchMock.mockImplementationOnce(() => gate);

        const stale = fetch(DOC_URL);
        await Promise.resolve();
        expect(getDidWebDocumentFetchCacheStats().inflightEntries).toBe(1);

        clearDidWebDocumentFetchCache();
        expect(getDidWebDocumentFetchCacheStats().inflightEntries).toBe(0);
        expect(getDidWebDocumentFetchCacheStats().cacheGeneration).toBe(1);

        fetchMock.mockImplementationOnce(async () => {
            const response = new Response(AUTH_BODY, { status: 200 });
            Object.defineProperty(response, 'url', { value: DOC_URL, configurable: true });
            return response;
        });
        const fresh = await fetch(DOC_URL);
        expect(await fresh.json()).toEqual(JSON.parse(AUTH_BODY));
        expect(fetchMock).toHaveBeenCalledTimes(2);

        const gated = new Response(DOC_BODY, { status: 200 });
        Object.defineProperty(gated, 'url', { value: DOC_URL, configurable: true });
        release!(gated);
        await expect(stale).resolves.toMatchObject({ status: 200 });
        expect(getDidWebDocumentFetchCacheStats().successEntries).toBe(1);
        const stillFresh = await fetch(DOC_URL);
        expect(await stillFresh.json()).toEqual(JSON.parse(AUTH_BODY));
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('rechecks generations after body streaming before insert (canStore race)', async () => {
        let releaseBody!: () => void;
        const bodyGate = new Promise<void>(resolve => {
            releaseBody = resolve;
        });

        fetchMock.mockImplementationOnce(async () => {
            const stream = new ReadableStream<Uint8Array>({
                async start(controller) {
                    await bodyGate;
                    controller.enqueue(new TextEncoder().encode(DOC_BODY));
                    controller.close();
                },
            });
            const response = new Response(stream, {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
            Object.defineProperty(response, 'url', { value: DOC_URL, configurable: true });
            return response;
        });

        const stale = fetch(DOC_URL);
        await Promise.resolve();
        await Promise.resolve();

        // Newer document lands while the stale body is still gated.
        clearDidWebDocumentFetchCache();
        fetchMock.mockImplementationOnce(async () => {
            const response = new Response(AUTH_BODY, { status: 200 });
            Object.defineProperty(response, 'url', { value: DOC_URL, configurable: true });
            return response;
        });
        const fresh = await fetch(DOC_URL);
        expect(await fresh.json()).toEqual(JSON.parse(AUTH_BODY));

        releaseBody!();
        await stale;

        const stillFresh = await fetch(DOC_URL);
        expect(await stillFresh.json()).toEqual(JSON.parse(AUTH_BODY));
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('normalize invalidate keys like toAbsoluteUrl (host case / default port)', async () => {
        const mixedCaseUrl = 'https://EXAMPLE.com:443/.well-known/did.json';
        await fetch(mixedCaseUrl);
        expect(getDidWebDocumentFetchCacheStats().successEntries).toBe(1);

        invalidateDidWebDocument('did:web:EXAMPLE.com%3A443');
        expect(getDidWebDocumentFetchCacheStats().successEntries).toBe(0);

        await fetch('https://example.com/.well-known/did.json');
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('lets joiners cancel independently without aborting peers', async () => {
        let release!: (value: Response) => void;
        const gate = new Promise<Response>(resolve => {
            release = resolve;
        });
        fetchMock.mockImplementationOnce(() => gate);

        const a = new AbortController();
        const b = new AbortController();
        const pA = fetch(DOC_URL, { signal: a.signal });
        const pB = fetch(DOC_URL, { signal: b.signal });
        await Promise.resolve();
        expect(fetchMock).toHaveBeenCalledTimes(1);

        a.abort();
        await expect(pA).rejects.toMatchObject({ name: 'AbortError' });

        const gated = new Response(DOC_BODY, { status: 200 });
        Object.defineProperty(gated, 'url', { value: DOC_URL, configurable: true });
        release!(gated);
        const responseB = await pB;
        expect(responseB.status).toBe(200);
        expect(await responseB.json()).toEqual(JSON.parse(DOC_BODY));
    });

    it('evicts expired and over-capacity entries', async () => {
        installDidWebDocumentFetchCache({ ttlMs: 50, maxEntries: 2, force: true });

        const urls = [
            'https://a.example.com/.well-known/did.json',
            'https://b.example.com/.well-known/did.json',
            'https://c.example.com/.well-known/did.json',
        ];
        for (const url of urls) {
            await fetch(url);
        }
        expect(getDidWebDocumentFetchCacheStats().successEntries).toBe(2);

        await fetch(urls[0]!);
        expect(fetchMock).toHaveBeenCalledTimes(4);

        await new Promise(resolve => setTimeout(resolve, 60));
        await fetch(urls[1]!);
        expect(getDidWebDocumentFetchCacheStats().successEntries).toBe(1);
    });

    it('rebuilds null-body statuses without throwing', async () => {
        fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
        const response = await fetch(DOC_URL);
        expect(response.status).toBe(204);
        expect(await response.text()).toBe('');
    });

    it('replaces Request headers when init.headers is supplied (does not merge Authorization)', async () => {
        const seen: Headers[] = [];
        fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
            const req = input instanceof Request ? input : new Request(input);
            seen.push(new Headers(req.headers));
            const response = new Response(DOC_BODY, { status: 200 });
            Object.defineProperty(response, 'url', { value: DOC_URL, configurable: true });
            return response;
        });

        // Populate an authenticated cache entry first.
        await fetch(DOC_URL, { headers: { Authorization: 'Bearer secret' } });
        expect(seen[0]!.get('authorization')).toBe('Bearer secret');
        expect(getDidWebDocumentFetchCacheStats().successEntries).toBe(1);

        // Platform rule: init.headers replaces the input Request's headers entirely.
        const authedRequest = new Request(DOC_URL, {
            headers: { Authorization: 'Bearer secret' },
        });
        await fetch(authedRequest, { headers: { Accept: 'application/json' } });
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(seen[1]!.get('authorization')).toBeNull();
        expect(seen[1]!.get('accept')).toBe('application/json');
    });

    it('empty init.headers replaces and strips Authorization from the input Request', async () => {
        const seen: Headers[] = [];
        fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
            const req = input instanceof Request ? input : new Request(input);
            seen.push(new Headers(req.headers));
            const response = new Response(DOC_BODY, { status: 200 });
            Object.defineProperty(response, 'url', { value: DOC_URL, configurable: true });
            return response;
        });

        await fetch(DOC_URL, { headers: { Authorization: 'Bearer secret' } });
        expect(getDidWebDocumentFetchCacheStats().successEntries).toBe(1);

        const authedRequest = new Request(DOC_URL, {
            headers: { Authorization: 'Bearer secret' },
        });
        await fetch(authedRequest, { headers: {} });
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(seen[1]!.get('authorization')).toBeNull();
    });

    it('passes integrity-bearing requests through to native fetch (cold cache)', async () => {
        fetchMock.mockImplementation(async (_input: RequestInfo | URL, init?: RequestInit) => {
            const integrity =
                init?.integrity || (_input instanceof Request ? _input.integrity : undefined);
            if (integrity) {
                throw new TypeError('Failed to fetch (integrity mismatch)');
            }
            const response = new Response(DOC_BODY, { status: 200 });
            Object.defineProperty(response, 'url', { value: DOC_URL, configurable: true });
            return response;
        });

        await expect(
            fetch(DOC_URL, {
                integrity: 'sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
            })
        ).rejects.toThrow(/integrity mismatch/);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(getDidWebDocumentFetchCacheStats().successEntries).toBe(0);
    });

    it('does not serve warm cache hits for integrity-bearing requests', async () => {
        fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
            const integrity =
                init?.integrity || (input instanceof Request ? input.integrity : undefined);
            if (integrity) {
                throw new TypeError('Failed to fetch (integrity mismatch)');
            }
            const response = new Response(DOC_BODY, { status: 200 });
            Object.defineProperty(response, 'url', { value: DOC_URL, configurable: true });
            return response;
        });

        await fetch(DOC_URL);
        expect(getDidWebDocumentFetchCacheStats().successEntries).toBe(1);
        expect(fetchMock).toHaveBeenCalledTimes(1);

        await expect(
            fetch(DOC_URL, {
                integrity: 'sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
            })
        ).rejects.toThrow(/integrity mismatch/);
        // Must not be satisfied from the warm cache — underlying fetch runs again.
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('throws when install is called without globalThis.fetch', () => {
        resetDidWebDocumentFetchCacheForTests();
        const previous = globalThis.fetch;
        // @ts-expect-error intentional
        delete globalThis.fetch;
        try {
            expect(() => installDidWebDocumentFetchCache({ force: true })).toThrow(
                /globalThis\.fetch/
            );
        } finally {
            globalThis.fetch = previous;
        }
    });
});

describe('didWebDocumentCache + DIDKit WASM resolveDid', () => {
    const originalFetch = globalThis.fetch;
    let fetchCount = 0;

    afterEach(() => {
        resetDidWebDocumentFetchCacheForTests();
        globalThis.fetch = originalFetch;
    });

    it('dedupes 25 concurrent WASM did:web resolutions to one did.json fetch', async () => {
        const did = 'did:web:network.learncard.com:users:playwright-test-demo-boi';
        const docUrl = didWebToDocumentUrl(did)!;
        const didDocument = {
            '@context': 'https://www.w3.org/ns/did/v1',
            id: did,
            verificationMethod: [
                {
                    id: `${did}#key-0`,
                    type: 'Ed25519VerificationKey2018',
                    controller: did,
                    publicKeyBase58: 'H3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV',
                },
            ],
            assertionMethod: [`${did}#key-0`],
        };

        fetchCount = 0;
        globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
            const req = input instanceof Request ? input : new Request(input, init);
            const url = req.url;
            if (url.includes('/did.json')) {
                fetchCount += 1;
                // Real WASM sends Accept: application/json (and usually a User-Agent).
                expect(req.headers.get('accept')?.toLowerCase()).toContain('application/json');
                await new Promise(r => setTimeout(r, 30));
                const response = new Response(JSON.stringify(didDocument), {
                    status: 200,
                    headers: { 'content-type': 'application/json' },
                });
                Object.defineProperty(response, 'url', { value: url, configurable: true });
                return response;
            }
            return originalFetch(input, init);
        }) as typeof fetch;

        // Plugin install wraps fetch; pass local wasm bytes so we do not hit the CDN.
        const wasmBytes = readFileSync(wasmPath);
        const plugin = await getDidKitPlugin(wasmBytes);

        const results = await Promise.all(
            Array.from({ length: 25 }, () => plugin.methods.resolveDid({} as never, did))
        );

        expect(results).toHaveLength(25);
        for (const doc of results) {
            expect(doc.id).toBe(did);
        }
        // Measured through the real WASM resolveDid path (not a bare fetch harness).
        expect(fetchCount).toBe(1);
        expect(getDidWebDocumentFetchCacheStats().successEntries).toBeGreaterThanOrEqual(1);
        expect(docUrl).toBe(DOC_URL);
    }, 60_000);
});
