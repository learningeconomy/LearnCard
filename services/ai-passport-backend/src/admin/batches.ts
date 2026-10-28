import { MongoClient } from 'mongodb';
import { randomUUID } from 'node:crypto';
import { MONGO_URI, MONGO_DB } from '../constants/env';
import { stepJob, listJobs, costPlan } from './backfill';
import { repairJobAction, listRepairJobs } from './legacy-repair';
import { AI_INSIGHT_CREDENTIAL_TYPE } from '../constants/vc';
export type BatchKind = 'verification' | 'apply';
type Batch = {
    _id: string;
    jobKey: string;
    jobId: string;
    kind: BatchKind;
    limit: number;
    state: 'running' | 'paused' | 'cancelled' | 'completed' | 'interrupted';
    processed: number;
    sequence: number;
    baseline: number;
    process: string;
    reason?: string;
    ownershipReleased?: boolean;
    lease?: string;
    leaseUntil?: Date;
    waitingUntil: Date;
    createdAt: Date;
};
const processEpoch = randomUUID();
let mongo: MongoClient | undefined;
async function database() {
    mongo ??= new MongoClient(MONGO_URI, {
        serverSelectionTimeoutMS: 2000,
        socketTimeoutMS: 5000,
        writeConcern: { w: 'majority', journal: true },
    });
    await mongo.connect();
    return mongo.db(MONGO_DB);
}
async function runs(ensureIndex = true) {
    const store = (await database()).collection<Batch>('embedding_admin_batches');
    if (ensureIndex)
        await store.createIndex(
            { jobKey: 1 },
            { unique: true, partialFilterExpression: { state: 'running' } }
        );
    return store;
}
const publicBatch = (b: Batch) => ({
    _id: b._id,
    jobId: b.jobId,
    kind: b.kind,
    limit: b.limit,
    state: b.state,
    processed: b.processed,
    sequence: b.sequence,
    reason: b.reason,
    recoverable:
        !b.ownershipReleased &&
        b.state !== 'running' &&
        (!b.leaseUntil || b.leaseUntil <= new Date()),
});
async function sourceJobs(kind: BatchKind) {
    return (await database()).collection<any>(
        kind === 'apply' ? 'embedding_backfill_jobs' : 'embedding_legacy_repair_jobs'
    );
}
async function release(batch: Batch) {
    if (batch.state === 'running' || (batch.leaseUntil && batch.leaseUntil > new Date())) return;
    const source = await sourceJobs(batch.kind);
    const job = await source.findOne({ _id: batch.jobId, batchId: batch._id });
    if (!job) {
        await (await runs()).updateOne({ _id: batch._id }, { $set: { ownershipReleased: true } });
        return;
    }
    if (batch.state === 'interrupted')
        await (
            await runs()
        ).updateOne(
            { _id: batch._id, state: 'interrupted' },
            {
                $set: {
                    processed: Math.min(batch.limit, Math.max(0, job.scanned - batch.baseline)),
                },
            }
        );
    const free = {
        _id: batch.jobId,
        batchId: batch._id,
        $or: [{ leaseUntil: { $exists: false } }, { leaseUntil: { $lte: new Date() } }],
    };
    await source.updateOne(
        { ...free, state: 'running', cancel: { $ne: true } },
        { $set: { state: 'paused' }, $unset: { lease: '', leaseUntil: '' } }
    );
    const released = await source.updateOne(
        {
            _id: batch.jobId,
            batchId: batch._id,
            $or: [{ leaseUntil: { $exists: false } }, { leaseUntil: { $lte: new Date() } }],
        },
        { $unset: { batchId: '' } }
    );
    if (released.matchedCount === 1)
        await (await runs()).updateOne({ _id: batch._id }, { $set: { ownershipReleased: true } });
}
export async function listBatches() {
    const store = await runs(false);
    const rows = await store.find({}).sort({ createdAt: -1 }).limit(40).toArray();
    return Promise.all(
        rows.map(async b => {
            const expired =
                b.waitingUntil <= new Date() && (!b.leaseUntil || b.leaseUntil <= new Date());
            const interrupted = b.state === 'running' && (expired || b.process !== processEpoch);
            const view = {
                ...b,
                ...(interrupted
                    ? {
                          state: 'interrupted' as const,
                          reason: 'Explicit recovery and new start required',
                      }
                    : {}),
            };
            if (!b.ownershipReleased) {
                const job = await (
                    await sourceJobs(b.kind)
                ).findOne(
                    { _id: b.jobId, batchId: b._id },
                    { projection: { scanned: 1, leaseUntil: 1 } }
                );
                if (view.state === 'interrupted' && job)
                    view.processed = Math.min(b.limit, Math.max(0, job.scanned - b.baseline));
                if (job?.leaseUntil && (!view.leaseUntil || job.leaseUntil > view.leaseUntil))
                    view.leaseUntil = job.leaseUntil;
            }
            return publicBatch(view);
        })
    );
}
export async function recoverBatch(id: string) {
    const store = await runs();
    const b = await store.findOne({ _id: id });
    if (!b || (b.leaseUntil && b.leaseUntil > new Date())) throw new Error('Unit still draining');
    if (b.state === 'running') {
        if (b.waitingUntil > new Date() && b.process === processEpoch)
            throw new Error('Active batch must be paused first');
        const recovered = await store.updateOne(
            {
                _id: id,
                state: 'running',
                $or: [{ leaseUntil: { $exists: false } }, { leaseUntil: { $lte: new Date() } }],
            },
            {
                $set: {
                    state: 'interrupted',
                    reason: 'Explicit new start required after recovery',
                },
            }
        );
        if (recovered.matchedCount !== 1) throw new Error('Unit still draining');
    }
    const stopped = (await store.findOne({ _id: id }))!;
    await release(stopped);
    return publicBatch((await store.findOne({ _id: id }))!);
}
export async function assertNoBatch(jobId: string, kind: BatchKind) {
    if (
        await (
            await runs()
        ).findOne({
            jobKey: `${kind}:${jobId}`,
            $or: [{ state: 'running' }, { leaseUntil: { $gt: new Date() } }],
        })
    )
        throw new Error('Pause the active batch before manual actions');
}
export async function startBatch(
    id: string,
    jobId: string,
    kind: BatchKind,
    limit: number,
    paid: boolean
) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100 || (kind === 'apply' && !paid))
        throw new Error('Explicit limit and paid authorization required');
    const store = await runs();
    const existing = await store.findOne({ _id: id });
    if (existing) {
        if (existing.jobId !== jobId || existing.kind !== kind || existing.limit !== limit)
            throw new Error('Idempotency conflict');
        return publicBatch(existing);
    }
    const source = await sourceJobs(kind);
    const job = await source.findOne({ _id: jobId });
    if (!job || job.managedRunId || !['ready', 'paused'].includes(job.state))
        throw new Error('Paused job required');
    if (
        kind === 'apply' &&
        (job.dryRun ||
            !job.regenerationAuthorized ||
            process.env.BEDROCK_EMBEDDINGS_ENABLED !== 'true' ||
            process.env.EMBEDDINGS_DUAL_WRITE !== 'true')
    )
        throw new Error('Paid apply unavailable');
    const batch: Batch = {
        _id: id,
        jobId,
        jobKey: `${kind}:${jobId}`,
        kind,
        limit,
        baseline: job.scanned,
        process: processEpoch,
        state: 'running',
        processed: 0,
        sequence: 0,
        createdAt: new Date(),
        waitingUntil: new Date(Date.now() + 45000),
    };
    if (limit > 100 - job.scanned) throw new Error('Limit exceeds remaining job budget');
    const session = mongo!.startSession();
    try {
        await session.withTransaction(async () => {
            const claimed = await source.updateOne(
                {
                    _id: jobId,
                    scanned: batch.baseline,
                    state: { $in: ['ready', 'paused'] },
                    batchId: { $exists: false },
                    $or: [{ leaseUntil: { $exists: false } }, { leaseUntil: { $lte: new Date() } }],
                },
                { $set: { batchId: id } },
                { session }
            );
            if (claimed.matchedCount !== 1) throw new Error('Job already owned or draining');
            await store.insertOne(batch, { session });
        });
    } catch {
        const repeated = await store.findOne({ _id: id });
        if (
            repeated &&
            repeated.jobId === jobId &&
            repeated.kind === kind &&
            repeated.limit === limit
        )
            return publicBatch(repeated);
        throw new Error('Another action owns this job');
    } finally {
        await session.endSession();
    }
    return publicBatch(batch);
}
export async function stopBatch(id: string, cancel: boolean) {
    const store = await runs();
    await store.updateOne(
        { _id: id, state: 'running' },
        {
            $set: {
                state: cancel ? 'cancelled' : 'paused',
                reason: cancel ? 'Batch cancelled; job budget retained' : 'Paused by operator',
            },
        }
    );
    const batch = await store.findOne({ _id: id });
    if (!batch) throw new Error('Batch unavailable');
    await release(batch);
    return publicBatch(batch);
}
export async function advanceBatch(id: string, sequence: number) {
    const store = await runs();
    const lease = randomUUID();
    const before = await store.findOne({ _id: id });
    if (!before) throw new Error('Batch unavailable');
    if (before.state === 'running' && before.process !== processEpoch) {
        await store.updateOne(
            { _id: id, state: 'running' },
            {
                $set: {
                    state: 'interrupted',
                    reason: 'Server changed; explicit new start required',
                },
            }
        );
        const stopped = (await store.findOne({ _id: id }))!;
        await release(stopped);
        return publicBatch(stopped);
    }
    // A delayed/repeated response cannot initiate another unit.
    if (sequence < before.sequence || before.state !== 'running') return publicBatch(before);
    const batch = await store.findOneAndUpdate(
        {
            _id: id,
            state: 'running',
            sequence,
            waitingUntil: { $gt: new Date() },
            lease: { $exists: false },
        },
        { $set: { lease, leaseUntil: new Date(Date.now() + 660000) } },
        { returnDocument: 'after' }
    );
    if (!batch) throw new Error('Refresh after interrupted or concurrent action');
    const active = async () => {
        if (
            !(await store.findOne({
                _id: id,
                state: 'running',
                lease,
                leaseUntil: { $gt: new Date() },
            }))
        )
            throw new Error('Batch paused or lease lost');
    };
    let processed = 0,
        reason: string | undefined,
        complete = false;
    try {
        await active();
        if (batch.kind === 'verification') {
            const initial = (await listRepairJobs()).find(j => j._id === batch.jobId);
            if (!initial) throw new Error('Job unavailable');
            let result = initial;
            if (!result.awaitingVerification)
                result = await repairJobAction(batch.jobId, false, active, batch._id);
            await active();
            if (result.awaitingVerification)
                result = await repairJobAction(batch.jobId, true, active, batch._id);
            processed = result.scanned - initial.scanned;
            complete = result.state === 'completed';
            const stopped = [
                'source_changed',
                'unavailable',
                'original_unavailable',
                'verification_unavailable',
                'consent_unavailable',
            ].some(
                k =>
                    (result.outcomes[k as keyof typeof result.outcomes] ?? 0) >
                    (initial.outcomes[k as keyof typeof initial.outcomes] ?? 0)
            );
            if (stopped || (!processed && !complete))
                reason = 'Unavailable or changed evidence; review before new start';
        } else {
            const initial = (await listJobs()).find(j => j._id === batch.jobId);
            if (!initial) throw new Error('Job unavailable');
            const result = await stepJob(batch.jobId, 1, active, batch._id);
            if (!result) throw new Error('Job unavailable');
            processed = result.scanned - initial.scanned;
            complete = ['completed', 'cancelled'].includes(result.state);
            if (
                result.lastError ||
                result.errors > initial.errors ||
                ['consent_unavailable', 'consent_revision_changed', 'missing_source'].some(
                    k =>
                        (result.skipReasons?.[k as keyof typeof result.skipReasons] ?? 0) >
                        (initial.skipReasons?.[k as keyof typeof initial.skipReasons] ?? 0)
                )
            )
                reason = 'Error or changed/unavailable evidence; review before new start';
        }
    } catch {
        reason = 'Interrupted unit; review job progress before new start';
    }
    const durable = await (
        await sourceJobs(batch.kind)
    ).findOne({ _id: batch.jobId, batchId: batch._id }, { projection: { scanned: 1 } });
    const count = durable
        ? Math.min(batch.limit, Math.max(0, durable.scanned - batch.baseline))
        : batch.processed + Math.max(0, processed);
    await store.updateOne(
        { _id: id, lease, state: 'running', leaseUntil: { $gt: new Date() } },
        {
            $set: {
                processed: count,
                sequence: sequence + 1,
                state: reason
                    ? 'paused'
                    : complete || count >= batch.limit
                      ? 'completed'
                      : 'running',
                ...(reason ? { reason } : {}),
                waitingUntil: new Date(Date.now() + 45000),
            },
            $unset: { lease: '', leaseUntil: '' },
        }
    );
    // Pausing does not wait for or overwrite the operator state; finish removes only our lease.
    await store.updateOne(
        { _id: id, lease, state: { $ne: 'running' } },
        {
            $set: { processed: count, sequence: sequence + 1 },
            $unset: { lease: '', leaseUntil: '' },
        }
    );
    const saved = await store.findOne({ _id: id });
    if (!saved) throw new Error('Batch unavailable');
    await release(saved);
    return publicBatch(saved);
}
export async function batchPreflight(limit = 10000) {
    const rows = await (
        await database()
    )
        .collection('credentials')
        .find(
            {},
            {
                projection: {
                    _id: 0,
                    'verification.status': 1,
                    source: 1,
                    category: 1,
                    did: 1,
                    uri: 1,
                },
            }
        )
        .sort({ _id: 1 })
        .limit(limit + 1)
        .toArray();
    const observed = rows.slice(0, limit);
    const generated = (r: Record<string, unknown>) =>
        r.source === 'generated' || r.category === AI_INSIGHT_CREDENTIAL_TYPE;
    return {
        observed: observed.length,
        truncated: rows.length > limit,
        metadataOnly: true,
        missingVerification: observed.filter(r => !r.verification && !generated(r)).length,
        generated: observed.filter(generated).length,
        missingOwnerOrUri: observed.filter(
            r =>
                typeof r.did !== 'string' ||
                !r.did.startsWith('did:') ||
                typeof r.uri !== 'string' ||
                !r.uri
        ).length,
        eligibility: 'Remote consent, original availability and proof validity not checked',
        paidCeiling: costPlan(600, 100),
    };
}
