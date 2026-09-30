import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { fastifyTRPCOpenApiPlugin } from 'trpc-to-openapi';
import { randomUUID } from 'node:crypto';
import type { InboxBatchReceipt, IssueInboxCredentialBatch, VC, VP } from '@learncard/types';
import { appRouter, createContext } from '../src/app';
import { getClient, getUser } from './helpers/getClient';
import { testUnsignedBoost } from './helpers/send';
import { sendSpy, addNotificationToQueueSpy } from './helpers/spies';
import { Profile, InboxCredential, ContactMethod, SigningAuthority, Boost } from '@models';
import cache from '@cache';
import { neogma } from '@instance';
import {
    configureInboxBatchBodyLimit,
    inboxBatchResponseMeta,
} from '@helpers/inbox-batch-http.helpers';
import { setValidChallengeForDid } from '@cache/challenges';
import { getInboxCredentialById } from '@accesslayer/inbox-credential/read';
import { createContactMethod } from '@accesslayer/contact-method/create';
import { createProfileContactMethodRelationship } from '@accesslayer/contact-method/relationships/create';
import { decryptInboxCredential } from '@helpers/inbox-encryption.helpers';
import * as notifications from '@helpers/notifications.helpers';
import { clrWestbridgeFull } from '../../../../packages/credential-library/src/fixtures/clr/westbridge-full';
import * as signing from '@helpers/signingAuthority.helpers';
import {
    dispatchInboxJobs,
    consumeInboxQueueOnce,
    consumeInboxDeadLettersOnce,
} from '@helpers/inbox-queue.helpers';
import { fingerprint } from '@helpers/inbox-batch.helpers';
import * as jobStore from '@accesslayer/inbox-batch/store';
import * as issuance from '@helpers/inbox.helpers';
import { SQSClient, SendMessageCommand, SendMessageBatchCommand } from '@aws-sdk/client-sqs';

vi.mock('@services/delivery/delivery.factory', () => ({
    getDeliveryService: () => ({ send: sendSpy }),
}));

vi.mock('@services/registry/registry.factory', () => ({
    getRegistryService: () => ({ isTrusted: async () => false }),
}));

