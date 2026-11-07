import {
    RECOVERY_PASS_CAPS,
    RECOVERY_PASS_CONSUMED_MESSAGE,
    supplementalRecoverySchema,
    recoveryPassRequestSchema,
    withSingleRecoveryPass,
    type RecoveryPassRequest,
} from './supplemental-recovery';
import { embeddingRecoveryLedgerSchema } from './embedding-recovery';
import { embeddingResumeBlock, EmbeddingResumeBlockedError } from './embedding-recovery';
import { AI_INSIGHT_CREDENTIAL_TYPE } from '../constants/vc';
import { inspectLegacySource, inspectWorkflowGeneratedSource } from './legacy-repair';
import { repairSourceFingerprint } from './legacy-repair-source';
import { MongoClient, ObjectId } from 'mongodb';
import { randomUUID } from 'node:crypto';
import { MONGO_DB, MONGO_URI } from '../constants/env';
import { withProviderBudget, type UsageKind } from '../ai/usage-meter';
import {
    assertNovaEnabled,
    NOVA_IDENTITY,
    withEmbeddingGeneration,
} from '../ai/embedding-generation';
import { withOwnerOperation } from '../services/dataErasure';
import { db } from '../db';
import { assertCurrentAiConsent, runWithAiPrivacyContext } from '../ai/privacy';
import { getCredentialVectorCoverage } from '../db/qdrant';
import { stepJob, type BackfillJob } from './backfill';
import {
    retainDispatchedFailure,
    backfillPauseReason,
    sanitizeBackfillFailure,
    GENERIC_BACKFILL_PAUSE_REASON,
} from './backfill-diagnostics';
import { costPricing, estimateCosts, type CostPricing } from './cost-model';
import { usageCostSummary } from './usage-cost';
import {
    isGenerationRetryPolicy,
    type GenerationRetryPolicy,
    GENERATION_RETRY_POLICY,
    GENERATION_RETRY_DELAYS_MS,
    generationRetryNow,
    sleepForGenerationRetry,
    isRetryableGenerationFailure,
} from './generation-retry';
import {
    digest,
    metadataExclusionReason,
    type ExclusionReason,
    runSourceFingerprint,
    RUN_SOURCE_PROJECTION,
    type RunSource,
    type SnapshotEntry,
    workflowSourceFingerprint,
    WORKFLOW_SOURCE_PROJECTION,
    type WorkflowItem,
    type WorkflowOperation,
} from './run-model';

const INVENTORY_LIMIT = 10000;
const LEASE_MS = 660000;
const processEpoch = randomUUID();
const loops = new Map<string, Promise<void>>();
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
type RunPlan = {
    workflowVersion?: 2;
    requestedRecordLimit?: number;
    selectionLimited?: boolean;
    inventoryTruncated?: boolean;
    _id: string;
    state: 'review';
    generation: string;
    principalRef: string;
    snapshot: SnapshotEntry[];
    configuration: string;
    recordLimit: number;
    maxGenerationRequests: number;
    maxEmbeddingRequests: number;
    maxPrivacyRequests: number;
    pricing: CostPricing;
    observedRecords: number;
    excludedComplete: number;
    excludedIneligible: number;
    exclusionReasons?: Partial<Record<ExclusionReason, number>>;
    initializedSourceEpochs: number;
    createdAt: Date;
};
type RunState =
    'running' | 'paused' | 'cancelled' | 'completed' | 'completed_with_blockers' | 'interrupted';
type Run = {
    workflowVersion?: 2;
    stage?: 'verification' | 'embedding' | 'reconciliation' | 'finished' | 'retry_wait';
    recoveryPass?: { id: string; index: number };
    generationRetryPolicy?: GenerationRetryPolicy;
    startGenerationRetryPolicy?: GenerationRetryPolicy;
    retry?: { attempt: number; maxAttempts: number; nextAttemptAt: Date; record: number };
    alreadyComplete?: number;
    blocked?: number;
    blockedReasons?: Record<string, number>;
    repaired?: number;
    reconciled?: number;
    _id: string;
    planId: string;
    planDigest: string;
    principalRef: string;
    activeKey: 'credential-backfill';
    occupied: boolean;
    state: RunState;
    process: string;
    lease?: string;
    leaseUntil?: Date;
    recordLimit: number;
    maxGenerationRequests: number;
    maxEmbeddingRequests: number;
    maxPrivacyRequests: number;
    generationRequests: number;
    embeddingRequests: number;
    privacyRequests: number;
    processed: number;
    written: number;
    skipped: number;
    errors: number;
    reason?: string;
    createdAt: Date;
    updatedAt: Date;
};
type PrincipalGuard = () => Promise<void>;
const enabled = () => {
    if (process.env.EMBEDDINGS_ADMIN_ENABLED !== 'true')
        throw new Error('Embedding administration disabled');
};
const enabledForPaid = () => {
    enabled();
    assertNovaEnabled();
    if (process.env.EMBEDDINGS_DUAL_WRITE !== 'true')
        throw new Error('Enable dual ingestion writes before applying backfill');
};
const configuration = () =>
    digest([
        NOVA_IDENTITY,
        costPricing(process.env),
        ...[
            'TITLE_MODEL',
            'OPENAI_REASONING_EFFORT',
            'AWS_REGION',
            'BEDROCK_BASE_URL',
            'AWS_ENDPOINT_URL',
            'AWS_ENDPOINT_URL_BEDROCK',
            'AWS_ENDPOINT_URL_BEDROCK_RUNTIME',
            'BEDROCK_GUARDRAIL_ID',
            'BEDROCK_GUARDRAIL_VERSION',
        ].map(key => [key, process.env[key]]),
    ]);
