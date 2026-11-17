import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const wasmInit = vi.hoisted(() => vi.fn());

vi.mock('../src/didkit/pkg/didkit_wasm', () => ({ default: wasmInit }));

type Deferred = { promise: Promise<void>; resolve: () => void; reject: (error: Error) => void };
const deferred = (): Deferred => {
    let resolve!: () => void;
    let reject!: (error: Error) => void;
    const promise = new Promise<void>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
};

/** Settles pending promise callbacks without advancing (fake) timers. */
const flushMicrotasks = async () => {
    for (let i = 0; i < 10; i += 1) await Promise.resolve();
};

const settled = <T>(promise: Promise<T>) => {
    const state = { done: false, error: undefined as unknown };
    promise.then(
        () => {
            state.done = true;
        },
        error => {
            state.done = true;
            state.error = error;
        }
    );
    return state;
};

const loadInit = async () => {
    vi.resetModules();
    return (await import('../src/didkit/index')).init;
};

describe('DIDKit WASM init', () => {
    beforeEach(() => {
        wasmInit.mockReset();
        // Concurrent callers must not depend on a polling timer to finish.
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('runs one WASM init for concurrent and repeated calls, all settling together', async () => {
        const init = await loadInit();
        const wasm = deferred();
        wasmInit.mockReturnValue(wasm.promise);

        const callers = [init('a.wasm'), init('b.wasm'), init()].map(settled);
        await flushMicrotasks();
        expect(callers.some(caller => caller.done)).toBe(false);

        wasm.resolve();
        await flushMicrotasks();

        expect(callers.every(caller => caller.done && caller.error === undefined)).toBe(true);
        await init('later.wasm');
        expect(wasmInit).toHaveBeenCalledTimes(1);
        expect(wasmInit).toHaveBeenCalledWith({ module_or_path: 'a.wasm' });
    });

    it('shares one failed attempt between concurrent callers, then lets a later call retry', async () => {
        const init = await loadInit();
        const failing = deferred();
        wasmInit.mockReturnValueOnce(failing.promise).mockResolvedValueOnce(undefined);

        const callers = [init('x.wasm'), init('x.wasm')].map(settled);
        failing.reject(new Error('wasm fetch failed'));
        await flushMicrotasks();

        expect(callers.map(caller => (caller.error as Error)?.message)).toEqual([
            'wasm fetch failed',
            'wasm fetch failed',
        ]);
        expect(wasmInit).toHaveBeenCalledTimes(1);

        await expect(init('x.wasm')).resolves.toBeUndefined();
        expect(wasmInit).toHaveBeenCalledTimes(2);
        await init('x.wasm');
        expect(wasmInit).toHaveBeenCalledTimes(2);
    });

    it('lets initDidKit warm the same init that getDidKitPlugin later awaits', async () => {
        vi.resetModules();
        const { initDidKit, getDidKitPlugin } = await import('../src/plugin');
        wasmInit.mockResolvedValue(undefined);

        await initDidKit('warm.wasm');
        await getDidKitPlugin('warm.wasm');

        expect(wasmInit).toHaveBeenCalledTimes(1);
    });
});
