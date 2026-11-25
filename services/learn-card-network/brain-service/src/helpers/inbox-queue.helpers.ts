import { randomUUID } from 'node:crypto';
import {
    SQSClient,
    SendMessageBatchCommand,
    ReceiveMessageCommand,
    DeleteMessageCommand,
} from '@aws-sdk/client-sqs';
import { TRPCError } from '@trpc/server';
import { TRPC_ERROR_CODES_BY_KEY } from '@trpc/server/rpc';
import { IssueInboxCredentialResponseValidator } from '@learncard/types';
import type {
    InboxBatchReceipt,
    InboxBatchStatus,
    IssueInboxCredentialBatch,
    IssueInboxCredentialBatchItemResult,
    IssueInboxCredentialType,
} from '@learncard/types';
import { getInboxBatchRuntimeEnvironment } from '@environment';
import type { Context } from '@routes';
import type { ProfileType } from 'types/profile';
import type { BatchJobPayload } from 'types/inbox-batch';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import {
    batchReplayStore,
    claimBatchItem,
    createBatchJob,
    finishBatchItem,
    markBatchIssuanceStarted,
    InboxBatchRequestIdConflict,
    readBatchAdmission,
    readBatchJob,
    readBatchReplay,
    recoverInboxJobs,
    rejectWaitingBatchItem,
    settleQueuedBatchItem,
    takeInboxDispatches,
} from '@accesslayer/inbox-batch/store';
import { acknowledgeInboxDispatches, deadLetterBatchItem } from '@accesslayer/inbox-batch/store';
import { encryptInboxCredential, decryptInboxCredential } from './inbox-encryption.helpers';
import {
    InboxBatchConflict,
    fingerprint,
    issueInboxBatch,
    inboxItemReplayKey,
    inboxItemRequestHash,
    replayResult,
} from './inbox-batch.helpers';
import { INBOX_BATCH_MAX_BYTES } from './inbox-batch-http.helpers';
import { getInboxBatchState } from './inbox-batch-status.helpers';

const queue = (): { client: SQSClient; url: string } => {
    const env = getInboxBatchRuntimeEnvironment();
    if (!env.INBOX_QUEUE_URL)
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Inbox queue is not configured.',
        });
    return {
        url: env.INBOX_QUEUE_URL,
        client: new SQSClient({
            region: env.AWS_REGION ?? 'us-east-1',
            ...(env.INBOX_QUEUE_ENDPOINT
                ? {
                      endpoint: env.INBOX_QUEUE_ENDPOINT,
                      credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
                  }
                : {}),
        }),
    };
};

/** One admission fingerprint, for submission and for recognising a caller's own waiting job. */
const batchRequestHash = (batch: IssueInboxCredentialBatch, ctx: Context): string =>
    fingerprint({ batch, domain: ctx.domain, tenant: ctx.tenant?.id });

/** Only durable admission happens here. The dispatcher owns publication, including retries. */
export const submitInboxBatch = async (
    profile: ProfileType,
    batch: IssueInboxCredentialBatch,
    ctx: Context
): Promise<InboxBatchReceipt> => {
    if (Buffer.byteLength(JSON.stringify(batch), 'utf8') > INBOX_BATCH_MAX_BYTES)
        throw new TRPCError({
            code: 'PAYLOAD_TOO_LARGE',
            message: 'Inbox batch exceeds the 4 MiB JSON payload limit',
        });
    if (!getInboxBatchRuntimeEnvironment().INBOX_QUEUE_URL)
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Inbox queue is not configured.',
        });
    const seen = new Set<string>();
    const items = await Promise.all(
        batch.items.map(async item => {
            const duplicate = item.idempotencyKey !== undefined && seen.has(item.idempotencyKey);
            if (item.idempotencyKey !== undefined) seen.add(item.idempotencyKey);
            return {
                duplicate,
                correlation: await encryptInboxCredential(
                    JSON.stringify({
                        idempotencyKey: item.idempotencyKey,
                        recipient: item.recipient,
                    })
                ),
                replayKey:
                    item.idempotencyKey === undefined
                        ? `internal:${randomUUID()}`
                        : inboxItemReplayKey(profile.profileId, item.idempotencyKey),
            };
        })
    );
    const configuredLimit = Number(getInboxBatchRuntimeEnvironment().INBOX_BATCH_ITEMS_PER_HOUR);
    return createBatchJob({
        issuer: profile.profileId,
        requestId: batch.requestId,
        requestHash: batchRequestHash(batch, ctx),
        payload: await encryptInboxCredential(
            JSON.stringify({
                batch,
                context: { domain: ctx.domain, tenant: ctx.tenant },
                scope: ctx.user?.scope,
            } satisfies BatchJobPayload)
        ),
        items,
        limit:
            Number.isSafeInteger(configuredLimit) && configuredLimit > 0 ? configuredLimit : 10_000,
    });
};

