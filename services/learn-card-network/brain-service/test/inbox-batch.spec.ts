import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { fastifyTRPCOpenApiPlugin } from 'trpc-to-openapi';
import { randomUUID } from 'node:crypto';
import type { IssueInboxCredentialBatch, VC, VP } from '@learncard/types';
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
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

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
        return response.json() as { batchId: string; status: 'QUEUED'; createdAt: string };
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
        const response = await post({
            items: [{ recipient: email('offline@test.com'), credential: await signed() }],
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
                { recipient: email('bad@test.com') },
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
        expect((await issue({ items: [item] })).results[0]).toMatchObject({ success: false });
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
            items: [
                {
                    recipient: email('child@test.com'),
                    credential,
                    configuration: { guardianEmail: 'guardian@test.com' },
                },
                { recipient: email('adult@test.com'), credential },
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
