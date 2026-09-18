import { randomUUID } from 'node:crypto';
import {
    SQSClient,
    SendMessageBatchCommand,
    ReceiveMessageCommand,
    DeleteMessageCommand,
} from '@aws-sdk/client-sqs';
import { TRPCError } from '@trpc/server';
import type {
    InboxBatchReceipt,
    InboxBatchStatus,
    IssueInboxCredentialBatch,
    IssueInboxCredentialBatchItemResult,
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
    readBatchJob,
    recoverInboxJobs,
    takeInboxDispatches,
} from '@accesslayer/inbox-batch/store';
import { acknowledgeInboxDispatches, deadLetterBatchItem } from '@accesslayer/inbox-batch/store';
import { encryptInboxCredential, decryptInboxCredential } from './inbox-encryption.helpers';
import { fingerprint, issueInboxBatch } from './inbox-batch.helpers';
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
    const items = batch.items.map(item => {
        const duplicate = item.idempotencyKey !== undefined && seen.has(item.idempotencyKey);
        if (item.idempotencyKey !== undefined) seen.add(item.idempotencyKey);
        return {
            duplicate,
            replayKey:
                item.idempotencyKey === undefined
                    ? `internal:${randomUUID()}`
                    : `client:${fingerprint([profile.profileId, item.idempotencyKey])}`,
        };
    });
    const configuredLimit = Number(getInboxBatchRuntimeEnvironment().INBOX_BATCH_ITEMS_PER_HOUR);
    return createBatchJob({
        issuer: profile.profileId,
        requestId: batch.requestId,
        requestHash: fingerprint({ batch, domain: ctx.domain, tenant: ctx.tenant }),
        payload: await encryptInboxCredential(
            JSON.stringify({
                batch,
                context: { domain: ctx.domain, tenant: ctx.tenant },
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
                        message:
                            state === 'NEEDS_RECONCILIATION'
                                ? 'Issuance outcome is unconfirmed. Keep this key and contact support for reconciliation.'
                                : 'Processing could not be completed after worker failures or queue delivery exhaustion.',
                    },
                };
            return { index: Number(item.index), state, ...(result ? { result } : {}) };
        })
    );
    const completed = entries.filter(i => i.state === 'COMPLETED').length;
    const unconfirmed = entries.filter(i => i.state === 'NEEDS_RECONCILIATION').length;
    const succeeded = entries.filter(i => i.result?.success).length;
    return {
        batchId,
        createdAt: new Date(Number(job.createdAt)).toISOString(),
        status: getInboxBatchState(entries.map(item => item.state)),
        items: entries,
        summary: {
            total: entries.length,
            succeeded,
            failed: entries.filter(i => i.result && !i.result.success).length,
            deduplicated: entries.filter(i => i.result?.success && i.result.deduplicated).length,
            completed,
            pending: entries.length - completed - unconfirmed,
            unconfirmed,
        },
    };
};

/** SQS is at-least-once. Ownership and issuance checkpoints, not delivery count, control execution. */
export const processInboxQueueMessage = async (body: string): Promise<void> => {
    const message: unknown = JSON.parse(body);
    if (
        !message ||
        typeof message !== 'object' ||
        !('itemId' in message) ||
        typeof message.itemId !== 'string'
    )
        throw new Error('Invalid inbox queue message');
    const owner = randomUUID();
    const claimed = await claimBatchItem(message.itemId, owner);
    if (!claimed) return;
    const { job, item } = claimed;
    const fail = (code: string, text: string): IssueInboxCredentialBatchItemResult => ({
        success: false,
        index: Number(item.index),
        error: { code, message: text },
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
        payload.context,
        {
            cache: batchReplayStore(item.id, owner, item.replayKey),
            beforeIssue: () => markBatchIssuanceStarted(item.id, owner),
        }
    );
    await finishBatchItem(item.id, owner, { ...result.results[0]!, index: Number(item.index) });
    console.info('Inbox item processed', {
        batchId: job.id,
        index: Number(item.index),
        success: result.results[0]!.success,
        queueAgeMs: Date.now() - Number(job.createdAt),
    });
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

export const dispatchInboxJobs = async (): Promise<void> => {
    const { client, url } = queue();
    try {
        // Publish before maintenance: an unavailable recovery path must not stall new work.
        const ids = await takeInboxDispatches();
        const failures: unknown[] = [];
        for (let offset = 0; offset < ids.length; offset += 10) {
            try {
                const response = await client.send(
                    new SendMessageBatchCommand({
                        QueueUrl: url,
                        Entries: ids.slice(offset, offset + 10).map((itemId, index) => ({
                            Id: String(index),
                            MessageBody: JSON.stringify({ itemId }),
                        })),
                    })
                );
                await acknowledgeInboxDispatches(
                    (response.Successful ?? []).map(entry => ids[offset + Number(entry.Id)]!)
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
        if (ids.length) console.info('Inbox dispatch attempted', { count: ids.length });
        try {
            await recoverInboxJobs();
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
