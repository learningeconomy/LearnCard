/**
 * Unit tests for lazyWithRetry — stale chunk recovery logic.
 *
 * @vitest-environment jsdom
 *
 * Covers:
 *  - Successful import on first try
 *  - Non-chunk errors thrown immediately
 *  - isStaleChunkError detection for all known error messages
 *  - Retry succeeds on second attempt
 *  - Both attempts fail → reload + pending promise
 *  - Reload loop guard (sessionStorage-based)
 *  - sessionStorage TTL expiry resets the guard
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { isStaleChunkError, guardedChunkReload, lazyWithRetry } from '../lazyWithRetry';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const RELOAD_KEY = '__chunk_reload__';

const fakeModule = { default: () => null };

/** Extract the async loader that lazyWithRetry passes to React.lazy */
let capturedLoader: (() => Promise<{ default: React.ComponentType<unknown> }>) | undefined;

const fakeLazyComponent = { $$typeof: Symbol.for('react.lazy'), _status: -1, _result: null };

vi.mock('react', () => ({
    default: {
        lazy: (loader: () => Promise<{ default: React.ComponentType<unknown> }>) => {
            capturedLoader = loader;

            return { ...fakeLazyComponent };
        },
    },
    lazy: (loader: () => Promise<{ default: React.ComponentType<unknown> }>) => {
        capturedLoader = loader;

        return { ...fakeLazyComponent };
    },
}));

const reloadMock = vi.fn();

beforeEach(() => {
    capturedLoader = undefined;
    sessionStorage.clear();

    Object.defineProperty(window, 'location', {
        configurable: true,
        value: { reload: reloadMock },
    });
});

afterEach(() => {
    vi.restoreAllMocks();
    reloadMock.mockReset();
});

// ---------------------------------------------------------------------------
// isStaleChunkError
// ---------------------------------------------------------------------------

