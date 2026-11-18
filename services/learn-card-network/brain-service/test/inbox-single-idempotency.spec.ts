import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    IssueInboxCredentialValidator,
    IssueInboxCredentialResponseValidator,
    type IssueInboxCredentialType,
} from '@learncard/types';
import { SQSClient } from '@aws-sdk/client-sqs';
import { Profile, Credential, InboxCredential, ContactMethod } from '@models';
import { neogma } from '@instance';
import cache from '@cache';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { createContactMethod } from '@accesslayer/contact-method/create';
import { createProfileContactMethodRelationship } from '@accesslayer/contact-method/relationships/create';
import {
    batchReplayStore,
    claimBatchItem,
    markBatchIssuanceStarted,
    recoverInboxJobs,
    DAY,
} from '@accesslayer/inbox-batch/store';
import { fingerprint } from '@helpers/inbox-batch.helpers';
import {
    getInboxBatch,
    processInboxQueueMessage,
    submitInboxBatch,
} from '@helpers/inbox-queue.helpers';
import * as notifications from '@helpers/notifications.helpers';
import * as inboxHelpers from '@helpers/inbox.helpers';
import { AUTH_GRANT_FULL_ACCESS_SCOPE } from '../src/constants/auth-grant';
import { getUser } from './helpers/getClient';
import { addNotificationToQueueSpy, sendSpy } from './helpers/spies';

vi.mock('@environment', async importOriginal => {
    const actual = await importOriginal<typeof import('@environment')>();
    return {
        ...actual,
        getInboxBatchRuntimeEnvironment: () => ({
            ...actual.getInboxBatchRuntimeEnvironment(),
            INBOX_QUEUE_URL:
                'https://sqs.us-east-1.amazonaws.com/000000000000/inbox-single-idempotency',
        }),
    };
});
vi.mock('@services/delivery/delivery.factory', () => ({
    getDeliveryService: () => ({ send: sendSpy }),
}));
vi.mock('@services/registry/registry.factory', () => ({
    getRegistryService: () => ({
        isTrusted: async () => false,
        getIssuer: async () => null,
    }),
}));

