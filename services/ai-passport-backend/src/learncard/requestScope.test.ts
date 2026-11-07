import { beforeEach, describe, expect, test } from 'bun:test';

import { LearnCardTimeoutError } from './errors';
import {
    boundLearnCardCall,
    clearConsentSnapshots,
    CONSENT_READ_REUSE_MAX_MS,
    CONSENT_SNAPSHOT_TTL_MS,
    prefetchConsentSnapshot,
    resetConsentSnapshots,
    reuseRequestConsentRead,
    runInAiCallConsentScope,
    runWithLearnCardRequestScope,
} from './requestScope';

const hung = () => new Promise<never>(() => {});

describe('boundLearnCardCall', () => {
    test('stops waiting on a hung call at its timeout', async () => {
        const startedAt = performance.now();
        const error = await boundLearnCardCall(hung(), { timeoutMs: 20 }).catch(
            (caught: unknown) => caught
        );
        expect(error).toBeInstanceOf(LearnCardTimeoutError);
        expect((error as Error).name).toBe('TimeoutError');
        expect(performance.now() - startedAt).toBeLessThan(500);
    });

    test("rejects with the signal's reason when it aborts", async () => {
        const controller = new AbortController();
        const pending = boundLearnCardCall(hung(), { signal: controller.signal });
        const reason = new DOMException('deadline', 'TimeoutError');
        controller.abort(reason);
        await expect(pending).rejects.toBe(reason);
        // An already-aborted signal never starts waiting.
        await expect(boundLearnCardCall(hung(), { signal: controller.signal })).rejects.toBe(
            reason
        );
    });

    test("inherits the request scope's signal", async () => {
        const controller = new AbortController();
        const pending = runWithLearnCardRequestScope({ signal: controller.signal }, () =>
            boundLearnCardCall(hung())
        );
        controller.abort(new DOMException('aborted', 'AbortError'));
        await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    });

    test("a detached call ignores the request scope's signal", async () => {
        const controller = new AbortController();
        const gate = Promise.withResolvers<string>();
        const pending = runWithLearnCardRequestScope({ signal: controller.signal }, () =>
            boundLearnCardCall(gate.promise, { timeoutMs: 1_000, detached: true })
        );
        controller.abort(new DOMException('aborted', 'AbortError'));
        gate.resolve('shared');
        expect(await pending).toBe('shared');
    });

    test('passes results and failures through unchanged', async () => {
        expect(await boundLearnCardCall(Promise.resolve(1), { timeoutMs: 1_000 })).toBe(1);
        const failure = new Error('synthetic');
        await expect(
            boundLearnCardCall(Promise.reject(failure), { timeoutMs: 1_000 })
        ).rejects.toBe(failure);
    });
});

describe('reuseRequestConsentRead', () => {
    test('reads once per request and owner, and always outside a request', async () => {
        let reads = 0;
        const read = async () => (reads += 1);

        await runWithLearnCardRequestScope({}, async () => {
            expect(
                await Promise.all([
                    reuseRequestConsentRead('did:a', read),
                    reuseRequestConsentRead('did:a', read),
                ])
            ).toEqual([1, 1]);
            // A different owner never shares a read.
            expect(await reuseRequestConsentRead('did:b', read)).toBe(2);
        });
        expect(await reuseRequestConsentRead('did:a', read)).toBe(3);
        expect(await reuseRequestConsentRead('did:a', read)).toBe(4);
    });

    test('a fresh read always reads and replaces the shared read', async () => {
        let reads = 0;
        const read = async () => (reads += 1);

        await runWithLearnCardRequestScope({}, async () => {
            expect(await reuseRequestConsentRead('did:a', read)).toBe(1);
            expect(await reuseRequestConsentRead('did:a', read, { fresh: true })).toBe(2);
            // Later fan-out reads reuse the newer read.
            expect(await reuseRequestConsentRead('did:a', read)).toBe(2);
        });
    });

    test('reads again once the reuse window passes', async () => {
        let now = 0;
        let reads = 0;
        const read = async () => (reads += 1);
        await runWithLearnCardRequestScope({}, async () => {
            await reuseRequestConsentRead('did:a', read, { now: () => now });
            now = CONSENT_READ_REUSE_MAX_MS + 1;
            expect(await reuseRequestConsentRead('did:a', read, { now: () => now })).toBe(2);
        });
    });
});

