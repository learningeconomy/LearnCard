import { afterEach, beforeEach, expect, mock, test } from 'bun:test';
import { createHash, randomUUID } from 'node:crypto';
import Redis from 'ioredis';

mock.module('../ai/privacy-keys', () => ({
    getPrivacySubjectRef: (did: string) => createHash('sha256').update(did).digest('hex'),
    getPrivacyKeyMaterial: () => ({ erasureRequest: Buffer.alloc(32, 9) }),
}));
mock.module('./dataLifecycle', () => ({
    dataLifecycleService: {
        deleteData: async () => {
            throw new Error('Unexpected real cleanup');
        },
    },
}));
const { default: cache } = await import('../utils/cache');
const {
    requestDataErasure,
    completeDataErasure,
    readPendingDataErasurePage,
    PRIVACY_MAINTENANCE_KEY,
    withOwnerOperation,
} = await import('./dataErasure');
const { reconcileDataErasures } = await import('./dataErasureReconciliation');
await cache.redis?.quit();
let store: Redis;
beforeEach(() => {
    store = new Redis({
        host: process.env.REDIS_HOST ?? '127.0.0.1',
        port: Number(process.env.REDIS_PORT ?? 6384),
        keyPrefix: `erasure-reconciliation:${randomUUID()}:`,
    });
    cache.redis = store;
});
afterEach(async () => {
    const prefix = store.options.keyPrefix;
    if (!prefix) throw new Error('Isolated prefix is required');
    const keys = await store.keys(`${prefix}*`);
    if (keys.length) await store.del(...keys.map(key => key.slice(prefix.length)));
    await store.quit();
});

test('a different process recovers accepted erasure without another HTTP request', async () => {
    const did = 'did:example:recovery';
    await requestDataErasure(did);
    // Discard the requesting process's connection; only durable state can survive.
    const options = { ...store.options };
    await store.quit();
    store = new Redis(options);
    cache.redis = store;
    let drained = false;
    await reconcileDataErasures(async () => ({
        status: 'incomplete',
        retryable: true,
    }));
    expect((await readPendingDataErasurePage('0')).owners).toEqual([did]);
    await reconcileDataErasures(async owner => {
        drained = owner === did;
        await completeDataErasure(owner);
        return { status: 'complete' };
    });
    expect(drained).toBe(true);
    expect((await readPendingDataErasurePage('0')).owners).toEqual([]);
    await expect(withOwnerOperation(did, async () => 'resurrected')).rejects.toMatchObject({
        code: 'data_erasure_requested',
    });
});

test('maintenance pauses cleanup and one failed owner does not block another', async () => {
    const failed = 'did:example:failed';
    const completed = 'did:example:completed';
    await requestDataErasure(failed);
    await requestDataErasure(completed);
    await store.set(PRIVACY_MAINTENANCE_KEY, 'offline-migration');
    let calls = 0;
    const clean = async (did: string) => {
        calls += 1;
        if (did === failed) throw new Error('private infrastructure detail');
        await completeDataErasure(did);
        return { status: 'complete' as const };
    };
    await reconcileDataErasures(clean);
    expect(calls).toBe(0);
    await store.del(PRIVACY_MAINTENANCE_KEY);
    await reconcileDataErasures(clean);
    expect(calls).toBe(2);
    expect((await readPendingDataErasurePage('0')).owners).toEqual([failed]);
});
