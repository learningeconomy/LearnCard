import { int } from 'neo4j-driver';

import {
    SHARE_LINK_CLEANUP_DEFAULT_BATCH,
    SHARE_LINK_CLEANUP_DEFAULT_CLAIM_MS,
    SHARE_LINK_CLEANUP_MAX_BATCH,
    SHARE_LINK_CLEANUP_MAX_CLAIM_MS,
    SHARE_LINK_CLEANUP_MIN_CLAIM_MS,
    computeCleanupBackoffMs,
    computeLeaseExpiry,
} from '@helpers/share-link-lifecycle';
import { neogma } from '@instance';

import { ensureShareLinkConstraints } from '../../models/share-link-constraints';
import { failShareLink } from './errors';
import { generateClaimToken, readNodeProperties, toShareContentCleanupJobRecord } from './helpers';
import { withShareLinkTransaction, type ShareLinkTransaction } from './transaction';
import type {
    ClaimCleanupJobsInput,
    ClaimCleanupJobsResult,
    CompleteCleanupJobInput,
    CompleteCleanupJobResult,
    ShareContentCleanupJobRecord,
} from './types';

const clampLimit = (limit: number | undefined): number => {
    if (!Number.isSafeInteger(limit) || (limit as number) < 1)
        return SHARE_LINK_CLEANUP_DEFAULT_BATCH;

    return Math.min(limit as number, SHARE_LINK_CLEANUP_MAX_BATCH);
};

const clampClaimMs = (claimMs: number | undefined): number => {
    if (!Number.isSafeInteger(claimMs)) return SHARE_LINK_CLEANUP_DEFAULT_CLAIM_MS;

    return Math.min(
        Math.max(claimMs as number, SHARE_LINK_CLEANUP_MIN_CLAIM_MS),
        SHARE_LINK_CLEANUP_MAX_CLAIM_MS
    );
};

/**
 * Require an explicit namespace before any graph access. This is intentionally
 * only an exact, non-empty-string check: the scheduler additionally enforces the
 * C1 opaque-identifier rule, while the reviewed lifecycle tests keep their
 * legacy `localhost%3A3000` namespace at the repository layer.
 */
const assertExplicitNamespace = (namespace: unknown): string => {
    if (typeof namespace !== 'string' || namespace.length === 0) {
        failShareLink('INVALID_INPUT', 'an explicit cleanup namespace is required');
    }

    return namespace;
};

const readCleanupJob = async (
    tx: ShareLinkTransaction,
    objectRef: string
): Promise<ShareContentCleanupJobRecord | null> => {
    const result = await tx.run(
        'MATCH (c:ShareContentCleanupJob {objectRef: $objectRef}) RETURN c LIMIT 1',
        { objectRef }
    );
    const props = readNodeProperties(result, 'c');

    return props ? toShareContentCleanupJobRecord(props) : null;
};

/**
 * Claims a bounded batch of due cleanup jobs for one explicit namespace.
 *
 * The candidate scan and the post-lock reread both filter on the exact
 * namespace, so a worker never claims a foreign namespace's job. Every clock read
 * used for eligibility and for the new claim expiry happens *inside* the managed
 * transaction after the job write lock is taken (and therefore afresh on each
 * driver retry); production callers omit `now`, tests inject it.
 *
 * The claim is fenced: `completeCleanupJob` only accepts the unique `claimToken`
 * returned here, so a claim whose bounded lease expired cannot complete a job that
 * another worker has since claimed. Jobs are returned in due order; the caller
 * performs the actual exact-object LearnCloud deletion and then completes the job.
 */
export const claimCleanupJobs = async (
    input: ClaimCleanupJobsInput
): Promise<ClaimCleanupJobsResult> => {
    const namespace = assertExplicitNamespace(input.namespace);

    await ensureShareLinkConstraints();

    const limit = clampLimit(input.limit);
    const claimMs = clampClaimMs(input.claimMs);

    return withShareLinkTransaction(
        async tx => {
            // Discovery prefilter only. Eligibility is re-checked against the
            // post-lock clock below, so this timestamp cannot authorise a claim.
            const discoveryNow = (input.now ?? new Date()).toISOString();
            const candidates = await tx.run(
                `MATCH (c:ShareContentCleanupJob)
                 WHERE c.namespace = $namespace
                   AND ((c.status = 'queued' AND c.nextAttemptAt <= $discoveryNow)
                        OR (c.status = 'claimed' AND c.claimExpiresAt <= $discoveryNow))
                 RETURN c.objectRef AS objectRef ORDER BY c.objectRef LIMIT $limit`,
                { namespace, discoveryNow, limit: int(limit) }
            );
            const claimToken = generateClaimToken();
            const jobs: ShareContentCleanupJobRecord[] = [];
            for (const candidate of candidates.records) {
                const objectRef = candidate.get('objectRef');
                const locked = await tx.run(
                    `MATCH (c:ShareContentCleanupJob {objectRef: $objectRef})
                     SET c.lockTick = coalesce(c.lockTick, 0) + 1 RETURN c`,
                    { objectRef }
                );
                const props = readNodeProperties(locked, 'c');
                if (!props) continue;

                // Fresh clock after the lock (and on every managed retry).
                const now = input.now ?? new Date();
                const nowIso = now.toISOString();
                const job = toShareContentCleanupJobRecord(props);
                if (job.namespace !== namespace) continue;
                if (!(
                    (job.status === 'queued' && job.nextAttemptAt <= nowIso) ||
                    (job.status === 'claimed' && job.claimExpiresAt && job.claimExpiresAt <= nowIso)
                ))
                    continue;

                const claimExpiresAt = computeLeaseExpiry(now, claimMs);
                const updated = await tx.run(
                    `MATCH (c:ShareContentCleanupJob {objectRef: $objectRef, namespace: $namespace})
                     SET c.status = 'claimed', c.claimedBy = $claimant, c.claimToken = $claimToken,
                         c.claimExpiresAt = $claimExpiresAt, c.updatedAt = $now RETURN c`,
                    {
                        objectRef,
                        namespace,
                        claimant: input.claimant,
                        claimToken,
                        claimExpiresAt,
                        now: nowIso,
                    }
                );
                const updatedProps = readNodeProperties(updated, 'c');
                if (updatedProps) jobs.push(toShareContentCleanupJobRecord(updatedProps));
            }

            return { claimToken, jobs };
        },
        { timeoutMs: input.transactionTimeoutMs, noInlineRetry: input.noInlineRetry }
    );
};

