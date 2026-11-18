import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomBytes } from 'node:crypto';
import { getUser } from './helpers/getClient';
import { normalContract } from './helpers/contract';
import { neogma } from '@instance';
import * as notifications from '@helpers/notifications.helpers';

const actor = async (role: string) => {
    const user = await getUser(randomBytes(32).toString('hex'));
    const profileId = `reqcancel-${role}-${randomBytes(5).toString('hex')}`;
    await user.clients.fullAuth.profile.createProfile({ profileId });
    return { ...user, profileId };
};
type Actor = Awaited<ReturnType<typeof actor>>;
const id = (uri: string): string => uri.split(':').at(-1)!;

describe('cancelContractRequest by request ID', () => {
    let owner: Actor;
    let recipient: Actor;
    let otherRecipient: Actor;
    let learner: Actor;

    beforeEach(async () => {
        [owner, recipient, otherRecipient, learner] = await Promise.all([
            actor('owner'),
            actor('recipient'),
            actor('other'),
            actor('learner'),
        ]);
        vi.spyOn(notifications, 'addNotificationToQueue').mockImplementation(async () => undefined);
    });
    afterEach(() => vi.restoreAllMocks());

    const create = (): Promise<string> =>
        owner.clients.fullAuth.contracts.createConsentFlowContract({
            name: 'Synthetic referral',
            contract: normalContract,
            recipients: [recipient.profileId, otherRecipient.profileId],
        });
    const send = (contractUri: string) =>
        recipient.clients.fullAuth.contracts.sendContractRequest({
            contractUri,
            targetProfileId: learner.profileId,
        });
    const storedStatus = async (contractUri: string, requestId: string): Promise<string> =>
        (
            await neogma.queryRunner.run(
                `MATCH (:ConsentFlowContract {id: $contractId})-[r:REQUESTED_FOR]->(:Profile)
                 WHERE r.requestId = $requestId RETURN r.status AS status`,
                { contractId: id(contractUri), requestId }
            )
        ).records[0]!.get('status');

    it('lets the sender cancel by request ID', async () => {
        const contractUri = await create();
        const { requestId } = await send(contractUri);
        await expect(
            recipient.clients.fullAuth.contracts.cancelContractRequest({ contractUri, requestId })
        ).resolves.toBe(true);
        expect(await storedStatus(contractUri, requestId)).toBe('cancelled');
    });

    it('answers NOT_FOUND to a recipient that did not send the request, and to unknown IDs', async () => {
        const contractUri = await create();
        const { requestId } = await send(contractUri);
        await expect(
            otherRecipient.clients.fullAuth.contracts.cancelContractRequest({
                contractUri,
                requestId,
            })
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        await expect(
            recipient.clients.fullAuth.contracts.cancelContractRequest({
                contractUri,
                requestId: 'missing-request',
            })
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        expect(await storedStatus(contractUri, requestId)).toBe('pending');
    });

    it('requires exactly one of targetProfileId and requestId', async () => {
        const contractUri = await create();
        const { requestId } = await send(contractUri);
        await expect(
            recipient.clients.fullAuth.contracts.cancelContractRequest({ contractUri })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        await expect(
            recipient.clients.fullAuth.contracts.cancelContractRequest({
                contractUri,
                requestId,
                targetProfileId: learner.profileId,
            })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('does not let a referrer cancel an email-addressed request by profile ID', async () => {
        const contractUri = await create();
        const { requestId } = await send(contractUri);
        await neogma.queryRunner.run(
            `MATCH (:ConsentFlowContract {id: $contractId})-[r:REQUESTED_FOR]->(:Profile)
             WHERE r.requestId = $requestId SET r.addressedByEmail = true`,
            { contractId: id(contractUri), requestId }
        );
        await expect(
            recipient.clients.fullAuth.contracts.cancelContractRequest({
                contractUri,
                targetProfileId: learner.profileId,
            })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        await expect(
            owner.clients.fullAuth.contracts.cancelContractRequest({
                contractUri,
                targetProfileId: learner.profileId,
            })
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        expect(await storedStatus(contractUri, requestId)).toBe('pending');
        await expect(
            recipient.clients.fullAuth.contracts.cancelContractRequest({ contractUri, requestId })
        ).resolves.toBe(true);
    });
});
