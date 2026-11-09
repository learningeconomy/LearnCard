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

describe('didWebDocumentCache', () => {
    const originalFetch = globalThis.fetch;
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        resetDidWebDocumentFetchCacheForTests();
        fetchMock = vi.fn(async () => new Response(DOC_BODY, { status: 200 }));
        globalThis.fetch = fetchMock as unknown as typeof fetch;
        installDidWebDocumentFetchCache({ ttlMs: 50, force: true });
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
        fetchMock.mockImplementationOnce(() => gate);

        const requests = Array.from({ length: 25 }, () => fetch(DOC_URL));
        // Allow the wrapper to register in-flight before releasing the underlying fetch.
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
});