/**
 * Completes a claimed cleanup job (`completed`) or returns it to the queue with
 * exponential backoff (`retry`). A missing/mismatched claim token yields
 * `claim_lost`; this repository never deletes LearnCloud content itself.
 */
export const completeCleanupJob = async (
    input: CompleteCleanupJobInput
): Promise<CompleteCleanupJobResult> => {
    await ensureShareLinkConstraints();

    return withShareLinkTransaction(
        async tx => {
            const jobProps = await (async () => {
                const result = await tx.run(
                    `MATCH (c:ShareContentCleanupJob {objectRef: $objectRef})
                     SET c.lockTick = coalesce(c.lockTick, 0) + 1
                     RETURN c LIMIT 1`,
                    { objectRef: input.objectRef, claimToken: input.claimToken }
                );

                return readNodeProperties(result, 'c');
            })();

            if (!jobProps) return { outcome: 'claim_lost' };

            // Sample the clock only after the job write lock is held (and afresh on
            // each managed retry). A worker that was blocked on the lock past its
            // claim expiry therefore observes the lapsed lease and fails completion
            // instead of committing with a stale pre-lock timestamp.
            const now = input.now ?? new Date();
            const nowIso = now.toISOString();
            const job = toShareContentCleanupJobRecord(jobProps);
            if (
                job.status !== 'claimed' ||
                job.claimToken !== input.claimToken ||
                !job.claimExpiresAt ||
                job.claimExpiresAt <= nowIso
            )
                return { outcome: 'claim_lost' };

            if (input.outcome === 'completed') {
                await tx.run(
                    `MATCH (c:ShareContentCleanupJob {objectRef: $objectRef})
                     SET c.status = 'completed',
                         c.completedAt = $now,
                         c.claimToken = null,
                         c.claimedBy = null,
                         c.claimExpiresAt = null,
                         c.updatedAt = $now`,
                    { objectRef: input.objectRef, now: nowIso }
                );

                const updated = await readCleanupJob(tx, input.objectRef);

                return { outcome: 'completed', job: updated ?? job };
            }

            const attempts = job.attempts + 1;
            const nextAttemptAt = new Date(
                now.getTime() + computeCleanupBackoffMs(job.attempts)
            ).toISOString();

            await tx.run(
                `MATCH (c:ShareContentCleanupJob {objectRef: $objectRef})
                 SET c.status = 'queued',
                     c.attempts = $attempts,
                     c.nextAttemptAt = $nextAttemptAt,
                     c.claimToken = null,
                     c.claimedBy = null,
                     c.claimExpiresAt = null,
                     c.lastError = $lastError,
                     c.updatedAt = $now`,
                {
                    objectRef: input.objectRef,
                    attempts,
                    nextAttemptAt,
                    lastError: input.errorMessage ?? null,
                    now: nowIso,
                }
            );

            const updated = await readCleanupJob(tx, input.objectRef);

            return { outcome: 'retry', job: updated ?? job };
        },
        { timeoutMs: input.transactionTimeoutMs, noInlineRetry: input.noInlineRetry }
    );
};

/** Observability/test read: the durable cleanup job for one exact object. */
export const getCleanupJob = async (
    objectRef: string
): Promise<ShareContentCleanupJobRecord | null> => {
    const result = await neogma.queryRunner.run(
        'MATCH (c:ShareContentCleanupJob {objectRef: $objectRef}) RETURN c LIMIT 1',
        { objectRef }
    );
    const props = readNodeProperties(result, 'c');

    return props ? toShareContentCleanupJobRecord(props) : null;
};

/** Observability/test read: all durable cleanup jobs queued for one share. */
export const listCleanupJobsForShare = async (
    shareId: string
): Promise<ShareContentCleanupJobRecord[]> => {
    const result = await neogma.queryRunner.run(
        'MATCH (c:ShareContentCleanupJob {shareId: $shareId}) RETURN c ORDER BY c.createdAt ASC',
        { shareId }
    );

    return result.records
        .map(record => {
            const props = (record.get('c') as { properties?: Record<string, unknown> })?.properties;

            return props ? toShareContentCleanupJobRecord(props) : null;
        })
        .filter((job): job is ShareContentCleanupJobRecord => job !== null);
};
