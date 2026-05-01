import React from 'react';

const STALE_CHUNK_RE =
    /ChunkLoadError|Failed to fetch dynamically imported module|Importing a module script failed/i;

const RELOAD_KEY = '__chunk_reload__';
const RELOAD_MAX = 2;
const RELOAD_TTL_MS = 30_000;

export const isStaleChunkError = (err: unknown): boolean =>
    typeof err === 'object' &&
    err !== null &&
    STALE_CHUNK_RE.test((err as { message?: string }).message ?? '');

/**
 * Check whether we've already reloaded recently to break infinite reload loops.
 * Uses sessionStorage with a TTL so the guard resets after RELOAD_TTL_MS.
 */
function shouldReload(): boolean {
    try {
        const raw = sessionStorage.getItem(RELOAD_KEY);

        if (!raw) return true;

        const { count, ts } = JSON.parse(raw) as { count: number; ts: number };

        if (Date.now() - ts > RELOAD_TTL_MS) return true;

        return count < RELOAD_MAX;
    } catch {
        return true;
    }
}

function recordReload(): void {
    try {
        const raw = sessionStorage.getItem(RELOAD_KEY);
        let count = 1;

        if (raw) {
            const prev = JSON.parse(raw) as { count: number; ts: number };

            if (Date.now() - prev.ts <= RELOAD_TTL_MS) {
                count = prev.count + 1;
            }
        }

        sessionStorage.setItem(RELOAD_KEY, JSON.stringify({ count, ts: Date.now() }));
    } catch {
        // sessionStorage unavailable — proceed with reload anyway
    }
}

/**
 * Returns a promise that never resolves.
 * Used after calling reload() so React doesn't render an error boundary
 * while the page is still tearing down.
 */
function pendingForever<T>(): Promise<T> {
    return new Promise<T>(() => {});
}

/**
 * Reload the page if the sessionStorage guard allows it.
 * Returns `true` if a reload was triggered, `false` if reloads are exhausted.
 *
 * Intended for use in error boundaries (ChunkBoundary, GenericErrorBoundary)
 * so every layer shares the same reload budget.
 */
export function guardedChunkReload(): boolean {
    if (shouldReload()) {
        recordReload();
        window.location.reload();

        return true;
    }

    return false;
}

type Preloadable = React.LazyExoticComponent<React.ComponentType<any>> & {
    preload: () => Promise<void>;
};

export function lazyWithRetry<T extends { default: React.ComponentType<any> }>(
    factory: () => Promise<T>
): Preloadable {
    let pending: Promise<T> | null = null;

    const load = (): Promise<T> => {
        if (pending) return pending;
        pending = (async () => {
            try {
                return await factory();
            } catch (firstErr) {
                if (!isStaleChunkError(firstErr)) throw firstErr;

                try {
                    return await factory();
                } catch (retryErr) {
                    if (!isStaleChunkError(retryErr)) throw retryErr;
                }

                if (shouldReload()) {
                    recordReload();
                    window.location.reload();

                    return pendingForever<T>();
                }

                throw firstErr;
            }
        })();
        // On failure, clear so a future preload/render can retry.
        pending.catch(() => {
            pending = null;
        });
        return pending;
    };

    const Component = React.lazy(load) as Preloadable;
    Component.preload = () => load().then(
        () => undefined,
        () => undefined
    );
    return Component;
}