describe('isStaleChunkError', () => {
    it('matches "ChunkLoadError"', () => {
        expect(isStaleChunkError(new Error('ChunkLoadError: loading chunk 42 failed'))).toBe(true);
    });

    it('matches "Failed to fetch dynamically imported module"', () => {
        expect(
            isStaleChunkError(new Error('Failed to fetch dynamically imported module: /foo.js'))
        ).toBe(true);
    });

    it('matches "Importing a module script failed"', () => {
        expect(isStaleChunkError(new TypeError('Importing a module script failed.'))).toBe(true);
    });

    it('does not match unrelated errors', () => {
        expect(isStaleChunkError(new Error('Network request failed'))).toBe(false);
    });

    it('returns false for non-object values', () => {
        expect(isStaleChunkError(null)).toBe(false);
        expect(isStaleChunkError(undefined)).toBe(false);
        expect(isStaleChunkError('string error')).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// lazyWithRetry
// ---------------------------------------------------------------------------

describe('lazyWithRetry', () => {
    it('returns the module when the first import succeeds', async () => {
        const factory = vi.fn().mockResolvedValue(fakeModule);

        lazyWithRetry(factory);
        const result = await capturedLoader!();

        expect(result).toBe(fakeModule);
        expect(factory).toHaveBeenCalledTimes(1);
        expect(reloadMock).not.toHaveBeenCalled();
    });

    it('throws immediately for non-chunk errors', async () => {
        const err = new Error('Some other problem');
        const factory = vi.fn().mockRejectedValue(err);

        lazyWithRetry(factory);

        await expect(capturedLoader!()).rejects.toThrow('Some other problem');
        expect(factory).toHaveBeenCalledTimes(1);
        expect(reloadMock).not.toHaveBeenCalled();
    });

    it('retries once on a stale chunk error and succeeds', async () => {
        const chunkErr = new TypeError('Importing a module script failed.');
        const factory = vi.fn().mockRejectedValueOnce(chunkErr).mockResolvedValueOnce(fakeModule);

        lazyWithRetry(factory);
        const result = await capturedLoader!();

        expect(result).toBe(fakeModule);
        expect(factory).toHaveBeenCalledTimes(2);
        expect(reloadMock).not.toHaveBeenCalled();
    });

    it('reloads when both attempts fail with a stale chunk error', async () => {
        const chunkErr = new TypeError('Importing a module script failed.');
        const factory = vi.fn().mockRejectedValue(chunkErr);

        lazyWithRetry(factory);

        // The returned promise should never resolve (pendingForever),
        // so we race it against a short timeout.
        const result = await Promise.race([
            capturedLoader!().then(() => 'resolved'),
            new Promise<string>(r => setTimeout(() => r('pending'), 100)),
        ]);

        expect(result).toBe('pending');
        expect(factory).toHaveBeenCalledTimes(2);
        expect(reloadMock).toHaveBeenCalledTimes(1);
    });

    it('records reload count in sessionStorage', async () => {
        const chunkErr = new TypeError('Importing a module script failed.');
        const factory = vi.fn().mockRejectedValue(chunkErr);

        lazyWithRetry(factory);

        // Trigger the loader (will reload + pend)
        capturedLoader!();
        await new Promise(r => setTimeout(r, 50));

        const stored = JSON.parse(sessionStorage.getItem(RELOAD_KEY)!);

        expect(stored.count).toBe(1);
        expect(typeof stored.ts).toBe('number');
    });

    it('stops reloading after RELOAD_MAX (2) attempts within the TTL', async () => {
        // Pre-seed sessionStorage as if we already reloaded twice recently
        sessionStorage.setItem(RELOAD_KEY, JSON.stringify({ count: 2, ts: Date.now() }));

        const chunkErr = new TypeError('Importing a module script failed.');
        const factory = vi.fn().mockRejectedValue(chunkErr);

        lazyWithRetry(factory);

        await expect(capturedLoader!()).rejects.toThrow('Importing a module script failed.');
        expect(reloadMock).not.toHaveBeenCalled();
    });

    it('reloads again after the TTL window expires', async () => {
        // Pre-seed sessionStorage with an expired entry (31s ago)
        sessionStorage.setItem(
            RELOAD_KEY,
            JSON.stringify({ count: 2, ts: Date.now() - 31_000 })
        );

        const chunkErr = new TypeError('Importing a module script failed.');
        const factory = vi.fn().mockRejectedValue(chunkErr);

        lazyWithRetry(factory);

        const result = await Promise.race([
            capturedLoader!().then(() => 'resolved'),
            new Promise<string>(r => setTimeout(() => r('pending'), 100)),
        ]);

        expect(result).toBe('pending');
        expect(reloadMock).toHaveBeenCalledTimes(1);

        // Count should have reset to 1
        const stored = JSON.parse(sessionStorage.getItem(RELOAD_KEY)!);

        expect(stored.count).toBe(1);
    });

    it('handles retry returning a non-chunk error', async () => {
        const chunkErr = new TypeError('Importing a module script failed.');
        const otherErr = new Error('Server 500');
        const factory = vi.fn().mockRejectedValueOnce(chunkErr).mockRejectedValueOnce(otherErr);

        lazyWithRetry(factory);

        await expect(capturedLoader!()).rejects.toThrow('Server 500');
        expect(factory).toHaveBeenCalledTimes(2);
        expect(reloadMock).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// guardedChunkReload — used by ChunkBoundary & GenericErrorBoundary
// ---------------------------------------------------------------------------

describe('guardedChunkReload', () => {
    it('reloads and returns true when reload budget is available', () => {
        const result = guardedChunkReload();

        expect(result).toBe(true);
        expect(reloadMock).toHaveBeenCalledTimes(1);
    });

    it('returns false and does NOT reload when budget is exhausted', () => {
        sessionStorage.setItem(RELOAD_KEY, JSON.stringify({ count: 2, ts: Date.now() }));

        const result = guardedChunkReload();

        expect(result).toBe(false);
        expect(reloadMock).not.toHaveBeenCalled();
    });

    it('shares the reload budget with lazyWithRetry', async () => {
        const chunkErr = new TypeError('Importing a module script failed.');
        const factory = vi.fn().mockRejectedValue(chunkErr);

        // lazyWithRetry uses 1 reload from the budget
        lazyWithRetry(factory);
        capturedLoader!();
        await new Promise(r => setTimeout(r, 50));

        expect(reloadMock).toHaveBeenCalledTimes(1);

        const stored = JSON.parse(sessionStorage.getItem(RELOAD_KEY)!);

        expect(stored.count).toBe(1);

        // guardedChunkReload uses 1 more — still within budget (max 2)
        const result1 = guardedChunkReload();

        expect(result1).toBe(true);
        expect(reloadMock).toHaveBeenCalledTimes(2);

        // Now budget is exhausted — should not reload
        const result2 = guardedChunkReload();

        expect(result2).toBe(false);
        expect(reloadMock).toHaveBeenCalledTimes(2);
    });
});

// ---------------------------------------------------------------------------
// preload() — idempotent pre-fetching
// ---------------------------------------------------------------------------

describe('lazyWithRetry .preload()', () => {
    it('resolves after a successful import', async () => {
        const factory = vi.fn().mockResolvedValue(fakeModule);

        const Component = lazyWithRetry(factory);
        await expect(Component.preload()).resolves.toBeUndefined();
        expect(factory).toHaveBeenCalledTimes(1);
    });

    it('only invokes the factory once across multiple preload() calls', async () => {
        const factory = vi.fn().mockResolvedValue(fakeModule);

        const Component = lazyWithRetry(factory);

        // Fire multiple preloads in parallel
        await Promise.all([Component.preload(), Component.preload(), Component.preload()]);

        expect(factory).toHaveBeenCalledTimes(1);
    });

    it('does not re-invoke the factory on render after preload', async () => {
        const factory = vi.fn().mockResolvedValue(fakeModule);

        const Component = lazyWithRetry(factory);
        await Component.preload();
        expect(factory).toHaveBeenCalledTimes(1);

        // Simulate React.lazy calling the loader
        const result = await capturedLoader!();
        expect(result).toBe(fakeModule);
        // Factory should NOT have been called again
        expect(factory).toHaveBeenCalledTimes(1);
    });

    it('does not poison subsequent preload attempts after a non-stale error', async () => {
        const err = new Error('transient failure');
        const factory = vi.fn()
            .mockRejectedValueOnce(err)
            .mockResolvedValueOnce(fakeModule);

        const Component = lazyWithRetry(factory);

        // First preload swallows the error
        await expect(Component.preload()).resolves.toBeUndefined();
        expect(factory).toHaveBeenCalledTimes(1);

        // Second preload should retry (pending was cleared)
        await expect(Component.preload()).resolves.toBeUndefined();
        expect(factory).toHaveBeenCalledTimes(2);
    });
});