async function stores(indexes = false) {
    const db = await database();
    const runs = db.collection<Run>('embedding_backfill_runs');
    if (indexes) {
        // Stopped but draining runs retain this slot. Paused runs retain it until
        // explicitly cancelled, preventing several partially authorized jobs.
        await runs.createIndex(
            { activeKey: 1 },
            { unique: true, partialFilterExpression: { occupied: true } }
        );
        await runs.createIndex({ planId: 1 }, { unique: true });
    }
    if (indexes)
        await db.collection('embedding_backfill_items').createIndex(
            { 'supplementalRecovery.id': 1 },
            {
                unique: true,
                partialFilterExpression: { 'supplementalRecovery.id': { $type: 'string' } },
            }
        );
    return {
        runs,
        plans: db.collection<RunPlan>('embedding_backfill_plans'),
        jobs: db.collection<BackfillJob>('embedding_backfill_jobs'),
        sources: db.collection<RunSource>('credentials'),
        items: db.collection<WorkflowItem>('embedding_backfill_items'),
    };
}
const publicPlan = (plan: RunPlan) => ({
    _id: plan._id,
    workflowVersion: plan.workflowVersion,
    selectionLimited: plan.selectionLimited ?? false,
    inventoryTruncated: plan.inventoryTruncated ?? false,
    state: plan.state,
    recordLimit: plan.recordLimit,
    maxGenerationRequests: plan.maxGenerationRequests,
    maxEmbeddingRequests: plan.maxEmbeddingRequests,
    maxPrivacyRequests: plan.maxPrivacyRequests,
    estimate: estimateCosts(plan.maxEmbeddingRequests, plan.maxGenerationRequests, plan.pricing),
    pricing: plan.pricing,
    observedRecords: plan.observedRecords,
    excludedComplete: plan.excludedComplete,
    excludedIneligible: plan.excludedIneligible,
    exclusionReasons: plan.exclusionReasons ?? {},
    initializedSourceEpochs: plan.initializedSourceEpochs,
    createdAt: plan.createdAt,
    note:
        plan.workflowVersion === 2
            ? 'Every selected credential is inventoried, verified or reported as blocked, embedded when authorized, and reconciled. Request caps are hard bounds over the selected snapshot; displayed dollar totals are planning assumptions, not a billing cap. New arrivals and messages are excluded.'
            : 'Finite credential snapshot. Planning may initialize missing source-fencing metadata without model calls. Current consent and source eligibility are checked again before work. Request caps are hard bounds; dollar figures are planning assumptions, not a billing cap. New credentials and messages are excluded.',
});
function assertPlan(plan: RunPlan) {
    const count = plan.snapshot.length;
    if (
        plan.state !== 'review' ||
        plan.generation !== NOVA_IDENTITY ||
        count > INVENTORY_LIMIT ||
        plan.recordLimit !== count ||
        plan.maxGenerationRequests !== count ||
        plan.maxEmbeddingRequests !== count * 5 ||
        plan.maxPrivacyRequests !== count * 3 ||
        new Set(plan.snapshot.map(entry => entry.id)).size !== count ||
        plan.snapshot.some(
            entry =>
                (plan.workflowVersion !== 2 && !/^[0-9a-f]{24}$/i.test(entry.id)) ||
                !/^[0-9a-f]{64}$/.test(entry.fingerprint) ||
                (entry.originalHash !== undefined && !/^[0-9a-f]{64}$/.test(entry.originalHash))
        )
    )
        throw new Error('Stored run plan is invalid');
}
async function preparePlan(
    requestId: string,
    principalDid: string,
    progress: (processed: number, total: number) => Promise<void>,
    publish: (plan: RunPlan) => Promise<void>,
    requestedRecordLimit?: number
) {
    enabled();
    const { sources } = await stores();
    const rows = await sources
        .find({}, { projection: WORKFLOW_SOURCE_PROJECTION, maxTimeMS: 5000 })
        .sort({ _id: 1 })
        .limit(INVENTORY_LIMIT + 1)
        .toArray();
    if (rows.length > INVENTORY_LIMIT && requestedRecordLimit === undefined)
        throw new Error('Inventory exceeds 10000 records; no partial plan was created');
    const selected = rows.slice(0, requestedRecordLimit ?? INVENTORY_LIMIT);
    await progress(0, selected.length);
    // No source repair, owner API calls, Qdrant reads or provider calls during
    // review. Unknown eligibility is included in the worst-case request caps.
    const snapshot: SnapshotEntry[] = [];
    for (const row of selected) {
        await progress(snapshot.length, selected.length);
        let originalHash: string | undefined;
        if (row.source === 'generated' || row.category === AI_INSIGHT_CREDENTIAL_TYPE) {
            if (/^[0-9a-f]{64}$/.test(row.rawContentHash ?? '')) originalHash = row.rawContentHash;
            else if (
                row.rawContentHash === undefined &&
                typeof row.did === 'string' &&
                typeof row.uri === 'string'
            ) {
                const envelopes = await (
                    await database()
                )
                    .collection('raw_credentials')
                    .find(
                        {
                            did: row.did,
                            uri: row.uri,
                            expiresAt: { $gt: new Date() },
                        },
                        { projection: { _id: 0, contentHash: 1 }, maxTimeMS: 2000 }
                    )
                    .limit(2)
                    .toArray();
                if (envelopes.length === 1 && /^[0-9a-f]{64}$/.test(envelopes[0].contentHash ?? ''))
                    originalHash = envelopes[0].contentHash;
            }
        }
        snapshot.push({
            id: String(row._id),
            fingerprint: workflowSourceFingerprint(row),
            ...(originalHash ? { originalHash } : {}),
        });
    }
    const plan: RunPlan = {
        _id: requestId,
        state: 'review',
        workflowVersion: 2,
        requestedRecordLimit,
        selectionLimited: rows.length > selected.length,
        inventoryTruncated: rows.length > INVENTORY_LIMIT,
        generation: NOVA_IDENTITY,
        principalRef: digest(principalDid),
        snapshot,
        configuration: configuration(),
        recordLimit: snapshot.length,
        maxGenerationRequests: snapshot.length,
        maxEmbeddingRequests: snapshot.length * 5,
        maxPrivacyRequests: snapshot.length * 3,
        pricing: costPricing(process.env),
        observedRecords: rows.length,
        excludedComplete: 0,
        excludedIneligible: 0,
        exclusionReasons: {},
        initializedSourceEpochs: 0,
        createdAt: new Date(),
    };
    await progress(selected.length, selected.length);
    await publish(plan);
    return publicPlan(plan);
}
// Preparation is separate from paid runs. The durable claim prevents a slow
// review response or another tab from launching overlapping inventory scans.
const PLAN_LEASE_MS = 120000;
type Preparation = {
    requestedRecordLimit?: number;
    _id: string;
    principalRef: string;
    state: 'preparing' | 'completed' | 'failed' | 'interrupted';
    lease: string;
    leaseUntil: Date;
    processed: number;
    total: number | null;
    reason?: string;
};
async function preparations(index = false) {
    const store = (await database()).collection<Preparation>('embedding_backfill_preparations');
    if (index)
        await store.createIndex(
            { principalRef: 1 },
            {
                unique: true,
                partialFilterExpression: { state: 'preparing' },
            }
        );
    return store;
}
const publicPreparation = (value: Preparation) => ({
    _id: value._id,
    state:
        value.state === 'preparing' && value.leaseUntil <= new Date()
            ? ('interrupted' as const)
            : value.state,
    processed: value.processed,
    total: value.total,
    reason:
        value.state === 'preparing' && value.leaseUntil <= new Date()
            ? 'Review interrupted. Start a new review; no paid backfill was started.'
            : value.reason,
});
export async function getPlanStatus(id: string, principalDid: string) {
    enabled();
    const principalRef = digest(principalDid);
    const { plans } = await stores();
    const plan = await plans.findOne({ _id: id, principalRef });
    if (plan) return publicPlan(plan);
    const preparation = await (await preparations()).findOne({ _id: id, principalRef });
    if (!preparation) return null;
    return publicPreparation(preparation);
}
export async function planRun(
    requestId: string,
    principalDid: string,
    requestedRecordLimit?: number
) {
    if (
        requestedRecordLimit !== undefined &&
        (!Number.isInteger(requestedRecordLimit) ||
            requestedRecordLimit < 1 ||
            requestedRecordLimit > INVENTORY_LIMIT)
    )
        throw new Error('Record limit must be between 1 and 10000');
    enabled();
    if (!principalDid?.startsWith('did:')) throw new Error('Current service principal required');
    const { plans } = await stores();
    const existing = await plans.findOne({ _id: requestId });
    if (existing) {
        if (existing.principalRef !== digest(principalDid))
            throw new Error('Plan unavailable for this principal');
        if (existing.requestedRecordLimit !== requestedRecordLimit)
            throw new Error('Idempotency conflict');
        return publicPlan(existing);
    }
    const store = await preparations(true);
    const principalRef = digest(principalDid);
    const repeated = await store.findOne({ _id: requestId });
    if (repeated) {
        if (repeated.principalRef !== principalRef)
            throw new Error('Review unavailable for this principal');
        if (repeated.requestedRecordLimit !== requestedRecordLimit)
            throw new Error('Idempotency conflict');
        return getPlanStatus(requestId, principalDid);
    }
    // Reclaim only expired work on an explicit new review, never on a read.
    await store.updateMany(
        { principalRef, state: 'preparing', leaseUntil: { $lte: new Date() } },
        {
            $set: {
                state: 'interrupted',
                reason: 'Review interrupted. Start a new review; no paid backfill was started.',
            },
        }
    );
    const active = await store.findOne({ principalRef, state: 'preparing' });
    if (active) {
        if (active.requestedRecordLimit !== requestedRecordLimit)
            throw new Error('A review with another record limit is in progress');
        return publicPreparation(active);
    }
    const preparation: Preparation = {
        requestedRecordLimit,
        _id: requestId,
        principalRef,
        state: 'preparing',
        lease: randomUUID(),
        leaseUntil: new Date(Date.now() + PLAN_LEASE_MS),
        processed: 0,
        total: null,
    };
    try {
        await store.insertOne(preparation);
    } catch (error) {
        const claimed = await store.findOne({ principalRef, state: 'preparing' });
        if (claimed && claimed.requestedRecordLimit === requestedRecordLimit)
            return publicPreparation(claimed);
        throw error;
    }
    const owned = {
        _id: requestId,
        lease: preparation.lease,
        state: 'preparing' as const,
    };
    const progress = async (processed: number, total: number) => {
        enabled();
        const result = await store.updateOne(
            { ...owned, leaseUntil: { $gt: new Date() } },
            {
                $set: {
                    processed,
                    total,
                    leaseUntil: new Date(Date.now() + PLAN_LEASE_MS),
                },
            }
        );
        if (result.matchedCount !== 1) throw new Error('Review lease lost');
    };
    // This handler returns immediately. Browser cancellation cannot create a
    // second scan; status reads and repeated POSTs only observe the same claim.
    void preparePlan(
        requestId,
        principalDid,
        progress,
        async plan => {
            const session = mongo!.startSession();
            try {
                await session.withTransaction(async () => {
                    const complete = await store.updateOne(
                        { ...owned, leaseUntil: { $gt: new Date() } },
                        { $set: { state: 'completed' } },
                        { session }
                    );
                    if (complete.matchedCount !== 1) throw new Error('Review lease lost');
                    await plans.insertOne(plan, { session });
                    const stillLive = await store.findOne(
                        {
                            _id: requestId,
                            lease: preparation.lease,
                            state: 'completed',
                            leaseUntil: { $gt: new Date() },
                        },
                        { session }
                    );
                    if (!stillLive) throw new Error('Review lease lost before publication');
                });
            } finally {
                await session.endSession();
            }
        },
        requestedRecordLimit
    ).catch(async error => {
        const safe = [
            'Inventory exceeds 10000 records; no partial plan was created',
            'Inventory changed while preparing source metadata',
            'Inventory changed during planning; review a fresh plan',
            'Configuration changed during planning',
        ];
        const reason =
            error instanceof Error && safe.includes(error.message)
                ? error.message
                : 'Review preparation failed. Start a new review; no paid backfill was started.';
        await store.updateOne(owned, { $set: { state: 'failed', reason } }).catch(() => {});
    });
    return publicPreparation(preparation);
}

