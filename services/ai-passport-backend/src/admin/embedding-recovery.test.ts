import { afterAll, beforeEach, expect, spyOn, test } from 'bun:test';
import { MongoClient } from 'mongodb';
import { randomUUID } from 'node:crypto';
import type { BackfillJob } from './backfill';
import { managedEmbeddingRecovery } from './embedding-recovery';
import { withProviderBudget } from '../ai/usage-meter';
import { EMBEDDING_MAX_ATTEMPTS } from '../ai/embedding-recovery';
const mongo = new MongoClient(process.env.MONGO_URI!);
await mongo.connect();
const store = mongo.db(process.env.MONGO_DB!).collection<BackfillJob>('recovery_test_jobs');
afterAll(async () => {
    await store.drop();
    await mongo.close();
});
let id: string,
    calls = 0,
    lease = 'lease',
    active = true;
let clock = Date.now();
const now = spyOn(Date, 'now').mockImplementation(() => clock);
afterAll(() => now.mockRestore());
beforeEach(async () => {
    await store.deleteMany({});
    calls = 0;
    active = true;
    lease = 'lease';
    id = randomUUID();
    await store.insertOne({
        _id: id,
        lease,
        cancel: false,
        leaseUntil: new Date(clock + 600000),
    } as BackfillJob);
});
const recovery = (record = 1, fingerprint = 'source-hash') =>
    managedEmbeddingRecovery({
        store,
        id,
        lease,
        record,
        fingerprint,
        deadline: clock + 360000,
        active: async () => {
            if (!active) throw new Error('source/lease changed');
        },
    });
const reserve = (r = recovery(), ordinal = 1, signal?: AbortSignal) =>
    withProviderBudget(
        async () => {
            calls += 1;
        },
        () => r.reserve(ordinal, 60000, signal)
    );

test('durable reservations bound attempts across interrupted dispatches and new workers', async () => {
    for (let n = 1; n <= EMBEDDING_MAX_ATTEMPTS; n++) {
        await reserve(recovery());
        const saved = await store.findOne({ _id: id });
        expect(saved?.embeddingRecovery?.slots[0]?.attempts).toBe(n);
        // Simulate a crashed process: no failed() checkpoint, a new recovery object.
        clock += 65000;
    }
    await expect(reserve(recovery())).rejects.toThrow('attempts exhausted');
    expect(calls).toBe(3);
});
test('transient failures persist 1s/4s backoff and exhaustion; ordinals are independent', async () => {
    const r = recovery();
    await reserve(r);
    expect(await r.failed(1)).toBe(true);
    expect((await store.findOne({ _id: id }))?.embeddingRecovery?.slots[0]?.notBefore).toBe(
        clock + 1000
    );
    clock += 1000;
    await reserve(r);
    expect(await r.failed(1)).toBe(true);
    expect((await store.findOne({ _id: id }))?.embeddingRecovery?.slots[0]?.notBefore).toBe(
        clock + 4000
    );
    clock += 4000;
    await reserve(r);
    expect(await r.failed(1)).toBe(false);
    await reserve(r, 2);
    expect(calls).toBe(4);
});
test('cancelled, stale, changed-source and invalid ledgers fail closed without dispatch authorization', async () => {
    await expect(reserve(recovery(), 1, AbortSignal.abort())).rejects.toThrow();
    expect(calls).toBe(0);
    await reserve();
    await expect(reserve(recovery(1, 'different-source'))).rejects.toThrow('source changed');
    await store.updateOne({ _id: id }, { $set: { cancel: true } });
    await expect(reserve()).rejects.toThrow('lease lost');
    expect(calls).toBe(1);
});
test('budget refusal cannot advance durable attempts or authorize a retry', async () => {
    await expect(
        withProviderBudget(
            async () => {
                throw new Error('budget exhausted');
            },
            () => recovery().reserve(1, 60000)
        )
    ).rejects.toThrow('budget exhausted');
    expect((await store.findOne({ _id: id }))?.embeddingRecovery?.slots[0]?.attempts).toBe(0);
});
test('new records receive independent limits, old records cannot rewind ledger', async () => {
    await reserve(recovery());
    await reserve(recovery(2));
    await expect(reserve(recovery(1))).rejects.toThrow('source changed');
    expect((await store.findOne({ _id: id }))?.embeddingRecovery?.record).toBe(2);
});
test('lease loss after budget reservation conservatively counts budget but cannot claim or dispatch', async () => {
    await expect(
        withProviderBudget(
            async () => {
                calls += 1;
                await store.updateOne({ _id: id }, { $set: { lease: 'other-worker' } });
            },
            () => recovery().reserve(1, 60000)
        )
    ).rejects.toThrow('checkpoint changed');
    expect(calls).toBe(1);
    expect((await store.findOne({ _id: id }))?.embeddingRecovery?.slots[0]?.attempts).toBe(0);
});

