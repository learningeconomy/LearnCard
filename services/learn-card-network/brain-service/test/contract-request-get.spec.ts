import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomBytes } from 'node:crypto';
import { getUser } from './helpers/getClient';
import { normalContract, normalFullTerms } from './helpers/contract';
import { neogma } from '@instance';
import * as notifications from '@helpers/notifications.helpers';

const actor = async (role: string) => {
    const user = await getUser(randomBytes(32).toString('hex'));
    const profileId = `reqget-${role}-${randomBytes(5).toString('hex')}`;
    await user.clients.fullAuth.profile.createProfile({ profileId });
    return { ...user, profileId };
};
type Actor = Awaited<ReturnType<typeof actor>>;
const id = (uri: string): string => uri.split(':').at(-1)!;

describe('getContractRequest', () => {
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
            externalReferenceId: 'synthetic-ref-1',
        });
    /** Simulates a request that was created from an email invite. */
    const markAddressedByEmail = (contractUri: string, requestId: string, email: string) =>
        neogma.queryRunner.run(
            `MATCH (c:ConsentFlowContract {id: $contractId})-[r:REQUESTED_FOR]->(:Profile)
             WHERE r.requestId = $requestId
             SET r.addressedByEmail = true
             MERGE (c)-[:HAS_REQUEST_INVITE]->(i:ContractRequestInvite {id: $requestId})
             SET i.email = $email, i.status = 'attached', i.expiresAt = $expiresAt`,
            {
                contractId: id(contractUri),
                requestId,
                email,
                expiresAt: '2999-01-01T00:00:00.000Z',
            }
        );

    it('returns the request with the target profile to the sender and the owner', async () => {
        const contractUri = await create();
        const { requestId } = await send(contractUri);
        for (const viewer of [recipient, owner]) {
            const request = await viewer.clients.fullAuth.contracts.getContractRequest({
                contractUri,
                requestId,
            });
            expect(request).toMatchObject({
                requestId,
                status: 'pending',
                externalReferenceId: 'synthetic-ref-1',
                target: { profile: { profileId: learner.profileId } },
            });
            expect(request.requestedAt).toEqual(expect.any(String));
        }
    });

    it('answers NOT_FOUND to other recipients, the target and unknown IDs', async () => {
        const contractUri = await create();
        const { requestId } = await send(contractUri);
        for (const viewer of [otherRecipient, learner])
            await expect(
                viewer.clients.fullAuth.contracts.getContractRequest({ contractUri, requestId })
            ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        await expect(
            recipient.clients.fullAuth.contracts.getContractRequest({
                contractUri,
                requestId: 'missing-request',
            })
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('shows only the email for an email-addressed request until it is accepted', async () => {
        const contractUri = await create();
        const { requestId } = await send(contractUri);
        const email = `${randomBytes(5).toString('hex')}@example.com`;
        await markAddressedByEmail(contractUri, requestId, email);

        const pending = await recipient.clients.fullAuth.contracts.getContractRequest({
            contractUri,
            requestId,
        });
        expect(pending.target).toEqual({ email });
        expect(pending.expiresAt).toBe('2999-01-01T00:00:00.000Z');
        expect(JSON.stringify(pending)).not.toContain(learner.profileId);

        await learner.clients.fullAuth.contracts.consentToContract({
            contractUri,
            terms: normalFullTerms,
            audienceVersion: (
                await owner.clients.fullAuth.contracts.getConsentFlowContract({ uri: contractUri })
            ).audienceVersion,
        });
        const accepted = await recipient.clients.fullAuth.contracts.getContractRequest({
            contractUri,
            requestId,
        });
        expect(accepted).toMatchObject({
            status: 'accepted',
            target: { profile: { profileId: learner.profileId } },
        });
    });
});