function viewState(run: Run): RunState {
    return run.state === 'running' && (!run.leaseUntil || run.leaseUntil <= new Date())
        ? 'interrupted'
        : run.state;
}
async function publicRun(run: Run) {
    const { jobs, plans, items } = await stores();
    const [job, plan] = await Promise.all([
        jobs.findOne({ _id: run._id, managedRunId: run._id }),
        plans.findOne({ _id: run.planId }),
    ]);
    const state = viewState(run);
    const draining = Boolean(
        (run.leaseUntil && run.leaseUntil > new Date()) ||
        (job?.leaseUntil && job.leaseUntil > new Date())
    );
    const recoveryItem = run.recoveryPass
        ? await items.findOne({
              _id: `${run._id}:${run.recoveryPass.index}`,
              'supplementalRecovery.id': run.recoveryPass.id,
          })
        : null;
    const parsedRecovery = supplementalRecoverySchema.safeParse(recoveryItem?.supplementalRecovery);
    const recovery = parsedRecovery.success ? parsedRecovery.data : undefined;
    const consumedRecovery = run.recoveryPass?.index === run.processed;
    const resumeBlock = ['paused', 'interrupted'].includes(state)
        ? consumedRecovery
            ? {
                  code: 'single_recovery_consumed' as const,
                  record: run.processed + 1,
                  message: RECOVERY_PASS_CONSUMED_MESSAGE,
              }
            : embeddingResumeBlock(job, run.processed)
        : undefined;
    const lastFailure = sanitizeBackfillFailure(job?.lastFailure);
    const failureTime = lastFailure ? Date.parse(lastFailure.at) : NaN;
    const jobTime = job?.updatedAt instanceof Date ? job.updatedAt.getTime() : NaN;
    const runTime = run.updatedAt instanceof Date ? run.updatedAt.getTime() : NaN;
    // Read-only recovery for diagnostics written with null optional BSON fields.
    // Resume clears lastError; each new failure replaces or clears lastFailure.
    // Never promote a historical diagnostic into an active/unrelated pause.
    const recoverCurrentFailure =
        run.workflowVersion === 2 &&
        state === 'paused' &&
        !draining &&
        job?.state === 'paused' &&
        run.reason === GENERIC_BACKFILL_PAUSE_REASON &&
        job.lastError === 'record_failed_or_budget_exhausted_cursor_preserved' &&
        job.errors > 0 &&
        job.snapshotIndex === run.processed &&
        lastFailure?.record === run.processed + 1 &&
        failureTime <= jobTime &&
        jobTime <= runTime;
    return {
        _id: run._id,
        planId: run.planId,
        state,
        recordLimit: run.recordLimit,
        workflowVersion: run.workflowVersion,
        stage: run.stage,
        generationRetryPolicy: run.generationRetryPolicy,
        ...(state === 'running' && run.stage === 'retry_wait' && run.retry
            ? {
                  retry: {
                      attempt: run.retry.attempt,
                      maxAttempts: 3,
                      nextAttemptAt: run.retry.nextAttemptAt,
                      record: run.retry.record,
                  },
              }
            : {}),
        alreadyComplete: run.alreadyComplete ?? 0,
        blocked: run.blocked ?? 0,
        blockedReasons: run.blockedReasons ?? {},
        repaired: run.repaired ?? 0,
        reconciled: run.reconciled ?? 0,
        processed:
            run.workflowVersion === 2 ? run.processed : (job?.snapshotIndex ?? run.processed),
        written: run.workflowVersion === 2 ? run.written : (job?.written ?? run.written),
        skipped:
            run.workflowVersion === 2
                ? (run.blocked ?? 0) + (run.alreadyComplete ?? 0)
                : (job?.skipped ?? run.skipped),
        errors: job?.errors ?? run.errors,
        lastFailure,
        lastDispatchedFailure:
            job?.snapshotIndex === run.processed
                ? retainDispatchedFailure(undefined, job.lastDispatchedFailure, run.processed + 1)
                : undefined,
        skipReasons: job?.skipReasons ?? {},
        maxGenerationRequests: run.maxGenerationRequests,
        maxEmbeddingRequests: run.maxEmbeddingRequests,
        maxPrivacyRequests: run.maxPrivacyRequests,
        generationRequests: run.generationRequests,
        embeddingRequests: run.embeddingRequests,
        privacyRequests: run.privacyRequests,
        recovery: recovery
            ? {
                  id: recovery.id,
                  record: recovery.index + 1,
                  phase:
                      recovery.phase === 'running' && state !== 'running'
                          ? state === 'cancelled'
                              ? 'cancelled'
                              : 'interrupted'
                          : recovery.phase,
                  caps: RECOVERY_PASS_CAPS,
                  used: recovery.used,
                  expiresAt: recovery.expiresAt,
              }
            : undefined,
        resumeBlock,
        reason:
            resumeBlock?.message ??
            (state === 'interrupted'
                ? 'Server interrupted; fresh login and explicit resume required after the current unit drains'
                : recoverCurrentFailure
                  ? backfillPauseReason(lastFailure)
                  : run.reason),
        draining,
        resumable: ['paused', 'interrupted'].includes(state) && !draining && !resumeBlock,
        createdAt: run.createdAt,
        updatedAt: run.updatedAt,
        ...(plan
            ? {
                  selection: {
                      observedRecords: plan.observedRecords,
                      inventoryTruncated: plan.inventoryTruncated ?? false,
                      excludedComplete: plan.excludedComplete,
                      excludedIneligible: plan.excludedIneligible,
                      exclusionReasons: plan.exclusionReasons ?? {},
                  },
                  pricing: plan.pricing,
                  estimate: estimateCosts(
                      plan.maxEmbeddingRequests,
                      plan.maxGenerationRequests,
                      plan.pricing
                  ),
                  observedUsage: usageCostSummary(job?.usage, plan.pricing),
              }
            : {}),
    };
}
export async function listRuns() {
    enabled();
    const { runs } = await stores();
    const rows = await runs.find({}).sort({ createdAt: -1 }).limit(20).toArray();
    return Promise.all(rows.map(publicRun));
}
async function releaseTerminal(run: Run) {
    if (!['cancelled', 'completed', 'completed_with_blockers'].includes(run.state)) return;
    const { runs, jobs } = await stores();
    const job = await jobs.findOne({ _id: run._id, managedRunId: run._id });
    if (job?.leaseUntil && job.leaseUntil > new Date()) return;
    await runs.updateOne(
        {
            _id: run._id,
            state: { $in: ['cancelled', 'completed', 'completed_with_blockers'] },
            $or: [{ leaseUntil: { $exists: false } }, { leaseUntil: { $lte: new Date() } }],
        },
        {
            $set: { occupied: false, updatedAt: new Date() },
            $unset: { lease: '', leaseUntil: '' },
        }
    );
}
export async function startRun(
    requestId: string,
    planId: string,
    paidAuthorized: boolean,
    principal: PrincipalGuard,
    principalDid: string,
    replaceRunId?: string,
    generationRetryPolicy?: GenerationRetryPolicy
) {
    enabledForPaid();
    if (generationRetryPolicy !== undefined && !isGenerationRetryPolicy(generationRetryPolicy))
        throw new Error('Unsupported generation retry policy');
    if (paidAuthorized !== true) throw new Error('Explicit paid authorization required');
    await principal();
    if (!principalDid?.startsWith('did:')) throw new Error('Current service principal required');
    const { runs, plans, jobs, items } = await stores(true);
    const existing = await runs.findOne({ _id: requestId });
    if (existing) {
        if (
            existing.planId !== planId ||
            existing.principalRef !== digest(principalDid) ||
            existing.startGenerationRetryPolicy !== generationRetryPolicy
        )
            throw new Error('Idempotency conflict');
        // Repeated HTTP requests never launch or resume a runner.
        return publicRun(existing);
    }
    const plan = await plans.findOne({ _id: planId });
    if (!plan || plan.principalRef !== digest(principalDid))
        throw new Error('Reviewed plan required for this principal');
    assertPlan(plan);
    if (generationRetryPolicy && plan.workflowVersion !== 2)
        throw new Error('Generation retries require a whole-workflow run');
    if (replaceRunId && plan.workflowVersion !== 2)
        throw new Error('Only a whole-workflow plan may replace an earlier run');
    if (plan.configuration !== configuration())
        throw new Error('Configuration changed; review a fresh plan');
    // A cancelled run whose process died can release only after both leases drain.
    for (const terminal of await runs
        .find({
            occupied: true,
            state: { $in: ['cancelled', 'completed', 'completed_with_blockers'] },
        })
        .toArray())
        await releaseTerminal(terminal);
    const now = new Date(),
        lease = randomUUID();
    const run: Run = {
        ...(generationRetryPolicy
            ? { generationRetryPolicy, startGenerationRetryPolicy: generationRetryPolicy }
            : {}),
        ...(plan.workflowVersion === 2
            ? {
                  workflowVersion: 2,
                  stage: plan.recordLimit ? 'verification' : 'finished',
                  alreadyComplete: 0,
                  blocked: 0,
                  blockedReasons: {},
                  repaired: 0,
                  reconciled: 0,
              }
            : {}),
        _id: requestId,
        planId,
        planDigest: digest(plan),
        principalRef: digest(principalDid),
        activeKey: 'credential-backfill',
        occupied: plan.recordLimit > 0,
        state: plan.recordLimit ? 'running' : 'completed',
        process: processEpoch,
        ...(plan.recordLimit ? { lease, leaseUntil: new Date(Date.now() + LEASE_MS) } : {}),
        recordLimit: plan.recordLimit,
        maxGenerationRequests: plan.maxGenerationRequests,
        maxEmbeddingRequests: plan.maxEmbeddingRequests,
        maxPrivacyRequests: plan.maxPrivacyRequests,
        generationRequests: 0,
        embeddingRequests: 0,
        privacyRequests: 0,
        processed: 0,
        written: 0,
        skipped: 0,
        errors: 0,
        createdAt: now,
        updatedAt: now,
    };
    const job: BackfillJob = {
        ...(plan.workflowVersion === 2 ? { workflowVersion: 2 } : {}),
        _id: requestId,
        managedRunId: requestId,
        snapshot: plan.snapshot,
        snapshotIndex: 0,
        generation: NOVA_IDENTITY,
        regenerationAuthorized: true,
        maxRecords: plan.recordLimit,
        maxRepresentationCalls: plan.maxGenerationRequests,
        maxEmbeddingRequests: plan.maxEmbeddingRequests,
        dryRun: false,
        state: plan.recordLimit ? 'ready' : 'completed',
        kind: 'credentials',
        cursor: '',
        highWater: { credentials: '', messages: '' },
        scanned: 0,
        written: 0,
        skipped: 0,
        skipReasons: {},
        errors: 0,
        cancel: false,
        representationCalls: 0,
        embeddingRequests: 0,
        createdAt: now,
        updatedAt: now,
    };
    const session = mongo!.startSession();
    try {
        await session.withTransaction(async () => {
            if (replaceRunId) {
                const prior = await runs.findOne(
                    {
                        _id: replaceRunId,
                        principalRef: digest(principalDid),
                        workflowVersion: { $exists: false },
                        occupied: true,
                        state: { $in: ['paused', 'interrupted', 'running'] },
                        $or: [
                            { leaseUntil: { $exists: false } },
                            { leaseUntil: { $lte: new Date() } },
                        ],
                    },
                    { session }
                );
                const priorJob = await jobs.findOne(
                    {
                        _id: replaceRunId,
                        managedRunId: replaceRunId,
                        $or: [
                            { leaseUntil: { $exists: false } },
                            { leaseUntil: { $lte: new Date() } },
                        ],
                    },
                    { session }
                );
                if (!prior || !priorJob)
                    throw new Error('Prior run is not a drained owned legacy run');
                await runs.updateOne(
                    { _id: replaceRunId, occupied: true },
                    {
                        $set: {
                            state: 'cancelled',
                            occupied: false,
                            reason: 'Replaced by an explicitly authorized whole workflow',
                            updatedAt: new Date(),
                        },
                        $unset: { lease: '', leaseUntil: '' },
                    },
                    { session }
                );
            }
            await runs.insertOne(run, { session });
            await jobs.insertOne(job, { session });
            if (plan.workflowVersion === 2 && plan.snapshot.length)
                await items.insertMany(
                    plan.snapshot.map((entry, index) => ({
                        _id: `${requestId}:${index}`,
                        runId: requestId,
                        index,
                        sourceId: entry.id,
                        initialFingerprint: entry.fingerprint,
                        ...(entry.originalHash ? { originalHash: entry.originalHash } : {}),
                        state: 'pending' as const,
                    })),
                    { session }
                );
        });
    } catch (error) {
        const repeated = await runs.findOne({ _id: requestId });
        if (
            repeated &&
            repeated.planId === planId &&
            repeated.principalRef === digest(principalDid) &&
            repeated.startGenerationRetryPolicy === generationRetryPolicy
        )
            return publicRun(repeated);
        throw new Error('Another run owns this plan or the global runner slot', {
            cause: error,
        });
    } finally {
        await session.endSession();
    }
    if (run.state === 'running') launch(run, principal);
    return publicRun(run);
}
export async function stopRun(id: string, cancel: boolean, principalDid: string) {
    enabled();
    const { runs } = await stores();
    const owner = await runs.findOne({
        _id: id,
        principalRef: digest(principalDid),
    });
    if (!owner) throw new Error('Run unavailable for this principal');
    await runs.updateOne(
        {
            _id: id,
            principalRef: digest(principalDid),
            state: {
                $in: cancel ? ['running', 'paused', 'interrupted'] : ['running'],
            },
        },
        {
            $set: {
                state: cancel ? 'cancelled' : 'paused',
                updatedAt: new Date(),
                reason: cancel
                    ? 'Cancelled by operator; remaining requests will not be dispatched'
                    : 'Paused by operator',
            },
        }
    );
    const run = await runs.findOne({ _id: id });
    if (!run) throw new Error('Run unavailable');
    await releaseTerminal(run);
    return publicRun((await runs.findOne({ _id: id }))!);
}
export async function resumeRun(
    id: string,
    principal: PrincipalGuard,
    principalDid: string,
    generationRetryPolicy?: GenerationRetryPolicy
) {
    enabledForPaid();
    if (generationRetryPolicy !== undefined && !isGenerationRetryPolicy(generationRetryPolicy))
        throw new Error('Unsupported generation retry policy');
    await principal();
    const { runs, plans, jobs } = await stores(true);
    const run = await runs.findOne({
        _id: id,
        principalRef: digest(principalDid),
    });
    if (!run) throw new Error('Run unavailable');
    if (generationRetryPolicy && run.workflowVersion !== 2)
        throw new Error('Generation retries require a whole-workflow run');
    if (viewState(run) === 'running') {
        if (run.generationRetryPolicy !== generationRetryPolicy)
            throw new Error('Pause before changing generation retry policy');
        return publicRun(run);
    }
    if (!['paused', 'interrupted'].includes(viewState(run)))
        throw new Error('Run is not resumable');
    if (run.recoveryPass?.index === run.processed) throw new Error(RECOVERY_PASS_CONSUMED_MESSAGE);
    const [plan, job] = await Promise.all([
        plans.findOne({ _id: run.planId }),
        jobs.findOne({ _id: id, managedRunId: id }),
    ]);
    if (
        !plan ||
        !job ||
        digest(plan) !== run.planDigest ||
        digest(job.snapshot) !== digest(plan.snapshot)
    )
        throw new Error('Stored plan changed');
    assertPlan(plan);
    if (plan.configuration !== configuration())
        throw new Error('Configuration changed; cancel and review a fresh plan');
    if (
        (run.leaseUntil && run.leaseUntil > new Date()) ||
        (job.leaseUntil && job.leaseUntil > new Date()) ||
        loops.has(id)
    )
        throw new Error('Current unit is still draining');
    const resumeBlock = embeddingResumeBlock(job, run.processed);
    if (resumeBlock) throw new EmbeddingResumeBlockedError(resumeBlock.record);
    const lease = randomUUID();
    const session = mongo!.startSession();
    try {
        await session.withTransaction(async () => {
            const reset = await jobs.updateOne(
                {
                    _id: id,
                    managedRunId: id,
                    $or: [{ leaseUntil: { $exists: false } }, { leaseUntil: { $lte: new Date() } }],
                },
                {
                    $set: { state: 'paused', cancel: false },
                    $unset: { lease: '', leaseUntil: '', lastError: '' },
                },
                { session }
            );
            if (reset.matchedCount !== 1) throw new Error('Current unit is still draining');
            const claimed = await runs.updateOne(
                {
                    _id: id,
                    occupied: true,
                    state: run.state,
                    $or: [{ leaseUntil: { $exists: false } }, { leaseUntil: { $lte: new Date() } }],
                },
                {
                    $set: {
                        state: 'running',
                        ...(generationRetryPolicy
                            ? { generationRetryPolicy }
                            : run.workflowVersion === 2 && run.stage === 'retry_wait'
                              ? { stage: 'embedding' }
                              : {}),
                        process: processEpoch,
                        lease,
                        leaseUntil: new Date(Date.now() + LEASE_MS),
                        updatedAt: new Date(),
                    },
                    $unset: {
                        reason: '',
                        ...(!generationRetryPolicy ? { generationRetryPolicy: '', retry: '' } : {}),
                    },
                },
                { session }
            );
            if (claimed.matchedCount !== 1) throw new Error('Concurrent run action; refresh first');
        });
    } finally {
        await session.endSession();
    }
    const resumed = (await runs.findOne({ _id: id }))!;
    launch(resumed, principal);
    return publicRun(resumed);
}
function launch(run: Run, principal: PrincipalGuard) {
    if (loops.has(run._id)) return;
    // Only called after this process commits an explicit start/resume. There is
    // intentionally no startup scan, durable scheduler or automatic retry.
    const task = (
        run.workflowVersion === 2 ? executeWorkflow(run, principal) : execute(run, principal)
    )
        .catch(() => {})
        .finally(() => loops.delete(run._id));
    loops.set(run._id, task);
}
async function execute(run: Run, principal: PrincipalGuard) {
    const { runs, plans, jobs, sources } = await stores();
    const owned = { _id: run._id, process: processEpoch, lease: run.lease };
    const activeFilter = () => ({
        ...owned,
        state: 'running' as const,
        leaseUntil: { $gt: new Date() },
    });
    const stop = async (reason: string, interrupted = false) => {
        // Persist the reason before throwing: provider wrappers normalize errors.
        await runs.updateOne(
            { ...owned, state: 'running' },
            {
                $set: {
                    state: interrupted ? 'interrupted' : 'paused',
                    reason,
                    updatedAt: new Date(),
                },
            }
        );
        throw new Error(reason);
    };
    const active = async (requiredRemainingMs = 0) => {
        try {
            enabledForPaid();
            await principal();
        } catch {
            return stop('Authorization expired, revoked or unavailable; fresh login required');
        }
        const current = await runs.findOne(activeFilter());
        if (!current) return stop('Runner lease expired or work was stopped', true);
        if (
            requiredRemainingMs > 0 &&
            (!current.leaseUntil || current.leaseUntil.getTime() - Date.now() < requiredRemainingMs)
        )
            return stop(
                'Runner lease has insufficient deadline headroom; explicit resume required'
            );
        const plan = await plans.findOne({ _id: run.planId });
        if (!plan || digest(plan) !== run.planDigest || plan.configuration !== configuration())
            return stop('Reviewed plan or provider configuration changed');
        return current;
    };
    try {
        for (;;) {
            await active();
            const job = await jobs.findOne({ _id: run._id, managedRunId: run._id });
            if (!job?.snapshot) return await stop('Managed job unavailable');
            const index = job.snapshotIndex ?? 0;
            if (index >= run.recordLimit) {
                await runs.updateOne(activeFilter(), {
                    $set: {
                        state: 'completed',
                        reason: 'Credential snapshot completed',
                        updatedAt: new Date(),
                    },
                });
                break;
            }
            const plan = await plans.findOne({ _id: run.planId });
            if (!plan || digest(job.snapshot) !== digest(plan.snapshot))
                return await stop('Managed snapshot changed');
            const entry = plan.snapshot[index];
            const reserve = async (kind: UsageKind) => {
                await active();
                const source = await sources.findOne(
                    { _id: new ObjectId(entry.id) },
                    { projection: RUN_SOURCE_PROJECTION }
                );
                if (!source || runSourceFingerprint(source) !== entry.fingerprint)
                    return stop('Snapshot source changed; cancel and review a fresh plan');
                const field = (
                    {
                        generation: 'generationRequests',
                        embedding: 'embeddingRequests',
                        privacy: 'privacyRequests',
                    } as const
                )[kind];
                const cap = (
                    {
                        generation: 'maxGenerationRequests',
                        embedding: 'maxEmbeddingRequests',
                        privacy: 'maxPrivacyRequests',
                    } as const
                )[kind];
                // Every attempt, including one explicitly retried after interruption,
                // consumes a durable reservation. No refund on failures/unknown results.
                const reserved = await runs.updateOne(
                    { ...activeFilter(), [field]: { $lt: run[cap] } },
                    { $inc: { [field]: 1 }, $set: { updatedAt: new Date() } }
                );
                if (reserved.matchedCount !== 1)
                    return stop('Provider request budget exhausted or run stopped');
            };
            const result = await withProviderBudget(reserve, () =>
                stepJob(
                    run._id,
                    1,
                    async (requiredRemainingMs = 0) => {
                        await active(requiredRemainingMs);
                    },
                    undefined,
                    run._id
                )
            );
            if (!result) return await stop('Managed job unavailable');
            await runs.updateOne(owned, {
                $set: {
                    processed: result.snapshotIndex ?? 0,
                    written: result.written,
                    skipped: result.skipped,
                    errors: result.errors,
                    updatedAt: new Date(),
                },
            });
            if (result.lastError || result.errors > job.errors)
                return await stop(
                    result.lastError === 'snapshot_source_changed'
                        ? 'Snapshot source changed; cancel and review a fresh plan'
                        : backfillPauseReason(result.lastFailure)
                );
            if ((result.snapshotIndex ?? 0) <= index)
                return await stop('No progress; inspect before explicit resume');
            const renewed = await runs.updateOne(activeFilter(), {
                $set: { leaseUntil: new Date(Date.now() + LEASE_MS) },
            });
            if (renewed.matchedCount !== 1) break;
        }
    } catch {
        // Never automatically retry a failed, cancelled or ambiguous unit.
        await runs
            .updateOne(
                { ...owned, state: 'running' },
                {
                    $set: {
                        state: 'interrupted',
                        reason: 'Server or unit interrupted; explicit resume required',
                        updatedAt: new Date(),
                    },
                }
            )
            .catch(() => {});
    } finally {
        await runs.updateOne(owned, { $unset: { lease: '', leaseUntil: '' } });
        const current = await runs.findOne({ _id: run._id });
        if (current) await releaseTerminal(current);
    }
}

