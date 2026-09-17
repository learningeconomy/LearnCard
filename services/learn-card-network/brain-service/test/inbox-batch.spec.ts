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
import { configureInboxBatchBodyLimit } from '@helpers/inbox-batch-http.helpers';
import { setValidChallengeForDid } from '@cache/challenges';
import { getInboxCredentialById } from '@accesslayer/inbox-credential/read';
import { createContactMethod } from '@accesslayer/contact-method/create';
import { createProfileContactMethodRelationship } from '@accesslayer/contact-method/relationships/create';
import { decryptInboxCredential } from '@helpers/inbox-encryption.helpers';
import * as notifications from '@helpers/notifications.helpers';
import { clrWestbridgeFull } from '../../../../packages/credential-library/src/fixtures/clr/westbridge-full';
import * as signing from '@helpers/signingAuthority.helpers';

vi.mock('@services/delivery/delivery.factory', () => ({
    getDeliveryService: () => ({ send: sendSpy }),
}));

describe('Universal Inbox batch issuance', () => {
    let issuer: Awaited<ReturnType<typeof getUser>>;
    let holder: Awaited<ReturnType<typeof getUser>>;
    let server: FastifyInstance;
    const signingAuthority = { endpoint: 'http://localhost:5000/api', name: 'batch-sa' };
    const email = (value: string) => ({ type: 'email' as const, value });
    const unsigned = async () => issuer.learnCard.invoke.getTestVc();
    const signed = async () => issuer.learnCard.invoke.issueCredential(await unsigned());
    const issue = (batch: IssueInboxCredentialBatch) =>
        issuer.clients.fullAuth.inbox.issueBatch(batch);
    const stored = async (id: string) => {
        const record = await getInboxCredentialById(id);
        expect(record).toBeDefined();
        return record!;
    };
    const post = async (body: unknown, authenticated = true) => {
        const challenge = randomUUID();
        await setValidChallengeForDid(issuer.learnCard.id.did(), challenge);
        const token = await issuer.learnCard.invoke.getDidAuthVp({ proofFormat: 'jwt', challenge });
        return server.inject({
            method: 'POST',
            url: '/api/inbox/issue-batch',
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
    });

    it('returns three pending results in input order and defers signing until claim', async () => {
        // Use an unsigned credential and a configured signing authority to exercise the normal
        // inbox flow: unknown recipients receive an unsigned credential in escrow, and it is
        // signed only after the recipient claims it.
        const sign = vi.spyOn(signing, 'issueCredentialWithSigningAuthority');
        const credential = await unsigned();
        const recipients = ['one@test.com', 'two@test.com', 'three@test.com'].map(email);

        // This is the batch API's core shape: shared configuration is supplied once, while each
        // item supplies its recipient and credential. The helper runs these concurrently, but the
        // contract requires results to retain this input order.
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

    it('returns HTTP 200 for partial success and passes tenant branding to delivery', async () => {
        const response = await post({
            items: [
                { recipient: email('good@test.com'), credential: await signed() },
                { recipient: email('bad@test.com') },
            ],
        });
        expect(response.statusCode, response.body).toBe(200);
        expect(response.json()).toMatchObject({
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
        const ttl = await cache.ttl('inbox-batch-idem:batch-issuer:replay-0');
        expect(ttl).toBeGreaterThan(86300);
        expect(ttl).toBeLessThanOrEqual(86400);
    });

    it('does not consume an idempotency key on failure', async () => {
        const item = { recipient: email('retry@test.com'), idempotencyKey: 'retry' };
        expect((await issue({ items: [item] })).results[0]).toMatchObject({ success: false });
        expect(await cache.get('inbox-batch-idem:batch-issuer:retry')).toBeNull();
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
        await expect(issue({ items })).rejects.toMatchObject({
            code: 'TOO_MANY_REQUESTS',
            message: expect.stringContaining('3600 seconds'),
        });
        expect(await InboxCredential.findMany({ where: {} })).toHaveLength(0);
        expect(sendSpy).not.toHaveBeenCalled();
        expect(await cache.get('inbox-batch-rate:batch-issuer')).toBe('3');
    });

    it('rejects empty and oversized batches, unauthenticated callers and read-only grants', async () => {
        await expect(issue({ items: [] })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        const item = { recipient: email('validation@test.com'), credential: await signed() };
        await expect(issue({ items: Array(101).fill(item) })).rejects.toMatchObject({
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
        expect(response.statusCode, response.body).toBe(200);
        expect(response.json().results).toHaveLength(75);
        expect(response.json().summary).toEqual({
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
