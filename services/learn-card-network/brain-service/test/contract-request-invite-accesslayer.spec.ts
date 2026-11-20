import { beforeEach, describe, expect, it } from 'vitest';
import { randomBytes, randomUUID } from 'node:crypto';
import { getUser } from './helpers/getClient';
import { normalContract } from './helpers/contract';
import { neogma } from '@instance';
import { createContractRequestInvite } from '@accesslayer/contract-request-invite/create';
import {
    getContractRequestInvite,
    getPendingContractRequestInvitesForProfile,
    getProfileIdsWithVerifiedEmail,
    getUnattachedContractRequestInvites,
} from '@accesslayer/contract-request-invite/read';

const actor = async (role: string) => {
    const user = await getUser(randomBytes(32).toString('hex'));
    const profileId = `invite-al-${role}-${randomBytes(5).toString('hex')}`;
    await user.clients.fullAuth.profile.createProfile({ profileId });
    return { ...user, profileId };
};
type Actor = Awaited<ReturnType<typeof actor>>;
const id = (uri: string): string => uri.split(':').at(-1)!;
const randomEmail = (): string => `${randomBytes(6).toString('hex')}@example.com`;

/** Gives a profile an email contact method without going through the verification routes. */
const addEmail = (profileId: string, value: string, isVerified = true) =>
    neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId})
         CREATE (p)-[:HAS_CONTACT_METHOD]->(:ContactMethod {id: $id, type: 'email', value: $value,
             isVerified: $isVerified, verifiedAt: $now, isPrimary: false, createdAt: $now})`,
        { profileId, id: randomUUID(), value, isVerified, now: new Date().toISOString() }
    );

describe('ContractRequestInvite access layer', () => {
    let owner: Actor;
    let recipient: Actor;
    let otherRecipient: Actor;
    let learner: Actor;
    let outsider: Actor;
    let contractId: string;

    beforeEach(async () => {
        [owner, recipient, otherRecipient, learner, outsider] = await Promise.all([
            actor('owner'),
            actor('recipient'),
            actor('other'),
            actor('learner'),
            actor('outsider'),
        ]);
        contractId = id(
            await owner.clients.fullAuth.contracts.createConsentFlowContract({
                name: 'Synthetic referral',
                contract: normalContract,
                recipients: [recipient.profileId, otherRecipient.profileId],
            })
        );
    });

    const invite = (email: string, externalReferenceId = 'synthetic-ref-1') =>
        createContractRequestInvite({
            contractId,
            email,
            senderProfileId: recipient.profileId,
            externalReferenceId,
            message: 'Synthetic invitation',
            tenantId: 'synthetic-tenant',
        });

    it('creates a pending invite with a normalised email and a 30 day expiry', async () => {
        const email = randomEmail();
        const before = Date.now();
        const result = await invite(`  ${email.toUpperCase()} `);
        expect(result?.created).toBe(true);
        expect(result?.invite).toMatchObject({
            id: expect.any(String),
            email,
            requestedBy: recipient.profileId,
            externalReferenceId: 'synthetic-ref-1',
            message: 'Synthetic invitation',
            tenantId: 'synthetic-tenant',
            status: 'pending',
        });
        const ttl = Date.parse(result!.invite.expiresAt) - before;
        expect(ttl).toBeGreaterThan(29.9 * 24 * 60 * 60_000);
        expect(ttl).toBeLessThan(30.1 * 24 * 60 * 60_000);
        expect(await getContractRequestInvite(contractId, result!.invite.id)).toMatchObject({
            id: result!.invite.id,
            email,
        });
    });

    it('returns the same invite for an identical pending retry and a new one otherwise', async () => {
        const email = randomEmail();
        const first = await invite(email);
        const retry = await invite(email.toUpperCase());
        expect(retry).toMatchObject({ created: false, invite: { id: first!.invite.id } });
        const other = await invite(email, 'synthetic-ref-2');
        expect(other?.created).toBe(true);
        expect(other?.invite.id).not.toBe(first!.invite.id);
    });

    it('treats an attached invite whose request is still pending as the same invite', async () => {
        const email = randomEmail();
        const first = await invite(email);
        await neogma.queryRunner.run(
            `MATCH (c:ConsentFlowContract {id: $contractId})-[:HAS_REQUEST_INVITE]->(i:ContractRequestInvite {id: $inviteId})
             MATCH (p:Profile {profileId: $profileId})
             SET i.status = 'attached'
             CREATE (c)-[:REQUESTED_FOR {requestId: i.id, requestedBy: i.requestedBy, status: 'pending', addressedByEmail: true}]->(p)`,
            { contractId, inviteId: first!.invite.id, profileId: learner.profileId }
        );
        expect(await invite(email)).toMatchObject({
            created: false,
            invite: { id: first!.invite.id },
        });
        await neogma.queryRunner.run(
            `MATCH (:ConsentFlowContract {id: $contractId})-[r:REQUESTED_FOR]->(:Profile)
             WHERE r.requestId = $inviteId SET r.status = 'denied'`,
            { contractId, inviteId: first!.invite.id }
        );
        expect((await invite(email))?.created).toBe(true);
    });

    it('returns null when the sender has no role on the contract', async () => {
        expect(
            await createContractRequestInvite({
                contractId,
                email: randomEmail(),
                senderProfileId: outsider.profileId,
            })
        ).toBeNull();
    });

    it('finds pending invites for a profile by verified email, ignoring case', async () => {
        const email = randomEmail();
        const created = await invite(email);
        expect(await getPendingContractRequestInvitesForProfile(learner.profileId, 20)).toEqual([]);
        expect(await getProfileIdsWithVerifiedEmail(email)).toEqual([]);

        await addEmail(outsider.profileId, randomEmail().replace('@', '-u@'), false);
        await addEmail(learner.profileId, email.toUpperCase());
        expect(await getProfileIdsWithVerifiedEmail(email)).toEqual([learner.profileId]);
        const pending = await getPendingContractRequestInvitesForProfile(learner.profileId, 20);
        expect(pending).toEqual([
            { contractId, invite: expect.objectContaining({ id: created!.invite.id, email }) },
        ]);

        await neogma.queryRunner.run(
            `MATCH (i:ContractRequestInvite {id: $inviteId}) SET i.expiresAt = $past`,
            { inviteId: created!.invite.id, past: '2000-01-01T00:00:00.000Z' }
        );
        expect(await getPendingContractRequestInvitesForProfile(learner.profileId, 20)).toEqual([]);
    });

    it('does not match an unverified email', async () => {
        const email = randomEmail();
        await invite(email);
        await addEmail(learner.profileId, email, false);
        expect(await getProfileIdsWithVerifiedEmail(email)).toEqual([]);
        expect(await getPendingContractRequestInvitesForProfile(learner.profileId, 20)).toEqual([]);
    });

    it('shows unattached invites to managers and to their sender only', async () => {
        const created = await invite(randomEmail());
        const inviteId = created!.invite.id;
        for (const viewer of [owner, recipient]) {
            expect(
                (await getUnattachedContractRequestInvites(contractId, viewer.profileId)).map(
                    row => row.id
                )
            ).toEqual([inviteId]);
            expect(
                await getContractRequestInvite(contractId, inviteId, viewer.profileId)
            ).toMatchObject({ id: inviteId });
        }
        for (const viewer of [otherRecipient, outsider]) {
            expect(await getUnattachedContractRequestInvites(contractId, viewer.profileId)).toEqual(
                []
            );
            expect(
                await getContractRequestInvite(contractId, inviteId, viewer.profileId)
            ).toBeNull();
        }
        await neogma.queryRunner.run(
            `MATCH (i:ContractRequestInvite {id: $inviteId})
             SET i.status = 'attached', i.attachedProfileId = 'synthetic-attached-profile'`,
            { inviteId }
        );
        expect(await getUnattachedContractRequestInvites(contractId, owner.profileId)).toEqual([]);
    });
});