export const getInboxBatch = async (issuer: string, batchId: string): Promise<InboxBatchStatus> => {
    const { job, items } = await readBatchJob(batchId, issuer);
    const entries = await Promise.all(
        items.map(async item => {
            const state = item.state as InboxBatchStatus['items'][number]['state'];
            let result: IssueInboxCredentialBatchItemResult | undefined;
            if (item.result)
                result = {
                    ...JSON.parse(await decryptInboxCredential(item.result)),
                    index: Number(item.index),
                };
            else if (state === 'NEEDS_RECONCILIATION' || state === 'COMPLETED')
                result = {
                    success: false,
                    index: Number(item.index),
                    error: {
                        code:
                            state === 'NEEDS_RECONCILIATION' ? 'CONFLICT' : 'INTERNAL_SERVER_ERROR',
                        ...(state === 'NEEDS_RECONCILIATION'
                            ? { reason: 'UNCONFIRMED' as const }
                            : {}),
                        message:
                            state === 'NEEDS_RECONCILIATION'
                                ? 'Issuance outcome is unconfirmed. Keep this key and contact support for reconciliation.'
                                : 'Processing could not be completed after worker failures or queue delivery exhaustion.',
                    },
                };
            if (result && item.correlation) {
                const correlation = JSON.parse(await decryptInboxCredential(item.correlation));
                result = {
                    ...result,
                    recipient: correlation.recipient,
                    // Recovery may read a replay containing an internal key for an unkeyed item.
                    idempotencyKey: correlation.idempotencyKey,
                };
            }
            return { index: Number(item.index), state, ...(result ? { result } : {}) };
        })
    );
    const completed = entries.filter(
        i => i.state === 'COMPLETED' || i.state === 'NEEDS_RECONCILIATION'
    ).length;
    const unconfirmed = entries.filter(i => i.state === 'NEEDS_RECONCILIATION').length;
    const succeeded = entries.filter(i => i.result?.success).length;
    return {
        batchId,
        createdAt: new Date(Number(job.createdAt)).toISOString(),
        status: getInboxBatchState(entries.map(item => item.state)),
        done: completed === entries.length,
        items: entries,
        summary: {
            total: entries.length,
            succeeded,
            failed: entries.filter(i => i.state === 'COMPLETED' && i.result && !i.result.success)
                .length,
            deduplicated: entries.filter(i => i.result?.success && i.result.deduplicated).length,
            completed,
            pending: entries.length - completed,
            unconfirmed,
        },
    };
};

