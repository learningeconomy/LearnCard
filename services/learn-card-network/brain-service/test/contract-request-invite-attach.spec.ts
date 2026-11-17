import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomBytes, randomUUID } from 'node:crypto';
import type { LCNNotification } from '@learncard/types';
import { getUser } from './helpers/getClient';
import { normalContract, normalFullTerms } from './helpers/contract';
import { neogma } from '@instance';
import { createContractRequestInvite } from '@accesslayer/contract-request-invite/create';
import { getContractRequestInvite } from '@accesslayer/contract-request-invite/read';
import { attachContractRequestInvitesForProfile } from '@helpers/contract-request-invites.helpers';
import { dispatchContractEvents } from '@helpers/contract-events.helpers';
import * as notifications from '@helpers/notifications.helpers';

const DOMAIN = 'localhost%3A3000';

const actor = async (role: string) => {
    const user = await getUser(randomBytes(32).toString('hex'));
    const profileId = `invite-attach-${role}-${randomBytes(5).toString('hex')}`;
    await user.clients.fullAuth.profile.createProfile({ profileId });
    return { ...user, profileId };
};
type Actor = Awaited<ReturnType<typeof actor>>;
const id = (uri: string): string => uri.split(':').at(-1)!;
const randomEmail = (): string => `${randomBytes(6).toString('hex')}@example.com`;

const addEmail = (profileId: string, value: string) =>
    neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId})
         CREATE (p)-[:HAS_CONTACT_METHOD]->(:ContactMethod {id: $id, type: 'email', value: $value,
             isVerified: true, verifiedAt: $now, isPrimary: false, createdAt: $now})`,
        { profileId, id: randomUUID(), value, now: new Date().toISOString() }
    );

describe('attachContractRequestInvitesForProfile', () => {
    let owner: Actor;
    let recipient: Actor;
    let learner: Actor;
    let contractUri: string;
    let delivered: LCNNotification[];

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
        delivered = [];
        vi.spyOn(notifications, 'addNotificationToQueue').mockImplementation(async notification => {
            delivered.push(structuredClone(notification));
            return undefined;
        });
    });
    afterEach(() => vi.restoreAllMocks());

    const invite = async (email: string, sender = recipient): Promise<string> =>
        (await createContractRequestInvite({
            contractId: id(contractUri),
            email,
            senderProfileId: sender.profileId,
            externalReferenceId: 'synthetic-ref-1',
            message: 'Synthetic invitation',
        }))!.invite.id;
    const flush = async (): Promise<void> => {
        const rows = await neogma.queryRunner.run(
            'MATCH (e:ConsentFlowEvent {contractId: $contractId}) RETURN e.id AS eventId',
            { contractId: id(contractUri) }
        );
        for (const row of rows.records)
            await dispatchContractEvents({ eventId: row.get('eventId') });
    };

    it('turns a pending invite into a request with the same ID and notifies the target', async () => {
        const email = randomEmail();
        const requestId = await invite(email);
        await addEmail(learner.profileId, email.toUpperCase());

        expect(await attachContractRequestInvitesForProfile(learner, DOMAIN)).toBe(1);
        expect(await attachContractRequestInvitesForProfile(learner, DOMAIN)).toBe(0);

        const stored = await learner.clients.fullAuth.contracts.getRequestStatusForProfile({
            contractUri,
            targetProfileId: learner.profileId,
        });
        expect(stored).toMatchObject({
            requestId,
            status: 'pending',
            requestedBy: recipient.profileId,
            externalReferenceId: 'synthetic-ref-1',
            message: 'Synthetic invitation',
        });
        expect(await getContractRequestInvite(id(contractUri), requestId)).toMatchObject({
            status: 'attached',
            attachedProfileId: learner.profileId,
        });

        await flush();
        const sent = delivered.filter(n => n.data?.metadata?.event === 'request_sent');
        expect(sent).toHaveLength(1);
        expect(sent[0]).toMatchObject({
            to: { profileId: learner.profileId },
            data: { metadata: { requestId } },
        });
    });

    it('keeps the profile hidden from the sender until the request is accepted', async () => {
        const email = randomEmail();
        const requestId = await invite(email);
        await addEmail(learner.profileId, email);
        await attachContractRequestInvitesForProfile(learner, DOMAIN);

        const pending = await recipient.clients.fullAuth.contracts.getContractRequest({
            contractUri,
            requestId,
        });
        expect(pending).toMatchObject({ requestId, status: 'pending', target: { email } });
        expect(JSON.stringify(pending)).not.toContain(learner.profileId);

        await learner.clients.fullAuth.contracts.consentToContract({
            contractUri,
            terms: normalFullTerms,
            expectedRequestId: requestId,
            audienceVersion: (
                await owner.clients.fullAuth.contracts.getConsentFlowContract({ uri: contractUri })
            ).audienceVersion,
        });
        expect(
            await recipient.clients.fullAuth.contracts.getContractRequest({
                contractUri,
                requestId,
            })
        ).toMatchObject({
            status: 'accepted',
            target: { profile: { profileId: learner.profileId } },
        });
    });

    it('leaves the invite pending when the profile already has a request for the contract', async () => {
        await owner.clients.fullAuth.contracts.sendContractRequest({
            contractUri,
            targetProfileId: learner.profileId,
        });
        const email = randomEmail();
        const requestId = await invite(email);
        await addEmail(learner.profileId, email);

        expect(await attachContractRequestInvitesForProfile(learner, DOMAIN)).toBe(0);
        expect(await getContractRequestInvite(id(contractUri), requestId)).toMatchObject({
            status: 'pending',
        });
    });

    it('does not attach an invite to its own sender', async () => {
        const email = randomEmail();
        const requestId = await invite(email);
        await addEmail(recipient.profileId, email);

        expect(await attachContractRequestInvitesForProfile(recipient, DOMAIN)).toBe(0);
        expect(await getContractRequestInvite(id(contractUri), requestId)).toMatchObject({
            status: 'pending',
        });
    });

    it('never throws', async () => {
        await expect(
            attachContractRequestInvitesForProfile({ profileId: 'missing-profile' }, DOMAIN)
        ).resolves.toBe(0);
    });
});
