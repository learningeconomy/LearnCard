import { CHUNK_PREFETCH_ELEMENT_ID } from '../buildPlugins/chunkPrefetchList';

/** Keys of the chunk list Vite writes into index.html (see vite.config.mts). */
export type PrefetchChunkKey = 'my-learncard';

let list: Partial<Record<PrefetchChunkKey, string[]>> | null = null;

const filesFor = (key: PrefetchChunkKey): string[] => {
    if (!list) {
        try {
            list = JSON.parse(
                document.getElementById(CHUNK_PREFETCH_ELEMENT_ID)?.textContent ?? '{}'
            );
        } catch {
            list = {};
        }
    }
    return list?.[key] ?? [];
};

/**
 * Paths the page already loaded as scripts or styles (e.g. FullApp, which the modal imports but
 * startup has already pulled in). Our own fetch() entries don't count, so a failed prefetch
 * is retried.
 */
const loadedPaths = (): Set<string> => {
    const entries = (performance.getEntriesByType?.('resource') ?? []) as Array<
        PerformanceResourceTiming & { responseStatus?: number }
    >;
    return new Set(
        entries
            .filter(entry => entry.initiatorType !== 'fetch')
            .filter(entry => !entry.responseStatus || entry.responseStatus < 400)
            .map(entry => new URL(entry.name).pathname)
    );
};

const attempts = new Map<PrefetchChunkKey, Promise<boolean>>();

/**
 * Download a lazy chunk's files into the HTTP cache so the later import() finds them there.
 *
 * This uses fetch(), never import(). A speculative import() that fails (a 503, a dropped
 * connection) is remembered by Firefox and some Chromium versions, so the real open would
 * fail without another request. A failed fetch() leaves nothing behind: we forget it, the
 * next prefetch tries again, and the open does its own import() through lazyWithRetry.
 *
 * Resolves true once every file is downloaded (or was already loaded), false when the list is
 * missing or a download failed. Never rejects.
 */
export const prefetchChunk = (key: PrefetchChunkKey): Promise<boolean> => {
    const known = attempts.get(key);
    if (known) return known;
    const listed = filesFor(key);
    if (listed.length === 0) return Promise.resolve(false);
    const loaded = loadedPaths();
    const files = listed.filter(file => !loaded.has(new URL(file, window.location.href).pathname));

    // allSettled, not all: one failed file mustn't end the attempt while the others still
    // download, or waitForPrefetch would let the open request them a second time.
    const attempt = Promise.allSettled(
        files.map(async file => {
            const response = await fetch(file, { priority: 'low' } as RequestInit);
            if (!response.ok) throw new Error(`${response.status} ${file}`);
            await response.arrayBuffer();
        })
    ).then(results => {
        if (results.every(result => result.status === 'fulfilled')) return true;
        attempts.delete(key);
        return false;
    });
    attempts.set(key, attempt);
    return attempt;
};

/**
 * Wait for a prefetch that's still downloading, so the open's import() finds its files in the
 * HTTP cache instead of requesting them a second time alongside it. Resolves at once when no
 * prefetch is running, as soon as it settles (failed files just get requested by the import),
 * or after maxMs so a hung prefetch never holds the open. Never rejects.
 */
export const waitForPrefetch = (key: PrefetchChunkKey, maxMs = 3000): Promise<void> => {
    const running = attempts.get(key);
    if (!running) return Promise.resolve();
    let timer: ReturnType<typeof setTimeout> | undefined;
    return Promise.race([
        running,
        new Promise(resolve => {
            timer = setTimeout(resolve, maxMs);
        }),
    ]).then(() => clearTimeout(timer));
};
