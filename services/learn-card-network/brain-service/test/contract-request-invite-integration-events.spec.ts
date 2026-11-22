import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomBytes, randomUUID } from 'node:crypto';

const mocks = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('@services/delivery/delivery.factory', () => ({
    getDeliveryService: () => ({ send: mocks.send }),
}));

import { IntegrationEventTypeValidator } from '@learncard/types';
import { getUser } from './helpers/getClient';
import { normalContract, normalFullTerms } from './helpers/contract';
import { neogma } from '@instance';
import {
    deliverContractRequestInvites,
    expireContractRequestInvites,
} from '@helpers/contract-request-invites.helpers';
import { fanOutIntegrationEvents } from '@helpers/integration-events.helpers';
import * as notifications from '@helpers/notifications.helpers';

const actor = async (role: string) => {
    const user = await getUser(randomBytes(32).toString('hex'));
    const profileId = `invite-events-${role}-${randomBytes(5).toString('hex')}`;
    await user.clients.fullAuth.profile.createProfile({ profileId });
    return { ...user, profileId };
};
type Actor = Awaited<ReturnType<typeof actor>>;
const randomEmail = (): string => `${randomBytes(6).toString('hex')}@example.com`;

const addEmail = (profileId: string, value: string) =>
    neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId})
         CREATE (p)-[:HAS_CONTACT_METHOD]->(:ContactMethod {id: $id, type: 'email', value: $value,
             isVerified: true, verifiedAt: $now, isPrimary: false, createdAt: $now})`,
        { profileId, id: randomUUID(), value, now: new Date().toISOString() }
    );

/** Gives the profile an Integration that receives contract events. Returns its ID. */
const subscribe = async (profileId: string): Promise<string> => {
    const integrationId = `int-${randomBytes(6).toString('hex')}`;
    await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId})
         CREATE (:Integration {id: $integrationId, contractEventsEnabledAt: '2000-01-01T00:00:00.000Z'})
             -[:CREATED_BY]->(p)`,
        { profileId, integrationId }
    );
    return integrationId;
};

type FeedRecord = {
    type: string;
    eventId: string;
    requestId?: string;
    subjectProfileId?: string;
    externalReferenceId?: string;
    role: string;
};

vi.setConfig({ hookTimeout: 30_000 });

