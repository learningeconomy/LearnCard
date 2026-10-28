import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { createHash, randomUUID } from 'node:crypto';
import Redis from 'ioredis';

mock.module('../ai/privacy-keys', () => ({
    getPrivacySubjectRef: (did: string) => createHash('sha256').update(did).digest('hex'),
    getPrivacyKeyMaterial: () => ({ erasureRequest: Buffer.alloc(32, 9) }),
}));
// Load after installing the isolated privacy-key fixture.
const { default: cache, evalOwnerMutation } = await import('../utils/cache');
const {
    withOwnerOperation,
    getCurrentOwnerOperation,
    getOwnerOperationFence,
    assertOwnerOperationActive,
    getActiveOwnerOperationCount,
    isDataErasureRequested,
    requestDataErasure,
    completeDataErasure,
    readPendingDataErasurePage,
    PENDING_ERASURES_KEY,
    PRIVACY_MAINTENANCE_KEY,
    OWNER_OPERATION_FENCE_SCRIPT,
} = await import('./dataErasure');
const did = 'did:example:alice';
let store: Redis;
await cache.redis?.quit();
beforeEach(() => {
    store = new Redis({
        host: process.env.REDIS_HOST ?? '127.0.0.1',
        port: Number(process.env.REDIS_PORT ?? 6384),
        keyPrefix: `owner-fence-test:${randomUUID()}:`,
    });
    cache.redis = store;
});
afterEach(async () => {
    const prefix = store.options.keyPrefix;
    if (!prefix) throw new Error('Isolated Redis fixture prefix is required');
    const keys = await store.keys(`${prefix}*`);
    if (keys.length) await store.del(...keys.map(key => key.slice(prefix.length)));
    await store.quit();
});
describe('owner lease publication fences', () => {
    test('durable pending owners are encrypted and completion never reopens admission', async () => {
        const first = await requestDataErasure(did);
        const records = await store.hgetall(PENDING_ERASURES_KEY);
        expect(JSON.stringify(records)).not.toContain(did);
        expect(await readPendingDataErasurePage('0')).toMatchObject({
            owners: [did],
            unreadable: 0,
        });
        const completed = await completeDataErasure(did);
        expect(await requestDataErasure(did)).toEqual({ ...first, ...completed });
        expect((await readPendingDataErasurePage('0')).owners).toEqual([]);
        expect(await isDataErasureRequested(did)).toBe(true);
        await expect(withOwnerOperation(did, async () => 'new account')).rejects.toMatchObject({
            code: 'data_erasure_requested',
        });
    });

    test('an unreadable queued request is retained without blocking other owners', async () => {
        await store.hset(PENDING_ERASURES_KEY, 'corrupt-owner', 'invalid ciphertext');
        await requestDataErasure(did);
        expect(await readPendingDataErasurePage('0')).toMatchObject({
            owners: [did],
            unreadable: 1,
        });
        expect(await store.hget(PENDING_ERASURES_KEY, 'corrupt-owner')).toBe('invalid ciphertext');
    });

    test('erasure is idempotent and rejects admission while a live operation drains', async () => {
        await expect(
            withOwnerOperation(did, async () => {
                expect(await getActiveOwnerOperationCount(did)).toBe(1);
                const first = await requestDataErasure(did);
                expect(await requestDataErasure(did)).toEqual(first);
                expect(await isDataErasureRequested(did)).toBe(true);
                await expect(withOwnerOperation(did, async () => 'late')).rejects.toMatchObject({
                    code: 'data_erasure_requested',
                });
                expect(await getActiveOwnerOperationCount(did)).toBe(1);
                return 'must not escape completion check';
            })
        ).rejects.toMatchObject({ code: 'data_erasure_requested' });
        expect(await getActiveOwnerOperationCount(did)).toBe(0);
    });

    test('a paused expired operation cannot renew or publish even before pruning', async () => {
        await expect(
            withOwnerOperation(did, async signal => {
                const fence = getOwnerOperationFence()!;
                // Simulate a stalled process by moving its server-side expiry into the past.
                await store.zadd(fence.operationsKey, 1, fence.token);
                await expect(
                    store.eval(
                        `${OWNER_OPERATION_FENCE_SCRIPT}\nredis.call("ZADD", KEYS[2], now + 120000, ARGV[1]); return 1`,
                        3,
                        fence.tombstoneKey,
                        fence.operationsKey,
                        PRIVACY_MAINTENANCE_KEY,
                        fence.token
                    )
                ).rejects.toThrow();
                expect(await store.zscore(fence.operationsKey, fence.token)).toBe('1');
                await expect(cache.set('topics:late', 'private')).rejects.toMatchObject({
                    code: 'data_erasure_requested',
                });
                expect(await store.get('topics:late')).toBeNull();
                await expect(assertOwnerOperationActive(did)).rejects.toMatchObject({
                    code: 'data_erasure_requested',
                });
                expect(signal.aborted).toBe(true);
            })
        ).rejects.toMatchObject({ code: 'data_erasure_requested' });
    });

    test('the mutation itself rejects erasure arriving after a successful precheck', async () => {
        await expect(
            withOwnerOperation(did, async () => {
                await assertOwnerOperationActive(did);
                await requestDataErasure(did);
                await evalOwnerMutation(
                    store,
                    did,
                    `return redis.call("SET", KEYS[4], ARGV[2])`,
                    ['oauth:refresh:late'],
                    ['private']
                );
            })
        ).rejects.toMatchObject({ code: 'data_erasure_requested' });
        expect(await store.get('oauth:refresh:late')).toBeNull();
    });

    test('maintenance blocks existing and new operations without deleting its marker', async () => {
        await expect(
            withOwnerOperation(did, async () => {
                await store.set(PRIVACY_MAINTENANCE_KEY, 'migration');
                await cache.set('topics:late', 'private');
            })
        ).rejects.toMatchObject({ code: 'data_erasure_requested' });
        await expect(withOwnerOperation(did, async () => 'denied')).rejects.toMatchObject({
            code: 'data_erasure_requested',
        });
        expect(await store.get(PRIVACY_MAINTENANCE_KEY)).toBe('migration');
    });

    test('nested work reuses one lease while a detached child outlives its parent', async () => {
        const gate = Promise.withResolvers<void>();
        const started = Promise.withResolvers<void>();
        let child: Promise<string> | undefined;
        await withOwnerOperation(did, async () => {
            const parent = getCurrentOwnerOperation()!.token;
            await withOwnerOperation(did, async () => {
                expect(getCurrentOwnerOperation()!.token).toBe(parent);
            });
            await expect(
                withOwnerOperation('did:example:bob', async () => 'wrong')
            ).rejects.toThrow('different owners');
            child = withOwnerOperation(
                did,
                async () => {
                    expect(getCurrentOwnerOperation()!.token).not.toBe(parent);
                    started.resolve();
                    await gate.promise;
                    await cache.set('topics:child', 'result');
                    return 'completed';
                },
                { detached: true }
            );
            await started.promise;
        });
        expect(await getActiveOwnerOperationCount(did)).toBe(1);
        gate.resolve();
        expect(await child).toBe('completed');
        expect(await getActiveOwnerOperationCount(did)).toBe(0);
    });

    test('owner-bound writes and expiry extensions require a scope', async () => {
        await store.set('topics:private', 'private');
        await expect(cache.set('topics:private', 'late')).rejects.toMatchObject({
            code: 'data_erasure_requested',
        });
        await expect(cache.get('topics:private', true)).rejects.toMatchObject({
            code: 'data_erasure_requested',
        });
        expect(await cache.get('topics:private')).toBe('private');
    });
});