/** Explicit one-record authority. A duplicate request only observes its original claim. */
export async function recoverRunOnce(
    id: string,
    principal: PrincipalGuard,
    principalDid: string,
    input: RecoveryPassRequest
) {
    const request = recoveryPassRequestSchema.parse(input);
    enabledForPaid();
    await principal();
    const { runs, plans, jobs, items, sources } = await stores(true);
    const run = await runs.findOne({
        _id: id,
        principalRef: digest(principalDid),
    });
    if (!run) throw new Error('Run unavailable');
    const index = request.record - 1;
    const item = await items.findOne({ _id: `${id}:${index}`, runId: id, index });
    if (item?.supplementalRecovery) {
        const previous = supplementalRecoverySchema.parse(item.supplementalRecovery);
        if (previous.id === request.requestId) return publicRun(run);
        throw new Error(RECOVERY_PASS_CONSUMED_MESSAGE);
    }
    if (
        run.workflowVersion !== 2 ||
        !['paused', 'interrupted'].includes(viewState(run)) ||
        run.processed !== index ||
        !run.occupied ||
        index >= run.recordLimit
    )
        throw new Error('Recovery requires the paused current whole-workflow record');
    const [plan, job] = await Promise.all([
        plans.findOne({ _id: run.planId }),
        jobs.findOne({ _id: id, managedRunId: id }),
    ]);
    if (
        !plan ||
        !job ||
        digest(plan) !== run.planDigest ||
        digest(job.snapshot) !== digest(plan.snapshot)
    )
        throw new Error('Stored plan changed');
    assertPlan(plan);
    if (plan.configuration !== configuration()) throw new Error('Configuration changed');
    if (
        loops.has(id) ||
        (run.leaseUntil && run.leaseUntil > new Date()) ||
        (job.leaseUntil && job.leaseUntil > new Date())
    )
        throw new Error('Current unit is still draining');
    const ledger = embeddingRecoveryLedgerSchema.parse(job.embeddingRecovery);
    const entry = plan.snapshot[index];
    if (
        !embeddingResumeBlock(job, index) ||
        !item ||
        item.state !== 'embedding_ready' ||
        item.initialFingerprint !== entry?.fingerprint ||
        item.sourceId !== entry.id ||
        item.originalHash !== entry.originalHash ||
        !item.resolvedFingerprint ||
        ledger.fingerprint !== item.resolvedFingerprint
    )
        throw new Error('Recovery requires a verified exhausted current record');
    if (
        run.maxGenerationRequests - run.generationRequests < 1 ||
        run.maxEmbeddingRequests - run.embeddingRequests < 5 ||
        run.maxPrivacyRequests - run.privacyRequests < 3
    )
        throw new Error('Original run has insufficient remaining request budget');
    const source = await sources.findOne(
        { _id: new ObjectId(item.sourceId) },
        { projection: WORKFLOW_SOURCE_PROJECTION }
    );
    if (
        !source ||
        !source.did ||
        !source.embeddingEpoch ||
        metadataExclusionReason(source) ||
        runSourceFingerprint(source) !== item.resolvedFingerprint
    )
        throw new Error('Verified source changed');
    const claimedRun = await withOwnerOperation(source.did, () =>
        runWithAiPrivacyContext(source.did!, async () => {
            const receipt = await assertCurrentAiConsent('embedding');
            const inference = await assertCurrentAiConsent('model-inference');
            if (
                receipt.revision !== inference.revision ||
                source.verification?.consent?.revision !== receipt.revision ||
                (source.source !== 'generated' && !receipt.credentialUris.includes(source.uri!))
            )
                throw new Error('Consent changed or source is outside scope');
            await principal();
            const grant = supplementalRecoverySchema.parse({
                id: request.requestId,
                index,
                sourceFingerprint: item.resolvedFingerprint,
                consentRevision: receipt.revision,
                sourceEpoch: source.embeddingEpoch,
                modelIdentity: NOVA_IDENTITY,
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 15 * 60000),
                phase: 'running',
                used: { generation: 0, embedding: 0, privacy: 0 },
                embeddingOrdinals: [0, 0, 0, 0, 0],
                baselineAttempts: ledger.slots.map(slot => slot.attempts),
            });
            const lease = randomUUID();
            const session = mongo!.startSession();
            try {
                await session.withTransaction(async () => {
                    const fresh = await sources.findOne(
                        { _id: source._id },
                        { projection: WORKFLOW_SOURCE_PROJECTION, session }
                    );
                    if (!fresh || runSourceFingerprint(fresh) !== grant.sourceFingerprint)
                        throw new Error('Verified source changed');
                    const claimed = await runs.updateOne(
                        {
                            _id: id,
                            principalRef: run.principalRef,
                            occupied: true,
                            state: run.state,
                            processed: index,
                            generationRequests: run.generationRequests,
                            embeddingRequests: run.embeddingRequests,
                            privacyRequests: run.privacyRequests,
                            $or: [
                                { leaseUntil: { $exists: false } },
                                { leaseUntil: { $lte: new Date() } },
                            ],
                        },
                        {
                            $set: {
                                state: 'running',
                                stage: 'embedding',
                                process: processEpoch,
                                lease,
                                leaseUntil: new Date(Date.now() + LEASE_MS),
                                updatedAt: new Date(),
                                recoveryPass: { id: grant.id, index },
                            },
                            $unset: { reason: '', generationRetryPolicy: '', retry: '' },
                        },
                        { session }
                    );
                    if (claimed.matchedCount !== 1)
                        throw new Error('Concurrent run action; refresh first');
                    const bound = await items.updateOne(
                        {
                            _id: item._id,
                            state: 'embedding_ready',
                            resolvedFingerprint: grant.sourceFingerprint,
                            supplementalRecovery: { $exists: false },
                        },
                        { $set: { supplementalRecovery: grant } },
                        { session }
                    );
                    if (bound.matchedCount !== 1) throw new Error(RECOVERY_PASS_CONSUMED_MESSAGE);
                    const reset = await jobs.updateOne(
                        {
                            _id: id,
                            managedRunId: id,
                            snapshotIndex: index,
                            'embeddingRecovery.record': ledger.record,
                            'embeddingRecovery.fingerprint': ledger.fingerprint,
                            ...Object.fromEntries(
                                ledger.slots.flatMap((slot, ordinal) => [
                                    [`embeddingRecovery.slots.${ordinal}.attempts`, slot.attempts],
                                    [
                                        `embeddingRecovery.slots.${ordinal}.notBefore`,
                                        slot.notBefore,
                                    ],
                                ])
                            ),
                            $or: [
                                { leaseUntil: { $exists: false } },
                                { leaseUntil: { $lte: new Date() } },
                            ],
                        },
                        {
                            $set: { state: 'paused', cancel: false },
                            $unset: { lease: '', leaseUntil: '', lastError: '' },
                        },
                        { session }
                    );
                    if (reset.matchedCount !== 1)
                        throw new Error('Current record or ledger changed');
                });
            } finally {
                await session.endSession();
            }
            const claimed = (await runs.findOne({ _id: id }))!;
            return claimed;
        })
    );
    launch(claimedRun, principal);
    return publicRun(claimedRun);
}

