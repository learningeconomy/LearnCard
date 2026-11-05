import { describe, expect, it } from 'vitest';
import { runOpenLoop, type ScheduleDeps } from './schedule';

/** Virtual clock: sleep advances time; `block` simulates a busy event loop. */
const clock = () => {
    let t = 1_000;
    const deps: ScheduleDeps = {
        now: () => t,
        sleep: async ms => {
            t += ms;
        },
    };
    return { deps, advance: (ms: number) => (t += ms), now: () => t };
};

const deferred = () => {
    let resolve!: () => void;
    const promise = new Promise<void>(r => (resolve = r));
    return { promise, resolve };
};

describe('runOpenLoop', () => {
    it('starts each item at its scheduled time without waiting for earlier ones', async () => {
        const { deps, now } = clock();
        const starts: number[] = [];
        const gates = [deferred(), deferred(), deferred()];
        const items = [0, 500, 1000].map(atMs => ({ atMs }));
        const done = runOpenLoop(items, { maxInFlight: 10, lateMs: 100 }, deps, {
            start: async item => {
                starts.push(now() - 1_000);
                await gates[items.indexOf(item)].promise;
            },
            dropped: () => undefined,
            late: () => undefined,
            shouldStop: () => false,
        });
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(starts).toEqual([0, 500, 1000]);
        gates.forEach(gate => gate.resolve());
        expect(await done).toEqual({ started: 3, dropped: 0, late: 0 });
    });

    it('drops (never queues) starts beyond max in-flight, and waits for in-flight work', async () => {
        const { deps } = clock();
        const gate = deferred();
        const dropped: [number, string][] = [];
        let finished = 0;
        const result = runOpenLoop(
            [0, 10, 20, 30].map(atMs => ({ atMs })),
            { maxInFlight: 2, lateMs: 100 },
            deps,
            {
                start: async () => {
                    await gate.promise;
                    finished += 1;
                },
                dropped: (item, reason) => dropped.push([item.atMs, reason]),
                late: () => undefined,
                shouldStop: () => false,
            }
        );
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(dropped).toEqual([
            [20, 'in_flight'],
            [30, 'in_flight'],
        ]);
        gate.resolve();
        expect(await result).toEqual({ started: 2, dropped: 2, late: 0 });
        expect(finished).toBe(2);
    });

    it('counts late starts when the generator falls behind', async () => {
        const { deps, advance } = clock();
        const late: number[] = [];
        const result = await runOpenLoop(
            [0, 100, 200].map(atMs => ({ atMs })),
            { maxInFlight: 5, lateMs: 50 },
            deps,
            {
                // A CPU-bound synchronous prefix delays the next scheduled start.
                start: async () => {
                    advance(180);
                },
                dropped: () => undefined,
                late: (_item, ms) => late.push(ms),
                shouldStop: () => false,
            }
        );
        expect(result).toEqual({ started: 3, dropped: 0, late: 2 });
        expect(late).toEqual([80, 160]);
    });

    it('drops every remaining item once stopped, and swallows start failures', async () => {
        const { deps } = clock();
        const dropped: string[] = [];
        let calls = 0;
        const result = await runOpenLoop(
            [0, 1, 2, 3].map(atMs => ({ atMs })),
            { maxInFlight: 5, lateMs: 50 },
            deps,
            {
                start: async () => {
                    calls += 1;
                    throw new Error('boom');
                },
                dropped: (_item, reason) => dropped.push(reason),
                late: () => undefined,
                shouldStop: item => item.atMs >= 2,
            }
        );
        expect(calls).toBe(2);
        expect(dropped).toEqual(['stopped', 'stopped']);
        expect(result).toEqual({ started: 2, dropped: 2, late: 0 });
    });

    it('rejects a non-positive in-flight bound', async () => {
        await expect(
            runOpenLoop([], { maxInFlight: 0, lateMs: 1 }, clock().deps, {
                start: async () => undefined,
                dropped: () => undefined,
                late: () => undefined,
                shouldStop: () => false,
            })
        ).rejects.toThrow('maxInFlight');
    });
});
