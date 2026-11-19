import {
    CHUNK_PREFETCH_ELEMENT_ID,
    type PrefetchChunkKey,
} from '../buildPlugins/chunkPrefetchList';

export type { PrefetchChunkKey };

/** How long a failed prefetch blocks the next attempt for the same key (gitStream on #2104). */
export const PREFETCH_FAIL_COOLDOWN_MS = 20_000;

/** Per-file fetch timeout so a hung request can't leave the attempt pending forever. */
export const PREFETCH_FETCH_TIMEOUT_MS = 30_000;

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
 * is retried (after the cooldown).
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
const cooldownUntil = new Map<PrefetchChunkKey, number>();

/**
 * Download a lazy chunk's files into the HTTP cache so the later import() finds them there.
 *
 * This uses fetch(), never import(). A speculative import() that fails (a 503, a dropped
 * connection) is remembered by Firefox and some Chromium versions, so the real open would
 * fail without another request. A failed fetch() leaves nothing behind: we forget it (after a
 * short cooldown so every hover/focus doesn't re-hit a broken network), and the open does its
 * own import() through lazyWithRetry.
 *
 * Each file fetch has a timeout so a hung connection can't leave the attempt pending forever.
 *
 * Resolves true once every file is downloaded (or was already loaded), false when the list is
 * missing, a download failed, or we're in the post-failure cooldown. Never rejects.
 */
export const prefetchChunk = (key: PrefetchChunkKey): Promise<boolean> => {
    const known = attempts.get(key);
    if (known) return known;
    const until = cooldownUntil.get(key);
    if (until !== undefined && Date.now() < until) return Promise.resolve(false);
    const listed = filesFor(key);
    if (listed.length === 0) return Promise.resolve(false);
    const loaded = loadedPaths();
    const files = listed.filter(file => !loaded.has(new URL(file, window.location.href).pathname));

    // allSettled, not all: one failed file mustn't end the attempt while the others still
    // download, or waitForPrefetch would let the open request them a second time.
    const attempt = Promise.allSettled(
        files.map(async file => {
            // AbortController + setTimeout (not AbortSignal.timeout) so vitest fake
            // timers can advance a hung fetch the same way production wall-clock does.
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), PREFETCH_FETCH_TIMEOUT_MS);
            try {
                const response = await fetch(file, {
                    priority: 'low',
                    signal: controller.signal,
                } as RequestInit);
                if (!response.ok) throw new Error(`${response.status} ${file}`);
                await response.arrayBuffer();
            } finally {
                clearTimeout(timer);
            }
        })
    ).then(results => {
        if (results.every(result => result.status === 'fulfilled')) {
            cooldownUntil.delete(key);
            return true;
        }
        attempts.delete(key);
        cooldownUntil.set(key, Date.now() + PREFETCH_FAIL_COOLDOWN_MS);
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
