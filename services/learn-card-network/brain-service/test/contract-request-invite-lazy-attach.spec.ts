import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomBytes, randomUUID } from 'node:crypto';
import { getUser } from './helpers/getClient';
import { normalContract } from './helpers/contract';
import { neogma } from '@instance';
import { createContractRequestInvite } from '@accesslayer/contract-request-invite/create';
import * as notifications from '@helpers/notifications.helpers';

const actor = async (role: string) => {
    const user = await getUser(randomBytes(32).toString('hex'));
    const profileId = `invite-lazy-${role}-${randomBytes(5).toString('hex')}`;
    await user.clients.fullAuth.profile.createProfile({ profileId });
    return { ...user, profileId };
};
type Actor = Awaited<ReturnType<typeof actor>>;
const id = (uri: string): string => uri.split(':').at(-1)!;
const randomEmail = (): string => `${randomBytes(6).toString('hex')}@example.com`;

/** Verifies an email on a profile without running any route hook. */
const addEmail = (profileId: string, value: string) =>
    neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId})
         CREATE (p)-[:HAS_CONTACT_METHOD]->(:ContactMethod {id: $id, type: 'email', value: $value,
             isVerified: true, verifiedAt: $now, isPrimary: false, createdAt: $now})`,
        { profileId, id: randomUUID(), value, now: new Date().toISOString() }
    );

describe('getAllContractRequestsForProfile attaches pending invites', () => {
    let owner: Actor;
    let learner: Actor;

    beforeEach(async () => {
        [owner, learner] = await Promise.all([actor('owner'), actor('learner')]);
        vi.spyOn(notifications, 'addNotificationToQueue').mockImplementation(async () => undefined);
    });
    afterEach(() => vi.restoreAllMocks());

    const createContracts = (count: number): Promise<string[]> =>
        Promise.all(
            Array.from({ length: count }, (_, index) =>
                owner.clients.fullAuth.contracts.createConsentFlowContract({
                    name: `Synthetic referral ${index}`,
                    contract: normalContract,
                })
            )
        );
    const inviteAll = async (contractUris: string[], email: string): Promise<string[]> => {
        const ids: string[] = [];
        for (const contractUri of contractUris) {
            const result = await createContractRequestInvite({
                contractId: id(contractUri),
                email,
                senderProfileId: owner.profileId,
            });
            ids.push(result!.invite.id);
        }
        return ids;
    };
    const pendingRequestIds = async (): Promise<string[]> =>
        (
            await learner.clients.fullAuth.contracts.getAllContractRequestsForProfile({
                targetProfileId: learner.profileId,
            })
        )
            .filter(request => request.status === 'pending')
            .map(request => request.requestId!);

    it('lists a request for an invite whose email was verified without a hook', async () => {
        const email = randomEmail();
        const [requestId] = await inviteAll(await createContracts(1), email);
        expect(await pendingRequestIds()).toEqual([]);
        await addEmail(learner.profileId, email.toUpperCase());
        expect(await pendingRequestIds()).toEqual([requestId]);
    });

    it('converts at most 20 invites per call', async () => {
        const email = randomEmail();
        const requestIds = await inviteAll(await createContracts(21), email);
        await addEmail(learner.profileId, email);
        expect(await pendingRequestIds()).toHaveLength(20);
        const all = await pendingRequestIds();
        expect(all).toHaveLength(21);
        expect([...all].sort()).toEqual([...requestIds].sort());
    }, 120_000);
});