async function executeWorkflow(run: Run, principal: PrincipalGuard) {
    const { runs, plans, jobs, sources, items } = await stores();
    const recoveryPass = run.recoveryPass?.index === run.processed ? run.recoveryPass : undefined;
    const owned = { _id: run._id, process: processEpoch, lease: run.lease };
    const activeFilter = () => ({
        ...owned,
        state: 'running' as const,
        leaseUntil: { $gt: new Date() },
    });
    const stop = async (reason: string, interrupted = false): Promise<never> => {
        const stopped = await runs.updateOne(
            { ...owned, state: 'running' },
            {
                $set: {
                    state: interrupted ? 'interrupted' : 'paused',
                    reason,
                    updatedAt: new Date(),
                },
            }
        );
        if (recoveryPass && stopped.matchedCount === 1)
            await items.updateOne(
                {
                    _id: `${run._id}:${recoveryPass.index}`,
                    'supplementalRecovery.id': recoveryPass.id,
                    'supplementalRecovery.phase': 'running',
                },
                { $set: { 'supplementalRecovery.phase': 'failed' } }
            );
        throw new Error(reason);
    };
    const active = async (requiredRemainingMs = 0) => {
        try {
            enabledForPaid();
            await principal();
        } catch {
            return stop('Authorization expired, revoked or unavailable; fresh login required');
        }
        const current = await runs.findOne(activeFilter());
        if (!current) return stop('Runner lease expired or work was stopped', true);
        if (
            requiredRemainingMs > 0 &&
            (!current.leaseUntil || current.leaseUntil.getTime() - Date.now() < requiredRemainingMs)
        )
            return stop(
                'Runner lease has insufficient deadline headroom; explicit resume required'
            );
        const plan = await plans.findOne({ _id: run.planId });
        if (!plan || digest(plan) !== run.planDigest || plan.configuration !== configuration())
            return stop('Reviewed plan or provider configuration changed');
        return { current, plan };
    };
    const transaction = async (
        operation: (session: import('mongodb').ClientSession) => Promise<void>
    ) => {
        const session = mongo!.startSession();
        try {
            await session.withTransaction(async () => {
                const fence = await runs.updateOne(
                    activeFilter(),
                    { $inc: { workflowFence: 1 } },
                    { session }
                );
                if (fence.matchedCount !== 1) throw new Error('Workflow lease lost');
                await operation(session);
            });
        } finally {
            await session.endSession();
        }
    };
    const finish = async (
        item: WorkflowItem,
        state: 'written' | 'already_complete' | 'blocked',
        reason?: string
    ) => {
        if (recoveryPass && state === 'blocked')
            return stop('Recovery pass requires review; the record was not skipped');
        await transaction(async session => {
            const done = await items.updateOne(
                {
                    _id: item._id,
                    initialFingerprint: item.initialFingerprint,
                    state: { $in: ['pending', 'embedding_ready'] },
                },
                { $set: { state, ...(reason ? { reason } : {}) } },
                { session }
            );
            if (done.matchedCount !== 1) throw new Error('Workflow item checkpoint changed');
            if (recoveryPass) {
                const marked = await items.updateOne(
                    {
                        _id: item._id,
                        'supplementalRecovery.id': recoveryPass.id,
                        'supplementalRecovery.phase': 'running',
                    },
                    { $set: { 'supplementalRecovery.phase': 'completed' } },
                    { session }
                );
                if (marked.matchedCount !== 1) throw new Error('Recovery pass changed');
            }
            const cursor = await jobs.updateOne(
                {
                    _id: run._id,
                    managedRunId: run._id,
                    snapshotIndex: { $in: [item.index, item.index + 1] },
                },
                { $set: { snapshotIndex: item.index + 1, updatedAt: new Date() } },
                { session }
            );
            if (cursor.matchedCount !== 1) throw new Error('Workflow source checkpoint changed');
            const field =
                state === 'written'
                    ? 'written'
                    : state === 'already_complete'
                      ? 'alreadyComplete'
                      : 'blocked';
            const checkpoint = await runs.updateOne(
                { ...activeFilter(), processed: item.index },
                {
                    $inc: {
                        processed: 1,
                        [field]: 1,
                        ...(reason ? { [`blockedReasons.${reason}`]: 1 } : {}),
                        ...(item.repaired ? { repaired: 1 } : {}),
                    },
                    $set: {
                        stage: 'verification',
                        updatedAt: new Date(),
                        leaseUntil: new Date(Date.now() + LEASE_MS),
                    },
                },
                { session }
            );
            if (checkpoint.matchedCount !== 1) throw new Error('Workflow progress changed');
        });
    };
    const reasonFor = (error: unknown) => {
        if (error instanceof Error && error.name === 'DataErasureRequestedError')
            return 'owner_erased';
        if (error instanceof Error && error.name === 'AiConsentError') {
            const reason = (error as Error & { reason?: string }).reason;
            return (
                (
                    {
                        missing: 'consent_missing',
                        revoked: 'consent_revoked',
                        expired: 'consent_expired',
                        guardian_required: 'guardian_required',
                    } as Record<string, string>
                )[reason ?? ''] ?? 'consent_unavailable'
            );
        }
        return 'source_or_consent_unavailable';
    };
    const sourceFor = async (item: WorkflowItem) =>
        /^[0-9a-f]{24}$/i.test(item.sourceId)
            ? sources.findOne(
                  { _id: new ObjectId(item.sourceId) },
                  { projection: WORKFLOW_SOURCE_PROJECTION }
              )
            : null;
    const observe = async (item: WorkflowItem): Promise<{ complete: boolean; reason?: string }> => {
        const source = await sourceFor(item);
        if (!source) return { complete: false, reason: 'missing_source' };
        if (runSourceFingerprint(source) !== item.resolvedFingerprint)
            return { complete: false, reason: 'source_changed' };
        try {
            return await withOwnerOperation(source.did!, () =>
                runWithAiPrivacyContext(source.did!, async () => {
                    await active();
                    const receipt = await assertCurrentAiConsent('embedding');
                    if (source.verification?.consent?.revision !== receipt.revision)
                        return { complete: false, reason: 'consent_revision_changed' };
                    if (
                        source.source !== 'generated' &&
                        !receipt.credentialUris.includes(source.uri!)
                    )
                        return { complete: false, reason: 'outside_consent_scope' };
                    const coverage = await withEmbeddingGeneration('nova1024v1', () =>
                        getCredentialVectorCoverage(source.did!, [source.uri!], {
                            contentHash: source.verification!.contentHash!,
                            consentRevision: receipt.revision,
                            sourceEpoch: source.embeddingEpoch ?? null,
                        })
                    );
                    await active();
                    const freshReceipt = await assertCurrentAiConsent('embedding');
                    if (freshReceipt.revision !== receipt.revision)
                        return { complete: false, reason: 'consent_revision_changed' };
                    if (
                        source.source !== 'generated' &&
                        !freshReceipt.credentialUris.includes(source.uri!)
                    )
                        return { complete: false, reason: 'outside_consent_scope' };
                    const fresh = await sourceFor(item);
                    if (!fresh || runSourceFingerprint(fresh) !== item.resolvedFingerprint)
                        return { complete: false, reason: 'source_changed' };
                    return { complete: coverage.get(source.uri!)?.size === 5 };
                })
            );
        } catch (error) {
            await active();
            return { complete: false, reason: reasonFor(error) };
        }
    };
    const waitForScheduledRetry = async (item: WorkflowItem) => {
        const ticket = item.generationRetry;
        if (!ticket || ticket.phase !== 'waiting') return;
        if (
            (ticket.policy !== undefined && !isGenerationRetryPolicy(ticket.policy)) ||
            !Number.isInteger(ticket.attempt) ||
            ticket.attempt < 1 ||
            ticket.attempt > 3 ||
            item.autoRetries !== ticket.attempt ||
            !Number.isSafeInteger(ticket.failureErrors) ||
            ticket.failureErrors < 1 ||
            typeof ticket.failureAt !== 'string' ||
            !Number.isFinite(Date.parse(ticket.failureAt)) ||
            !(ticket.nextAttemptAt instanceof Date) ||
            !Number.isFinite(ticket.nextAttemptAt.getTime())
        )
            return stop('Saved generation retry checkpoint is invalid');
        let lastRenewal = -Infinity;
        for (;;) {
            const { current } = await active();
            if (current.processed !== item.index) return stop('Retry source checkpoint changed');
            if (current.generationRetryPolicy !== (ticket.policy ?? GENERATION_RETRY_POLICY)) {
                // Fresh manual Resume without opt-in authorizes one ordinary attempt,
                // not replay of a queued automatic ticket. Its ordinal is never refunded.
                await transaction(async session => {
                    const retired = await items.updateOne(
                        {
                            _id: item._id,
                            runId: run._id,
                            index: item.index,
                            state: 'embedding_ready',
                            initialFingerprint: item.initialFingerprint,
                            resolvedFingerprint: item.resolvedFingerprint,
                            autoRetries: ticket.attempt,
                            'generationRetry.phase': 'waiting',
                            'generationRetry.attempt': ticket.attempt,
                            'generationRetry.failureErrors': ticket.failureErrors,
                            'generationRetry.failureAt': ticket.failureAt,
                        },
                        { $set: { 'generationRetry.phase': 'abandoned' } },
                        { session }
                    );
                    if (retired.matchedCount !== 1)
                        throw new Error('Retry ticket changed before opt-out');
                    const renewed = await runs.updateOne(
                        { ...activeFilter(), processed: item.index },
                        {
                            $set: {
                                stage: 'embedding',
                                leaseUntil: new Date(Date.now() + LEASE_MS),
                                updatedAt: new Date(),
                            },
                            $unset: { retry: '', reason: '' },
                        },
                        { session }
                    );
                    if (
                        renewed.matchedCount !== 1 ||
                        !(await runs.findOne(
                            { ...activeFilter(), processed: item.index },
                            { session }
                        ))
                    )
                        throw new Error('Retry lease expired during opt-out');
                });
                return;
            }
            const now = generationRetryNow();
            if (now - lastRenewal >= 30_000) {
                const renewed = await runs.updateOne(
                    { ...activeFilter(), processed: item.index },
                    {
                        $set: {
                            stage: 'retry_wait',
                            retry: {
                                attempt: ticket.attempt,
                                maxAttempts: 3,
                                nextAttemptAt: ticket.nextAttemptAt,
                                record: item.index + 1,
                            },
                            reason: `Waiting for generation retry ${ticket.attempt} of 3 for record ${item.index + 1}; another attempt may incur charges within existing limits`,
                            leaseUntil: new Date(Date.now() + LEASE_MS),
                            updatedAt: new Date(),
                        },
                    }
                );
                if (renewed.matchedCount !== 1) return stop('Retry lease lost', true);
                lastRenewal = now;
            }
            if (now >= ticket.nextAttemptAt.getTime()) break;
            await sleepForGenerationRetry(Math.min(1_000, ticket.nextAttemptAt.getTime() - now));
        }
        const { current: ready } = await active();
        if (
            ready.generationRequests + 1 > run.maxGenerationRequests ||
            ready.privacyRequests + 3 > run.maxPrivacyRequests ||
            ready.embeddingRequests + 5 > run.maxEmbeddingRequests
        )
            return stop(
                'Insufficient remaining request budget for a generation retry; limits were not increased'
            );
        await transaction(async session => {
            const failed = await jobs.findOne(
                {
                    _id: run._id,
                    managedRunId: run._id,
                    state: 'paused',
                    cancel: false,
                    snapshotIndex: item.index,
                    errors: ticket.failureErrors,
                    'lastFailure.at': ticket.failureAt,
                    $or: [{ leaseUntil: { $exists: false } }, { leaseUntil: { $lte: new Date() } }],
                },
                { session }
            );
            if (!failed) throw new Error('Retry failure checkpoint changed');
            const claimed = await items.updateOne(
                {
                    _id: item._id,
                    runId: run._id,
                    index: item.index,
                    state: 'embedding_ready',
                    initialFingerprint: item.initialFingerprint,
                    resolvedFingerprint: item.resolvedFingerprint,
                    autoRetries: ticket.attempt,
                    'generationRetry.phase': 'waiting',
                    'generationRetry.attempt': ticket.attempt,
                    'generationRetry.failureErrors': ticket.failureErrors,
                    'generationRetry.failureAt': ticket.failureAt,
                },
                { $set: { 'generationRetry.phase': 'claimed' } },
                { session }
            );
            if (claimed.matchedCount !== 1)
                throw new Error('Retry already claimed or source changed');
            const renewed = await runs.updateOne(
                { ...activeFilter(), processed: item.index },
                {
                    $set: {
                        stage: 'embedding',
                        leaseUntil: new Date(Date.now() + LEASE_MS),
                        updatedAt: new Date(),
                    },
                    $unset: { retry: '', reason: '' },
                },
                { session }
            );
            if (
                renewed.matchedCount !== 1 ||
                !(await runs.findOne({ ...activeFilter(), processed: item.index }, { session }))
            )
                throw new Error('Retry lease expired');
        });
    };
    const scheduleGenerationRetry = async (
        item: WorkflowItem,
        before: BackfillJob,
        result: BackfillJob
    ) => {
        const { current } = await active();
        if (
            !isGenerationRetryPolicy(current.generationRetryPolicy) ||
            !isRetryableGenerationFailure(before, result, item.index, current.generationRetryPolicy)
        )
            return false;
        const used = item.autoRetries ?? 0;
        if (!Number.isInteger(used) || used < 0 || used > 3)
            return stop('Saved generation retry count is invalid');
        if (used >= GENERATION_RETRY_DELAYS_MS.length)
            return stop(
                'Automatic generation retry limit reached; run paused without advancing this record'
            );
        // A retry reruns privacy and may reach all five embeddings. Never raise caps.
        if (
            current.generationRequests + 1 > run.maxGenerationRequests ||
            current.privacyRequests + 3 > run.maxPrivacyRequests ||
            current.embeddingRequests + 5 > run.maxEmbeddingRequests
        )
            return stop(
                'Insufficient remaining request budget for a generation retry; limits were not increased'
            );
        const attempt = used + 1;
        const nextAttemptAt = new Date(generationRetryNow() + GENERATION_RETRY_DELAYS_MS[used]!);
        await transaction(async session => {
            const failed = await jobs.findOne(
                {
                    _id: run._id,
                    managedRunId: run._id,
                    state: 'paused',
                    cancel: false,
                    snapshotIndex: item.index,
                    errors: result.errors,
                    cursor: before.cursor,
                    written: before.written,
                    skipped: before.skipped,
                    lastError: 'record_failed_or_budget_exhausted_cursor_preserved',
                    $or: [{ leaseUntil: { $exists: false } }, { leaseUntil: { $lte: new Date() } }],
                },
                { session }
            );
            if (
                !failed ||
                !isRetryableGenerationFailure(
                    before,
                    failed,
                    item.index,
                    current.generationRetryPolicy
                ) ||
                failed.lastFailure?.at !== result.lastFailure?.at
            )
                throw new Error('Failed attempt changed before retry checkpoint');
            const saved = await items.updateOne(
                {
                    _id: item._id,
                    runId: run._id,
                    index: item.index,
                    state: 'embedding_ready',
                    initialFingerprint: item.initialFingerprint,
                    resolvedFingerprint: item.resolvedFingerprint,
                    ...(used
                        ? { autoRetries: used }
                        : { $or: [{ autoRetries: 0 }, { autoRetries: { $exists: false } }] }),
                    'generationRetry.failureErrors': { $ne: result.errors },
                },
                {
                    $inc: { autoRetries: 1 },
                    $set: {
                        generationRetry: {
                            ...(current.generationRetryPolicy === GENERATION_RETRY_POLICY
                                ? {}
                                : { policy: current.generationRetryPolicy }),
                            attempt,
                            failureErrors: result.errors,
                            failureAt: result.lastFailure!.at,
                            nextAttemptAt,
                            phase: 'waiting',
                        },
                    },
                },
                { session }
            );
            if (saved.matchedCount !== 1) throw new Error('Generation retry already scheduled');
            const savedRun = await runs.updateOne(
                { ...activeFilter(), processed: item.index },
                {
                    $set: {
                        stage: 'retry_wait',
                        retry: { attempt, maxAttempts: 3, nextAttemptAt, record: item.index + 1 },
                        reason: `Waiting for generation retry ${attempt} of 3 for record ${item.index + 1}; another attempt may incur charges within existing limits`,
                        leaseUntil: new Date(Date.now() + LEASE_MS),
                        updatedAt: new Date(),
                    },
                },
                { session }
            );
            if (
                savedRun.matchedCount !== 1 ||
                !(await runs.findOne({ ...activeFilter(), processed: item.index }, { session }))
            )
                throw new Error('Retry lease expired before scheduling');
        });
        return true;
    };
    try {
        for (;;) {
            const { current, plan } = await active();
            if (recoveryPass && current.processed !== recoveryPass.index)
                return stop('Single recovery pass completed; paused before the next record');
            if (current.processed >= run.recordLimit) break;
            const index = current.processed;
            let item = await items.findOne({
                _id: `${run._id}:${index}`,
                runId: run._id,
                index,
            });
            const entry = plan.snapshot[index];
            if (
                !item ||
                item.sourceId !== entry.id ||
                item.initialFingerprint !== entry.fingerprint ||
                item.originalHash !== entry.originalHash
            )
                return await stop('Reviewed workflow item changed');
            const job = await jobs.findOne({ _id: run._id, managedRunId: run._id });
            if (!job || digest(job.snapshot) !== digest(plan.snapshot))
                return await stop('Managed snapshot changed');
            if (recoveryPass && item.state !== 'embedding_ready')
                return stop('Recovery source is no longer verified');
            if (recoveryPass) {
                const grant = supplementalRecoverySchema.safeParse(item.supplementalRecovery);
                if (
                    !grant.success ||
                    grant.data.id !== recoveryPass.id ||
                    grant.data.phase !== 'running' ||
                    grant.data.expiresAt.getTime() <= Date.now()
                )
                    return stop('Recovery pass expired or unavailable');
            }
            if (item.state === 'pending') {
                await runs.updateOne(activeFilter(), {
                    $set: { stage: 'verification' },
                });
                const source = await sourceFor(item);
                let blocked: string | undefined;
                if (!source)
                    blocked = /^[0-9a-f]{24}$/i.test(item.sourceId)
                        ? 'missing_source'
                        : 'missing_source_identity';
                else if (workflowSourceFingerprint(source) !== item.initialFingerprint)
                    blocked = 'source_changed';
                else if (
                    typeof source.did !== 'string' ||
                    !source.did.startsWith('did:') ||
                    typeof source.uri !== 'string' ||
                    !source.uri.trim()
                )
                    blocked = 'missing_source_identity';
                if (blocked) {
                    await finish(item, 'blocked', blocked);
                    continue;
                }
                const operation: WorkflowOperation = {
                    runId: run._id,
                    lease: run.lease!,
                    index,
                    initialFingerprint: item.initialFingerprint,
                    originalHash: item.originalHash,
                };
                if (!source!.verification) {
                    const generated =
                        source!.source === 'generated' ||
                        source!.category === AI_INSIGHT_CREDENTIAL_TYPE;
                    if (generated) {
                        const result = await inspectWorkflowGeneratedSource(
                            source! as never,
                            operation,
                            async () => {
                                await active();
                            }
                        );
                        item = (await items.findOne({ _id: item._id }))!;
                        if (item.state !== 'embedding_ready') blocked = result.outcome;
                    } else {
                        const preview = await inspectLegacySource(
                            source! as never,
                            false,
                            undefined,
                            async () => {
                                await active();
                            }
                        );
                        if (preview.outcome !== 'eligible' || !preview.revision)
                            blocked = preview.outcome;
                        else {
                            const fingerprint = repairSourceFingerprint(source);
                            await transaction(async session => {
                                const saved = await items.updateOne(
                                    {
                                        _id: item!._id,
                                        state: 'pending',
                                        initialFingerprint: item!.initialFingerprint,
                                    },
                                    {
                                        $set: {
                                            repairFingerprint: fingerprint,
                                            revision: preview.revision,
                                        },
                                    },
                                    { session }
                                );
                                if (saved.matchedCount !== 1)
                                    throw new Error('Workflow repair claim changed');
                            });
                            const result = await inspectLegacySource(
                                source! as never,
                                true,
                                { fingerprint, revision: preview.revision },
                                async () => {
                                    await active();
                                },
                                operation
                            );
                            item = (await items.findOne({ _id: item._id }))!;
                            if (item.state !== 'embedding_ready') blocked = result.outcome;
                        }
                    }
                } else {
                    blocked = metadataExclusionReason(source!);
                    if (!blocked) {
                        try {
                            await withOwnerOperation(source!.did!, () =>
                                runWithAiPrivacyContext(source!.did!, async () => {
                                    const receipt = await assertCurrentAiConsent('embedding');
                                    if (
                                        source!.verification?.consent?.revision !== receipt.revision
                                    ) {
                                        blocked = 'consent_revision_changed';
                                        return;
                                    }
                                    if (
                                        source!.source !== 'generated' &&
                                        !receipt.credentialUris.includes(source!.uri!)
                                    ) {
                                        blocked = 'outside_consent_scope';
                                        return;
                                    }
                                    const recheck = async () => {
                                        await active();
                                        const fresh = await assertCurrentAiConsent('embedding');
                                        if (
                                            fresh.revision !== receipt.revision ||
                                            (source!.source !== 'generated' &&
                                                !fresh.credentialUris.includes(source!.uri!))
                                        )
                                            throw new Error('Consent changed');
                                    };
                                    if (
                                        !(await db.prepareWorkflowEmbedding(
                                            source!.did!,
                                            new ObjectId(item!.sourceId),
                                            item!.initialFingerprint,
                                            receipt.revision,
                                            recheck,
                                            operation
                                        ))
                                    )
                                        blocked = 'source_changed';
                                })
                            );
                        } catch (error) {
                            await active();
                            blocked = reasonFor(error);
                        }
                        item = (await items.findOne({ _id: item._id }))!;
                    }
                }
                await active();
                if (blocked) {
                    await finish(item, 'blocked', blocked);
                    continue;
                }
                if (item.state !== 'embedding_ready')
                    return await stop('Source verification checkpoint unavailable');
            }
            if (item.state !== 'embedding_ready')
                return await stop('Unexpected workflow item state');
            await waitForScheduledRetry(item);
            await runs.updateOne(activeFilter(), { $set: { stage: 'embedding' } });
            const observation = await observe(item);
            if (observation.reason) {
                await finish(item, 'blocked', observation.reason);
                continue;
            }
            const before = await jobs.findOne({
                _id: run._id,
                managedRunId: run._id,
            });
            if (!before) return await stop('Managed job unavailable');
            if (observation.complete) {
                await finish(
                    item,
                    item.attemptBaseline && before.written > item.attemptBaseline.written
                        ? 'written'
                        : 'already_complete'
                );
                continue;
            }
            if ((before.snapshotIndex ?? 0) > index) {
                const reason =
                    Object.entries(before.skipReasons ?? {}).find(
                        ([key, count]) => count > (item!.attemptBaseline?.skipReasons?.[key] ?? 0)
                    )?.[0] ?? 'embedding_reconciliation_incomplete';
                await finish(item, 'blocked', reason);
                continue;
            }
            const baseline = {
                written: before.written,
                skipped: before.skipped,
                errors: before.errors,
                skipReasons: before.skipReasons ?? {},
            };
            await transaction(async session => {
                const saved = await items.updateOne(
                    { _id: item!._id, state: 'embedding_ready' },
                    { $set: { attemptBaseline: baseline } },
                    { session }
                );
                if (saved.matchedCount !== 1) throw new Error('Workflow item changed');
            });
            const reserve = async (kind: UsageKind, ordinal?: number) => {
                await active();
                const freshItem = await items.findOne({
                    _id: item!._id,
                    state: 'embedding_ready',
                    initialFingerprint: entry.fingerprint,
                });
                const source = await sourceFor(item!);
                if (
                    !freshItem ||
                    freshItem.resolvedFingerprint !== item!.resolvedFingerprint ||
                    !source ||
                    runSourceFingerprint(source) !== item!.resolvedFingerprint
                )
                    return stop('Verified source changed; inspect before explicit resume');
                const field = (
                    {
                        generation: 'generationRequests',
                        embedding: 'embeddingRequests',
                        privacy: 'privacyRequests',
                    } as const
                )[kind];
                const cap = (
                    {
                        generation: 'maxGenerationRequests',
                        embedding: 'maxEmbeddingRequests',
                        privacy: 'maxPrivacyRequests',
                    } as const
                )[kind];
                if (recoveryPass) {
                    const grant = supplementalRecoverySchema.parse(freshItem.supplementalRecovery);
                    const receipt = await assertCurrentAiConsent(
                        kind === 'embedding' ? 'embedding' : 'model-inference'
                    );
                    if (
                        grant.id !== recoveryPass.id ||
                        grant.phase !== 'running' ||
                        grant.expiresAt.getTime() <= Date.now() ||
                        grant.modelIdentity !== NOVA_IDENTITY ||
                        grant.sourceFingerprint !== item!.resolvedFingerprint ||
                        grant.consentRevision !== receipt.revision ||
                        source.embeddingEpoch !== grant.sourceEpoch ||
                        (source.source !== 'generated' &&
                            !receipt.credentialUris.includes(source.uri!))
                    )
                        return stop('Recovery source, consent or authorization changed');
                    if (
                        kind === 'embedding' &&
                        (!Number.isInteger(ordinal) || ordinal! < 1 || ordinal! > 5)
                    )
                        return stop('Recovery embedding ordinal unavailable');
                    await transaction(async session => {
                        const changed = await items.updateOne(
                            {
                                _id: item!._id,
                                state: 'embedding_ready',
                                resolvedFingerprint: grant.sourceFingerprint,
                                'supplementalRecovery.id': grant.id,
                                'supplementalRecovery.phase': 'running',
                                'supplementalRecovery.expiresAt': { $gt: new Date() },
                                [`supplementalRecovery.used.${kind}`]: {
                                    $lt: RECOVERY_PASS_CAPS[kind],
                                },
                                ...(kind === 'embedding'
                                    ? {
                                          [`supplementalRecovery.embeddingOrdinals.${ordinal! - 1}`]: 0,
                                      }
                                    : {}),
                            },
                            {
                                $inc: {
                                    [`supplementalRecovery.used.${kind}`]: 1,
                                    ...(kind === 'embedding'
                                        ? {
                                              [`supplementalRecovery.embeddingOrdinals.${ordinal! - 1}`]: 1,
                                          }
                                        : {}),
                                },
                            },
                            { session }
                        );
                        if (changed.matchedCount !== 1)
                            throw new Error('Recovery pass request allowance exhausted');
                        const global = await runs.updateOne(
                            { ...activeFilter(), [field]: { $lt: run[cap] } },
                            { $inc: { [field]: 1 }, $set: { updatedAt: new Date() } },
                            { session }
                        );
                        if (global.matchedCount !== 1)
                            throw new Error('Original run request budget exhausted');
                    });
                    return;
                }
                const result = await runs.updateOne(
                    { ...activeFilter(), [field]: { $lt: run[cap] } },
                    { $inc: { [field]: 1 }, $set: { updatedAt: new Date() } }
                );
                if (result.matchedCount !== 1)
                    return stop('Provider request budget exhausted or run stopped');
            };
            const result = await withProviderBudget(reserve, () =>
                withSingleRecoveryPass(
                    recoveryPass
                        ? {
                              runId: run._id,
                              record: index + 1,
                              sourceFingerprint: item!.resolvedFingerprint!,
                              baselineAttempts: supplementalRecoverySchema.parse(
                                  item!.supplementalRecovery
                              ).baselineAttempts,
                              reserveEmbedding: ordinal => reserve('embedding', ordinal),
                          }
                        : undefined,
                    () =>
                        stepJob(
                            run._id,
                            1,
                            async (requiredRemainingMs = 0) => {
                                await active(requiredRemainingMs);
                            },
                            undefined,
                            run._id
                        )
                )
            );
            if (!result || result.lastError || result.errors > before.errors) {
                if (
                    !recoveryPass &&
                    result &&
                    (await scheduleGenerationRetry(item, before, result))
                )
                    continue;
                return await stop(backfillPauseReason(result?.lastFailure));
            }
            if (result.written > before.written) await finish(item, 'written');
            else {
                const reason =
                    Object.entries(result.skipReasons ?? {}).find(
                        ([key, count]) =>
                            count >
                            (before.skipReasons?.[key as keyof typeof before.skipReasons] ?? 0)
                    )?.[0] ?? 'embedding_incomplete';
                await finish(
                    item,
                    reason === 'already_complete' ? 'already_complete' : 'blocked',
                    reason === 'already_complete' ? undefined : reason
                );
            }
        }
        await runs.updateOne(activeFilter(), { $set: { stage: 'reconciliation' } });
        for (;;) {
            const { current } = await active();
            const index = current.reconciled ?? 0;
            if (index >= run.recordLimit) break;
            const item = await items.findOne({
                _id: `${run._id}:${index}`,
                runId: run._id,
            });
            if (!item || !['written', 'already_complete', 'blocked'].includes(item.state))
                return await stop('Workflow reconciliation checkpoint missing');
            const result = item.state === 'blocked' ? { complete: false } : await observe(item);
            const reason =
                item.state !== 'blocked' && !result.complete
                    ? (result.reason ?? 'embedding_reconciliation_incomplete')
                    : undefined;
            await transaction(async session => {
                const done = await items.updateOne(
                    { _id: item._id, reconciled: { $ne: true } },
                    {
                        $set: {
                            reconciled: true,
                            ...(reason ? { state: 'blocked', reason } : {}),
                        },
                    },
                    { session }
                );
                if (done.matchedCount !== 1) throw new Error('Workflow reconciliation changed');
                const oldField = item.state === 'written' ? 'written' : 'alreadyComplete';
                const advanced = await runs.updateOne(
                    { ...activeFilter(), reconciled: index },
                    {
                        $inc: {
                            reconciled: 1,
                            ...(reason
                                ? {
                                      [oldField]: -1,
                                      blocked: 1,
                                      [`blockedReasons.${reason}`]: 1,
                                  }
                                : {}),
                        },
                        $set: {
                            leaseUntil: new Date(Date.now() + LEASE_MS),
                            updatedAt: new Date(),
                        },
                    },
                    { session }
                );
                if (advanced.matchedCount !== 1) throw new Error('Workflow reconciliation changed');
            });
        }
        const { current } = await active();
        if (
            current.processed !== run.recordLimit ||
            current.written + (current.alreadyComplete ?? 0) + (current.blocked ?? 0) !==
                run.recordLimit ||
            current.reconciled !== run.recordLimit
        )
            return await stop('Workflow accounting did not reconcile');
        await runs.updateOne(activeFilter(), {
            $set: {
                state: current.blocked ? 'completed_with_blockers' : 'completed',
                stage: 'finished',
                reason: current.blocked
                    ? 'Selected snapshot reconciled with blocked records; see reasons'
                    : 'Every selected credential is reconciled with complete Nova coverage',
                updatedAt: new Date(),
            },
        });
    } catch {
        await runs
            .updateOne(
                { ...owned, state: 'running' },
                {
                    $set: {
                        state: 'interrupted',
                        reason: 'Workflow interrupted; fresh login and explicit resume required',
                        updatedAt: new Date(),
                    },
                }
            )
            .catch(() => {});
    } finally {
        await runs.updateOne(owned, { $unset: { lease: '', leaseUntil: '' } });
        const current = await runs.findOne({ _id: run._id });
        if (current) await releaseTerminal(current);
    }
}

// Metadata-only diagnostic: no source writes, erasure lookups, vector or provider calls.
export async function diagnoseMetadata() {
    const rows = await (
        await database()
    )
        .collection<RunSource>('credentials')
        .find({}, { projection: RUN_SOURCE_PROJECTION, maxTimeMS: 5000 })
        .sort({ _id: 1 })
        .limit(INVENTORY_LIMIT + 1)
        .toArray();
    const reasons: Partial<Record<ExclusionReason, number>> = {};
    let metadataEligible = 0;
    for (const source of rows.slice(0, INVENTORY_LIMIT)) {
        const reason = metadataExclusionReason(source);
        if (reason) reasons[reason] = (reasons[reason] ?? 0) + 1;
        else metadataEligible += 1;
    }
    const scanned = Math.min(rows.length, INVENTORY_LIMIT);
    return {
        scanned,
        metadataEligible,
        excluded: scanned - metadataEligible,
        exclusionReasons: reasons,
        limit: INVENTORY_LIMIT,
        incomplete: rows.length > INVENTORY_LIMIT,
        scope: 'current_metadata_only',
        observedAt: new Date().toISOString(),
    };
}
