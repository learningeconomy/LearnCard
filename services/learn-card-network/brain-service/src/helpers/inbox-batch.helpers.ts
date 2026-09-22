import { TRPCError } from '@trpc/server';
import { getHTTPStatusCodeFromError } from '@trpc/server/http';
import { SaIssueError } from './signingAuthority.helpers';
import { mergeWith } from 'lodash';
import { createHash, randomUUID } from 'node:crypto';
import type {
    InboxBatchErrorReason,
    IssueInboxCredentialBatch,
    IssueInboxCredentialBatchItemResult,
    IssueInboxCredentialBatchResponse,
} from '@learncard/types';
import {
    IssueInboxCredentialValidator,
    IssueInboxCredentialBatchItemResultValidator,
} from '@learncard/types';
import type { Context } from '@routes';
import type { ProfileType } from 'types/profile';
import type { BatchReplayStore } from 'types/inbox-batch';
import { issueToInbox, resolveInboxCredentialInput } from './inbox.helpers';
import { assertInboxRefreshEnabled, inboxRefreshRequestDigest } from './inbox-refresh.helpers';
import {
    InboxDeliveryCheckpointError,
    InboxIssuancePreflightError,
} from './inbox-issuance-error.helpers';

const INTERNAL_BATCH_CONCURRENCY = 10;
const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60;

const unavailable = (): TRPCError =>
    new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Batch issuance storage is unavailable. Please try again later.',
    });

/**
 * Produces a stable identity for an effective item. Objects are sorted recursively by JSON's
 * replacer traversal so equivalent objects with different property insertion order replay, while
 * a reused idempotency key with changed recipient, credential, or configuration is rejected.
 */
export const fingerprint = (input: unknown): string =>
    createHash('sha256')
        .update(
            JSON.stringify(input, (_key, value) =>
                value && typeof value === 'object' && !Array.isArray(value)
                    ? Object.fromEntries(
                          Object.keys(value)
                              .sort()
                              .map(key => [key, value[key]])
                      )
                    : value
            )
        )
        .digest('hex');

class InboxBatchConflict extends TRPCError {
    constructor(
        readonly reason: InboxBatchErrorReason,
        message: string
    ) {
        super({ code: 'CONFLICT', message });
    }
}

const replayResult = (
    stored: string,
    requestHash: string,
    index: number
): IssueInboxCredentialBatchItemResult => {
    const decoded = JSON.parse(stored);
    // This namespace has always stored fingerprints. Missing hashes are corrupt records,
    // not permission to replay a potentially unrelated issuance.
    if (!decoded || typeof decoded.requestHash !== 'string') {
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Corrupt inbox replay record',
        });
    }
    if (decoded.requestHash !== requestHash) {
        throw new InboxBatchConflict(
            'IDEMPOTENCY_MISMATCH',
            'This idempotency key was used for a different issuance.'
        );
    }
    if (decoded.state === 'processing') {
        throw new InboxBatchConflict(
            'IN_PROGRESS',
            'Issuance is in progress or its outcome is unconfirmed. Retry this same key later; do not issue with a new key. Contact support if it remains unconfirmed.'
        );
    }
    const result = IssueInboxCredentialBatchItemResultValidator.parse(decoded);
    if (!result.success) {
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Corrupt inbox replay record',
        });
    }
    return { ...result, index, deduplicated: true };
};

/**
 * Internal processing only: HTTP callers must use submitInboxBatch. Queue workers supply durable
 * replay storage and an ownership checkpoint; quota was already charged at admission. Each item
 * uses resolveInboxCredentialInput and issueToInbox, which preserves the single route's signing,
 * claim, guardian, webhook, email, and tenant-branding behavior.
 */
