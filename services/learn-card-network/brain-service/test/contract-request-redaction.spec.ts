import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomBytes } from 'node:crypto';
import { getUser } from './helpers/getClient';
import { normalContract, normalFullTerms } from './helpers/contract';
import { neogma } from '@instance';
import * as notifications from '@helpers/notifications.helpers';

const actor = async (role: string) => {
    const user = await getUser(randomBytes(32).toString('hex'));
    const profileId = `reqredact-${role}-${randomBytes(5).toString('hex')}`;
    await user.clients.fullAuth.profile.createProfile({ profileId });
    return { ...user, profileId };
};
type Actor = Awaited<ReturnType<typeof actor>>;
const id = (uri: string): string => uri.split(':').at(-1)!;

describe('redaction of email-addressed contract requests', () => {
    let owner: Actor;
    let recipient: Actor;
    let learner: Actor;

    beforeEach(async () => {
        [owner, recipient, learner] = await Promise.all([
            actor('owner'),
            actor('recipient'),
            actor('learner'),
        ]);
        vi.spyOn(notifications, 'addNotificationToQueue').mockImplementation(async () => undefined);
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
    const accept = async (contractUri: string) =>
        learner.clients.fullAuth.contracts.consentToContract({
            contractUri,
            terms: normalFullTerms,
            audienceVersion: (
                await owner.clients.fullAuth.contracts.getConsentFlowContract({ uri: contractUri })
            ).audienceVersion,
        });

    it('lists a profile-addressed request with its profile and a profile target', async () => {
        const contractUri = await create();
        const { requestId } = await send(contractUri);
        const rows = await recipient.clients.fullAuth.contracts.getContractSentRequests({
            contractUri,
        });
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({
            requestId,
            status: 'pending',
            profile: { profileId: learner.profileId },
            target: { profile: { profileId: learner.profileId } },
        });
    });

    it('lists an email-addressed request without a profile until it is accepted', async () => {
        const contractUri = await create();
        const { requestId } = await send(contractUri);
        const email = `${randomBytes(5).toString('hex')}@example.com`;
        await markAddressedByEmail(contractUri, requestId, email);

        for (const viewer of [recipient, owner]) {
            const rows = await viewer.clients.fullAuth.contracts.getContractSentRequests({
                contractUri,
            });
            expect(rows).toHaveLength(1);
            expect(rows[0]).not.toHaveProperty('profile');
            expect(rows[0]).toMatchObject({
                requestId,
                status: 'pending',
                readStatus: null,
                target: { email },
                expiresAt: '2999-01-01T00:00:00.000Z',
            });
            expect(JSON.stringify(rows)).not.toContain(learner.profileId);
        }

        await accept(contractUri);
        const rows = await recipient.clients.fullAuth.contracts.getContractSentRequests({
            contractUri,
        });
        expect(rows[0]).toMatchObject({
            status: 'accepted',
            profile: { profileId: learner.profileId },
            target: { profile: { profileId: learner.profileId } },
        });
    });

    it('answers null for an email-addressed request status until it is accepted', async () => {
        const contractUri = await create();
        const { requestId } = await send(contractUri);
        const status = (viewer: Actor) =>
            viewer.clients.fullAuth.contracts.getRequestStatusForProfile({
                contractUri,
                targetProfileId: learner.profileId,
            });
        expect(await status(recipient)).toMatchObject({ requestId, status: 'pending' });

        await markAddressedByEmail(
            contractUri,
            requestId,
            `${randomBytes(5).toString('hex')}@example.com`
        );
        expect(await status(recipient)).toBeNull();
        expect(await status(owner)).toBeNull();
        expect(await status(learner)).toMatchObject({
            requestId,
            status: 'pending',
            profile: { profileId: learner.profileId },
        });

        await accept(contractUri);
        expect(await status(recipient)).toMatchObject({
            requestId,
            status: 'accepted',
            profile: { profileId: learner.profileId },
        });
    });
});
