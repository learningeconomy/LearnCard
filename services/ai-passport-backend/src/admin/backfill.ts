import { currentSingleRecoveryPass } from './supplemental-recovery';
import { managedEmbeddingRecovery, type EmbeddingRecoveryLedger } from './embedding-recovery';
import { withEmbeddingRecovery } from '../ai/embedding-recovery';
import { withEmbeddingUnitDeadline } from '../ai/embedding-diagnostics';
import {
    LEGACY_UNIT_TIMEOUT_MS,
    MANAGED_UNIT_TIMEOUT_MS,
    MANAGED_LEASE_MARGIN_MS,
    managedGenerationOptions,
} from './backfill-timeouts';
import { runSourceFingerprint, type SnapshotEntry } from './run-model';
import { createUsageMeter, withUsageMeter, type UsageMeter } from '../ai/usage-meter';
import {
    retainDispatchedFailure,
    createBackfillFailure,
    type BackfillFailure,
    type BackfillFailureStage,
} from './backfill-diagnostics';
import { addUsageAttempt, usageCostSummary, type UsageLedger } from './usage-cost';
import { costPricing, estimateCosts } from './cost-model';
import { recordSkip as recordOrdinarySkip, type SkipCounters } from './skip-reasons';
import { MongoClient, ObjectId, type Collection } from 'mongodb';
import { randomUUID } from 'node:crypto';
import { MONGO_URI, MONGO_DB } from '../constants/env';
import { withOwnerOperation, isDataErasureRequested } from '../services/dataErasure';
import { runWithAiPrivacyContext, assertCurrentAiConsent } from '../ai/privacy';
import {
    withEmbeddingGeneration,
    assertNovaEnabled,
    NOVA_IDENTITY,
} from '../ai/embedding-generation';
import { db, type DBCredentialRecord } from '../db';
import { generateAndStoreCredentialEmbeddings } from '../ai/embeddings';
import { generateCredentialEmbeddingTexts } from '../ai/embedding-texts';
import {
    getCredentialProjection,
    serializeModelSafeCredentialProjection,
} from '../credentials/projection';
import { getCredentialVectorCoverage } from '../db/qdrant';

