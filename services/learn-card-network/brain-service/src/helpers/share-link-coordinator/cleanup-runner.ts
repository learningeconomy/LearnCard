import {
    SHARE_LINK_CLEANUP_DEFAULT_BATCH,
    SHARE_LINK_CLEANUP_MAX_BATCH,
} from '../share-link-lifecycle';
import {
    isTransientShareContentError,
    type ShareContentClientErrorCode,
} from '../share-content-client/types';
import {
    ShareLinkCoordinatorError,
    type CleanupRunnerDependencies,
    type CleanupRunSummary,
    type ShareCleanupCategory,
} from './types';
import { budgetAllows, budgetHasUnitReserve, boundTransactionTimeout } from './budget-helpers';

const OPAQUE_IDENTIFIER_RE = /^[A-Za-z0-9._~-]+$/;

const isOpaqueIdentifier = (value: unknown, maxLength = 128): value is string =>
    typeof value === 'string' &&
    value.length >= 1 &&
    value.length <= maxLength &&
    OPAQUE_IDENTIFIER_RE.test(value);

/**
 * Validate the operator-configured scope before any graph or remote I/O. A
 * missing or malformed namespace means the pass does nothing at all.
 */
const assertRunnerScope = (dependencies: CleanupRunnerDependencies): void => {
    if (!isOpaqueIdentifier(dependencies.claimant)) {
        throw new ShareLinkCoordinatorError(
            'INVALID_INPUT',
            'claimant must be an opaque configured identifier'
        );
    }
    if (!isOpaqueIdentifier(dependencies.namespace)) {
        throw new ShareLinkCoordinatorError(
            'INVALID_INPUT',
            'namespace must be an opaque configured identifier'
        );
    }
};

const clampTotal = (limit: number | undefined): number => {
    if (!Number.isSafeInteger(limit) || (limit as number) < 1)
        return SHARE_LINK_CLEANUP_DEFAULT_BATCH;

    return Math.min(limit as number, SHARE_LINK_CLEANUP_MAX_BATCH);
};

const clampBatchSize = (batchSize: number | undefined, total: number): number => {
    if (!Number.isSafeInteger(batchSize) || (batchSize as number) < 1) return total;

    return Math.min(batchSize as number, total);
};

const recordCategory = (
    categories: Partial<Record<ShareCleanupCategory, number>>,
    category: ShareCleanupCategory
): void => {
    categories[category] = (categories[category] ?? 0) + 1;
};

/**
 * Cap the managed-transaction timeout by the time left in the pass so a graph
 * unit cannot outlive a cooperative deadline. No budget means the configured
 * repository default is used unchanged.
 */
const boundTransactionTimeoutMs = (
    configuredTimeoutMs: number | undefined,
    budget: CleanupRunnerDependencies['budget']
): number | undefined => boundTransactionTimeout(configuredTimeoutMs, budget);

/**
 * Worst-case bounded cost of one whole cleanup unit:
 *   claim (graph) + delete (HTTP) + complete (graph).
 * The HTTP allowance is fixed when the transport client is constructed, so it
 * cannot be reduced per call; the graph calls are bounded per call below.
 */
const cleanupUnitCostMs = (dependencies: CleanupRunnerDependencies): number =>
    (dependencies.requestTimeoutMs ?? 0) + 2 * (dependencies.transactionTimeoutMs ?? 0);

/** Cost of the remote/complete tail once a job has already been claimed. */
const cleanupRemoteCostMs = (dependencies: CleanupRunnerDependencies): number =>
    (dependencies.requestTimeoutMs ?? 0) + (dependencies.transactionTimeoutMs ?? 0);

type DeleteOutcome =
    | { ok: true }
    | { ok: false; transient: true; error: ShareContentClientErrorCode }
    | { ok: false; category: ShareCleanupCategory };

type ClaimedCleanupJob = Awaited<
    ReturnType<CleanupRunnerDependencies['repository']['claimCleanupJobs']>
>['jobs'][number];

/**
 * Bounded, one-shot cleanup runner for durable C3 cleanup jobs.
 *
 * It is deliberately NOT a scheduler: nothing registers it, no interval is
 * created, and no ShareLink routes or workers are enabled by importing it. The
 * maintenance scheduler owns cadence.
 *
 * For every claimed job it sends the exact immutable binding —
 * `{ namespace, ownerProfileId, shareId, contentVersion, objectId: objectRef,
 * operationId }` — to LearnCloud `delete`. `operationId` is the ORIGINAL object
 * operation id recorded by C3, never the latest metadata operation.
 *
 * A job is completed only on a proven LearnCloud deletion/tombstone response.
 * Transient/unavailable responses are returned to the queue with C3's capped
 * exponential backoff. Any other response leaves the job claimed (never
 * completed) so the fenced claim expires and another worker can retry; this
 * never pretends a deletion happened. The returned summary contains aggregate
 * counts and fixed categories only — never an object ref or exception text.
 */
