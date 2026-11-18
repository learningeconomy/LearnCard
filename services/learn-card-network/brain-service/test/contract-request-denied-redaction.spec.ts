import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomBytes } from 'node:crypto';
import type { LCNNotification } from '@learncard/types';
import { getUser } from './helpers/getClient';
import { normalContract } from './helpers/contract';
import { neogma } from '@instance';
import { dispatchContractEvents } from '@helpers/contract-events.helpers';
import * as notifications from '@helpers/notifications.helpers';

const actor = async (role: string) => {
    const user = await getUser(randomBytes(32).toString('hex'));
    const profileId = `reqdeny-${role}-${randomBytes(5).toString('hex')}`;
    await user.clients.fullAuth.profile.createProfile({ profileId });
    return { ...user, profileId };
};
type Actor = Awaited<ReturnType<typeof actor>>;
const id = (uri: string): string => uri.split(':').at(-1)!;

describe('decision notifications for email-addressed requests', () => {
    let owner: Actor;
    let recipient: Actor;
    let learner: Actor;
    let delivered: LCNNotification[];

    beforeEach(async () => {
        [owner, recipient, learner] = await Promise.all([
            actor('owner'),
            actor('recipient'),
            actor('learner'),
        ]);
        delivered = [];
        vi.spyOn(notifications, 'addNotificationToQueue').mockImplementation(async notification => {
            delivered.push(structuredClone(notification));
            return undefined;
        });
    });
    afterEach(() => vi.restoreAllMocks());

    const create = (): Promise<string> =>
        owner.clients.fullAuth.contracts.createConsentFlowContract({
            name: 'Synthetic referral',
            contract: normalContract,
            recipients: [recipient.profileId],
        });
    const send = (contractUri: string) =>
        recipient.clients.fullAuth.contracts.sendContractRequest({
            contractUri,
            targetProfileId: learner.profileId,
        });
    const markAddressedByEmail = (contractUri: string, requestId: string) =>
        neogma.queryRunner.run(
            `MATCH (:ConsentFlowContract {id: $contractId})-[r:REQUESTED_FOR]->(:Profile)
             WHERE r.requestId = $requestId SET r.addressedByEmail = true`,
            { contractId: id(contractUri), requestId }
        );
    const flush = async (contractUri: string): Promise<void> => {
        const rows = await neogma.queryRunner.run(
            'MATCH (e:ConsentFlowEvent {contractId: $contractId}) RETURN e.id AS eventId',
            { contractId: id(contractUri) }
        );
        for (const row of rows.records)
            await dispatchContractEvents({ eventId: row.get('eventId') });
    };
    const decisions = (event: string): LCNNotification[] =>
        delivered.filter(notification => notification.data?.metadata?.event === event);

    it('keeps the target as sender of a denial for a profile-addressed request', async () => {
        const contractUri = await create();
        await send(contractUri);
        await learner.clients.fullAuth.contracts.denyContractRequest({ contractUri });
        await flush(contractUri);
        const denied = decisions('request_denied');
        expect(denied.map(n => n.to.profileId).sort()).toEqual(
            [owner.profileId, recipient.profileId].sort()
        );
        expect(denied.every(n => n.from.profileId === learner.profileId)).toBe(true);
    });

    it('hides the target in a denial for an email-addressed request', async () => {
        const contractUri = await create();
        const { requestId } = await send(contractUri);
        await markAddressedByEmail(contractUri, requestId);
        await learner.clients.fullAuth.contracts.denyContractRequest({ contractUri });
        await flush(contractUri);
        const denied = decisions('request_denied');
        expect(denied.map(n => n.to.profileId).sort()).toEqual(
            [owner.profileId, recipient.profileId].sort()
        );
        for (const notification of denied) {
            expect(notification.from.profileId).toBe(owner.profileId);
            expect(notification.message?.body).toBe('The invited person declined the request.');
            expect(JSON.stringify(notification)).not.toContain(learner.profileId);
        }
    });

    it('hides the target when the target cancels, and notifies nobody when the sender cancels', async () => {
        const first = await create();
        await markAddressedByEmail(first, (await send(first)).requestId);
        await learner.clients.fullAuth.contracts.cancelContractRequest({
            contractUri: first,
            targetProfileId: learner.profileId,
        });
        await flush(first);
        const byTarget = decisions('request_cancelled');
        expect(byTarget.length).toBeGreaterThan(0);
        for (const notification of byTarget) {
            expect(notification.from.profileId).toBe(owner.profileId);
            expect(JSON.stringify(notification)).not.toContain(learner.profileId);
        }

        delivered.length = 0;
        const second = await create();
        const { requestId } = await send(second);
        await markAddressedByEmail(second, requestId);
        await recipient.clients.fullAuth.contracts.cancelContractRequest({
            contractUri: second,
            requestId,
        });
        await flush(second);
        // Cancelling an unattached invite notifies nobody, so cancelling an attached one must not
        // either: a notification would show that the email has an account.
        expect(decisions('request_cancelled')).toEqual([]);
    });
});