describe('per-learner consent snapshot', () => {
    beforeEach(() => resetConsentSnapshots());

    let clock = 0;
    const now = () => clock;
    const counter = (value: (n: number) => unknown = n => `read-${n}`) => {
        let calls = 0;
        const read = async () => {
            calls += 1;
            return value(calls);
        };
        return { read, calls: () => calls };
    };
    // A plain read in its own request, sharing the snapshot.
    const plain = (
        did: string,
        read: () => Promise<unknown>,
        options: { contract?: string; accept?: (value: unknown) => boolean } = {}
    ) =>
        runWithLearnCardRequestScope({}, () =>
            reuseRequestConsentRead(did, read, {
                now,
                snapshot: {
                    contract: options.contract ?? 'contract:a',
                    read,
                    accept: options.accept,
                },
            })
        );

    test('separate requests share one read for the TTL, then read again', async () => {
        clock = 1_000;
        expect(CONSENT_SNAPSHOT_TTL_MS).toBe(10_000);
        expect(CONSENT_SNAPSHOT_TTL_MS).toBeLessThanOrEqual(CONSENT_READ_REUSE_MAX_MS);
        const { read, calls } = counter();
        expect(await plain('did:a', read)).toBe('read-1');
        clock += CONSENT_SNAPSHOT_TTL_MS;
        expect(await plain('did:a', read)).toBe('read-1');
        expect(calls()).toBe(1);
        clock += 1;
        expect(await plain('did:a', read)).toBe('read-2');
        expect(calls()).toBe(2);
    });

    test('keyed on learner and contract', async () => {
        clock = 0;
        const { read, calls } = counter();
        await plain('did:a', read);
        await plain('did:b', read);
        await plain('did:a', read, { contract: 'contract:b' });
        expect(calls()).toBe(3);
        await plain('did:a', read);
        await plain('did:b', read);
        await plain('did:a', read, { contract: 'contract:b' });
        expect(calls()).toBe(3);
    });

    test('a caller holding another revision misses the snapshot', async () => {
        clock = 0;
        const { read, calls } = counter(n => ({ revision: `r${n}` }));
        const revision = (expected: string) => ({
            accept: (value: unknown) => (value as { revision: string }).revision === expected,
        });
        expect(await plain('did:a', read, revision('r1'))).toEqual({ revision: 'r1' });
        expect(calls()).toBe(1);
        expect(await plain('did:a', read, revision('r1'))).toEqual({ revision: 'r1' });
        expect(calls()).toBe(1);
        // A revision change reads again, and that read replaces the entry.
        expect(await plain('did:a', read, revision('r2'))).toEqual({ revision: 'r2' });
        expect(calls()).toBe(2);
        expect(await plain('did:a', read)).toEqual({ revision: 'r2' });
        expect(calls()).toBe(2);
    });

    test('single-flight: concurrent callers share one in-flight read', async () => {
        clock = 0;
        const gate = Promise.withResolvers<string>();
        let calls = 0;
        const read = () => {
            calls += 1;
            return gate.promise;
        };
        const pending = Promise.all([
            plain('did:a', read),
            plain('did:a', read),
            plain('did:a', read),
        ]);
        gate.resolve('shared');
        expect(await pending).toEqual(['shared', 'shared', 'shared']);
        expect(calls).toBe(1);
    });

    test('errors are never cached', async () => {
        clock = 0;
        let calls = 0;
        const gate = Promise.withResolvers<string>();
        const failing = () => {
            calls += 1;
            return gate.promise;
        };
        const first = Promise.allSettled([plain('did:a', failing), plain('did:a', failing)]);
        gate.reject(new Error('outage'));
        expect((await first).map(({ status }) => status)).toEqual(['rejected', 'rejected']);
        expect(calls).toBe(1);
        const { read } = counter();
        expect(await plain('did:a', read)).toBe('read-1');
        // A failed prefetch is swallowed and leaves nothing behind either.
        clearConsentSnapshots('did:a');
        await expect(
            prefetchConsentSnapshot(
                'did:a',
                'contract:a',
                async () => {
                    throw new Error('outage');
                },
                now
            )
        ).resolves.toBeUndefined();
        expect(await plain('did:a', read)).toBe('read-2');
    });

    test("erasure clears the learner's snapshot, and a read in flight never writes back", async () => {
        clock = 0;
        const { read, calls } = counter();
        await plain('did:a', read);
        await plain('did:b', read);
        clearConsentSnapshots('did:a');
        expect(await plain('did:a', read)).toBe('read-3');
        expect(await plain('did:b', read)).toBe('read-2');
        expect(calls()).toBe(3);

        // A live (fresh) read that started before erasure does not refill it.
        const gate = Promise.withResolvers<string>();
        const fresh = reuseRequestConsentRead('did:a', () => gate.promise, {
            fresh: true,
            now,
            snapshot: { contract: 'contract:a', read: () => gate.promise },
        });
        clearConsentSnapshots('did:a');
        gate.resolve('before-erasure');
        await fresh;
        expect(await plain('did:a', read)).toBe('read-4');
    });

    test("fresh reads bypass the snapshot, refresh it, and stay the AI call's read", async () => {
        clock = 0;
        const { read, calls } = counter();
        await plain('did:a', read);
        await runWithLearnCardRequestScope({}, () =>
            runInAiCallConsentScope(async () => {
                // A snapshot-served plain read is not the AI call's read...
                expect(
                    await reuseRequestConsentRead('did:a', read, {
                        now,
                        snapshot: { contract: 'contract:a', read },
                    })
                ).toBe('read-1');
                // ...so the call's first boundary check reads live.
                expect(
                    await reuseRequestConsentRead('did:a', read, {
                        fresh: true,
                        oncePerAiCall: true,
                        now,
                        snapshot: { contract: 'contract:a', read },
                    })
                ).toBe('read-2');
            })
        );
        expect(calls()).toBe(2);
        // The live read refreshed the snapshot for later plain reads.
        expect(await plain('did:a', read)).toBe('read-2');
        expect(calls()).toBe(2);
    });

    test('a socket-open prefetch is joined by the next plain read', async () => {
        clock = 0;
        const gate = Promise.withResolvers<string>();
        let calls = 0;
        const read = () => {
            calls += 1;
            return gate.promise;
        };
        const prefetched = prefetchConsentSnapshot('did:a', 'contract:a', read, now);
        const joined = plain('did:a', read);
        gate.resolve('prefetched');
        await prefetched;
        expect(await joined).toBe('prefetched');
        expect(calls).toBe(1);
    });
});