export const runShareContentCleanupOnce = async (
    dependencies: CleanupRunnerDependencies
): Promise<CleanupRunSummary> => {
    assertRunnerScope(dependencies);

    const { repository, client } = dependencies;
    const total = clampTotal(dependencies.limit);
    const batchSize = clampBatchSize(dependencies.claimBatchSize, total);

    const summary: CleanupRunSummary = {
        claimed: 0,
        completed: 0,
        retried: 0,
        claimLost: 0,
        skipped: 0,
        categories: {},
    };

    // Claim just-in-time so a deadline can never strand a whole claimed batch.
    // The default (batch size >= total) keeps the reviewed single-claim
    // behaviour; maintenance sets a small batch size and re-checks the budget
    // before every claim.
    const singleShot = batchSize >= total;

    while (summary.claimed < total) {
        // Whole-unit admission: a claim is only started when the remaining budget
        // can also cover the delete and the completion (or the retry write).
        if (!budgetAllows(dependencies.budget, cleanupUnitCostMs(dependencies))) break;

        const remaining = total - summary.claimed;
        const claimLimit = singleShot ? total : Math.min(batchSize, remaining);

        let claim: Awaited<ReturnType<CleanupRunnerDependencies['repository']['claimCleanupJobs']>>;
        try {
            claim = await repository.claimCleanupJobs({
                namespace: dependencies.namespace,
                claimant: dependencies.claimant,
                limit: claimLimit,
                claimMs: dependencies.claimMs,
                transactionTimeoutMs: boundTransactionTimeoutMs(
                    dependencies.transactionTimeoutMs,
                    dependencies.budget
                ),
                noInlineRetry: dependencies.noInlineRetry,
                // Omit production time so the repository samples it after the lock.
                now: dependencies.now?.(),
            });
        } catch {
            // Could not confirm a claim; a later pass retries after the lease.
            summary.claimLost += 1;
            recordCategory(summary.categories, 'claim_error');
            break;
        }

        if (claim.jobs.length === 0) break;

        let stoppedBeforeRemote = false;

        for (const job of claim.jobs) {
            summary.claimed += 1;

            // Recheck after the awaited claim, before the network call: the claim
            // may have waited on a lock. If the tail no longer fits, leave the job
            // fenced (its lease will lapse) and start no further call. Only the
            // maintenance budget opts into this mid-unit reserve.
            if (
                budgetHasUnitReserve(dependencies.budget) &&
                !budgetAllows(dependencies.budget, cleanupRemoteCostMs(dependencies))
            ) {
                recordCategory(summary.categories, 'budget_exhausted');
                stoppedBeforeRemote = true;
                break;
            }

            const deletion = await safeDelete(client, job);

            if (deletion.ok) {
                const completion = await safeComplete(repository, {
                    objectRef: job.objectRef,
                    claimToken: claim.claimToken,
                    outcome: 'completed',
                    transactionTimeoutMs: boundTransactionTimeoutMs(
                        dependencies.transactionTimeoutMs,
                        dependencies.budget
                    ),
                    noInlineRetry: dependencies.noInlineRetry,
                    now: dependencies.now?.(),
                });

                if (completion?.outcome === 'completed') summary.completed += 1;
                else {
                    summary.claimLost += 1;
                    recordCategory(summary.categories, 'claim_lost');
                }

                continue;
            }

            if ('transient' in deletion) {
                const completion = await safeComplete(repository, {
                    objectRef: job.objectRef,
                    claimToken: claim.claimToken,
                    outcome: 'retry',
                    errorMessage: deletion.error,
                    transactionTimeoutMs: boundTransactionTimeoutMs(
                        dependencies.transactionTimeoutMs,
                        dependencies.budget
                    ),
                    noInlineRetry: dependencies.noInlineRetry,
                    now: dependencies.now?.(),
                });

                if (completion?.outcome === 'retry') summary.retried += 1;
                else {
                    summary.claimLost += 1;
                    recordCategory(summary.categories, 'claim_lost');
                }

                continue;
            }

            // Deterministic/authorization failure: never complete. Leave the claim to
            // expire so the bounded fence lets another worker retry later.
            summary.skipped += 1;
            recordCategory(summary.categories, deletion.category);
        }

        if (singleShot || stoppedBeforeRemote) break;
    }

    return summary;
};

const safeDelete = async (
    client: CleanupRunnerDependencies['client'],
    job: ClaimedCleanupJob
): Promise<DeleteOutcome> => {
    let result: Awaited<ReturnType<CleanupRunnerDependencies['client']['delete']>>;

    try {
        result = await client.delete({
            namespace: job.namespace,
            ownerProfileId: job.ownerProfileId,
            shareId: job.shareId,
            contentVersion: job.contentVersion,
            objectId: job.objectRef,
            operationId: job.operationId,
        });
    } catch {
        return { ok: false, category: 'client_error' };
    }

    if (result.ok) return { ok: true };
    if (isTransientShareContentError(result.error)) {
        return { ok: false, transient: true, error: result.error };
    }

    return { ok: false, category: result.error };
};

const safeComplete = async (
    repository: CleanupRunnerDependencies['repository'],
    input: Parameters<CleanupRunnerDependencies['repository']['completeCleanupJob']>[0]
): Promise<Awaited<
    ReturnType<CleanupRunnerDependencies['repository']['completeCleanupJob']>
> | null> => {
    try {
        return await repository.completeCleanupJob(input);
    } catch {
        return null;
    }
};