/** SQS is at-least-once. Ownership and issuance checkpoints, not delivery count, control execution. */
export const processInboxQueueMessage = async (body: string, inline = false): Promise<void> => {
    const message: unknown = JSON.parse(body);
    if (
        !message ||
        typeof message !== 'object' ||
        !('itemId' in message) ||
        typeof message.itemId !== 'string'
    )
        throw new Error('Invalid inbox queue message');
    const owner = randomUUID();
    const claimed = await claimBatchItem(message.itemId, owner, inline);
    if (!claimed) return;
    const { job, item } = claimed;
    const fail = (code: string, text: string): IssueInboxCredentialBatchItemResult => ({
        success: false,
        index: Number(item.index),
        error: {
            code,
            message: text,
            ...(item.duplicate ? { reason: 'DUPLICATE_KEY' as const } : {}),
        },
    });
    if (item.duplicate) {
        await finishBatchItem(
            item.id,
            owner,
            fail(
                'CONFLICT',
                'Duplicate idempotency key in this batch. Only its first occurrence is attempted.'
            )
        );
        return;
    }
    const payload = JSON.parse(await decryptInboxCredential(job.payload)) as BatchJobPayload;
    const profile = await getProfileByProfileId(job.issuer);
    if (!profile) {
        await finishBatchItem(
            item.id,
            owner,
            fail('NOT_FOUND', 'Issuer profile no longer exists.')
        );
        return;
    }
    const input = payload.batch.items[Number(item.index)]!;
    const result = await issueInboxBatch(
        profile,
        {
            configuration: payload.batch.configuration,
            // Internal keys protect unkeyed items against SQS redelivery without deduplicating new submissions.
            items: [{ ...input, idempotencyKey: input.idempotencyKey ?? item.id }],
        },
        {
            ...payload.context,
            user: { did: profile.did, isChallengeValid: true, scope: payload.scope },
        },
        {
            cache: batchReplayStore(item.id, owner, item.replayKey),
            beforeIssue: () => markBatchIssuanceStarted(item.id, owner),
        }
    );
    await finishBatchItem(item.id, owner, {
        ...result.results[0]!,
        index: Number(item.index),
        idempotencyKey: input.idempotencyKey,
    });
    console.info('Inbox item processed', {
        batchId: job.id,
        index: Number(item.index),
        success: result.results[0]!.success,
        queueAgeMs: Date.now() - Number(job.createdAt),
    });
};

/**
 * Admission request ids of keyed inbox.issue calls live in this namespace. It is reserved:
 * the batch route refuses a caller-supplied requestId that starts with it.
 */
export const INBOX_ISSUE_REQUEST_ID_PREFIX = 'inbox.issue:';

/**
 * Single-request adapter over the existing durable batch lifecycle. A concurrent
 * queue worker and this request compete for the same item lease, never two sends.
 */