describe('Universal Inbox batch issuance', () => {
    let issuer: Awaited<ReturnType<typeof getUser>>;
    let holder: Awaited<ReturnType<typeof getUser>>;
    let server: FastifyInstance;
    const signingAuthority = { endpoint: 'http://localhost:5000/api', name: 'batch-sa' };
    const email = (value: string) => ({ type: 'email' as const, value });
    const unsigned = async () => issuer.learnCard.invoke.getTestVc();
    const signed = async () => issuer.learnCard.invoke.issueCredential(await unsigned());
    const poll = async (batchId: string) => {
        const deadline = Date.now() + 60_000;
        while (Date.now() < deadline) {
            // Exercise real SQS publication/consumption, not a direct issuance shortcut.
            await dispatchInboxJobs();
            await consumeInboxQueueOnce(0);
            const status = await issuer.clients.fullAuth.inbox.getBatch({ batchId });
            if (status.summary.pending === 0) {
                const { total, succeeded, failed, deduplicated } = status.summary;
                return {
                    results: status.items.map(item => item.result!),
                    summary: { total, succeeded, failed, deduplicated },
                };
            }
            await new Promise(resolve => setTimeout(resolve, 20));
        }
        throw new Error(`Timed out polling inbox batch ${batchId}`);
    };
    const issue = async (batch: IssueInboxCredentialBatch) => {
        const response = await post(batch);
        expect(response.statusCode, response.body).toBe(202);
        return poll(response.json().batchId);
    };
    const replay = async (key: string) => {
        const rows = await neogma.queryRunner.run('MATCH (r:InboxBatchReplay {id: $id}) RETURN r', {
            id: `client:${fingerprint(['batch-issuer', key])}`,
        });
        return rows.records[0]?.get('r').properties;
    };
    const stored = async (id: string) => {
        const record = await getInboxCredentialById(id);
        expect(record).toBeDefined();
        return record!;
    };
    const post = async (body: unknown, authenticated = true, path = '/api/inbox/issue-batch') => {
        const challenge = randomUUID();
        await setValidChallengeForDid(issuer.learnCard.id.did(), challenge);
        const token = await issuer.learnCard.invoke.getDidAuthVp({ proofFormat: 'jwt', challenge });
        return server.inject({
            method: 'POST',
            url: path,
            payload: body as object,
            headers: authenticated
                ? { authorization: `Bearer ${token}`, 'x-tenant-id': 'scoutpass' }
                : {},
        });
    };
    const claim = async (claimUrl: string): Promise<VC[]> => {
        const localExchangeId = new URL(claimUrl).pathname.split('/').pop()!;
        const start = await holder.clients.fullAuth.workflows.participateInExchange({
            localWorkflowId: 'inbox-claim',
            localExchangeId,
        });
        const vp = (await holder.learnCard.invoke.getDidAuthVp({
            challenge: start.verifiablePresentationRequest?.challenge,
            domain: start.verifiablePresentationRequest?.domain,
        })) as VP;
        const result = await holder.clients.fullAuth.workflows.participateInExchange({
            localWorkflowId: 'inbox-claim',
            localExchangeId,
            verifiablePresentation: vp,
        });
        return result.verifiablePresentation?.verifiableCredential as VC[];
    };

    beforeAll(async () => {
        issuer = await getUser('a'.repeat(64));
        holder = await getUser('b'.repeat(64));
        server = Fastify({ routerOptions: { maxParamLength: 5000 } });
        configureInboxBatchBodyLimit(server);
        await server.register(fastifyTRPCOpenApiPlugin, {
            responseMeta: inboxBatchResponseMeta,
            basePath: '/api',
            router: appRouter,
            createContext,
        });
    });
    beforeEach(async () => {
        vi.restoreAllMocks();
        vi.unstubAllEnvs();
        sendSpy.mockClear();
        addNotificationToQueueSpy.mockClear();
        vi.spyOn(notifications, 'addNotificationToQueue').mockImplementation(
            addNotificationToQueueSpy
        );
        for (const model of [Profile, InboxCredential, ContactMethod, SigningAuthority, Boost]) {
            await model.delete({ detach: true, where: {} });
        }
        await neogma.queryRunner.run(
            'MATCH (n) WHERE n:InboxBatch OR n:InboxBatchItem OR n:InboxBatchIssuer OR n:InboxBatchReplay DETACH DELETE n'
        );
        const keys = await cache.keys('inbox-batch-*');
        if (keys?.length) await cache.delete(keys);
        await issuer.clients.fullAuth.profile.createProfile({ profileId: 'batch-issuer' });
        await holder.clients.fullAuth.profile.createProfile({ profileId: 'batch-holder' });
        await issuer.clients.fullAuth.profile.registerSigningAuthority({
            ...signingAuthority,
            did: issuer.learnCard.id.did(),
        });
    });
    afterAll(async () => {
        vi.restoreAllMocks();
        vi.unstubAllEnvs();
        await server?.close();
        await cache.redis?.quit();
        await neogma.driver.close();
    });

    const submit = async (batch: IssueInboxCredentialBatch) => {
        const response = await post(batch);
        expect(response.statusCode, response.body).toBe(202);
        return response.json() as InboxBatchReceipt;
    };
    const statusOf = (batchId: string) => issuer.clients.fullAuth.inbox.getBatch({ batchId });
    const expireLease = (batchId: string) =>
        neogma.queryRunner.run(
            'MATCH (i:InboxBatchItem {batchId: $batchId}) SET i.leaseUntil = 0',
            { batchId }
        );

    it('accepts a one-item batch without waiting for a slow worker and restricts polling to its issuer', async () => {
        const receipt = await submit({
            items: [{ recipient: email('slow@test.com'), credential: await signed() }],
        });
        expect(sendSpy).not.toHaveBeenCalled();
        const challenge = randomUUID();
        await setValidChallengeForDid(issuer.learnCard.id.did(), challenge);
        const token = await issuer.learnCard.invoke.getDidAuthVp({ proofFormat: 'jwt', challenge });
        const httpProgress = await server.inject({
            method: 'GET',
            url: `/api/inbox/batches/${receipt.batchId}`,
            headers: { authorization: `Bearer ${token}` },
        });
        expect(httpProgress.statusCode, httpProgress.body).toBe(200);
        expect(httpProgress.json()).toMatchObject({ batchId: receipt.batchId, status: 'QUEUED' });
        expect(await statusOf(receipt.batchId)).toMatchObject({
            status: 'QUEUED',
            summary: { pending: 1 },
        });
        await expect(
            holder.clients.fullAuth.inbox.getBatch({ batchId: receipt.batchId })
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        await expect(
            getClient({
                did: issuer.learnCard.id.did(),
                isChallengeValid: true,
                scope: 'inbox:write',
            }).inbox.getBatch({ batchId: receipt.batchId })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        let release!: () => void;
        let started!: () => void;
        const blocked = new Promise<void>(resolve => {
            release = resolve;
        });
        const entered = new Promise<void>(resolve => {
            started = resolve;
        });
        const original = issuance.resolveInboxCredentialInput;
        vi.spyOn(issuance, 'resolveInboxCredentialInput').mockImplementationOnce(
            async (...args) => {
                started();
                await blocked;
                return original(...args);
            }
        );
        await dispatchInboxJobs();
        const worker = consumeInboxQueueOnce(0);
        try {
            await entered;
            expect(await statusOf(receipt.batchId)).toMatchObject({
                status: 'PROCESSING',
                summary: { pending: 1 },
            });
            expect(sendSpy).not.toHaveBeenCalled();
        } finally {
            release();
            await worker;
        }
        expect(await statusOf(receipt.batchId)).toMatchObject({
            status: 'COMPLETED',
            summary: { succeeded: 1 },
        });
    });

    it('atomically replays concurrent request IDs without a second quota charge', async () => {
        const batch = {
            requestId: randomUUID(),
            items: [{ recipient: email('request@test.com'), credential: await signed() }],
        };
        const receipts = await Promise.all(Array.from({ length: 5 }, () => submit(batch)));
        expect(new Set(receipts.map(r => r.batchId)).size).toBe(1);
        const quota = await neogma.queryRunner.run(
            'MATCH (q:InboxBatchIssuer {id: "batch-issuer"}) RETURN q.used AS used'
        );
        expect(Number(quota.records[0]!.get('used'))).toBe(1);
        const conflict = await post({
            ...batch,
            items: [{ ...batch.items[0], recipient: email('changed@test.com') }],
        });
        expect(conflict.statusCode).toBe(409);
        expect((await poll(receipts[0]!.batchId)).summary.succeeded).toBe(1);
        expect(await submit(batch)).toMatchObject({
            batchId: receipts[0]!.batchId,
            status: 'COMPLETED',
        });
    });

    it('reports live processing and reconciliation states when replaying a request ID', async () => {
        const batch = {
            requestId: randomUUID(),
            items: [{ recipient: email('receipt@test.com'), credential: await signed() }],
        };
        const receipt = await submit(batch);
        expect(receipt.status).toBe('QUEUED');
        const id = `${receipt.batchId}:0`;
        await jobStore.claimBatchItem(id, 'worker');
        expect(await submit(batch)).toMatchObject({
            batchId: receipt.batchId,
            status: 'PROCESSING',
        });
        await jobStore.markBatchIssuanceStarted(id, 'worker');
        await expireLease(receipt.batchId);
        await jobStore.recoverInboxJobs();
        expect(await submit(batch)).toMatchObject({
            batchId: receipt.batchId,
            status: 'NEEDS_RECONCILIATION',
        });
    });

    it('does not let a late publication ack postpone a worker retry', async () => {
        const receipt = await submit({
            items: [{ recipient: email('ack@test.com'), credential: await signed() }],
        });
        const leases = await jobStore.takeInboxDispatches();
        const id = `${receipt.batchId}:0`;
        await jobStore.claimBatchItem(id, 'fast-worker');
        await jobStore.finishBatchItem(id, 'fast-worker', {
            success: false,
            index: 0,
            error: { code: 'INTERNAL_SERVER_ERROR', message: 'retry' },
        });
        await jobStore.acknowledgeInboxDispatches(leases);
        expect((await jobStore.takeInboxDispatches()).map(lease => lease.id)).toContain(id);
    });

    it('keeps overlapping item keys queued and then replays the first success', async () => {
        const entry = {
            recipient: email('overlap@test.com'),
            credential: await signed(),
            idempotencyKey: 'overlap',
        };
        const first = await submit({ items: [entry] });
        const second = await submit({ items: [entry] });
        let release!: () => void;
        let started!: () => void;
        const blocked = new Promise<void>(resolve => {
            release = resolve;
        });
        const entered = new Promise<void>(resolve => {
            started = resolve;
        });
        const original = issuance.resolveInboxCredentialInput;
        vi.spyOn(issuance, 'resolveInboxCredentialInput').mockImplementationOnce(
            async (...args) => {
                started();
                await blocked;
                return original(...args);
            }
        );
        const { processInboxQueueMessage } = await import('@helpers/inbox-queue.helpers');
        const worker = processInboxQueueMessage(JSON.stringify({ itemId: `${first.batchId}:0` }));
        try {
            await entered;
            await processInboxQueueMessage(JSON.stringify({ itemId: `${second.batchId}:0` }));
            expect(await statusOf(second.batchId)).toMatchObject({
                done: false,
                summary: { pending: 1, failed: 0 },
            });
        } finally {
            release();
            await worker;
        }
        await processInboxQueueMessage(JSON.stringify({ itemId: `${second.batchId}:0` }));
        expect(await statusOf(second.batchId)).toMatchObject({
            done: true,
            summary: { succeeded: 1, deduplicated: 1 },
        });
        expect(await InboxCredential.findMany({ where: {} })).toHaveLength(1);
    });

    it('counts unconfirmed outcomes once and retains correlation after payload cleanup', async () => {
        const receipt = await submit({
            items: [
                {
                    recipient: email('uncertain@test.com'),
                    credential: await signed(),
                    idempotencyKey: 'uncertain',
                },
                {
                    recipient: email('pending@test.com'),
                    credential: await signed(),
                    idempotencyKey: 'pending',
                },
            ],
        });
        await jobStore.claimBatchItem(`${receipt.batchId}:0`, 'worker');
        await jobStore.markBatchIssuanceStarted(`${receipt.batchId}:0`, 'worker');
        await expireLease(receipt.batchId);
        await jobStore.recoverInboxJobs();
        expect(await statusOf(receipt.batchId)).toMatchObject({
            done: false,
            summary: { total: 2, completed: 1, pending: 1, unconfirmed: 1, failed: 0 },
        });
        await poll(receipt.batchId);
        const status = await statusOf(receipt.batchId);
        expect(status).toMatchObject({
            done: true,
            summary: {
                total: 2,
                completed: 2,
                pending: 0,
                unconfirmed: 1,
                succeeded: 1,
                failed: 0,
            },
            items: [
                {
                    result: {
                        idempotencyKey: 'uncertain',
                        recipient: email('uncertain@test.com'),
                        error: { reason: 'UNCONFIRMED' },
                    },
                },
                { result: { idempotencyKey: 'pending', recipient: email('pending@test.com') } },
            ],
        });
        expect(
            (await jobStore.readBatchJob(receipt.batchId, 'batch-issuer')).job.payload
        ).toBeUndefined();
    });

    it('rejects invalid input at admission without charging quota', async () => {
        const response = await post({
            items: [
                { recipient: email('missing@test.com') },
                {
                    recipient: email('self@test.com'),
                    credential: await signed(),
                    configuration: { guardianEmail: 'SELF@test.com' },
                },
            ],
        });
        expect(response.statusCode).toBe(400);
        expect(await InboxCredential.findMany({ where: {} })).toHaveLength(0);
        const jobs = await neogma.queryRunner.run('MATCH (b:InboxBatch) RETURN b');
        expect(jobs.records).toHaveLength(0);
    });

    it('continues dispatching later chunks after a partial SQS failure', async () => {
        const credential = await signed();
        const receipt = await submit({
            items: Array.from({ length: 25 }, (_, i) => ({
                recipient: email(`partial-${i}@test.com`),
                credential,
            })),
        });
        const originalSend = SQSClient.prototype.send;
        const send = vi.spyOn(SQSClient.prototype, 'send').mockImplementationOnce(async function (
            this: SQSClient,
            command
        ) {
            if (!(command instanceof SendMessageBatchCommand))
                throw new Error('Expected batch publication');
            const [failed, ...entries] = command.input.Entries!;
            const response = await originalSend.call(
                this,
                new SendMessageBatchCommand({ ...command.input, Entries: entries })
            );
            return {
                ...response,
                Failed: [{ Id: failed!.Id, Code: 'ServiceUnavailable', SenderFault: false }],
            };
        });
        await expect(dispatchInboxJobs()).rejects.toThrow('partially failed');
        expect(send).toHaveBeenCalledTimes(3);
        send.mockRestore();
        for (let i = 0; i < 3; i++) await consumeInboxQueueOnce(0);
        expect(await statusOf(receipt.batchId)).toMatchObject({
            summary: { succeeded: 24, pending: 1 },
        });
        await neogma.queryRunner.run(
            'MATCH (i:InboxBatchItem {batchId: $id}) WHERE i.state = "QUEUED" SET i.dispatchAt = 0',
            { id: receipt.batchId }
        );
        expect((await poll(receipt.batchId)).summary.succeeded).toBe(25);
    });

    it('publishes queued work even when recovery fails', async () => {
        const receipt = await submit({
            items: [{ recipient: email('maintenance@test.com'), credential: await signed() }],
        });
        const recover = vi
            .spyOn(jobStore, 'recoverInboxJobs')
            .mockRejectedValueOnce(new Error('Maintenance unavailable'));
        const deadline = Date.now() + 10_000;
        await expect(dispatchInboxJobs(deadline)).rejects.toThrow('Maintenance unavailable');
        expect(recover).toHaveBeenCalledWith(deadline);
        await consumeInboxQueueOnce(0);
        expect(await statusOf(receipt.batchId)).toMatchObject({
            status: 'COMPLETED',
            summary: { succeeded: 1 },
        });
    });

    it('tolerates duplicate SQS deliveries and concurrent consumers without duplicating unkeyed issuance', async () => {
        const receipt = await submit({
            items: [{ recipient: email('duplicate@test.com'), credential: await signed() }],
        });
        const client = new SQSClient({
            endpoint: process.env.INBOX_QUEUE_ENDPOINT,
            region: 'us-east-1',
            credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
        });
        try {
            await Promise.all(
                Array.from({ length: 3 }, () =>
                    client.send(
                        new SendMessageCommand({
                            QueueUrl: process.env.INBOX_QUEUE_URL,
                            MessageBody: JSON.stringify({ itemId: `${receipt.batchId}:0` }),
                        })
                    )
                )
            );
            await dispatchInboxJobs();
            await Promise.all([consumeInboxQueueOnce(0), consumeInboxQueueOnce(0)]);
            expect((await poll(receipt.batchId)).summary.succeeded).toBe(1);
            expect(sendSpy).toHaveBeenCalledTimes(1);
            expect(await InboxCredential.findMany({ where: {} })).toHaveLength(1);
        } finally {
            client.destroy();
        }
    });

    it('keeps an accepted batch durable when publication fails, then dispatches it after recovery', async () => {
        const receipt = await submit({
            items: [{ recipient: email('outbox@test.com'), credential: await signed() }],
        });
        const send = vi
            .spyOn(SQSClient.prototype, 'send')
            .mockRejectedValueOnce(new Error('SQS unavailable'));
        await expect(dispatchInboxJobs()).rejects.toThrow('SQS unavailable');
        send.mockRestore();
        expect(await statusOf(receipt.batchId)).toMatchObject({ status: 'QUEUED' });
        await neogma.queryRunner.run(
            'MATCH (i:InboxBatchItem {batchId: $id}) SET i.dispatchAt = 0',
            { id: receipt.batchId }
        );
        expect((await poll(receipt.batchId)).summary.succeeded).toBe(1);
    });

    it('recovers an expired preparation lease and rejects the old owner before issuance', async () => {
        const receipt = await submit({
            items: [
                {
                    recipient: email('restart@test.com'),
                    credential: await signed(),
                    idempotencyKey: 'restart',
                },
            ],
        });
        const id = `${receipt.batchId}:0`;
        const claimed = await jobStore.claimBatchItem(id, 'old-worker');
        const replayStore = jobStore.batchReplayStore(id, 'old-worker', claimed!.item.replayKey);
        expect(
            await replayStore.setIfAbsent(
                '',
                JSON.stringify({ state: 'processing', requestHash: 'old' }),
                86400
            )
        ).toBe('OK');
        await expireLease(receipt.batchId);
        await jobStore.recoverInboxJobs();
        await expect(jobStore.markBatchIssuanceStarted(id, 'old-worker')).rejects.toThrow(
            'lease lost'
        );
        expect((await poll(receipt.batchId)).summary.succeeded).toBe(1);
        expect(sendSpy).toHaveBeenCalledTimes(1);
    });

    it('marks an interrupted issuance unconfirmed and retains its key beyond the replay window', async () => {
        const entry = {
            recipient: email('uncertain@test.com'),
            credential: await signed(),
            idempotencyKey: 'uncertain',
        };
        const receipt = await submit({ items: [entry] });
        const id = `${receipt.batchId}:0`;
        const claimed = await jobStore.claimBatchItem(id, 'lost-worker');
        await jobStore
            .batchReplayStore(id, 'lost-worker', claimed!.item.replayKey)
            .setIfAbsent(
                '',
                JSON.stringify({ state: 'processing', requestHash: 'uncertain' }),
                86400
            );
        await jobStore.markBatchIssuanceStarted(id, 'lost-worker');
        await expireLease(receipt.batchId);
        await jobStore.recoverInboxJobs();
        expect(await statusOf(receipt.batchId)).toMatchObject({
            status: 'NEEDS_RECONCILIATION',
            summary: { unconfirmed: 1 },
        });
        expect((await replay('uncertain')).expiresAt).toBeUndefined();
        expect((await issue({ items: [entry] })).results[0]).toMatchObject({
            success: false,
            error: { code: 'CONFLICT' },
        });
        expect(sendSpy).not.toHaveBeenCalled();
    });

    it('recovers a durable success after the worker loses its completion write', async () => {
        const receipt = await submit({
            items: [{ recipient: email('commit@test.com'), credential: await signed() }],
        });
        vi.spyOn(jobStore, 'finishBatchItem').mockRejectedValueOnce(
            new Error('Lost completion write')
        );
        await dispatchInboxJobs();
        await expect(consumeInboxQueueOnce(0)).rejects.toThrow('Lost completion write');
        await expireLease(receipt.batchId);
        await jobStore.recoverInboxJobs();
        expect(await statusOf(receipt.batchId)).toMatchObject({
            status: 'COMPLETED',
            summary: { succeeded: 1 },
        });
        expect((await statusOf(receipt.batchId)).items[0]?.result?.idempotencyKey).toBeUndefined();
        expect(sendSpy).toHaveBeenCalledTimes(1);
    });

    it('exposes dead-letter exhaustion and cleans up completed jobs after 30 days', async () => {
        const receipt = await submit({
            items: [{ recipient: email('dead@test.com'), credential: await signed() }],
        });
        const client = new SQSClient({
            endpoint: process.env.INBOX_QUEUE_ENDPOINT,
            region: 'us-east-1',
            credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
        });
        try {
            await client.send(
                new SendMessageCommand({
                    QueueUrl: process.env.INBOX_DEAD_LETTER_QUEUE_URL,
                    MessageBody: JSON.stringify({ itemId: `${receipt.batchId}:0` }),
                })
            );
            await consumeInboxDeadLettersOnce();
        } finally {
            client.destroy();
        }
        expect(await statusOf(receipt.batchId)).toMatchObject({
            status: 'COMPLETED',
            summary: { failed: 1 },
        });
        await jobStore.recoverInboxJobs();
        await neogma.queryRunner.run('MATCH (b:InboxBatch {id: $id}) SET b.completedAt = $old', {
            id: receipt.batchId,
            old: Date.now() - 31 * jobStore.DAY,
        });
        await jobStore.recoverInboxJobs();
        await expect(statusOf(receipt.batchId)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('fails closed without queue configuration and leaves no accepted job', async () => {
        vi.stubEnv('INBOX_QUEUE_URL', '');
        const credential = await signed();
        // The programmatic route also rejects oversized input before checking queue setup.
        await expect(
            issuer.clients.fullAuth.inbox.issueBatch({
                items: [{ recipient: email('too-large@test.com'), credential }],
                configuration: { templateData: { padding: 'x'.repeat(4 * 1024 * 1024) } },
            })
        ).rejects.toMatchObject({ code: 'PAYLOAD_TOO_LARGE' });
        const response = await post({
            items: [{ recipient: email('offline@test.com'), credential }],
        });
        expect(response.statusCode).toBe(500);
        const rows = await neogma.queryRunner.run('MATCH (b:InboxBatch) RETURN count(b) AS count');
        expect(Number(rows.records[0]!.get('count'))).toBe(0);
        expect(sendSpy).not.toHaveBeenCalled();
    });

    it('atomically admits concurrent batches without overspending the hourly quota', async () => {
        vi.stubEnv('INBOX_BATCH_ITEMS_PER_HOUR', '2');
        const credential = await signed();
        const responses = await Promise.all(
            Array.from({ length: 5 }, (_, i) =>
                post({ items: [{ recipient: email(`quota-${i}@test.com`), credential }] })
            )
        );
        expect(responses.filter(response => response.statusCode === 202)).toHaveLength(2);
        expect(responses.filter(response => response.statusCode === 429)).toHaveLength(3);
        const quota = await neogma.queryRunner.run(
            'MATCH (q:InboxBatchIssuer {id: "batch-issuer"}) RETURN q.used AS used'
        );
        expect(Number(quota.records[0]!.get('used'))).toBe(2);
        expect(sendSpy).not.toHaveBeenCalled();
    });

    it('returns three pending results in input order and defers signing until claim', async () => {
        // Use an unsigned credential and a configured signing authority to exercise the normal
        // inbox flow: unknown recipients receive an unsigned credential in escrow, and it is
        // signed only after the recipient claims it.
        const sign = vi.spyOn(signing, 'issueCredentialWithSigningAuthority');
        const credential = await unsigned();
        const recipients = ['one@test.com', 'two@test.com', 'three@test.com'].map(email);

        // Submit shared configuration once. The issue test helper asserts HTTP 202, sends real
        // SQS messages through the worker, and polls until each item has a durable result.
        // Processing can finish out of order; polling must retain the original item order.
        const batch = await issue({
            configuration: { signingAuthority },
            items: recipients.map(recipient => ({ recipient, credential })),
        });

        // A successful batch reports both a compact aggregate and one outcome per submitted item.
        // Partial failures would still appear in `results`; this all-success case establishes the
        // expected baseline for a three-recipient batch.
        expect(batch.summary).toEqual({ total: 3, succeeded: 3, failed: 0, deduplicated: 0 });
        expect(batch.results.map(r => r.index)).toEqual([0, 1, 2]);
        for (const [index, result] of batch.results.entries()) {
            // Each result is correlated to its original input index and has the same pending
            // inbox semantics as a single issuance: a claim URL is created for the recipient.
            expect(result).toMatchObject({
                success: true,
                status: 'PENDING',
                recipient: recipients[index],
                claimUrl: expect.any(String),
            });
            if (!result.success) throw new Error('Expected successful issuance');

            // The stored copy remains unsigned while it waits in the Universal Inbox. This proves
            // the batch orchestrator delegated to the existing deferred-signing issuance path.
            expect((await stored(result.issuanceId)).isSigned).toBe(false);
        }

        // Issuing the batch sends one notification per recipient but must not sign all three
        // credentials eagerly. Signing is intentionally delayed until an individual claim.
        expect(sign).not.toHaveBeenCalled();
        expect(sendSpy).toHaveBeenCalledTimes(3);

        // Claiming only the first result signs only that credential. This demonstrates that batch
        // issuance creates independent inbox records rather than one shared batch-level claim.
        const first = batch.results[0]!;
        if (!first.success) throw new Error('Expected successful issuance');
        expect((await claim(first.claimUrl!))[0]?.proof).toBeDefined();
        expect(sign).toHaveBeenCalledTimes(1);
    });

    it('stores a pre-signed credential unchanged and preserves its proof through claim', async () => {
        const credential = await signed();
        const sign = vi.spyOn(signing, 'issueCredentialWithSigningAuthority');
        const {
            results: [result],
        } = await issue({ items: [{ recipient: email('signed@test.com'), credential }] });
        if (!result?.success) throw new Error('Expected successful issuance');
        expect(
            JSON.parse(await decryptInboxCredential((await stored(result.issuanceId)).credential))
        ).toEqual(credential);
        expect(await claim(result.claimUrl!)).toEqual([credential]);
        expect(sign).not.toHaveBeenCalled();
    });

    it('retries a transient signing failure before delivery without requiring reconciliation', async () => {
        const contact = await createContactMethod({
            ...email('retry-signing@test.com'),
            isVerified: true,
        });
        await createProfileContactMethodRelationship('batch-holder', contact.id);
        const sign = vi
            .spyOn(signing, 'issueCredentialWithSigningAuthority')
            .mockRejectedValueOnce(new Error('Signing authority timeout'));
        const receipt = await submit({
            configuration: { signingAuthority },
            items: [
                {
                    recipient: email('retry-signing@test.com'),
                    credential: await unsigned(),
                    idempotencyKey: 'retry-signing',
                },
            ],
        });
        await dispatchInboxJobs();
        await consumeInboxQueueOnce(0);
        expect(await statusOf(receipt.batchId)).toMatchObject({
            status: 'QUEUED',
            summary: { pending: 1, unconfirmed: 0 },
        });
        expect(await replay('retry-signing')).toBeUndefined();
        expect(await InboxCredential.findMany({ where: {} })).toHaveLength(0);
        expect(
            (await jobStore.readBatchJob(receipt.batchId, 'batch-issuer')).job.payload
        ).toBeDefined();
        expect((await poll(receipt.batchId)).summary.succeeded).toBe(1);
        expect(sign).toHaveBeenCalledTimes(2);
        expect(await InboxCredential.findMany({ where: {} })).toHaveLength(1);
    });

    it('blocks a stale worker after signing and before delivery', async () => {
        const contact = await createContactMethod({
            ...email('stale-signing@test.com'),
            isVerified: true,
        });
        await createProfileContactMethodRelationship('batch-holder', contact.id);
        const receipt = await submit({
            configuration: { signingAuthority },
            items: [
                {
                    recipient: email('stale-signing@test.com'),
                    credential: await unsigned(),
                    idempotencyKey: 'stale-signing',
                },
            ],
        });
        const originalSign = signing.issueCredentialWithSigningAuthority;
        vi.spyOn(signing, 'issueCredentialWithSigningAuthority').mockImplementationOnce(
            async (...args) => {
                const result = await originalSign(...args);
                await expireLease(receipt.batchId);
                await jobStore.recoverInboxJobs();
                return result;
            }
        );
        await dispatchInboxJobs();
        await expect(consumeInboxQueueOnce(0)).rejects.toThrow('lease lost');
        expect(await InboxCredential.findMany({ where: {} })).toHaveLength(0);
        expect((await poll(receipt.batchId)).summary.succeeded).toBe(1);
        expect(await InboxCredential.findMany({ where: {} })).toHaveLength(1);
    });

    it.each(['finish', 'recovery', 'dead-letter'] as const)(
        'drops settled payloads and prunes uncertain jobs while preserving reservations via %s',
        async path => {
            const entry = {
                recipient: email('retention@test.com'),
                credential: await signed(),
                idempotencyKey: 'retention',
            };
            const receipt = await submit({
                items: [
                    entry,
                    { ...entry, idempotencyKey: 'retention-second' },
                    {
                        recipient: email('unkeyed-retention@test.com'),
                        credential: entry.credential,
                    },
                ],
            });
            const internalId = `${receipt.batchId}:2`;
            const internal = await jobStore.claimBatchItem(internalId, 'worker');
            await jobStore
                .batchReplayStore(internalId, 'worker', internal!.item.replayKey)
                .setIfAbsent(
                    '',
                    JSON.stringify({ state: 'processing', requestHash: 'internal' }),
                    86400
                );
            await jobStore.markBatchIssuanceStarted(internalId, 'worker');
            await jobStore.finishBatchItem(internalId, 'worker', {
                success: false,
                index: 2,
                error: { code: 'CONFLICT', message: 'Delivery uncertain' },
            });
            const id = `${receipt.batchId}:0`;
            const claimed = await jobStore.claimBatchItem(id, 'worker');
            await jobStore
                .batchReplayStore(id, 'worker', claimed!.item.replayKey)
                .setIfAbsent(
                    '',
                    JSON.stringify({ state: 'processing', requestHash: 'retention' }),
                    86400
                );
            await jobStore.markBatchIssuanceStarted(id, 'worker');
            if (path === 'finish') {
                await jobStore.finishBatchItem(id, 'worker', {
                    success: false,
                    index: 0,
                    error: { code: 'CONFLICT', message: 'Delivery uncertain' },
                });
            } else {
                await expireLease(receipt.batchId);
                if (path === 'recovery') await jobStore.recoverInboxJobs();
                else await jobStore.deadLetterBatchItem(id);
            }
            // The second item can still progress, so the payload must remain available.
            expect(
                (await jobStore.readBatchJob(receipt.batchId, 'batch-issuer')).job.payload
            ).toBeDefined();
            await jobStore.deadLetterBatchItem(`${receipt.batchId}:1`);
            const { job } = await jobStore.readBatchJob(receipt.batchId, 'batch-issuer');
            expect(job.payload).toBeUndefined();
            expect(job.completedAt).toBeDefined();
            expect(await statusOf(receipt.batchId)).toMatchObject({
                status: 'NEEDS_RECONCILIATION',
                summary: { pending: 0, unconfirmed: 2 },
            });
            const internalReplay = async () =>
                neogma.queryRunner.run('MATCH (r:InboxBatchReplay {id: $id}) RETURN r', {
                    id: internal!.item.replayKey,
                });
            await jobStore.recoverInboxJobs();
            expect((await internalReplay()).records).toHaveLength(1);
            await neogma.queryRunner.run(
                'MATCH (b:InboxBatch {id: $id}) SET b.completedAt = $old',
                { id: receipt.batchId, old: Date.now() - 31 * jobStore.DAY }
            );
            await jobStore.recoverInboxJobs();
            await expect(statusOf(receipt.batchId)).rejects.toMatchObject({ code: 'NOT_FOUND' });
            expect((await internalReplay()).records).toHaveLength(0);
            expect((await replay('retention')).expiresAt).toBeUndefined();
            expect((await issue({ items: [entry] })).results[0]).toMatchObject({
                success: false,
                error: { code: 'CONFLICT' },
            });
            expect(sendSpy).not.toHaveBeenCalled();
        }
    );

    it('bounds orphaned internal replay cleanup and preserves client reservations', async () => {
        await neogma.queryRunner.run(
            `UNWIND range(0, 1000) AS index
            CREATE (:InboxBatchReplay {id: 'internal:orphan-' + toString(index), itemId: 'missing'})`
        );
        await neogma.queryRunner.run(
            `CREATE (:InboxBatchReplay {id: 'client:orphan', itemId: 'missing'})`
        );
        const remaining = async () => {
            const rows = await neogma.queryRunner.run(
                'MATCH (r:InboxBatchReplay) RETURN r.id AS id'
            );
            return rows.records.map(row => row.get('id') as string);
        };
        await jobStore.recoverInboxJobs();
        const ids = await remaining();
        expect(ids.filter(id => id.startsWith('internal:'))).toHaveLength(1);
        expect(ids).toContain('client:orphan');
        await jobStore.recoverInboxJobs();
        expect(await remaining()).toEqual(['client:orphan']);
    });

    it('defers all cleanup with five seconds remaining and resumes with more budget', async () => {
        const receipt = await submit({
            items: [{ recipient: email('cleanup-budget@test.com'), credential: await signed() }],
        });
        await jobStore.deadLetterBatchItem(`${receipt.batchId}:0`);
        const now = Date.now();
        await neogma.queryRunner.run('MATCH (b:InboxBatch {id: $id}) SET b.completedAt = $old', {
            id: receipt.batchId,
            old: now - 31 * jobStore.DAY,
        });
        await neogma.queryRunner.run(
            `CREATE (:InboxBatchReplay {id: 'client:expired', expiresAt: $expired}),
                (:InboxBatchReplay {id: 'internal:orphan-budget', itemId: 'missing'})`,
            { expired: now - 1 }
        );
        const replayCount = async () => {
            const rows = await neogma.queryRunner.run(
                'MATCH (r:InboxBatchReplay) RETURN count(r) AS count'
            );
            return Number(rows.records[0]!.get('count'));
        };
        const clock = vi.spyOn(Date, 'now').mockReturnValue(now);
        try {
            await jobStore.recoverInboxJobs(now + 5_000);
            expect(await statusOf(receipt.batchId)).toMatchObject({ status: 'COMPLETED' });
            expect(await replayCount()).toBe(2);
            await jobStore.recoverInboxJobs(now + 5_001);
            await expect(statusOf(receipt.batchId)).rejects.toMatchObject({ code: 'NOT_FOUND' });
            expect(await replayCount()).toBe(0);
        } finally {
            clock.mockRestore();
        }
    });

    it('signs and auto-delivers only the verified known recipient', async () => {
        const contact = await createContactMethod({ ...email('known@test.com'), isVerified: true });
        await createProfileContactMethodRelationship('batch-holder', contact.id);
        const sign = vi.spyOn(signing, 'issueCredentialWithSigningAuthority');
        const credential = await unsigned();
        const batch = await issue({
            configuration: { signingAuthority },
            items: [
                { recipient: email('known@test.com'), credential },
                { recipient: email('unknown@test.com'), credential },
            ],
        });
        expect(batch.results[0]).toMatchObject({
            success: true,
            status: 'ISSUED',
            recipientDid: expect.any(String),
        });
        expect(batch.results[1]).toMatchObject({ success: true, status: 'PENDING' });
        expect(sign).toHaveBeenCalledTimes(1);
        expect(sendSpy).toHaveBeenCalledTimes(1);
    });

    it('renders template data independently for each recipient', async () => {
        const template = structuredClone(testUnsignedBoost);
        template.name = '{{student.name}}';
        const templateUri = await issuer.clients.fullAuth.boost.createBoost({
            credential: template,
            name: 'Batch template',
            category: 'Achievement',
        });
        const batch = await issue({
            configuration: { signingAuthority, templateData: { student: { course: 'Math' } } },
            items: ['Ada', 'Grace'].map(name => ({
                recipient: email(`${name}@test.com`),
                templateUri,
                configuration: { templateData: { student: { name } } },
            })),
        });
        expect(batch.summary.failed).toBe(0);
        const names = [];
        for (const result of batch.results) {
            if (!result.success) throw new Error('Expected successful issuance');
            names.push(
                JSON.parse(
                    await decryptInboxCredential((await stored(result.issuanceId)).credential)
                ).name
            );
        }
        expect(names).toEqual(['Ada', 'Grace']);
    });

    it('returns HTTP 202 then exposes partial success and passes tenant branding to delivery', async () => {
        const response = await post({
            items: [
                { recipient: email('good@test.com'), credential: await signed() },
                { recipient: email('bad@test.com'), templateUri: 'invalid-template' },
            ],
        });
        expect(response.statusCode, response.body).toBe(202);
        expect(sendSpy).not.toHaveBeenCalled();
        expect(await poll(response.json().batchId)).toMatchObject({
            summary: { total: 2, succeeded: 1, failed: 1 },
            results: [
                { success: true, index: 0 },
                { success: false, index: 1, error: { code: 'BAD_REQUEST' } },
            ],
        });
        expect(sendSpy.mock.calls[0]?.[0]?.branding).toMatchObject({ brandName: 'ScoutPass' });
    });

    it('replays keys without new records, claim emails or webhook queue entries', async () => {
        const credential = await signed();
        const batch = {
            configuration: { webhookUrl: 'https://issuer.test/events' },
            items: [0, 1, 2].map(i => ({
                recipient: email(`replay${i}@test.com`),
                credential,
                idempotencyKey: `replay-${i}`,
            })),
        };
        const first = await issue(batch);
        const emails = sendSpy.mock.calls.length;
        const webhooks = addNotificationToQueueSpy.mock.calls.length;
        const records = await InboxCredential.findMany({ where: {} });
        const second = await issue({ ...batch, items: [...batch.items].reverse() });
        expect(second.summary).toEqual({ total: 3, succeeded: 3, failed: 0, deduplicated: 3 });
        expect(second.results).toEqual(
            [...first.results].reverse().map((r, index) => ({ ...r, index, deduplicated: true }))
        );
        expect(records).toHaveLength(3);
        expect(await InboxCredential.findMany({ where: {} })).toHaveLength(records.length);
        expect(sendSpy).toHaveBeenCalledTimes(emails);
        expect(addNotificationToQueueSpy).toHaveBeenCalledTimes(webhooks);
        const ttl = (Number((await replay('replay-0')).expiresAt) - Date.now()) / 1000;
        expect(ttl).toBeGreaterThan(86300);
        expect(ttl).toBeLessThanOrEqual(86400);
    });

    it('does not consume an idempotency key on failure', async () => {
        const item = { recipient: email('retry@test.com'), idempotencyKey: 'retry' };
        expect((await post({ items: [item] })).statusCode).toBe(400);
        expect(await replay('retry')).toBeUndefined();
        const result = (await issue({ items: [{ ...item, credential: await signed() }] }))
            .results[0];
        expect(result).toMatchObject({ success: true });
        expect(result).not.toHaveProperty('deduplicated');
    });

    it('deep-merges batch configuration and enqueues webhooks with per-item overrides', async () => {
        const credential = await unsigned();
        const batch = await issue({
            configuration: {
                signingAuthority,
                webhookUrl: 'https://issuer.test/default',
                delivery: {
                    suppress: true,
                    template: {
                        model: {
                            issuer: {
                                name: 'Batch issuer',
                                logoUrl: 'https://issuer.test/logo.png',
                            },
                        },
                    },
                },
            },
            items: [
                {
                    recipient: email('inherit@test.com'),
                    credential,
                    configuration: {
                        delivery: { template: { model: { recipient: { name: 'Ada' } } } },
                    },
                },
                {
                    recipient: email('override@test.com'),
                    credential,
                    configuration: {
                        signingAuthority: {
                            endpoint: 'https://override.test/sign',
                            name: 'override-sa',
                        },
                        webhookUrl: 'https://issuer.test/override',
                        delivery: { suppress: false },
                    },
                },
            ],
        });
        expect(batch.summary.failed).toBe(0);
        expect(sendSpy).toHaveBeenCalledTimes(1);
        expect(sendSpy.mock.calls[0]?.[0]).toMatchObject({
            templateModel: { issuer: { name: 'Batch issuer' } },
        });
        for (const [index, result] of batch.results.entries()) {
            if (!result.success) throw new Error('Expected successful issuance');
            expect(await stored(result.issuanceId)).toMatchObject({
                signingAuthority: index
                    ? { endpoint: 'https://override.test/sign', name: 'override-sa' }
                    : signingAuthority,
                webhookUrl: `https://issuer.test/${index ? 'override' : 'default'}`,
            });
            expect(addNotificationToQueueSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'ISSUANCE_DELIVERED',
                    webhookUrl: `https://issuer.test/${index ? 'override' : 'default'}`,
                })
            );
        }
    });

    it('rejects an over-quota batch before processing any item', async () => {
        vi.stubEnv('INBOX_BATCH_ITEMS_PER_HOUR', '2');
        const credential = await signed();
        const items = [0, 1, 2].map(i => ({ recipient: email(`rate${i}@test.com`), credential }));
        await expect(issuer.clients.fullAuth.inbox.issueBatch({ items })).rejects.toMatchObject({
            code: 'TOO_MANY_REQUESTS',
            message: expect.stringContaining('3600 seconds'),
        });
        expect(await InboxCredential.findMany({ where: {} })).toHaveLength(0);
        expect(sendSpy).not.toHaveBeenCalled();
        const quota = async () =>
            (
                await neogma.queryRunner.run(
                    'MATCH (q:InboxBatchIssuer {id: "batch-issuer"}) RETURN q.used AS used'
                )
            ).records[0]?.get('used');
        expect(await quota()).toBeUndefined();
        expect((await issue({ items: items.slice(0, 2) })).summary.succeeded).toBe(2);
        expect(Number(await quota())).toBe(2);
    });

    it('supports guardian approval on the single route and rejects self-approval before writes', async () => {
        const credential = await signed();
        const recipient = email('child@test.com');
        const rejected = await post(
            { recipient, credential, configuration: { guardianEmail: 'CHILD@test.com' } },
            true,
            '/api/inbox/issue'
        );
        expect(rejected.statusCode).toBe(400);
        expect(await InboxCredential.findMany({ where: {} })).toHaveLength(0);
        expect(sendSpy).not.toHaveBeenCalled();

        const accepted = await post(
            { recipient, credential, configuration: { guardianEmail: 'guardian@test.com' } },
            true,
            '/api/inbox/issue'
        );
        expect(accepted.statusCode, accepted.body).toBe(200);
        expect(await stored(accepted.json().issuanceId)).toMatchObject({
            guardianEmail: 'guardian@test.com',
            guardianStatus: 'AWAITING_GUARDIAN',
        });
        expect(sendSpy).toHaveBeenCalledTimes(2);
    });

    it('releases keys after real preflight rejection and accepts a corrected issuance', async () => {
        await SigningAuthority.delete({ detach: true, where: {} });
        const entry = {
            recipient: email('preflight@test.com'),
            credential: await unsigned(),
            idempotencyKey: 'preflight',
        };
        expect((await issue({ items: [entry] })).results[0]).toMatchObject({
            success: false,
            error: {
                code: 'BAD_REQUEST',
                message: 'Unsigned credentials require a signing authority',
            },
        });
        expect(await replay('preflight')).toBeUndefined();
        expect(await InboxCredential.findMany({ where: {} })).toHaveLength(0);
        expect(sendSpy).not.toHaveBeenCalled();
        expect(
            (await issue({ items: [{ ...entry, credential: await signed() }] })).summary.succeeded
        ).toBe(1);
    });

    it.each(['untrusted-phone', 'invalid-preflight', 'missing-authority'] as const)(
        'releases keys after %s preflight rejection before any delivery',
        async scenario => {
            const credential = await unsigned();
            let recipient: IssueInboxCredentialBatch['items'][number]['recipient'] =
                email('preflight@test.com');
            let configuration: IssueInboxCredentialBatch['configuration'];
            let code = 'BAD_REQUEST';
            if (scenario === 'untrusted-phone') {
                recipient = { type: 'phone', value: '+15555550100' };
                code = 'FORBIDDEN';
            } else if (scenario === 'invalid-preflight') {
                // Unknown JSON-LD property fails the real preflight signer, as in inbox.spec.ts.
                credential.context = 'banana';
            } else {
                const contact = await createContactMethod({ ...recipient, isVerified: true });
                await createProfileContactMethodRelationship('batch-holder', contact.id);
                configuration = {
                    signingAuthority: { endpoint: 'https://missing.test', name: 'missing' },
                };
                code = 'NOT_FOUND';
            }
            const result = await issue({
                items: [{ recipient, credential, configuration, idempotencyKey: scenario }],
            });
            expect(result.results[0]).toMatchObject({ success: false, error: { code } });
            expect(await replay(scenario)).toBeUndefined();
            expect(await InboxCredential.findMany({ where: {} })).toHaveLength(0);
            expect(sendSpy).not.toHaveBeenCalled();
            expect(
                (
                    await issue({
                        items: [
                            {
                                recipient: email('corrected@test.com'),
                                credential: await signed(),
                                idempotencyKey: scenario,
                            },
                        ],
                    })
                ).summary.succeeded
            ).toBe(1);
        }
    );

    it('issues only the first occurrence of a repeated key within one batch', async () => {
        const credential = await signed();
        const entry = {
            recipient: email('duplicate@test.com'),
            credential,
            idempotencyKey: 'duplicate',
        };
        const batch = await issue({
            items: [entry, entry, { ...entry, recipient: email('changed@test.com') }],
        });
        expect(batch.results).toMatchObject([
            { success: true, index: 0 },
            { success: false, index: 1, error: { code: 'CONFLICT' } },
            { success: false, index: 2, error: { code: 'CONFLICT' } },
        ]);
        expect(await InboxCredential.findMany({ where: {} })).toHaveLength(1);
        expect(sendSpy).toHaveBeenCalledTimes(1);
    });

    it('rejects empty and oversized batches, unauthenticated callers and read-only grants', async () => {
        await expect(issuer.clients.fullAuth.inbox.issueBatch({ items: [] })).rejects.toMatchObject(
            { code: 'BAD_REQUEST' }
        );
        const item = { recipient: email('validation@test.com'), credential: await signed() };
        await expect(
            issuer.clients.fullAuth.inbox.issueBatch({ items: Array(101).fill(item) })
        ).rejects.toMatchObject({
            code: 'BAD_REQUEST',
        });
        expect((await post({ items: [item] }, false)).statusCode).toBe(401);
        await expect(
            getClient({
                did: issuer.learnCard.id.did(),
                isChallengeValid: true,
                scope: 'inbox:read',
            }).inbox.issueBatch({ items: [item] })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    it('chunks full CLR payloads by bytes and enforces the 4 MiB HTTP boundary', async () => {
        const credential = structuredClone(clrWestbridgeFull.credential);
        // Unknown recipients defer signing, so this exercises real encrypted storage without
        // contacting an authority. This fixture is ~52 KB: 100 exceed the transport budget.
        const items = Array.from({ length: 100 }, (_, i) => ({
            recipient: email(`clr${i}@test.com`),
            credential,
            configuration: {
                signingAuthority: { endpoint: 'https://missing.test', name: 'missing' },
            },
        }));
        expect((await post({ items })).statusCode).toBe(413);
        const payload = {
            items: items.slice(0, 75),
            configuration: { templateData: { padding: '' } },
        };
        const maxBytes = 4 * 1024 * 1024;
        expect(Buffer.byteLength(JSON.stringify(payload))).toBeLessThan(maxBytes);
        payload.configuration.templateData.padding = 'x'.repeat(
            maxBytes - Buffer.byteLength(JSON.stringify(payload))
        );
        const response = await post(payload);
        expect(response.statusCode, response.body).toBe(202);
        const completed = await poll(response.json().batchId);
        expect(completed.results).toHaveLength(75);
        expect(completed.summary).toEqual({
            total: 75,
            succeeded: 75,
            failed: 0,
            deduplicated: 0,
        });
        const before = await InboxCredential.findMany({ where: {} });
        payload.configuration.templateData.padding += 'x';
        const tooLarge = await post(payload);
        expect(tooLarge.statusCode).toBe(413);
        expect(await InboxCredential.findMany({ where: {} })).toHaveLength(before.length);
    });

    it('accepts a single unkeyed item at exactly 4 MiB even after the worker adds its internal key', async () => {
        const batch = {
            items: [{ recipient: email('exact@test.com'), credential: await signed() }],
            configuration: { templateData: { padding: '' } },
        };
        batch.configuration.templateData.padding = 'x'.repeat(
            4 * 1024 * 1024 - Buffer.byteLength(JSON.stringify(batch))
        );
        expect((await issue(batch)).summary.succeeded).toBe(1);
        batch.configuration.templateData.padding += 'x';
        expect((await post(batch)).statusCode).toBe(413);
    });

    it('gates only the item configured with a guardian email', async () => {
        const credential = await signed();
        const batch = await issue({
            configuration: { guardianEmail: 'guardian@test.com' },
            items: [
                {
                    recipient: email('child@test.com'),
                    credential,
                },
                {
                    recipient: email('adult@test.com'),
                    credential,
                    configuration: { guardianEmail: null },
                },
            ],
        });
        expect(batch.results[0]).toMatchObject({
            success: true,
            status: 'PENDING',
            guardianStatus: 'AWAITING_GUARDIAN',
        });
        expect(batch.results[1]).toMatchObject({ success: true, status: 'PENDING' });
        expect(batch.results[1]).not.toHaveProperty('guardianStatus', 'AWAITING_GUARDIAN');
        const first = batch.results[0]!;
        if (!first.success) throw new Error('Expected successful issuance');
        expect(await stored(first.issuanceId)).toMatchObject({
            guardianEmail: 'guardian@test.com',
            guardianStatus: 'AWAITING_GUARDIAN',
        });
    });
});
