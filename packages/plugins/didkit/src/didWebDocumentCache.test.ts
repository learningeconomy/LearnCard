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

const DOC_URL = 'https://network.learncard.com/users/playwright-test-demo-boi/did.json';
const DOC_BODY = JSON.stringify({
    id: 'did:web:network.learncard.com:users:playwright-test-demo-boi',
});
const AUTH_BODY = JSON.stringify({ id: 'authed-doc' });

describe('didWebDocumentCache', () => {
    const originalFetch = globalThis.fetch;
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        resetDidWebDocumentFetchCacheForTests();
        fetchMock = vi.fn(async () => new Response(DOC_BODY, { status: 200 }));
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
        fetchMock.mockImplementationOnce((_input: RequestInfo | URL, init?: RequestInit) => {
            // Shared fetch must use its own controller signal (not a caller signal).
            expect(init?.signal).toBeInstanceOf(AbortSignal);
            return gate;
        });

        const requests = Array.from({ length: 25 }, () => fetch(DOC_URL));
        await Promise.resolve();
        expect(getDidWebDocumentFetchCacheStats().inflightEntries).toBe(1);

        release!(new Response(DOC_BODY, { status: 200 }));
        const responses = await Promise.all(requests);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(responses).toHaveLength(25);
        for (const response of responses) {
            expect(response.status).toBe(200);
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

        fetchMock.mockResolvedValueOnce(new Response(DOC_BODY, { status: 200 }));
        const recovered = await fetch(DOC_URL);
        expect(recovered.status).toBe(200);
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('does not cache thrown network errors; the next call retries', async () => {
        fetchMock.mockRejectedValueOnce(new Error('network down'));

        await expect(fetch(DOC_URL)).rejects.toThrow('network down');
        expect(getDidWebDocumentFetchCacheStats().successEntries).toBe(0);
        expect(getDidWebDocumentFetchCacheStats().inflightEntries).toBe(0);

        fetchMock.mockResolvedValueOnce(new Response(DOC_BODY, { status: 200 }));
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

    it('does not let unauthenticated GETs reuse an Authorization response (P1 request context)', async () => {
        fetchMock.mockImplementation(async (_input: RequestInfo | URL, init?: RequestInit) => {
            const headers = new Headers(init?.headers);
            if (headers.get('authorization')) {
                return new Response(AUTH_BODY, { status: 200 });
            }
            return new Response(DOC_BODY, { status: 200 });
        });

        const authed = await fetch(DOC_URL, { headers: { Authorization: 'Bearer secret' } });
        expect(await authed.json()).toEqual(JSON.parse(AUTH_BODY));
        expect(fetchMock).toHaveBeenCalledTimes(1);

        const anon = await fetch(DOC_URL);
        expect(await anon.json()).toEqual(JSON.parse(DOC_BODY));
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(getDidWebDocumentFetchCacheStats().successEntries).toBe(1);
    });

    it('honors response Cache-Control: no-store and max-age (P1 cache policy)', async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(DOC_BODY, {
                status: 200,
                headers: { 'cache-control': 'no-store' },
            })
        );
        await fetch(DOC_URL);
        expect(getDidWebDocumentFetchCacheStats().successEntries).toBe(0);

        fetchMock.mockResolvedValueOnce(
            new Response(DOC_BODY, {
                status: 200,
                headers: { 'cache-control': 'max-age=0' },
            })
        );
        await fetch(DOC_URL);
        expect(getDidWebDocumentFetchCacheStats().successEntries).toBe(0);

        fetchMock.mockResolvedValueOnce(
            new Response(DOC_BODY, {
                status: 200,
                headers: { 'cache-control': 'max-age=1' },
            })
        );
        await fetch(DOC_URL);
        expect(getDidWebDocumentFetchCacheStats().successEntries).toBe(1);
        await fetch(DOC_URL);
        expect(fetchMock).toHaveBeenCalledTimes(3); // still within max-age / ttl

        await new Promise(resolve => setTimeout(resolve, 1100));
        await fetch(DOC_URL);
        expect(fetchMock).toHaveBeenCalledTimes(4);
    });

    it('does not join or repopulate from in-flight work after clear/invalidate (P1 generation)', async () => {
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

        fetchMock.mockResolvedValueOnce(new Response(AUTH_BODY, { status: 200 }));
        const fresh = await fetch(DOC_URL);
        expect(await fresh.json()).toEqual(JSON.parse(AUTH_BODY));
        expect(fetchMock).toHaveBeenCalledTimes(2);

        release!(new Response(DOC_BODY, { status: 200 }));
        await expect(stale).resolves.toMatchObject({ status: 200 });
        // Stale in-flight must not overwrite the post-clear cache entry.
        expect(getDidWebDocumentFetchCacheStats().successEntries).toBe(1);
        const stillFresh = await fetch(DOC_URL);
        expect(await stillFresh.json()).toEqual(JSON.parse(AUTH_BODY));
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('normalize invalidate keys like toAbsoluteUrl (host case / default port) (P2)', async () => {
        const mixedCaseUrl = 'https://EXAMPLE.com:443/.well-known/did.json';
        fetchMock.mockResolvedValueOnce(new Response(DOC_BODY, { status: 200 }));
        await fetch(mixedCaseUrl);
        expect(getDidWebDocumentFetchCacheStats().successEntries).toBe(1);

        invalidateDidWebDocument('did:web:EXAMPLE.com%3A443');
        expect(getDidWebDocumentFetchCacheStats().successEntries).toBe(0);

        await fetch('https://example.com/.well-known/did.json');
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('lets joiners cancel independently without aborting peers (P2 AbortSignal)', async () => {
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

        release!(new Response(DOC_BODY, { status: 200 }));
        const responseB = await pB;
        expect(responseB.status).toBe(200);
        expect(await responseB.json()).toEqual(JSON.parse(DOC_BODY));
    });

    it('evicts expired and over-capacity entries (P2 bounded LRU)', async () => {
        installDidWebDocumentFetchCache({ ttlMs: 50, maxEntries: 2, force: true });

        const urls = [
            'https://a.example.com/.well-known/did.json',
            'https://b.example.com/.well-known/did.json',
            'https://c.example.com/.well-known/did.json',
        ];
        for (const url of urls) {
            fetchMock.mockResolvedValueOnce(new Response(DOC_BODY, { status: 200 }));
            await fetch(url);
        }
        expect(getDidWebDocumentFetchCacheStats().successEntries).toBe(2);

        // a should have been LRU-evicted; refetching it hits the network.
        fetchMock.mockResolvedValueOnce(new Response(DOC_BODY, { status: 200 }));
        await fetch(urls[0]!);
        expect(fetchMock).toHaveBeenCalledTimes(4);

        await new Promise(resolve => setTimeout(resolve, 60));
        // Sweep happens on next access; size should drop after expiry.
        fetchMock.mockResolvedValueOnce(new Response(DOC_BODY, { status: 200 }));
        await fetch(urls[1]!);
        expect(getDidWebDocumentFetchCacheStats().successEntries).toBe(1);
    });

    it('rebuilds null-body statuses without throwing', async () => {
        fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
        const response = await fetch(DOC_URL);
        expect(response.status).toBe(204);
        expect(await response.text()).toBe('');
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
