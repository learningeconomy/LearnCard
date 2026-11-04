import { afterAll, beforeEach, expect, mock, test } from 'bun:test';
import { MongoClient, ObjectId } from 'mongodb';
import { randomUUID } from 'node:crypto';
const client = new MongoClient(process.env.MONGO_URI!);
await client.connect();
const database = client.db(process.env.MONGO_DB!);
const applyJobs = database.collection<any>('embedding_backfill_jobs'),
    repairJobs = database.collection<any>('embedding_legacy_repair_jobs'),
    runs = database.collection<any>('embedding_admin_batches');
let entered = false;
let calls = 0,
    unavailable = false,
    hold: Promise<void> | undefined,
    crash = false;
mock.module('./backfill', () => ({
    costPlan: () => ({ embeddingUsdUpperEstimate: null }),
    listJobs: () => applyJobs.find({}).toArray(),
    stepJob: async (id: string, _limit: number, active: () => Promise<void>, batchId: string) => {
        const before = await applyJobs.findOne({ _id: id, batchId });
        if (!before) throw new Error('ownership');
        entered = true;
        if (hold) await hold;
        await active();
        calls += 1;
        await applyJobs.updateOne(
            { _id: id },
            {
                $inc: {
                    scanned: 1,
                    written: 1,
                    representationCalls: 1,
                    embeddingRequests: 5,
                },
                ...(unavailable ? { $set: { lastError: 'safe', errors: 1 } } : {}),
            }
        );
        if (crash) throw new Error('interruption after job commit');
        return applyJobs.findOne({ _id: id });
    },
}));
mock.module('./legacy-repair', () => ({
    listRepairJobs: () => repairJobs.find({}).toArray(),
    repairJobAction: async (
        id: string,
        apply: boolean,
        active: () => Promise<void>,
        batchId: string
    ) => {
        const before = await repairJobs.findOne({ _id: id, batchId });
        if (!before) throw new Error('ownership');
        await active();
        calls += 1;
        if (unavailable)
            await repairJobs.updateOne(
                { _id: id },
                { $set: { outcomes: { original_unavailable: 1 } } }
            );
        else if (apply)
            await repairJobs.updateOne(
                { _id: id },
                {
                    $inc: { scanned: 1, repaired: 1 },
                    $set: { awaitingVerification: false },
                }
            );
        else await repairJobs.updateOne({ _id: id }, { $set: { awaitingVerification: true } });
        return repairJobs.findOne({ _id: id });
    },
}));
const {
    startBatch,
    advanceBatch,
    stopBatch,
    listBatches,
    recoverBatch,
    assertNoBatch,
    batchPreflight,
} = await import('./batches');
const jobId = randomUUID();
beforeEach(async () => {
    await Promise.all([
        applyJobs.deleteMany({}),
        repairJobs.deleteMany({}),
        runs.deleteMany({}),
        database.collection('credentials').deleteMany({}),
    ]);
    process.env.BEDROCK_EMBEDDINGS_ENABLED = 'true';
    process.env.EMBEDDINGS_DUAL_WRITE = 'true';
    entered = false;
    calls = 0;
    unavailable = false;
    hold = undefined;
    crash = false;
    await applyJobs.insertOne({
        _id: jobId,
        state: 'paused',
        scanned: 0,
        written: 0,
        errors: 0,
        dryRun: false,
        regenerationAuthorized: true,
        representationCalls: 0,
        embeddingRequests: 0,
    });
    await repairJobs.insertOne({
        _id: jobId,
        state: 'paused',
        scanned: 0,
        repaired: 0,
        awaitingVerification: false,
        outcomes: {},
    });
});
afterAll(async () => {
    await Promise.all([
        applyJobs.deleteOne({ _id: jobId }),
        repairJobs.deleteOne({ _id: jobId }),
        runs.deleteMany({ jobId }),
    ]);
    await client.close();
});
test('explicit paid authorization and remaining job budget required, start makes no provider calls', async () => {
    await expect(startBatch(randomUUID(), jobId, 'apply', 5, false)).rejects.toThrow();
    for (const limit of [0, 101, 1.5])
        await expect(
            startBatch(randomUUID(), jobId, 'verification', limit, false)
        ).rejects.toThrow();
    await applyJobs.updateOne({ _id: jobId }, { $set: { scanned: 99 } });
    await expect(startBatch(randomUUID(), jobId, 'apply', 2, true)).rejects.toThrow();
    expect(calls).toBe(0);
});
test('repeated/concurrent starts are idempotent, conflicting stale tab cannot own same job', async () => {
    const id = randomUUID();
    const results = await Promise.all([
        startBatch(id, jobId, 'apply', 2, true),
        startBatch(id, jobId, 'apply', 2, true),
    ]);
    expect(results[0]._id).toBe(results[1]._id);
    expect(await runs.countDocuments({})).toBe(1);
    await expect(startBatch(randomUUID(), jobId, 'apply', 2, true)).rejects.toThrow();
    await expect(startBatch(id, jobId, 'apply', 3, true)).rejects.toThrow();
    await expect(assertNoBatch(jobId, 'apply')).rejects.toThrow();
});
test('exact sequences prevent duplicate steps and stop at selected record bound', async () => {
    const b = await startBatch(randomUUID(), jobId, 'apply', 2, true);
    expect((await advanceBatch(b._id, 0)).processed).toBe(1);
    expect((await advanceBatch(b._id, 0)).processed).toBe(1);
    expect((await advanceBatch(b._id, 1)).state).toBe('completed');
    await advanceBatch(b._id, 2);
    expect(calls).toBe(2);
    expect((await applyJobs.findOne({ _id: jobId }))?.batchId).toBeUndefined();
});
test('verification batches preview then verify one source per sequence without paid authorization', async () => {
    const b = await startBatch(randomUUID(), jobId, 'verification', 1, false);
    expect((await advanceBatch(b._id, 0)).state).toBe('completed');
    expect(calls).toBe(2);
    expect((await repairJobs.findOne({ _id: jobId }))?.repaired).toBe(1);
});
test('unavailable repair and apply evidence pause instead of advancing again', async () => {
    unavailable = true;
    const b = await startBatch(randomUUID(), jobId, 'verification', 5, false);
    expect((await advanceBatch(b._id, 0)).state).toBe('paused');
    await advanceBatch(b._id, 1);
    expect(calls).toBe(1);
    const a = await startBatch(randomUUID(), jobId, 'apply', 5, true);
    expect((await advanceBatch(a._id, 0)).state).toBe('paused');
});
test('pause/cancel while in flight prevents calls; ownership remains until worker drains', async () => {
    for (const cancel of [false, true]) {
        entered = false;
        let resolve!: () => void;
        hold = new Promise<void>(r => {
            resolve = r;
        });
        const b = await startBatch(randomUUID(), jobId, 'apply', 2, true);
        const advancing = advanceBatch(b._id, 0);
        for (let i = 0; i < 100 && !entered; i += 1) await new Promise(r => setTimeout(r, 1));
        expect((await stopBatch(b._id, cancel)).state).toBe(cancel ? 'cancelled' : 'paused');
        await expect(startBatch(randomUUID(), jobId, 'apply', 1, true)).rejects.toThrow();
        await expect(assertNoBatch(jobId, 'apply')).rejects.toThrow();
        resolve();
        expect((await advancing).state).toBe(cancel ? 'cancelled' : 'paused');
        expect(calls).toBe(0);
        hold = undefined;
    }
});
test('page interruption waits for unexpired lease, reconciles committed source counters, never dispatches', async () => {
    const b = await startBatch(randomUUID(), jobId, 'apply', 2, true);
    await runs.updateOne(
        { _id: b._id },
        {
            $set: {
                waitingUntil: new Date(0),
                lease: 'fixture',
                leaseUntil: new Date(Date.now() + 10000),
            },
        }
    );
    await listBatches();
    expect((await runs.findOne({ _id: b._id }))?.state).toBe('running');
    await applyJobs.updateOne({ _id: jobId }, { $set: { scanned: 1, written: 1 } });
    await runs.updateOne({ _id: b._id }, { $set: { leaseUntil: new Date(0) } });
    const recovered = (await listBatches()).find(r => r._id === b._id)!;
    expect(recovered.state).toBe('interrupted');
    expect(recovered.processed).toBe(1);
    expect((await runs.findOne({ _id: b._id }))?.state).toBe('running');
    await recoverBatch(b._id);
    expect(calls).toBe(0);
    await advanceBatch(b._id, 0);
    expect(calls).toBe(0);
});
test('server epoch change stops automatic continuation, requires explicit new start', async () => {
    const b = await startBatch(randomUUID(), jobId, 'apply', 2, true);
    await runs.updateOne({ _id: b._id }, { $set: { process: 'previous-boot' } });
    expect((await advanceBatch(b._id, 0)).state).toBe('interrupted');
    expect(calls).toBe(0);
});
test('underlying job error stops batch and does not replenish reservations or resubmit', async () => {
    crash = true;
    const b = await startBatch(randomUUID(), jobId, 'apply', 2, true);
    expect((await advanceBatch(b._id, 0)).processed).toBe(1);
    await advanceBatch(b._id, 1);
    expect(calls).toBe(1);
    expect((await applyJobs.findOne({ _id: jobId }))?.embeddingRequests).toBe(5);
});
test('preflight is bounded aggregate metadata, no receipt/proof/owner/URI disclosure or calls', async () => {
    await database.collection('credentials').insertMany([
        {
            _id: new ObjectId(),
            did: 'did:fixture:secret-owner',
            uri: 'secret-uri',
            rawCredential: 'secret-original',
        },
        { _id: new ObjectId(), source: 'generated' },
        { _id: new ObjectId() },
    ]);
    const summary = await batchPreflight(2);
    expect(summary.observed).toBe(2);
    expect(summary.truncated).toBe(true);
    expect(JSON.stringify(summary)).not.toContain('secret-');
    expect(calls).toBe(0);
});

test('expired crashed apply source returns paused without dispatch and can start explicitly', async () => {
    const b = await startBatch(randomUUID(), jobId, 'apply', 2, true);
    await runs.updateOne(
        { _id: b._id },
        {
            $set: {
                waitingUntil: new Date(0),
                leaseUntil: new Date(0),
                lease: 'stale',
            },
        }
    );
    await applyJobs.updateOne(
        { _id: jobId },
        {
            $set: {
                state: 'running',
                leaseUntil: new Date(0),
                lease: 'stale',
                scanned: 1,
            },
        }
    );
    await listBatches();
    expect((await applyJobs.findOne({ _id: jobId }))?.state).toBe('running');
    await recoverBatch(b._id);
    expect((await applyJobs.findOne({ _id: jobId }))?.state).toBe('paused');
    expect((await startBatch(randomUUID(), jobId, 'apply', 1, true)).processed).toBe(0);
    expect(calls).toBe(0);
});
