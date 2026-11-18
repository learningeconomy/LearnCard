import { beforeEach, describe, expect, it } from 'vitest';
import { randomBytes, randomUUID } from 'node:crypto';
import { getUser } from './helpers/getClient';
import { normalContract } from './helpers/contract';
import { neogma } from '@instance';
import { createContractRequestInvite } from '@accesslayer/contract-request-invite/create';
import { getContractRequestInvite } from '@accesslayer/contract-request-invite/read';
import {
    attachContractRequestInvitesForProfile,
    expireContractRequestInvites,
} from '@helpers/contract-request-invites.helpers';

const actor = async (role: string) => {
    const user = await getUser(randomBytes(32).toString('hex'));
    const profileId = `invite-expiry-${role}-${randomBytes(5).toString('hex')}`;
    await user.clients.fullAuth.profile.createProfile({ profileId });
    return { ...user, profileId };
};
type Actor = Awaited<ReturnType<typeof actor>>;
const id = (uri: string): string => uri.split(':').at(-1)!;
const randomEmail = (): string => `${randomBytes(6).toString('hex')}@example.com`;
const PAST = '2000-01-01T00:00:00.000Z';

describe('expireContractRequestInvites', () => {
    let owner: Actor;
    let learner: Actor;
    let contractId: string;

    beforeEach(async () => {
        [owner, learner] = await Promise.all([actor('owner'), actor('learner')]);
        contractId = id(
            await owner.clients.fullAuth.contracts.createConsentFlowContract({
                name: 'Synthetic referral',
                contract: normalContract,
            })
        );
    });

    const invite = async (email: string, reference: string): Promise<string> =>
        (await createContractRequestInvite({
            contractId,
            email,
            senderProfileId: owner.profileId,
            externalReferenceId: reference,
        }))!.invite.id;
    const set = (inviteId: string, properties: Record<string, string>) =>
        neogma.queryRunner.run(
            `MATCH (i:ContractRequestInvite {id: $inviteId}) SET i += $properties`,
            { inviteId, properties }
        );
    const status = async (inviteId: string): Promise<string | undefined> =>
        (await getContractRequestInvite(contractId, inviteId))?.status;

    it('expires overdue pending invites, and closes attached ones with no pending request', async () => {
        const email = randomEmail();
        const overdue = await invite(email, 'overdue');
        const current = await invite(email, 'current');
        const attached = await invite(email, 'attached');
        const cancelled = await invite(email, 'cancelled');
        await set(overdue, { expiresAt: PAST });
        await set(attached, { expiresAt: PAST, status: 'attached' });
        await set(cancelled, { expiresAt: PAST, status: 'cancelled' });

        expect(await expireContractRequestInvites()).toBeGreaterThanOrEqual(1);

        expect(await status(overdue)).toBe('expired');
        expect(await status(current)).toBe('pending');
        // Attached, but there is no pending request left to expire.
        expect(await status(attached)).toBe('closed');
        expect(await status(cancelled)).toBe('cancelled');
        expect(await getContractRequestInvite(contractId, overdue)).toMatchObject({
            expiredAt: expect.any(String),
        });
        expect(await expireContractRequestInvites()).toBe(0);
    });

    it('does not attach an expired invite', async () => {
        const email = randomEmail();
        const overdue = await invite(email, 'overdue');
        await set(overdue, { expiresAt: PAST });
        await expireContractRequestInvites();
        await neogma.queryRunner.run(
            `MATCH (p:Profile {profileId: $profileId})
             CREATE (p)-[:HAS_CONTACT_METHOD]->(:ContactMethod {id: $id, type: 'email', value: $value,
                 isVerified: true, verifiedAt: $now, isPrimary: false, createdAt: $now})`,
            {
                profileId: learner.profileId,
                id: randomUUID(),
                value: email,
                now: new Date().toISOString(),
            }
        );
        expect(await attachContractRequestInvitesForProfile(learner, 'localhost%3A3000')).toBe(0);
        expect(await status(overdue)).toBe('expired');
    });
});