export const issueKeyedInboxCredential = async (
    profile: ProfileType,
    input: IssueInboxCredentialType,
    ctx: Context
): Promise<ReturnType<typeof IssueInboxCredentialResponseValidator.parse>> => {
    if (!input.idempotencyKey || input.refresh) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'An ordinary issuance key is required.',
        });
    }
    const idempotencyKey = input.idempotencyKey;
    const replayKey = inboxItemReplayKey(profile.profileId, idempotencyKey);
    // Namespace admission replay without changing the shared issuer/item-key identity.
    const request = {
        requestId: `${INBOX_ISSUE_REQUEST_ID_PREFIX}${fingerprint(idempotencyKey)}`,
        items: [input],
    };
    // An earlier call under this key may have left its item waiting. Once the key's outcome
    // is known, record it there as a worker would, so that no later worker issues the item.
    // A job holding another payload under this request id is not this caller's to settle.
    const ownAdmission = async (): ReturnType<typeof readBatchAdmission> => {
        const admission = await readBatchAdmission(profile.profileId, request.requestId);
        return admission?.requestHash === batchRequestHash(request, ctx) ? admission : undefined;
    };
    const settleWaiting = async (result: IssueInboxCredentialBatchItemResult): Promise<void> => {
        const admission = await ownAdmission();
        if (admission?.state === 'QUEUED') await settleQueuedBatchItem(admission.itemId, result);
    };
    // A refusal must also hold against a worker that has claimed the item and has not reserved
    // the key yet: if the record this call was refused against is released, that worker would
    // find the key free and issue the refused payload. The store decides in one guarded step.
    // False: the item's worker has already reserved the key.
    const rejectWaiting = async (result: IssueInboxCredentialBatchItemResult): Promise<boolean> => {
        const admission = await ownAdmission();
        if (admission?.state !== 'QUEUED' && admission?.state !== 'PROCESSING') return true;
        return rejectWaitingBatchItem(admission.itemId, result);
    };
    const replay = async (
        stored: string
    ): Promise<ReturnType<typeof IssueInboxCredentialResponseValidator.parse>> => {
        let result: IssueInboxCredentialBatchItemResult;
        try {
            result = replayResult(stored, inboxItemRequestHash(input), 0);
        } catch (error) {
            // IN_PROGRESS is rethrown as is: the owner's outcome is not known yet, so a
            // waiting item must stay queued.
            if (error instanceof InboxBatchConflict && error.reason === 'IDEMPOTENCY_MISMATCH') {
                const rejected = await rejectWaiting({
                    success: false,
                    index: 0,
                    error: { code: 'CONFLICT', message: error.message, reason: error.reason },
                    idempotencyKey,
                    recipient: input.recipient,
                });
                if (!rejected) {
                    // This call's own item has reserved the key since the record above was
                    // read: answer from the record that holds the key now.
                    const current = await readBatchReplay(replayKey);
                    if (current !== null)
                        return IssueInboxCredentialResponseValidator.parse(
                            replayResult(current, inboxItemRequestHash(input), 0)
                        );
                }
            }
            throw error;
        }
        await settleWaiting({ ...result, index: 0, idempotencyKey });
        return IssueInboxCredentialResponseValidator.parse(result);
    };
    // Answer a known key before admission: an item admitted for a call that only replays
    // or is rejected would outlive the answer and could be issued by a later worker.
    const known = await readBatchReplay(replayKey);
    if (known !== null) return replay(known);
    // The request id is derived from the key, so a job holding another payload under it
    // means the key was reused. This caller never sent a requestId: answer about its key.
    const receipt = await submitInboxBatch(profile, request, ctx).catch((error: unknown) => {
        if (error instanceof InboxBatchRequestIdConflict)
            throw new InboxBatchConflict(
                'IDEMPOTENCY_MISMATCH',
                'This idempotency key was used for a different issuance.'
            );
        throw error;
    });
    // A separate job's IN_PROGRESS snapshot is not authoritative once its owner
    // commits the shared receipt. Validate the live record before trusting that job.
    const stored = await readBatchReplay(replayKey);
    if (stored !== null) return replay(stored);
    await processInboxQueueMessage(JSON.stringify({ itemId: `${receipt.batchId}:0` }), true);
    const batch = await getInboxBatch(profile.profileId, receipt.batchId);
    const result = batch.items[0]?.result;
    if (!result) {
        throw new TRPCError({
            code: 'CONFLICT',
            message:
                'Issuance is in progress. Retry this same idempotency key; do not issue with a new key.',
        });
    }
    if (!result.success) {
        const code = Object.prototype.hasOwnProperty.call(
            TRPC_ERROR_CODES_BY_KEY,
            result.error.code
        )
            ? (result.error.code as keyof typeof TRPC_ERROR_CODES_BY_KEY)
            : 'INTERNAL_SERVER_ERROR';
        throw new TRPCError({
            code,
            message: result.issuanceId
                ? `${result.error.message} Issuance ID: ${result.issuanceId}.`
                : result.error.message,
        });
    }
    // Strip batch-only metadata so first response and replay have the single-route shape.
    return IssueInboxCredentialResponseValidator.parse(result);
};