describe('integration events for contract request invites', () => {
    let owner: Actor;
    let recipient: Actor;
    let learner: Actor;
    let contractUri: string;
    let ownerIntegration: string;
    let recipientIntegration: string;

    beforeEach(async () => {
        [owner, recipient, learner] = await Promise.all([
            actor('owner'),
            actor('recipient'),
            actor('learner'),
        ]);
        contractUri = await owner.clients.fullAuth.contracts.createConsentFlowContract({
            name: 'Synthetic referral',
            contract: normalContract,
            recipients: [recipient.profileId],
        });
        [ownerIntegration, recipientIntegration] = await Promise.all([
            subscribe(owner.profileId),
            subscribe(recipient.profileId),
        ]);
        mocks.send.mockReset();
        mocks.send.mockResolvedValue(undefined);
        vi.spyOn(notifications, 'addNotificationToQueue').mockImplementation(async () => undefined);
    });
    afterEach(() => vi.restoreAllMocks());

    /** Sends, then runs the delivery worker pass that attaches or emails the invite. */
    const send = async (targetEmail: string, externalReferenceId = 'synthetic-ref-1') => {
        const result = await recipient.clients.fullAuth.contracts.sendContractRequest({
            contractUri,
            targetEmail,
            externalReferenceId,
        });
        await deliverContractRequestInvites();
        return result;
    };

    /** Feed records of one integration for one request, after the worker has caught up. */
    const feed = async (integrationId: string, requestId: string): Promise<FeedRecord[]> => {
        await fanOutIntegrationEvents({ limit: 50, budgetMs: 20_000 });
        const result = await neogma.queryRunner.run(
            `MATCH (record:IntegrationEvent {integrationId: $integrationId})
             WHERE record.requestId = $requestId
             RETURN properties(record) AS record ORDER BY record.sequence`,
            { integrationId, requestId }
        );
        return result.records.map(row => {
            const { type, eventId, subjectProfileId, externalReferenceId, role } =
                row.get('record');
            return { type, eventId, requestId, subjectProfileId, externalReferenceId, role };
        });
    };

    it('publishes an email referral with a subject only after the learner accepts it', async () => {
        const audienceVersion = (
            await owner.clients.fullAuth.contracts.getConsentFlowContract({ uri: contractUri })
        ).audienceVersion;
        const args = { contractUri, terms: normalFullTerms, audienceVersion };
        const consents = learner.clients.fullAuth.contracts;
        const original = await consents.consentToContract(args);
        const email = randomEmail();
        await addEmail(learner.profileId, email);
        const { requestId, status } = await send(email);
        expect(status).toBe('pending');
        await expect(
            recipient.clients.fullAuth.contracts.getContractRequest({
                contractUri,
                requestId,
            })
        ).resolves.toMatchObject({ status: 'pending', target: { email } });
        await expect(
            consents.getRequestStatusForProfile({
                contractUri,
                targetProfileId: learner.profileId,
            })
        ).resolves.toMatchObject({ requestId, referralOnly: true, status: 'pending' });
        expect(await feed(ownerIntegration, requestId)).toEqual([
            expect.objectContaining({ type: 'request_sent', subjectProfileId: undefined }),
        ]);

        await expect(
            consents.consentToContract({ ...args, expectedRequestId: 'stale-id' })
        ).rejects.toMatchObject({ code: 'CONFLICT' });
        const acceptArgs = { ...args, expectedRequestId: requestId };
        await expect(consents.consentToContract(acceptArgs)).resolves.toEqual(original);
        await expect(consents.consentToContract(acceptArgs)).resolves.toEqual(original);
        expect(await feed(ownerIntegration, requestId)).toEqual([
            expect.objectContaining({ type: 'request_sent', subjectProfileId: undefined }),
            expect.objectContaining({
                type: 'referral_attached',
                eventId: `${requestId}:attached`,
                subjectProfileId: learner.profileId,
                externalReferenceId: 'synthetic-ref-1',
            }),
        ]);
        const history = await consents.getTermsTransactionHistory({ uri: original.termsUri });
        expect(history.records.map(transaction => transaction.action).sort()).toEqual([
            'consent',
            'referral',
        ]);
        await expect(
            recipient.clients.fullAuth.contracts.getContractRequest({
                contractUri,
                requestId,
            })
        ).resolves.toMatchObject({
            status: 'accepted',
            target: { profile: { profileId: learner.profileId } },
        });
    });

    it('does not revive consent when a referral-only invitation outlives the connection', async () => {
        const audienceVersion = (
            await owner.clients.fullAuth.contracts.getConsentFlowContract({ uri: contractUri })
        ).audienceVersion;
        const args = { contractUri, terms: normalFullTerms, audienceVersion };
        const consents = learner.clients.fullAuth.contracts;
        const original = await consents.consentToContract(args);
        const email = randomEmail();
        await addEmail(learner.profileId, email);
        const { requestId } = await send(email);
        await consents.withdrawConsent({ uri: original.termsUri });

        await expect(
            consents.consentToContract({ ...args, expectedRequestId: requestId })
        ).rejects.toMatchObject({ code: 'CONFLICT' });
        expect(await feed(ownerIntegration, requestId)).toEqual([
            expect.objectContaining({ type: 'request_sent', subjectProfileId: undefined }),
        ]);
        const history = await consents.getTermsTransactionHistory({ uri: original.termsUri });
        expect(history.records.map(transaction => transaction.action).sort()).toEqual([
            'consent',
            'withdraw',
        ]);
    });

    it('lets a new invitation replace a stale referral after independent re-consent', async () => {
        const audienceVersion = (
            await owner.clients.fullAuth.contracts.getConsentFlowContract({ uri: contractUri })
        ).audienceVersion;
        const args = { contractUri, terms: normalFullTerms, audienceVersion };
        const consents = learner.clients.fullAuth.contracts;
        const original = await consents.consentToContract(args);
        const email = randomEmail();
        await addEmail(learner.profileId, email);
        const { requestId } = await send(email);

        await consents.withdrawConsent({ uri: original.termsUri });
        await consents.consentToContract(args);
        await expect(
            consents.consentToContract({ ...args, expectedRequestId: requestId })
        ).rejects.toMatchObject({ code: 'CONFLICT' });
        expect(await feed(ownerIntegration, requestId)).toEqual([
            expect.objectContaining({ type: 'request_sent', subjectProfileId: undefined }),
        ]);
        const history = await consents.getTermsTransactionHistory({ uri: original.termsUri });
        expect(history.records.map(transaction => transaction.action).sort()).toEqual([
            'consent',
            'reconsent',
            'withdraw',
        ]);

        // A retry remains email-only and keeps its original ID.
        await expect(send(email)).resolves.toEqual({ requestId, status: 'pending' });
        const replacement = await send(email, 'synthetic-ref-2');
        expect(replacement.requestId).not.toBe(requestId);
        await expect(
            consents.consentToContract({ ...args, expectedRequestId: replacement.requestId })
        ).resolves.toEqual(original);
        expect(await feed(ownerIntegration, replacement.requestId)).toEqual([
            expect.objectContaining({ type: 'request_sent', subjectProfileId: undefined }),
            expect.objectContaining({
                type: 'referral_attached',
                subjectProfileId: learner.profileId,
                externalReferenceId: 'synthetic-ref-2',
            }),
        ]);
    });

    it('accepts request_expired as an integration event type', () => {
        expect(IntegrationEventTypeValidator.safeParse('request_expired').success).toBe(true);
    });

    it('sends the same request_sent record whether or not the email has an account', async () => {
        const unknown = await send(randomEmail());
        const knownEmail = randomEmail();
        await addEmail(learner.profileId, knownEmail);
        const known = await send(knownEmail);

        for (const { requestId } of [unknown, known]) {
            expect(await feed(ownerIntegration, requestId)).toEqual([
                {
                    type: 'request_sent',
                    eventId: `${requestId}:invited`,
                    requestId,
                    subjectProfileId: undefined,
                    externalReferenceId: 'synthetic-ref-1',
                    role: 'owner',
                },
            ]);
            expect(await feed(recipientIntegration, requestId)).toEqual([
                expect.objectContaining({
                    type: 'request_sent',
                    eventId: `${requestId}:invited`,
                    subjectProfileId: undefined,
                    role: 'recipient',
                }),
            ]);
        }
    });

    it('hides the subject when the target of an email-addressed request denies it', async () => {
        const email = randomEmail();
        await addEmail(learner.profileId, email);
        const { requestId } = await send(email);
        await learner.clients.fullAuth.contracts.denyContractRequest({ contractUri });

        const records = await feed(ownerIntegration, requestId);
        expect(records.map(record => record.type)).toEqual(['request_sent', 'request_denied']);
        expect(records.every(record => record.subjectProfileId === undefined)).toBe(true);
    });

    it('reveals the subject once an email-addressed request is accepted', async () => {
        const email = randomEmail();
        await addEmail(learner.profileId, email);
        const { requestId } = await send(email);
        await learner.clients.fullAuth.contracts.consentToContract({
            contractUri,
            terms: normalFullTerms,
            audienceVersion: (
                await owner.clients.fullAuth.contracts.getConsentFlowContract({ uri: contractUri })
            ).audienceVersion,
        });

        const accepted = (await feed(ownerIntegration, requestId)).find(
            record => record.type === 'request_accepted'
        );
        expect(accepted).toMatchObject({ subjectProfileId: learner.profileId });
    });

    it('hides the subject when the sender cancels an attached email-addressed request', async () => {
        const email = randomEmail();
        await addEmail(learner.profileId, email);
        const { requestId } = await send(email);
        await recipient.clients.fullAuth.contracts.cancelContractRequest({
            contractUri,
            requestId,
        });

        const records = await feed(ownerIntegration, requestId);
        expect(records.map(record => record.type)).toEqual(['request_sent', 'request_cancelled']);
        expect(records[1]).toMatchObject({
            eventId: `${requestId}:cancelled`,
            subjectProfileId: undefined,
        });
    });

    it('sends request_cancelled once for an unattached invite', async () => {
        const { requestId } = await send(randomEmail());
        await recipient.clients.fullAuth.contracts.cancelContractRequest({
            contractUri,
            requestId,
        });
        await recipient.clients.fullAuth.contracts.cancelContractRequest({
            contractUri,
            requestId,
        });

        expect(await feed(ownerIntegration, requestId)).toEqual([
            expect.objectContaining({ type: 'request_sent' }),
            expect.objectContaining({
                type: 'request_cancelled',
                eventId: `${requestId}:cancelled`,
                subjectProfileId: undefined,
            }),
        ]);
    });

    it('sends request_expired once when the maintenance job expires an invite', async () => {
        const { requestId } = await send(randomEmail());
        await neogma.queryRunner.run(
            `MATCH (i:ContractRequestInvite {id: $requestId}) SET i.expiresAt = $past`,
            { requestId, past: '2000-01-01T00:00:00.000Z' }
        );
        await expireContractRequestInvites();
        await expireContractRequestInvites();

        expect(await feed(recipientIntegration, requestId)).toEqual([
            expect.objectContaining({ type: 'request_sent' }),
            expect.objectContaining({
                type: 'request_expired',
                eventId: `${requestId}:expired`,
                subjectProfileId: undefined,
                externalReferenceId: 'synthetic-ref-1',
                role: 'recipient',
            }),
        ]);
    });

    /** Moves the invite (and its attached request, if any) past its expiry. */
    const age = (requestId: string) =>
        neogma.queryRunner.run(
            `MATCH (c:ConsentFlowContract)-[:HAS_REQUEST_INVITE]->(i:ContractRequestInvite {id: $requestId})
             SET i.expiresAt = $past
             WITH c, i
             OPTIONAL MATCH (c)-[r:REQUESTED_FOR]->(:Profile) WHERE r.requestId = i.id
             FOREACH (_ IN CASE WHEN r IS NULL THEN [] ELSE [1] END | SET r.expiresAt = $past)`,
            { requestId, past: '2000-01-01T00:00:00.000Z' }
        );
    const outcome = (promise: Promise<unknown>) =>
        promise.then(
            () => 'ok',
            (error: { message?: string }) => error.message
        );

    it('expires an attached and an unattached request the same way', async () => {
        const knownEmail = randomEmail();
        await addEmail(learner.profileId, knownEmail);
        const known = await send(knownEmail);
        const unknown = await send(randomEmail());
        await Promise.all([age(known.requestId), age(unknown.requestId)]);

        for (const { requestId } of [known, unknown]) {
            expect(
                await recipient.clients.fullAuth.contracts.getContractRequest({
                    contractUri,
                    requestId,
                })
            ).toMatchObject({ status: 'expired' });
        }
        await expireContractRequestInvites();
        await expireContractRequestInvites();

        for (const { requestId } of [known, unknown]) {
            expect(
                await recipient.clients.fullAuth.contracts.getContractRequest({
                    contractUri,
                    requestId,
                })
            ).toMatchObject({ status: 'expired' });
            expect(
                (await feed(ownerIntegration, requestId)).map(record => [
                    record.type,
                    record.eventId,
                    record.subjectProfileId,
                ])
            ).toEqual([
                ['request_sent', `${requestId}:invited`, undefined],
                ['request_expired', `${requestId}:expired`, undefined],
            ]);
        }
        const sent = await recipient.clients.fullAuth.contracts.getContractSentRequests({
            contractUri,
        });
        expect(sent.map(row => row.status)).toEqual(['expired', 'expired']);
        expect(
            await learner.clients.fullAuth.contracts.getAllContractRequestsForProfile({
                targetProfileId: learner.profileId,
            })
        ).toEqual([]);
    });

    it('refuses to cancel an overdue request the same way whether or not it attached', async () => {
        const knownEmail = randomEmail();
        await addEmail(learner.profileId, knownEmail);
        const known = await send(knownEmail);
        const unknown = await send(randomEmail());
        await Promise.all([age(known.requestId), age(unknown.requestId)]);

        const cancel = (requestId: string) =>
            outcome(
                recipient.clients.fullAuth.contracts.cancelContractRequest({
                    contractUri,
                    requestId,
                })
            );
        expect(await cancel(known.requestId)).toBe(await cancel(unknown.requestId));
        expect(await cancel(unknown.requestId)).toBe(
            'Request already decided or permission changed'
        );
    });

    it('does not accept an overdue attached request when the person consents', async () => {
        const email = randomEmail();
        await addEmail(learner.profileId, email);
        const { requestId } = await send(email);
        await age(requestId);
        await learner.clients.fullAuth.contracts.consentToContract({
            contractUri,
            terms: normalFullTerms,
            audienceVersion: (
                await owner.clients.fullAuth.contracts.getConsentFlowContract({ uri: contractUri })
            ).audienceVersion,
        });

        expect((await feed(ownerIntegration, requestId)).map(record => record.type)).not.toContain(
            'request_accepted'
        );
        expect(
            await recipient.clients.fullAuth.contracts.getContractRequest({
                contractUri,
                requestId,
            })
        ).toMatchObject({ status: 'expired' });
    });

    it('notifies no profile when the sender cancels, whether or not the request attached', async () => {
        const knownEmail = randomEmail();
        await addEmail(learner.profileId, knownEmail);
        const known = await send(knownEmail);
        const unknown = await send(randomEmail());
        for (const { requestId } of [known, unknown])
            await recipient.clients.fullAuth.contracts.cancelContractRequest({
                contractUri,
                requestId,
            });

        const deliveries = await neogma.queryRunner.run(
            `MATCH (e:ConsentFlowEvent)-[:HAS_DELIVERY]->(d:ConsentFlowEventDelivery)
             WHERE e.id IN $eventIds
             RETURN count(d) AS count`,
            { eventIds: [known, unknown].map(({ requestId }) => `${requestId}:cancelled`) }
        );
        expect(deliveries.records[0]?.get('count').toNumber()).toBe(0);
    });

    it("replaces the sender's own email request when it sends to that profile, like a miss", async () => {
        const knownEmail = randomEmail();
        await addEmail(learner.profileId, knownEmail);
        const hit = await send(knownEmail);
        const other = await actor('other');
        const miss = await send(randomEmail());

        const profileSend = (target: Actor) =>
            recipient.clients.fullAuth.contracts.sendContractRequest({
                contractUri,
                targetProfileId: target.profileId,
                externalReferenceId: 'synthetic-ref-2',
            });
        const onHit = await profileSend(learner);
        const onMiss = await profileSend(other);
        expect(onHit).toEqual({ requestId: expect.any(String), status: 'pending' });
        expect(onHit.requestId).not.toBe(hit.requestId);
        expect(onMiss).toEqual({ requestId: expect.any(String), status: 'pending' });

        const read = (requestId: string) =>
            recipient.clients.fullAuth.contracts.getContractRequest({ contractUri, requestId });
        const shape = (request: Awaited<ReturnType<typeof read>>) => ({
            status: request.status,
            hasEmail: 'email' in request.target,
            hasProfile: 'profile' in request.target,
        });
        expect(shape(await read(hit.requestId))).toEqual(shape(await read(miss.requestId)));
        expect(shape(await read(hit.requestId))).toEqual({
            status: 'pending',
            hasEmail: true,
            hasProfile: false,
        });
        expect(await read(onHit.requestId)).toMatchObject({
            status: 'pending',
            target: { profile: { profileId: learner.profileId } },
        });

        await Promise.all([age(hit.requestId), age(miss.requestId)]);
        await expireContractRequestInvites();
        expect(shape(await read(hit.requestId))).toEqual(shape(await read(miss.requestId)));
        expect((await read(onHit.requestId)).status).toBe('pending');
        for (const { requestId } of [hit, miss])
            expect((await feed(ownerIntegration, requestId)).map(record => record.type)).toEqual([
                'request_sent',
                'request_expired',
            ]);
    });

    it('still answers CONFLICT when another sender collides with an email request', async () => {
        const email = randomEmail();
        await addEmail(learner.profileId, email);
        await send(email);
        await expect(
            owner.clients.fullAuth.contracts.sendContractRequest({
                contractUri,
                targetProfileId: learner.profileId,
            })
        ).rejects.toMatchObject({ message: expect.stringContaining('already exists') });
    });
});