export const issueInboxBatch = async (
    profile: ProfileType,
    batch: IssueInboxCredentialBatch,
    ctx: Context,
    execution: {
        /** Queue admission already charged quota; replay records live in durable storage. */
        cache: BatchReplayStore;
        beforeIssue: () => Promise<void>;
    }
): Promise<IssueInboxCredentialBatchResponse> => {
    // Payload size and quota are enforced at admission. Internal queue metadata must not make
    // a previously accepted request fail the HTTP byte limit during background processing.
    const replayCache = execution.cache;

    // Queue workers pass one item; the bounded pool, duplicate guard, and summary also protect
    // internal multi-item callers. Production concurrency is configured on the SQS queue.
    // Workers claim indexes synchronously before their first await. Results are written by index,
    // so the response remains in caller order even when template work completes out of order.
    const results: IssueInboxCredentialBatchItemResult[] = new Array(batch.items.length);
    // Choose the first occurrence synchronously, before worker scheduling. Later duplicates
    // always conflict, even if the first item fails or completes before another worker starts.
    const firstIndexByKey = new Map<string, number>();
    batch.items.forEach((item, index) => {
        if (item.idempotencyKey !== undefined && !firstIndexByKey.has(item.idempotencyKey)) {
            firstIndexByKey.set(item.idempotencyKey, index);
        }
    });
    let nextIndex = 0;
    const worker = async (): Promise<void> => {
        while (nextIndex < batch.items.length) {
            const index = nextIndex++;
            const item = batch.items[index]!;
            const key =
                item.idempotencyKey === undefined
                    ? undefined
                    : `inbox-batch-idem:${profile.profileId}:${item.idempotencyKey}`;
            let reservation: string | undefined;
            let issuanceStarted = false;
            let issued: Extract<IssueInboxCredentialBatchItemResult, { success: true }> | undefined;
            try {
                if (
                    item.idempotencyKey !== undefined &&
                    firstIndexByKey.get(item.idempotencyKey) !== index
                ) {
                    throw new InboxBatchConflict(
                        'DUPLICATE_KEY',
                        'Duplicate idempotency key in this batch. Only its first occurrence is attempted.'
                    );
                }
                const configuration = mergeWith(
                    {},
                    batch.configuration,
                    item.configuration,
                    (_base: unknown, override: unknown) =>
                        Array.isArray(override) ? override : undefined
                );
                // null is an explicit per-item escape hatch for the batch guardian default.
                // Remove it before validating against the single-issue contract.
                if (item.configuration?.guardianEmail === null) {
                    delete configuration.guardianEmail;
                }
                // Parse only after merging. Parsing each partial configuration first would apply
                // defaults too early and make an omitted item field override the batch default.
                // Batch idempotency predates refresh issuance and is handled by this worker's
                // replay cache. Do not pass that key through the single-issue validator, where
                // idempotencyKey is reserved for refresh requests.
                const { idempotencyKey: _batchIdempotencyKey, ...issueInput } = item;
                const parsed = IssueInboxCredentialValidator.safeParse({
                    ...issueInput,
                    // Explicit item settings win over shared defaults. Keep the existing
                    // top-level item flag as a compatibility alias.
                    refresh: item.configuration?.refresh ?? item.refresh ?? configuration.refresh,
                    configuration,
                });
                if (!parsed.success) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: parsed.error.issues.map(issue => issue.message).join('; '),
                    });
                }
                const input = parsed.data;
                if (input.configuration?.signingAuthority) {
                    input.configuration.signingAuthority.name =
                        input.configuration.signingAuthority.name.toLowerCase();
                }
                const requestHash = key ? fingerprint(input) : '';
                if (key) {
                    const stored = await replayCache.get(key);
                    if (stored === undefined) throw unavailable();
                    if (stored) {
                        results[index] = replayResult(stored, requestHash, index);
                        continue;
                    }
                    const marker = JSON.stringify({
                        state: 'processing',
                        owner: randomUUID(),
                        requestHash,
                    });
                    // Reserve before template resolution: it can be slow and two concurrent
                    // retries must not both reach issueToInbox. The marker is also the CAS owner.
                    const acquired = await replayCache.setIfAbsent(
                        key,
                        marker,
                        IDEMPOTENCY_TTL_SECONDS
                    );
                    if (acquired === undefined) throw unavailable();
                    if (acquired === null) {
                        const current = await replayCache.get(key);
                        if (current === undefined) throw unavailable();
                        if (current === null) {
                            // The owner may have released its marker after our failed SET NX.
                            // No issuance happened here; a retry with this key can acquire it.
                            throw new InboxBatchConflict(
                                'IN_PROGRESS',
                                'Idempotency reservation changed. Retry this same key.'
                            );
                        }
                        results[index] = replayResult(current, requestHash, index);
                        continue;
                    }
                    reservation = marker;
                }
                if (input.refresh) await assertInboxRefreshEnabled(ctx.user?.scope);
                const refreshRequestDigest = input.refresh
                    ? inboxRefreshRequestDigest(input)
                    : undefined;
                const { credential, resolvedBoostUri } = await resolveInboxCredentialInput(
                    input,
                    ctx
                );
                const result = await issueToInbox(
                    profile,
                    input.recipient,
                    credential,
                    {
                        ...input.configuration,
                        boostUri: resolvedBoostUri,
                        refresh: input.refresh,
                        refreshRequestDigest,
                    },
                    ctx,
                    async () => {
                        // Preparation (including signing) has not delivered anything yet. Signing
                        // retries can leave unused status allocations, but must not block delivery.
                        await execution.beforeIssue();
                        issuanceStarted = true;
                    }
                );
                const success: Extract<IssueInboxCredentialBatchItemResult, { success: true }> = {
                    success: true,
                    index,
                    issuanceId: result.inboxCredential.id,
                    status: result.status,
                    recipient: input.recipient,
                    idempotencyKey: item.idempotencyKey,
                    claimUrl: result.claimUrl,
                    recipientDid: result.recipientDid,
                    guardianStatus: result.guardianStatus,
                    refresh: result.refresh,
                };
                issued = success;
                if (key && reservation) {
                    const replay = JSON.stringify({ ...success, requestHash });
                    // Retry a transient failure once, always using CAS so a lost owner cannot
                    // overwrite another worker. A lost reply may mean the first commit succeeded.
                    let saved = await replayCache.compareAndSet(
                        key,
                        reservation,
                        replay,
                        IDEMPOTENCY_TTL_SECONDS
                    );
                    if (saved === undefined) {
                        saved = await replayCache.compareAndSet(
                            key,
                            reservation,
                            replay,
                            IDEMPOTENCY_TTL_SECONDS
                        );
                    }
                    if (!saved) saved = (await replayCache.get(key)) === replay;
                    if (!saved)
                        throw new TRPCError({
                            code: 'CONFLICT',
                            message:
                                'Credential issued, but its replay record could not be confirmed. Keep this idempotency key and check issuance status before retrying.',
                        });
                }
                results[index] = success;
            } catch (error) {
                if (error instanceof InboxDeliveryCheckpointError) {
                    issued = { ...error.result, success: true, index, recipient: item.recipient };
                    // A write may already have happened. Persist the uncertain phase when possible,
                    // and always retain the replay reservation to prevent automatic reissuance.
                    issuanceStarted = true;
                    try {
                        await execution.beforeIssue();
                    } catch {
                        // finishBatchItem still records a terminal conflict if this lease remains.
                    }
                }
                // Only an explicitly marked preflight rejection proves the helper has not
                // written anything. A generic 4xx after a write must retain the reservation.
                const safeToRelease =
                    !issuanceStarted || error instanceof InboxIssuancePreflightError;
                if (key && reservation && safeToRelease) {
                    // Preparation and explicit preflight failures have no delivery side effects,
                    // so freeing the owned marker makes a corrected item retryable.
                    try {
                        await replayCache.compareAndSet(
                            key,
                            reservation,
                            null,
                            IDEMPOTENCY_TTL_SECONDS
                        );
                    } catch {
                        // A lost lease or storage outage must not replace the original outcome.
                        // Recovery owns cleanup when this worker can no longer release its marker.
                    }
                }
                let itemError: Extract<
                    IssueInboxCredentialBatchItemResult,
                    { success: false }
                >['error'] = {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to issue credential',
                    retryable: true,
                };
                if (key && reservation && !safeToRelease) {
                    itemError = {
                        code: 'CONFLICT',
                        reason: 'UNCONFIRMED',
                        retryable: false,
                        message: issued
                            ? 'Credential issued, but replay storage could not be confirmed. Reconcile using issuanceId; do not issue with a new key.'
                            : 'Issuance outcome is unconfirmed. Retry this same key later; do not issue with a new key. Contact support if it remains unconfirmed.',
                    };
                } else if (error instanceof SaIssueError) {
                    itemError.retryable = error.retryable;
                } else if (error instanceof TRPCError && error.code !== 'INTERNAL_SERVER_ERROR') {
                    itemError = {
                        code: error.code,
                        message: error.message,
                        retryable:
                            error instanceof InboxBatchConflict && error.reason === 'IN_PROGRESS'
                                ? true
                                : getHTTPStatusCodeFromError(error) >= 500,
                        ...(error instanceof InboxBatchConflict ? { reason: error.reason } : {}),
                    };
                }
                results[index] = {
                    success: false,
                    index,
                    error: itemError,
                    idempotencyKey: item.idempotencyKey,
                    recipient: item.recipient,
                    ...(issued ? { issuanceId: issued.issuanceId, claimUrl: issued.claimUrl } : {}),
                };
            }
        }
    };
    await Promise.all(
        Array.from(
            {
                length: Math.min(batch.items.length, INTERNAL_BATCH_CONCURRENCY),
            },
            worker
        )
    );
    const succeeded = results.filter(result => result.success).length;
    return {
        results,
        summary: {
            total: results.length,
            succeeded,
            failed: results.length - succeeded,
            deduplicated: results.filter(result => result.success && result.deduplicated).length,
        },
    };
};