export const processInboxDeadLetter = async (body: string): Promise<void> => {
    let message: unknown;
    try {
        message = JSON.parse(body);
    } catch {
        console.error('Discarding malformed inbox dead-letter JSON');
        return;
    }
    if (
        !message ||
        typeof message !== 'object' ||
        !('itemId' in message) ||
        typeof message.itemId !== 'string'
    ) {
        console.error('Discarding malformed inbox dead-letter message');
        return;
    }
    await deadLetterBatchItem(message.itemId);
    console.error('Inbox dead-letter recorded', { itemId: message.itemId });
};

export const dispatchInboxJobs = async (
    maintenanceDeadline = Date.now() + 20_000
): Promise<void> => {
    const { client, url } = queue();
    try {
        // Publish before maintenance: an unavailable recovery path must not stall new work.
        // Recovered items become dispatchable here but wait for the next one-minute invocation,
        // because this run has already claimed its publication set.
        const leases = await takeInboxDispatches();
        const failures: unknown[] = [];
        for (let offset = 0; offset < leases.length; offset += 10) {
            try {
                const response = await client.send(
                    new SendMessageBatchCommand({
                        QueueUrl: url,
                        Entries: leases.slice(offset, offset + 10).map(({ id: itemId }, index) => ({
                            Id: String(index),
                            MessageBody: JSON.stringify({ itemId }),
                        })),
                    })
                );
                await acknowledgeInboxDispatches(
                    (response.Successful ?? []).map(entry => leases[offset + Number(entry.Id)]!)
                );
                if (response.Failed?.length) {
                    console.error('Inbox dispatch entries failed', {
                        count: response.Failed.length,
                    });
                    failures.push(
                        new Error('Inbox dispatch partially failed; durable outbox will retry')
                    );
                }
            } catch (error) {
                console.error('Inbox dispatch chunk failed', { offset });
                failures.push(error);
            }
        }
        if (leases.length) console.info('Inbox dispatch attempted', { count: leases.length });
        try {
            await recoverInboxJobs(maintenanceDeadline);
        } catch (error) {
            console.error('Inbox maintenance failed; publication was attempted independently');
            failures.push(error);
        }
        // Report failures after attempting every chunk; alarms require sustained failures.
        if (failures.length) throw failures[0];
    } finally {
        client.destroy();
    }
};

/** Local/E2E consumer uses the same SQS protocol and processing entry point as Lambda. */
export const consumeInboxQueueOnce = async (waitSeconds = 1): Promise<void> => {
    const { client, url } = queue();
    try {
        const response = await client.send(
            new ReceiveMessageCommand({
                QueueUrl: url,
                MaxNumberOfMessages: 10,
                WaitTimeSeconds: waitSeconds,
                VisibilityTimeout: 1800,
            })
        );
        const results = await Promise.allSettled(
            (response.Messages ?? []).map(async message => {
                await processInboxQueueMessage(message.Body ?? '');
                await client.send(
                    new DeleteMessageCommand({
                        QueueUrl: url,
                        ReceiptHandle: message.ReceiptHandle!,
                    })
                );
            })
        );
        // Wait for every owned item before destroying the SQS client or starting another wave.
        const failed = results.find(result => result.status === 'rejected');
        if (failed?.status === 'rejected') throw failed.reason;
    } finally {
        client.destroy();
    }
};

export const consumeInboxDeadLettersOnce = async (): Promise<void> => {
    const url = getInboxBatchRuntimeEnvironment().INBOX_DEAD_LETTER_QUEUE_URL;
    if (!url) return;
    const { client } = queue();
    try {
        const response = await client.send(
            new ReceiveMessageCommand({
                QueueUrl: url,
                MaxNumberOfMessages: 10,
                WaitTimeSeconds: 0,
            })
        );
        for (const message of response.Messages ?? []) {
            await processInboxDeadLetter(message.Body ?? '');
            await client.send(
                new DeleteMessageCommand({ QueueUrl: url, ReceiptHandle: message.ReceiptHandle! })
            );
        }
    } finally {
        client.destroy();
    }
};
