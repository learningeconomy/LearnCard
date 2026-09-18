import { TRPCError } from '@trpc/server';
import { mergeWith } from 'lodash';
import { createHash, randomUUID } from 'node:crypto';
import type {
    IssueInboxCredentialBatch,
    IssueInboxCredentialBatchItemResult,
    IssueInboxCredentialBatchResponse,
} from '@learncard/types';
import {
    IssueInboxCredentialValidator,
    IssueInboxCredentialBatchItemResultValidator,
} from '@learncard/types';
import { getInboxBatchRuntimeEnvironment } from '@environment';
import type { Context } from '@routes';
import type { ProfileType } from 'types/profile';
import type { BatchReplayStore } from 'types/inbox-batch';
import { issueToInbox, resolveInboxCredentialInput } from './inbox.helpers';
import { InboxIssuancePreflightError } from './inbox-issuance-error.helpers';

export const INBOX_BATCH_CONCURRENCY = 10;
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
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'This idempotency key was used for a different issuance.',
        });
    }
    if (decoded.state === 'processing') {
        throw new TRPCError({
            code: 'CONFLICT',
            message:
                'Issuance is in progress or its outcome is unconfirmed. Retry this same key later; do not issue with a new key. Contact support if it remains unconfirmed.',
        });
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

const positiveInteger = (value: string | undefined, fallback: number): number => {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
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
    const runtimeEnvironment = getInboxBatchRuntimeEnvironment();
    // Payload size and quota are enforced at admission. Internal queue metadata must not make
    // a previously accepted request fail the HTTP byte limit during background processing.
    const replayCache = execution.cache;

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
                    throw new TRPCError({
                        code: 'CONFLICT',
                        message:
                            'Duplicate idempotency key in this batch. Only its first occurrence is attempted.',
                    });
                }
                const configuration = mergeWith(
                    {},
                    batch.configuration,
                    item.configuration,
                    (_base: unknown, override: unknown) =>
                        Array.isArray(override) ? override : undefined
                );
                // Parse only after merging. Parsing each partial configuration first would apply
                // defaults too early and make an omitted item field override the batch default.
                const parsed = IssueInboxCredentialValidator.safeParse({ ...item, configuration });
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
                            throw new TRPCError({
                                code: 'CONFLICT',
                                message: 'Idempotency reservation changed. Retry this same key.',
                            });
                        }
                        results[index] = replayResult(current, requestHash, index);
                        continue;
                    }
                    reservation = marker;
                }
                const { credential } = await resolveInboxCredentialInput(input, ctx);
                await execution.beforeIssue();
                // From this point, issueToInbox may persist records or send an email before an
                // error is observed. Keep the reservation on failure to prevent a blind retry.
                issuanceStarted = true;
                const result = await issueToInbox(
                    profile,
                    input.recipient,
                    credential,
                    input.configuration,
                    ctx
                );
                const success: Extract<IssueInboxCredentialBatchItemResult, { success: true }> = {
                    success: true,
                    index,
                    issuanceId: result.inboxCredential.id,
                    status: result.status,
                    recipient: input.recipient,
                    claimUrl: result.claimUrl,
                    recipientDid: result.recipientDid,
                    guardianStatus: result.guardianStatus,
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
                // Only an explicitly marked preflight rejection proves the helper has not
                // written anything. A generic 4xx after a write must retain the reservation.
                const safeToRelease =
                    !issuanceStarted || error instanceof InboxIssuancePreflightError;
                if (key && reservation && safeToRelease) {
                    // Preparation and explicit preflight failures have no delivery side effects,
                    // so freeing the owned marker makes a corrected item retryable.
                    await replayCache.compareAndSet(
                        key,
                        reservation,
                        null,
                        IDEMPOTENCY_TTL_SECONDS
                    );
                }
                let itemError = {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to issue credential',
                };
                if (key && reservation && !safeToRelease) {
                    itemError = {
                        code: 'CONFLICT',
                        message: issued
                            ? 'Credential issued, but replay storage could not be confirmed. Reconcile using issuanceId; do not issue with a new key.'
                            : 'Issuance outcome is unconfirmed. Retry this same key later; do not issue with a new key. Contact support if it remains unconfirmed.',
                    };
                } else if (error instanceof TRPCError && error.code !== 'INTERNAL_SERVER_ERROR') {
                    itemError = { code: error.code, message: error.message };
                }
                results[index] = {
                    success: false,
                    index,
                    error: itemError,
                    ...(issued ? { issuanceId: issued.issuanceId, claimUrl: issued.claimUrl } : {}),
                };
            }
        }
    };
    await Promise.all(
        Array.from(
            {
                length: Math.min(
                    batch.items.length,
                    positiveInteger(
                        runtimeEnvironment.INBOX_BATCH_CONCURRENCY,
                        INBOX_BATCH_CONCURRENCY
                    )
                ),
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