test('concurrent ordinals initialize one durable ledger and each reserve exactly once', async () => {
    const r = recovery();
    await withProviderBudget(
        async () => {
            calls += 1;
        },
        () => Promise.all([1, 2, 3, 4, 5].map(ordinal => r.reserve(ordinal, 60000)))
    );
    expect(calls).toBe(5);
    expect(
        (await store.findOne({ _id: id }))?.embeddingRecovery?.slots.map(s => s.attempts)
    ).toEqual([1, 1, 1, 1, 1]);
});
test('backoff cannot enter finalization reserve or consume another budget reservation', async () => {
    const r = recovery();
    await reserve(r);
    const deadline = r.deadline;
    await store.updateOne(
        { _id: id },
        { $set: { 'embeddingRecovery.slots.0.notBefore': deadline - 15000 } }
    );
    const { embeddingStopDetails } = await import('../ai/embedding-recovery');
    const error = await reserve(r).catch(e => e);
    expect(embeddingStopDetails(error)).toBe('retry_deadline');
    expect(calls).toBe(1);
    expect((await store.findOne({ _id: id }))?.embeddingRecovery?.slots[0]?.attempts).toBe(1);
});

test('initial privacy preparation can use short remaining time, but an extra retry must fit both request caps', async () => {
    const r = managedEmbeddingRecovery({
        store,
        id,
        lease,
        record: 1,
        fingerprint: 'source-hash',
        deadline: clock + 20000,
        active: async () => {},
    });
    if (!r.privacy) throw new Error('Expected managed privacy recovery');
    await r.privacy.prepare();
    expect(await r.privacy.retry()).toBe(false);
    expect((await store.findOne({ _id: id }))?.embeddingRecovery?.privacyRetry).toBeUndefined();
});

test('supplemental recovery preserves real Mongo base ledger and disables all automatic retries', async () => {
    const baselineAttempts = [1, 3, 1, 1, 3];
    const baseline = {
        record: 1,
        fingerprint: 'source-hash',
        slots: baselineAttempts.map(attempts => ({ attempts, notBefore: clock + 4000 })),
        privacyRetry: { used: 2, notBefore: clock + 4000 },
    };
    await store.updateOne({ _id: id }, { $set: { embeddingRecovery: baseline } });
    const ordinals: number[] = [];
    const r = managedEmbeddingRecovery({
        store,
        id,
        lease,
        record: 1,
        fingerprint: 'source-hash',
        deadline: clock + 360000,
        active: async () => {},
        supplemental: {
            baselineAttempts,
            reserveEmbedding: async ordinal => {
                ordinals.push(ordinal);
            },
        },
    });
    await r.assertAvailable();
    for (let ordinal = 1; ordinal <= 5; ordinal++) await r.reserve(ordinal, 60000);
    expect(ordinals).toEqual([1, 2, 3, 4, 5]);
    expect(r.privacy).toBeUndefined();
    expect(await r.failed(2)).toBe(false);
    expect((await store.findOne({ _id: id }))?.embeddingRecovery).toEqual(baseline);
    await expect(r.reserve(6, 60000)).rejects.toThrow('ordinal');
});
test.each(['missing', 'older', 'changed'])(
    'supplemental recovery never initializes or replaces a %s base ledger',
    async mode => {
        const ledger = {
            record: mode === 'older' ? 1 : 2,
            fingerprint: 'source-hash',
            slots: [1, 3, 1, 1, 3].map(attempts => ({ attempts, notBefore: 0 })),
        };
        if (mode === 'changed') ledger.slots[0]!.attempts = 2;
        if (mode !== 'missing')
            await store.updateOne({ _id: id }, { $set: { embeddingRecovery: ledger } });
        const before = await store.findOne({ _id: id });
        const r = managedEmbeddingRecovery({
            store,
            id,
            lease,
            record: 2,
            fingerprint: 'source-hash',
            deadline: clock + 360000,
            active: async () => {},
            supplemental: {
                baselineAttempts: [1, 3, 1, 1, 3],
                reserveEmbedding: async () => {
                    calls += 1;
                },
            },
        });
        await expect(r.assertAvailable()).rejects.toThrow('baseline ledger changed');
        await expect(r.reserve(2, 60000)).rejects.toThrow('baseline ledger changed');
        expect(calls).toBe(0);
        expect(await store.findOne({ _id: id })).toEqual(before);
    }
);
