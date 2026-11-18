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
import { expireContractRequestInvites } from '@helpers/contract-request-invites.helpers';
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

    const send = (targetEmail: string) =>
        recipient.clients.fullAuth.contracts.sendContractRequest({
            contractUri,
            targetEmail,
            externalReferenceId: 'synthetic-ref-1',
        });

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
});