type User = Awaited<ReturnType<typeof getUser>>;
describe('single inbox durable idempotency', () => {
    let issuer: User;
    let other: User;
    let holder: User;
    const issuerId = 'single-idem-issuer';
    const recipient = { type: 'email' as const, value: 'single-idem-holder@test.com' };
    const counters = { iterations: 0, delivered: 0, inProgress: 0 };

    const inputFor = async (
        user = issuer,
        key?: string,
        name = 'Idempotent issuance'
    ): Promise<IssueInboxCredentialType> => {
        const unsigned = await user.learnCard.invoke.getTestVc();
        const credential = await user.learnCard.invoke.issueCredential({
            ...unsigned,
            id: `urn:uuid:${randomUUID()}`,
            name,
            credentialSubject: { id: holder.learnCard.id.did() },
        });
        return IssueInboxCredentialValidator.parse({
            recipient,
            credential,
            ...(key === undefined ? {} : { idempotencyKey: key }),
        });
    };
    const expectCounts = async (count: number): Promise<void> => {
        const result = await neogma.queryRunner.run(
            `MATCH (c:Credential) RETURN count(c) AS total,
             count(CASE WHEN EXISTS { MATCH (:Profile)-[:CREDENTIAL_SENT]->(c) } THEN 1 END) AS delivered`
        );
        expect(Number(result.records[0]!.get('total'))).toBe(count);
        expect(Number(result.records[0]!.get('delivered'))).toBe(count);
    };
    const admit = async (input: IssueInboxCredentialType): Promise<string> => {
        const profile = await getProfileByProfileId(issuerId);
        if (!profile) throw new Error('Missing issuer');
        const receipt = await submitInboxBatch(
            profile,
            {
                requestId: `inbox.issue:${fingerprint(input.idempotencyKey)}`,
                items: [input],
            },
            {
                domain: 'localhost%3A3000',
                user: {
                    did: issuer.learnCard.id.did(),
                    isChallengeValid: true,
                    scope: AUTH_GRANT_FULL_ACCESS_SCOPE,
                },
            }
        );
        return receipt.batchId;
    };
    const reserve = async (id: string, owner: string): Promise<void> => {
        const claimed = await claimBatchItem(id, owner);
        if (!claimed) throw new Error('Expected fresh lease');
        expect(
            await batchReplayStore(id, owner, claimed.item.replayKey).setIfAbsent(
                '',
                JSON.stringify({
                    state: 'processing',
                    owner,
                    requestHash: 'interrupted-worker',
                }),
                86400
            )
        ).toBe('OK');
    };
    beforeAll(async () => {
        issuer = await getUser('a'.repeat(64));
        other = await getUser('c'.repeat(64));
        holder = await getUser('b'.repeat(64));
    });
    beforeEach(async () => {
        vi.restoreAllMocks();
        sendSpy.mockClear();
        addNotificationToQueueSpy.mockClear();
        vi.spyOn(notifications, 'addNotificationToQueue').mockImplementation(
            addNotificationToQueueSpy
        );
        vi.spyOn(SQSClient.prototype, 'send').mockImplementation(async () => {
            throw new Error('Unexpected external queue call');
        });
        for (const model of [Credential, InboxCredential, ContactMethod, Profile]) {
            await model.delete({ detach: true, where: {} });
        }
        await neogma.queryRunner.run(`MATCH (n) WHERE n:InboxBatch OR n:InboxBatchItem
            OR n:InboxBatchIssuer OR n:InboxBatchReplay DETACH DELETE n`);
        await issuer.clients.fullAuth.profile.createProfile({ profileId: issuerId });
        await other.clients.fullAuth.profile.createProfile({ profileId: 'single-idem-other' });
        await holder.clients.fullAuth.profile.createProfile({ profileId: 'single-idem-holder' });
        const contact = await createContactMethod({ ...recipient, isVerified: true });
        await createProfileContactMethodRelationship('single-idem-holder', contact.id);
    });
    afterEach(() => {
        expect(SQSClient.prototype.send).not.toHaveBeenCalled();
        vi.restoreAllMocks();
    });
    afterAll(async () => {
        console.log('SINGLE_INBOX_CONTENTION', JSON.stringify(counters));
        await cache.redis?.quit();
        await neogma.driver.close();
    });

    it('returns the original result and one delivery on identical retries and worker redelivery', async () => {
        const input = await inputFor(issuer, randomUUID());
        const first = await issuer.clients.fullAuth.inbox.issue(input);
        expect(first.status).toBe('ISSUED');
        expect(await issuer.clients.fullAuth.inbox.issue(input)).toEqual(first);
        const batchId = await admit(input);
        await processInboxQueueMessage(JSON.stringify({ itemId: `${batchId}:0` }));
        expect(await issuer.clients.fullAuth.inbox.issue(input)).toEqual(first);
        await expectCounts(1);
    });
    it('rejects payload substitution for one issuer and key', async () => {
        const key = randomUUID();
        const input = await inputFor(issuer, key);
        const first = await issuer.clients.fullAuth.inbox.issue(input);
        await expect(
            issuer.clients.fullAuth.inbox.issue(await inputFor(issuer, key, 'Changed'))
        ).rejects.toMatchObject({ code: 'CONFLICT' });
        expect(await issuer.clients.fullAuth.inbox.issue(input)).toEqual(first);
        await expectCounts(1);
    });
    it('returns the successful batch receipt after rapid single retries encounter an in-progress owner', async () => {
        const input = await inputFor(issuer, randomUUID());
        let entered!: () => void;
        let release!: () => void;
        const ready = new Promise<void>(resolve => {
            entered = resolve;
        });
        const resumed = new Promise<void>(resolve => {
            release = resolve;
        });
        const original = inboxHelpers.issueToInbox;
        vi.spyOn(inboxHelpers, 'issueToInbox').mockImplementationOnce(async (...args) => {
            const result = await original(...args);
            entered();
            await resumed; // Delivery committed; the replay receipt is not committed yet.
            return result;
        });
        const owner = await issuer.clients.fullAuth.inbox.issueBatch({
            requestId: 'batch-owner',
            items: [input],
        });
        const processing = processInboxQueueMessage(
            JSON.stringify({ itemId: `${owner.batchId}:0` })
        );
        try {
            await ready;
            await expectCounts(1);
            for (let i = 0; i < 6; i += 1) {
                await expect(issuer.clients.fullAuth.inbox.issue(input)).rejects.toMatchObject({
                    code: 'CONFLICT',
                });
            }
            const retryBatch = await admit(input);
            const attempts = await neogma.queryRunner.run(
                'MATCH (i:InboxBatchItem {id:$id}) RETURN i.attempts AS attempts',
                { id: `${retryBatch}:0` }
            );
            expect(Number(attempts.records[0]!.get('attempts'))).toBe(0);
            // Also model a terminal snapshot left by the old implementation, using
            // the real worker/finish path rather than fabricating a success receipt.
            for (let i = 0; i < 5; i += 1) {
                await processInboxQueueMessage(JSON.stringify({ itemId: `${retryBatch}:0` }));
            }
            expect((await getInboxBatch(issuerId, retryBatch)).items[0]?.result).toMatchObject({
                success: false,
                error: { reason: 'IN_PROGRESS' },
            });
        } finally {
            release();
            await processing;
        }
        const ownerStatus = await getInboxBatch(issuerId, owner.batchId);
        expect(ownerStatus.items[0]?.result?.success).toBe(true);
        const originalReceipt = IssueInboxCredentialResponseValidator.parse(
            ownerStatus.items[0]!.result
        );
        await expect(issuer.clients.fullAuth.inbox.issue(input)).resolves.toEqual(originalReceipt);
        await expectCounts(1);
    }, 30000);
    it('rejects a substituted payload against the current successful batch replay', async () => {
        const key = randomUUID();
        const input = await inputFor(issuer, key);
        const owner = await issuer.clients.fullAuth.inbox.issueBatch({ items: [input] });
        await processInboxQueueMessage(JSON.stringify({ itemId: `${owner.batchId}:0` }));
        await expect(
            issuer.clients.fullAuth.inbox.issue(await inputFor(issuer, key, 'Substituted'))
        ).rejects.toMatchObject({ code: 'CONFLICT' });
        await expectCounts(1);
    });
    it('does not spend item attempts before the persisted dispatch schedule', async () => {
        const input = await inputFor(issuer, randomUUID());
        const batch = await admit(input);
        await neogma.queryRunner.run('MATCH (i:InboxBatchItem {id:$id}) SET i.dispatchAt=$future', {
            id: `${batch}:0`,
            future: Date.now() + 60000,
        });
        await expect(issuer.clients.fullAuth.inbox.issue(input)).rejects.toMatchObject({
            code: 'CONFLICT',
        });
        const attempts = await neogma.queryRunner.run(
            'MATCH (i:InboxBatchItem {id:$id}) RETURN i.attempts AS attempts',
            { id: `${batch}:0` }
        );
        expect(Number(attempts.records[0]!.get('attempts'))).toBe(0);
        await expectCounts(0);
        await neogma.queryRunner.run('MATCH (i:InboxBatchItem {id:$id}) SET i.dispatchAt=0', {
            id: `${batch}:0`,
        });
        expect((await issuer.clients.fullAuth.inbox.issue(input)).status).toBe('ISSUED');
        await expectCounts(1);
    });
    it('isolates the same key across authenticated issuers', async () => {
        const key = randomUUID();
        const a = await inputFor(issuer, key);
        const b = await inputFor(other, key);
        const first = await issuer.clients.fullAuth.inbox.issue(a);
        const second = await other.clients.fullAuth.inbox.issue(b);
        expect(second.issuanceId).not.toBe(first.issuanceId);
        expect(await issuer.clients.fullAuth.inbox.issue(a)).toEqual(first);
        expect(await other.clients.fullAuth.inbox.issue(b)).toEqual(second);
        await expectCounts(2);
    });
    it('leaves unkeyed requests independent', async () => {
        const input = await inputFor();
        const first = await issuer.clients.fullAuth.inbox.issue(input);
        const second = await issuer.clients.fullAuth.inbox.issue(input);
        expect(second.issuanceId).not.toBe(first.issuanceId);
        await expectCounts(2);
    });
    it.each(Array.from({ length: 20 }, (_, i) => i + 1))(
        'serializes simultaneous identical requests, iteration %i',
        async () => {
            const input = await inputFor(issuer, randomUUID());
            const results = await Promise.allSettled([
                issuer.clients.fullAuth.inbox.issue(input),
                issuer.clients.fullAuth.inbox.issue(input),
            ]);
            const successes = results.filter(result => result.status === 'fulfilled');
            expect(successes.length).toBeGreaterThan(0);
            const first = successes[0]!;
            if (first.status !== 'fulfilled') throw new Error('No winning request');
            for (const result of results) {
                if (result.status === 'fulfilled') expect(result.value).toEqual(first.value);
                else {
                    expect(result.reason).toMatchObject({ code: 'CONFLICT' });
                    counters.inProgress += 1;
                }
            }
            expect(await issuer.clients.fullAuth.inbox.issue(input)).toEqual(first.value);
            await expectCounts(1);
            counters.iterations += 1;
            counters.delivered += 1;
        },
        30000
    );
    it('recovers a crash before the issuance checkpoint without delivery duplication', async () => {
        const input = await inputFor(issuer, randomUUID());
        const batch = await admit(input);
        const itemId = `${batch}:0`;
        const owner = 'preparing-owner';
        await reserve(itemId, owner);
        await expect(issuer.clients.fullAuth.inbox.issue(input)).rejects.toMatchObject({
            code: 'CONFLICT',
        });
        await expectCounts(0);
        await neogma.queryRunner.run('MATCH (i:InboxBatchItem {id:$id}) SET i.leaseUntil=0', {
            id: itemId,
        });
        await recoverInboxJobs();
        await expect(markBatchIssuanceStarted(itemId, owner)).rejects.toThrow('lease lost');
        const result = await issuer.clients.fullAuth.inbox.issue(input);
        expect(result.status).toBe('ISSUED');
        expect(await issuer.clients.fullAuth.inbox.issue(input)).toEqual(result);
        await expectCounts(1);
    });
    it('keeps an uncertain post-checkpoint crash blocked without speculative reissuance', async () => {
        const input = await inputFor(issuer, randomUUID());
        const batch = await admit(input);
        const itemId = `${batch}:0`;
        await reserve(itemId, 'issuing-owner');
        await markBatchIssuanceStarted(itemId, 'issuing-owner');
        await neogma.queryRunner.run('MATCH (i:InboxBatchItem {id:$id}) SET i.leaseUntil=0', {
            id: itemId,
        });
        await recoverInboxJobs();
        expect(await getInboxBatch(issuerId, batch)).toMatchObject({
            status: 'NEEDS_RECONCILIATION',
        });
        await expect(issuer.clients.fullAuth.inbox.issue(input)).rejects.toMatchObject({
            code: 'CONFLICT',
        });
        await expectCounts(0);
    });
    it('inherits the 24-hour confirmed replay retention rather than promising permanent deduplication', async () => {
        const input = await inputFor(issuer, randomUUID());
        const first = await issuer.clients.fullAuth.inbox.issue(input);
        const records = await neogma.queryRunner.run(
            'MATCH (r:InboxBatchReplay) RETURN r.expiresAt AS expiry'
        );
        expect(Number(records.records[0]!.get('expiry'))).toBeGreaterThan(Date.now() + DAY - 60000);
        await neogma.queryRunner.run('MATCH (b:InboxBatch) SET b.createdAt=$old', {
            old: Date.now() - DAY - 1000,
        });
        await neogma.queryRunner.run('MATCH (r:InboxBatchReplay) SET r.expiresAt=0');
        const next = await issuer.clients.fullAuth.inbox.issue(input);
        expect(next.issuanceId).not.toBe(first.issuanceId);
        await expectCounts(2);
    });
});