export type BackfillJob = SkipCounters & {
    _id: string;
    managedRunId?: string;
    workflowVersion?: 2;
    snapshot?: SnapshotEntry[];
    snapshotIndex?: number;
    generation: string;
    regenerationAuthorized: boolean;
    corpusComplete?: boolean;
    continuationOf?: string;
    maxRecords: number;
    maxRepresentationCalls: number;
    maxEmbeddingRequests: number;
    dryRun: boolean;
    state: 'ready' | 'running' | 'paused' | 'cancelled' | 'completed';
    // Credentials only. "messages" can appear on a job written by an earlier
    // build; such a job completes without reading any message.
    kind: 'credentials' | 'messages';
    cursor: string;
    highWater: { credentials: string; messages?: string };
    scanned: number;
    written: number;
    skipped: number;
    errors: number;
    lastError?: string;
    lastFailure?: BackfillFailure;
    lastDispatchedFailure?: BackfillFailure;
    cancel: boolean;
    lease?: string;
    leaseUntil?: Date;
    createdAt: Date;
    updatedAt: Date;
    representationCalls: number;
    embeddingRequests: number;
    usage?: UsageLedger;
    embeddingRecovery?: EmbeddingRecoveryLedger;
};
let mongo: MongoClient | undefined;
async function database() {
    mongo ??= new MongoClient(MONGO_URI, {
        writeConcern: { w: 'majority', journal: true },
    });
    await mongo.connect();
    return mongo.db(MONGO_DB);
}
async function jobs(): Promise<Collection<BackfillJob>> {
    return (await database()).collection<BackfillJob>('embedding_backfill_jobs');
}
const enabled = () => {
    if (process.env.EMBEDDINGS_ADMIN_ENABLED !== 'true')
        throw new Error('Embedding administration disabled');
};
export async function listJobs() {
    enabled();
    return (await jobs())
        .find({ managedRunId: { $exists: false } }, { projection: { lease: 0 } })
        .sort({ createdAt: -1 })
        .limit(20)
        .toArray();
}
export async function createJob(
    dryRun: boolean,
    requestId: string,
    regenerationAuthorized = false,
    continuationOf?: string
) {
    enabled();
    if (!dryRun) {
        assertNovaEnabled();
        if (!regenerationAuthorized)
            throw new Error('Explicit regeneration authorization required');
    }
    const existing = await (await jobs()).findOne({ _id: requestId });
    if (existing) {
        if (existing.managedRunId) throw new Error('Managed run requires run controls');
        if (
            existing.dryRun !== dryRun ||
            existing.regenerationAuthorized !== regenerationAuthorized ||
            (existing.continuationOf ?? undefined) !== continuationOf
        )
            throw new Error('Idempotency key conflict');
        return existing;
    }
    const prior = continuationOf
        ? await (
              await jobs()
          ).findOne({
              _id: continuationOf,
              state: 'completed',
              corpusComplete: false,
              managedRunId: { $exists: false },
          })
        : null;
    if (continuationOf && (!prior || prior.dryRun !== dryRun))
        throw new Error('Continuation requires a budget-completed job');
    const databaseValue = await database();
    const highWater: BackfillJob['highWater'] = {
        credentials: String(
            (
                await databaseValue
                    .collection('credentials')
                    .find({}, { projection: { _id: 1 } })
                    .sort({ _id: -1 })
                    .limit(1)
                    .next()
            )?._id ?? ''
        ),
    };
    const job: BackfillJob = {
        _id: requestId,
        regenerationAuthorized,
        maxRecords: 100,
        maxRepresentationCalls: 100,
        maxEmbeddingRequests: 600,
        generation: NOVA_IDENTITY,
        dryRun,
        state: 'ready',
        kind: prior?.kind ?? 'credentials',
        cursor: prior?.cursor ?? '',
        highWater: prior?.highWater ?? highWater,
        continuationOf,
        scanned: 0,
        written: 0,
        skipped: 0,
        skipReasons: {},
        dryRunObserved: 0,
        errors: 0,
        cancel: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        representationCalls: 0,
        embeddingRequests: 0,
    };
    await (await jobs()).insertOne(job);
    return job;
}
export async function cancelJob(id: string) {
    enabled();
    const store = await jobs();
    if (await store.findOne({ _id: id, managedRunId: { $exists: true } }))
        throw new Error('Managed run requires run controls');
    await store.updateOne(
        { _id: id, managedRunId: { $exists: false }, state: { $ne: 'completed' } },
        { $set: { cancel: true, state: 'cancelled', updatedAt: new Date() } }
    );
}
export async function stepJob(
    id: string,
    limit = 1,
    externalGuard: (requiredRemainingMs?: number) => Promise<void> = async () => {},
    batchId?: string,
    managedRunId?: string
) {
    enabled();
    if (!Number.isInteger(limit) || limit < 1 || limit > 5)
        throw new Error('Batch limit must be 1–5');
    const store = await jobs();
    const lease = randomUUID();
    const now = new Date();
    const job = await store.findOneAndUpdate(
        {
            _id: id,
            cancel: false,
            ...(managedRunId ? { managedRunId } : { managedRunId: { $exists: false } }),
            ...(batchId ? { batchId } : { batchId: { $exists: false } }),
            state: { $in: ['ready', 'paused', 'running'] },
            $or: [{ leaseUntil: { $lt: now } }, { leaseUntil: { $exists: false } }],
        },
        {
            $set: {
                state: 'running',
                lease,
                leaseUntil: new Date(Date.now() + 600000),
            },
        },
        { returnDocument: 'after' }
    );
    if (!job) throw new Error('Job unavailable or another batch owns its lease');
    const assertJobActive = async (requiredRemainingMs = 0) => {
        await externalGuard(requiredRemainingMs);
        const active = await store.findOne({
            _id: id,
            lease,
            cancel: false,
            leaseUntil: { $gt: new Date(Date.now() + requiredRemainingMs) },
        });
        if (!active) throw new Error('Job cancelled, lease lost or insufficient deadline headroom');
    };
    let failureStage: BackfillFailureStage = 'job_guard';
    let failureRecord = Math.max(
        1,
        Math.min(job.maxRecords, (job.snapshotIndex ?? job.scanned) + 1)
    );
    let providerPipelineEntered = false;
    let attemptMeter: UsageMeter | undefined;
    let clearLastFailure = false;
    let clearDispatchedFailure = false;
    const controller = new AbortController();
    const timer = setInterval(() => {
        void store
            .findOne({ _id: id, lease, leaseUntil: { $gt: new Date() } })
            .then(value => {
                if (!value || value.cancel) controller.abort();
                return externalGuard().catch(() => controller.abort());
            })
            .catch(() => controller.abort());
    }, 250);
    try {
        if (!job.dryRun) {
            assertNovaEnabled();
            if (process.env.EMBEDDINGS_DUAL_WRITE !== 'true')
                throw new Error('Enable dual ingestion writes before applying backfill');
        }
        for (let count = 0; count < limit; count++) {
            failureStage = 'job_guard';
            failureRecord = Math.max(
                1,
                Math.min(job.maxRecords, (job.snapshotIndex ?? job.scanned) + 1)
            );
            providerPipelineEntered = false;
            attemptMeter = undefined;
            await assertJobActive();
            if (job.kind !== 'credentials') {
                job.state = 'completed';
                job.corpusComplete = true;
                break;
            }
            if ((job.snapshot ? (job.snapshotIndex ?? 0) : job.scanned) >= job.maxRecords) {
                job.state = 'completed';
                job.corpusComplete = Boolean(job.snapshot);
                break;
            }
            const current = await store.findOne({
                _id: id,
                lease,
                leaseUntil: { $gt: new Date() },
            });
            if (!current || current.cancel) break;
            failureStage = 'source_read';
            const source = (await database()).collection(job.kind);
            const high = job.highWater[job.kind];
            const snapshotEntry = job.snapshot?.[job.snapshotIndex ?? 0];
            const workflowItem =
                job.workflowVersion === 2
                    ? await (await database()).collection('embedding_backfill_items').findOne({
                          _id: `${id}:${job.snapshotIndex ?? 0}`,
                          runId: id,
                          index: job.snapshotIndex ?? 0,
                          sourceId: snapshotEntry?.id,
                          initialFingerprint: snapshotEntry?.fingerprint,
                          state: 'embedding_ready',
                      } as never)
                    : undefined;
            if (
                job.workflowVersion === 2 &&
                (!workflowItem || typeof workflowItem.resolvedFingerprint !== 'string')
            )
                throw new Error('Managed source is not verified for embedding');
            const expectedFingerprint =
                job.workflowVersion === 2
                    ? workflowItem!.resolvedFingerprint
                    : snapshotEntry?.fingerprint;
            const row = job.snapshot
                ? snapshotEntry
                    ? await source.findOne(
                          { _id: new ObjectId(snapshotEntry.id) },
                          { projection: { _id: 1, did: 1 } }
                      )
                    : null
                : high
                  ? await source.findOne(
                        {
                            _id: {
                                ...(job.cursor ? { $gt: new ObjectId(job.cursor) } : {}),
                                $lte: new ObjectId(high),
                            },
                        },
                        { sort: { _id: 1 }, projection: { _id: 1, did: 1 } }
                    )
                  : null;
            if (!row && job.snapshot) {
                if (!snapshotEntry) {
                    job.state = 'completed';
                    job.corpusComplete = true;
                    break;
                }
                recordSkip(job, 'missing_source');
                job.scanned += 1;
                job.snapshotIndex = (job.snapshotIndex ?? 0) + 1;
                continue;
            }
            if (!row) {
                job.state = 'completed';
                job.corpusComplete = true;
                break;
            }
            job.scanned += 1;
            if (job.dryRun) {
                job.representationCalls += 1;
                job.embeddingRequests += 5;
                job.dryRunObserved = (job.dryRunObserved ?? 0) + 1;
            } else if (typeof row.did !== 'string' || !row.did.startsWith('did:')) {
                recordSkip(job, 'missing_owner');
            } else {
                const beforeCalls = job.representationCalls + job.embeddingRequests;
                const beforeWritten = job.written;
                const meter = createUsageMeter();
                attemptMeter = meter;
                failureStage = 'consent';
                try {
                    const managedCredential = Boolean(
                        job.managedRunId && job.kind === 'credentials'
                    );
                    const unitTimeoutMs = managedCredential
                        ? MANAGED_UNIT_TIMEOUT_MS
                        : LEGACY_UNIT_TIMEOUT_MS;
                    failureStage = 'job_guard';
                    await assertJobActive(
                        managedCredential ? unitTimeoutMs + MANAGED_LEASE_MARGIN_MS : 0
                    );
                    failureStage = 'consent';
                    await withUsageMeter(meter, () =>
                        withOwnerOperation(row.did, ownerSignal => {
                            const unitDeadline = Date.now() + unitTimeoutMs;
                            const signal = AbortSignal.any([
                                ownerSignal,
                                controller.signal,
                                AbortSignal.timeout(unitTimeoutMs),
                            ]);
                            const supplemental = currentSingleRecoveryPass();
                            if (
                                supplemental &&
                                (supplemental.runId !== id ||
                                    supplemental.record !== failureRecord ||
                                    supplemental.sourceFingerprint !== expectedFingerprint ||
                                    !managedCredential ||
                                    job.workflowVersion !== 2)
                            )
                                throw new Error('Recovery pass binding changed');
                            const recovery =
                                managedCredential &&
                                job.workflowVersion === 2 &&
                                expectedFingerprint
                                    ? managedEmbeddingRecovery({
                                          store,
                                          id,
                                          lease,
                                          record: failureRecord,
                                          fingerprint: expectedFingerprint,
                                          deadline: unitDeadline,
                                          active: () => assertJobActive(),
                                          ...(supplemental ? { supplemental } : {}),
                                      })
                                    : undefined;
                            return withEmbeddingRecovery(recovery, () =>
                                withEmbeddingUnitDeadline(unitDeadline, () =>
                                    runWithAiPrivacyContext(row.did, () =>
                                        withEmbeddingGeneration('nova1024v1', async () => {
                                            signal.throwIfAborted();
                                            const receipt =
                                                await assertCurrentAiConsent('embedding');
                                            failureStage = 'source_read';
                                            const record = await db.getEmbeddingBackfillSource(
                                                row.did,
                                                'credentials',
                                                row._id
                                            );
                                            if (!record) {
                                                recordSkip(job, 'missing_source');
                                                return;
                                            }
                                            if (job.kind === 'credentials') {
                                                const credential =
                                                    record as unknown as DBCredentialRecord;
                                                if (
                                                    snapshotEntry &&
                                                    runSourceFingerprint(record) !==
                                                        expectedFingerprint
                                                )
                                                    throw new Error('snapshot_source_changed');
                                                if (!credential.verification) {
                                                    recordSkip(job, 'missing_verification');
                                                    return;
                                                }
                                                if (!credential.verification.consent?.revision) {
                                                    recordSkip(job, 'missing_consent_revision');
                                                    return;
                                                }
                                                if (
                                                    credential.verification.consent.revision !==
                                                    receipt.revision
                                                ) {
                                                    recordSkip(job, 'consent_revision_changed');
                                                    return;
                                                }
                                                if (
                                                    credential.source !== 'generated' &&
                                                    !receipt.credentialUris.includes(credential.uri)
                                                ) {
                                                    recordSkip(job, 'outside_consent_scope');
                                                    return;
                                                }
                                                failureStage = 'coverage';
                                                const coverage = await getCredentialVectorCoverage(
                                                    row.did,
                                                    [credential.uri],
                                                    {
                                                        contentHash:
                                                            credential.verification!.contentHash,
                                                        sourceEpoch:
                                                            credential.embeddingEpoch ?? null,
                                                        consentRevision: receipt.revision,
                                                    }
                                                );
                                                if (coverage.get(credential.uri)?.size === 5) {
                                                    recordSkip(job, 'already_complete');
                                                    return;
                                                }
                                                failureStage = 'projection';
                                                const projection =
                                                    getCredentialProjection(credential);
                                                const representationInput =
                                                    serializeModelSafeCredentialProjection(
                                                        projection
                                                    );
                                                if (
                                                    Buffer.byteLength(representationInput) > 16384
                                                ) {
                                                    if (
                                                        job.managedRunId &&
                                                        job.workflowVersion === 2
                                                    ) {
                                                        // A deterministic source limit, before any provider dispatch.
                                                        // Let the workflow account for this item and continue.
                                                        recordSkip(
                                                            job,
                                                            'representation_input_too_large'
                                                        );
                                                        return;
                                                    }
                                                    throw new Error(
                                                        'representation_input_exceeds_budget'
                                                    );
                                                }
                                                failureStage = 'job_guard';
                                                if (
                                                    !job.regenerationAuthorized ||
                                                    (!job.managedRunId &&
                                                        (job.representationCalls >=
                                                            job.maxRepresentationCalls ||
                                                            job.embeddingRequests + 5 >
                                                                job.maxEmbeddingRequests))
                                                )
                                                    throw new Error('provider_budget_exhausted');
                                                // A restart cannot discard an exhausted embedding ledger and
                                                // incur another generation before discovering it cannot embed.
                                                await recovery?.assertAvailable();
                                                job.representationCalls += 1;
                                                job.embeddingRequests += 5;
                                                failureStage = 'checkpoint';
                                                await store.updateOne(
                                                    {
                                                        _id: id,
                                                        lease,
                                                        cancel: false,
                                                        leaseUntil: { $gt: new Date() },
                                                    },
                                                    {
                                                        $set: {
                                                            representationCalls:
                                                                job.representationCalls,
                                                            embeddingRequests:
                                                                job.embeddingRequests,
                                                        },
                                                    }
                                                );
                                                failureStage = 'job_guard';
                                                await assertJobActive();
                                                // Recheck remaining lease headroom after source/coverage work, before privacy/provider dispatch.
                                                if (managedCredential)
                                                    await assertJobActive(
                                                        Math.max(0, unitDeadline - Date.now()) +
                                                            MANAGED_LEASE_MARGIN_MS
                                                    );
                                                failureStage = 'generation';
                                                const generationOptions = managedCredential
                                                    ? managedGenerationOptions(signal, unitDeadline)
                                                    : { signal };
                                                providerPipelineEntered = true;
                                                const texts =
                                                    await generateCredentialEmbeddingTexts(
                                                        representationInput,
                                                        {
                                                            ...generationOptions,
                                                            maxOutputTokens: 4096,
                                                        }
                                                    );
                                                generationOptions.signal.throwIfAborted();
                                                signal.throwIfAborted();
                                                failureStage = 'source_recheck';
                                                const fresh = (await db.getEmbeddingBackfillSource(
                                                    row.did,
                                                    'credentials',
                                                    row._id
                                                )) as unknown as DBCredentialRecord | null;
                                                if (
                                                    !fresh ||
                                                    (snapshotEntry &&
                                                        runSourceFingerprint(
                                                            fresh as unknown as typeof record
                                                        ) !== expectedFingerprint) ||
                                                    fresh.verification?.contentHash !==
                                                        credential.verification?.contentHash ||
                                                    fresh.verification?.consent.revision !==
                                                        receipt.revision
                                                )
                                                    throw new Error('source_changed');
                                                failureStage = 'job_guard';
                                                await assertJobActive();
                                                failureStage = 'embedding';
                                                await generateAndStoreCredentialEmbeddings(
                                                    credential,
                                                    texts,
                                                    row.did,
                                                    true,
                                                    signal
                                                );
                                            }
                                            failureStage = 'final_consent';
                                            await assertCurrentAiConsent('embedding');
                                            signal.throwIfAborted();
                                            job.written += 1;
                                        })
                                    )
                                )
                            );
                        })
                    );
                } catch (error) {
                    const name = error instanceof Error ? error.name : '';
                    if (
                        (name === 'AiConsentError' &&
                            beforeCalls === job.representationCalls + job.embeddingRequests) ||
                        (name === 'DataErasureRequestedError' &&
                            (await isDataErasureRequested(row.did)))
                    )
                        recordSkip(
                            job,
                            name === 'DataErasureRequestedError'
                                ? 'owner_erased'
                                : ((
                                      {
                                          missing: 'consent_missing',
                                          revoked: 'consent_revoked',
                                          expired: 'consent_expired',
                                          guardian_required: 'guardian_required',
                                      } as const
                                  )[
                                      (
                                          error as {
                                              reason?:
                                                  | 'missing'
                                                  | 'revoked'
                                                  | 'expired'
                                                  | 'guardian_required';
                                          }
                                      ).reason!
                                  ] ?? 'consent_unavailable')
                        );
                    else throw error;
                } finally {
                    job.usage = addUsageAttempt(job.usage, meter, costPricing(process.env), {
                        completed: job.written > beforeWritten,
                        credential: job.kind === 'credentials',
                        historicalRequestsUnmeasured: beforeCalls > 0,
                    });
                }
            }
            failureStage = 'checkpoint';
            delete job.lastError;
            job.cursor = String(row._id);
            if (job.snapshot) job.snapshotIndex = (job.snapshotIndex ?? 0) + 1;
            await store.updateOne(
                { _id: id, lease, cancel: false, leaseUntil: { $gt: new Date() } },
                {
                    $set: {
                        cursor: job.cursor,
                        ...(job.snapshot ? { snapshotIndex: job.snapshotIndex } : {}),
                        kind: job.kind,
                        scanned: job.scanned,
                        written: job.written,
                        skipped: job.skipped,
                        skipReasons: job.skipReasons ?? {},
                        dryRunObserved: job.dryRunObserved ?? 0,
                        representationCalls: job.representationCalls,
                        embeddingRequests: job.embeddingRequests,
                        ...(job.usage ? { usage: job.usage } : {}),
                        leaseUntil: new Date(Date.now() + 600000),
                        updatedAt: new Date(),
                    },
                    $unset: { lastError: '' },
                }
            );
        }
        if (job.state !== 'completed') job.state = 'paused';
    } catch (error) {
        job.state = 'paused';
        job.errors += 1;
        if (job.managedRunId) {
            const previousDispatched = retainDispatchedFailure(
                job.lastFailure,
                job.lastDispatchedFailure,
                failureRecord
            );
            // A new unknown failure must not borrow a previous attempt's diagnosis.
            delete job.lastFailure;
            try {
                job.lastFailure = createBackfillFailure(error, {
                    stage: failureStage,
                    record: failureRecord,
                    providerPipelineEntered,
                    meter: attemptMeter,
                });
            } catch {
                /* Diagnostics cannot replace the original safety stop. */
            }
            clearLastFailure = !job.lastFailure;
            if (clearLastFailure) delete job.lastFailure;
            const dispatched = retainDispatchedFailure(
                job.lastFailure,
                previousDispatched,
                failureRecord
            );
            if (dispatched) job.lastDispatchedFailure = dispatched;
            else {
                delete job.lastDispatchedFailure;
                clearDispatchedFailure = true;
            }
        }
        job.lastError =
            job.managedRunId &&
            error instanceof Error &&
            error.message === 'snapshot_source_changed'
                ? 'snapshot_source_changed'
                : 'record_failed_or_budget_exhausted_cursor_preserved';
    } finally {
        clearInterval(timer);
        const {
            _id,
            lease: _ignoredLease,
            leaseUntil: _ignoredUntil,
            // Retry reservations are independently persisted; never overwrite them
            // from the job snapshot loaded before dispatch.
            embeddingRecovery: _ignoredRecovery,
            ...fields
        } = job;
        await store.updateOne(
            { _id: id, lease, cancel: false, leaseUntil: { $gt: new Date() } },
            {
                $set: { ...fields, updatedAt: new Date() },
                $unset: {
                    lease: '',
                    leaseUntil: '',
                    ...(clearLastFailure ? { lastFailure: '' } : {}),
                    ...(clearDispatchedFailure ? { lastDispatchedFailure: '' } : {}),
                },
            }
        );
    }
    return await store.findOne({ _id: id }, { projection: { lease: 0 } });
}
export function costPlan(requests: number, representationCalls: number, usage?: UsageLedger) {
    const pricing = costPricing(process.env);
    const estimate = estimateCosts(requests, representationCalls, pricing);
    return {
        embeddingRequests: requests,
        representationCalls,
        // Legacy response fields retained; these are planning allowances, not bills.
        generationUsdEstimate: estimate.generationUsd,
        generationRateSource: pricing.generationRateSource,
        generationOutputTokenCapPerCall: 4096,
        representationInputByteCap: 16384,
        inputTokenUpperBound: requests * 8192,
        embeddingUsdUpperEstimate: estimate.embeddingUsd,
        rateSource: pricing.embeddingRateSource,
        pricing,
        estimate,
        observedUsage: usageCostSummary(usage, pricing),
        note: 'Planning assumptions, not measured usage or a hard dollar cap. Generation input allowance includes transformed input and prompt/schema overhead; privacy uses 100 text units per request. Retries can charge again. Storage, infrastructure and taxes excluded.',
    };
}

// A supplemental pass must preserve the current record on every failed guard.
function recordSkip(...args: Parameters<typeof recordOrdinarySkip>) {
    if (currentSingleRecoveryPass() && args[1] !== 'already_complete')
        throw new Error('Recovery pass stopped; current record was not skipped');
    return recordOrdinarySkip(...args);
}
