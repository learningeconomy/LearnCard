import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const FILES = ['/assets/MyLearnCardModalContent-abc.js', '/assets/PhoneForm-def.js'];

/** A fresh helper reading the chunk list that index.html would carry. */
const loadHelper = async (list: unknown = { 'my-learncard': FILES }) => {
    vi.resetModules();
    document.head.innerHTML = `<script type="application/json" id="lc-chunk-prefetch">${JSON.stringify(list)}</script>`;
    return import('./prefetchChunk');
};

const ok = () => new Response('export {}', { status: 200 });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
    fetchMock = vi.fn(async () => ok());
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.head.innerHTML = '';
});

const fetched = () => fetchMock.mock.calls.map(([url]) => url);

describe('prefetchChunk', () => {
    it('downloads every listed file once, however often it is asked', async () => {
        const { prefetchChunk } = await loadHelper();

        await expect(prefetchChunk('my-learncard')).resolves.toBe(true);
        await expect(prefetchChunk('my-learncard')).resolves.toBe(true);

        expect(fetched()).toEqual(FILES);
    });

    it('forgets a failed download, so the next prefetch asks the server again', async () => {
        fetchMock.mockImplementationOnce(async () => new Response('', { status: 503 }));
        const { prefetchChunk } = await loadHelper();

        await expect(prefetchChunk('my-learncard')).resolves.toBe(false);
        await expect(prefetchChunk('my-learncard')).resolves.toBe(true);

        expect(fetched()).toEqual([...FILES, ...FILES]);
    });

    it('resolves false on a network error instead of throwing', async () => {
        fetchMock.mockImplementation(async () => {
            throw new TypeError('Failed to fetch');
        });
        const { prefetchChunk } = await loadHelper();

        await expect(prefetchChunk('my-learncard')).resolves.toBe(false);
    });

    it('skips files the page already loaded as scripts, but not failed ones', async () => {
        vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
            { name: `${location.origin}${FILES[1]}`, initiatorType: 'script', responseStatus: 200 },
            { name: `${location.origin}${FILES[0]}`, initiatorType: 'script', responseStatus: 503 },
        ] as unknown as PerformanceEntryList);
        const { prefetchChunk } = await loadHelper();

        await prefetchChunk('my-learncard');

        expect(fetched()).toEqual([FILES[0]]);
    });

    it('does nothing without a chunk list', async () => {
        const { prefetchChunk } = await loadHelper({});

        await expect(prefetchChunk('my-learncard')).resolves.toBe(false);
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
