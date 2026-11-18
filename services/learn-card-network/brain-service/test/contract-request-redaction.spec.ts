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
            `MATCH (c:ConsentFlowContract {id: $contractId})-[r:REQUESTED_FOR]->(p:Profile)
             WHERE r.requestId = $requestId
             SET r.addressedByEmail = true
             MERGE (c)-[:HAS_REQUEST_INVITE]->(i:ContractRequestInvite {id: $requestId})
             SET i.email = $email, i.status = 'attached', i.expiresAt = $expiresAt,
                 i.attachedProfileId = p.profileId`,
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

    it('answers mark-as-seen for an email-addressed request as if there were none', async () => {
        const contractUri = await create();
        const { requestId } = await send(contractUri);
        await markAddressedByEmail(
            contractUri,
            requestId,
            `${randomBytes(5).toString('hex')}@example.com`
        );
        const outsider = await actor('outsider');
        const writer = await actor('writer');
        await neogma.queryRunner.run(
            `MATCH (c:ConsentFlowContract {id: $contractId}), (p:Profile {profileId: $profileId})
             MERGE (c)-[:CAN_WRITE]->(p)`,
            { contractId: id(contractUri), profileId: writer.profileId }
        );
        const seen = (viewer: Actor) =>
            viewer.clients.fullAuth.contracts.markContractRequestAsSeen({
                contractUri,
                targetProfileId: learner.profileId,
            });
        const outcome = (promise: Promise<unknown>) =>
            promise.then(
                value => ({ value }),
                (error: { message?: string }) => ({ message: error.message })
            );

        expect(await outcome(seen(writer))).toEqual({ value: true });
        expect(await outcome(seen(outsider))).toEqual({
            message: 'You do not have permissions to update this contract',
        });
        expect(
            (
                await learner.clients.fullAuth.contracts.getRequestStatusForProfile({
                    contractUri,
                    targetProfileId: learner.profileId,
                })
            )?.readStatus
        ).toBe('unseen');
    });

    it('gives a writer the same answer for a hidden email request and for no request', async () => {
        const contractUri = await create();
        const { requestId } = await send(contractUri);
        await markAddressedByEmail(
            contractUri,
            requestId,
            `${randomBytes(5).toString('hex')}@example.com`
        );
        const [writer, unrequested, legacy] = await Promise.all([
            actor('writer'),
            actor('unrequested'),
            actor('legacy'),
        ]);
        await neogma.queryRunner.run(
            `MATCH (c:ConsentFlowContract {id: $contractId}),
                   (w:Profile {profileId: $writer}), (l:Profile {profileId: $legacy})
             MERGE (c)-[:CAN_WRITE]->(w)
             MERGE (c)-[:REQUESTED_FOR {status: 'pending', readStatus: 'unseen'}]->(l)`,
            {
                contractId: id(contractUri),
                writer: writer.profileId,
                legacy: legacy.profileId,
            }
        );
        const seen = (target: Actor) =>
            writer.clients.fullAuth.contracts.markContractRequestAsSeen({
                contractUri,
                targetProfileId: target.profileId,
            });
        const status = (target: Actor) =>
            writer.clients.fullAuth.contracts.getRequestStatusForProfile({
                contractUri,
                targetProfileId: target.profileId,
            });

        expect(await seen(learner)).toBe(true);
        expect(await seen(unrequested)).toBe(true);
        expect(await status(learner)).toBeNull();
        expect(await status(unrequested)).toBeNull();
        const created = await neogma.queryRunner.run(
            `MATCH (:ConsentFlowContract {id: $contractId})-[r:REQUESTED_FOR]->(:Profile {profileId: $profileId})
             RETURN count(r) AS n`,
            { contractId: id(contractUri), profileId: unrequested.profileId }
        );
        expect(Number(created.records[0]?.get('n'))).toBe(0);

        expect(await seen(legacy)).toBe(true);
        expect(await status(legacy)).toMatchObject({ readStatus: 'seen' });
    });
});
