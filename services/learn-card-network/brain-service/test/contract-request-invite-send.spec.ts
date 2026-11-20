import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomBytes, randomUUID } from 'node:crypto';

const mocks = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('@services/delivery/delivery.factory', () => ({
    getDeliveryService: () => ({ send: mocks.send }),
}));

import { getUser } from './helpers/getClient';
import { normalContract, normalFullTerms } from './helpers/contract';
import cache from '@cache';
import { neogma } from '@instance';
import { getContractRequestInvite } from '@accesslayer/contract-request-invite/read';
import * as notifications from '@helpers/notifications.helpers';
import * as inviteReads from '@accesslayer/contract-request-invite/read';
import * as requestReads from '@accesslayer/consentflowcontract/read';
import * as requestHelpers from '@helpers/contract-requests.helpers';
import {
    attachContractRequestInvitesForProfile,
    deliverContractRequestInvites,
} from '@helpers/contract-request-invites.helpers';
import { defaultDomain } from '@helpers/integration-events.helpers';

const actor = async (role: string) => {
    const user = await getUser(randomBytes(32).toString('hex'));
    const profileId = `invite-send-${role}-${randomBytes(5).toString('hex')}`;
    await user.clients.fullAuth.profile.createProfile({ profileId, displayName: `Name ${role}` });
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

describe('sendContractRequest with targetEmail', () => {
    let owner: Actor;
    let recipient: Actor;
    let learner: Actor;
    let outsider: Actor;
    let contractUri: string;

    beforeEach(async () => {
        [owner, recipient, learner, outsider] = await Promise.all([
            actor('owner'),
            actor('recipient'),
            actor('learner'),
            actor('outsider'),
        ]);
        contractUri = await owner.clients.fullAuth.contracts.createConsentFlowContract({
            name: 'Synthetic referral',
            contract: normalContract,
            recipients: [recipient.profileId],
        });
        mocks.send.mockReset();
        mocks.send.mockResolvedValue(undefined);
        vi.spyOn(notifications, 'addNotificationToQueue').mockImplementation(async () => undefined);
    });
    afterEach(() => vi.restoreAllMocks());

    /** Sends, then runs the delivery worker pass that attaches or emails the invite. */
    const send = async (
        targetEmail: string,
        externalReferenceId = 'synthetic-ref-1',
        sender = recipient
    ) => {
        const result = await sender.clients.fullAuth.contracts.sendContractRequest({
            contractUri,
            targetEmail,
            externalReferenceId,
        });
        await deliverContractRequestInvites();
        return result;
    };
    const learnerRequest = () =>
        learner.clients.fullAuth.contracts.getRequestStatusForProfile({
            contractUri,
            targetProfileId: learner.profileId,
        });

    it('creates an invite and emails an address that has no account', async () => {
        const email = randomEmail();
        const result = await send(`  ${email.toUpperCase()} `);
        expect(result).toEqual({ requestId: expect.any(String), status: 'pending' });
        expect(await getContractRequestInvite(id(contractUri), result.requestId)).toMatchObject({
            email,
            status: 'pending',
            requestedBy: recipient.profileId,
            externalReferenceId: 'synthetic-ref-1',
            emailSentAt: expect.any(String),
        });
        expect(mocks.send).toHaveBeenCalledTimes(1);
        expect(mocks.send.mock.calls[0]![0]).toMatchObject({
            contactMethod: { type: 'email', value: email },
            templateId: 'contract-request-invite',
            templateModel: {
                referrer: { name: 'Name recipient' },
                contractOwner: { name: 'Name owner' },
            },
        });
    });

    it('returns the same request ID and sends nothing for an identical retry', async () => {
        const email = randomEmail();
        const first = await send(email);
        await expect(send(email)).resolves.toEqual(first);
        expect(mocks.send).toHaveBeenCalledTimes(1);
    });

    it('attaches to an existing account without sending an email', async () => {
        const email = randomEmail();
        await addEmail(learner.profileId, email.toUpperCase());
        const result = await send(email);
        expect(result).toEqual({ requestId: expect.any(String), status: 'pending' });
        expect(mocks.send).not.toHaveBeenCalled();
        expect(await learnerRequest()).toMatchObject({
            requestId: result.requestId,
            status: 'pending',
        });
        await expect(send(email)).resolves.toEqual(result);
    });

    it('answers the same way when the account already has live consent', async () => {
        const email = randomEmail();
        await addEmail(learner.profileId, email);
        await learner.clients.fullAuth.contracts.consentToContract({
            contractUri,
            terms: normalFullTerms,
            audienceVersion: (
                await owner.clients.fullAuth.contracts.getConsentFlowContract({ uri: contractUri })
            ).audienceVersion,
        });
        const result = await send(email);
        expect(result).toEqual({ requestId: expect.any(String), status: 'pending' });
        expect(mocks.send).not.toHaveBeenCalled();
        expect((await learnerRequest())?.requestId).not.toBe(result.requestId);
        expect(await getContractRequestInvite(id(contractUri), result.requestId)).toMatchObject({
            status: 'pending',
        });
    });

    it('answers the same way when the sender invites its own email', async () => {
        const email = randomEmail();
        await addEmail(recipient.profileId, email);
        await expect(send(email)).resolves.toEqual({
            requestId: expect.any(String),
            status: 'pending',
        });
        expect(mocks.send).not.toHaveBeenCalled();
    });

    it('sends at most 3 invite emails per contract and email in 24 hours', async () => {
        const email = randomEmail();
        for (const reference of ['a', 'b', 'c', 'd'])
            await expect(send(email, reference)).resolves.toMatchObject({ status: 'pending' });
        expect(mocks.send).toHaveBeenCalledTimes(3);
    });

    it('still answers pending when the email provider fails', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        mocks.send.mockRejectedValueOnce(new Error('provider down'));
        await expect(send(randomEmail())).resolves.toMatchObject({ status: 'pending' });
    });

    it('validates the target and the sender', async () => {
        await expect(
            recipient.clients.fullAuth.contracts.sendContractRequest({ contractUri } as never)
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        await expect(
            recipient.clients.fullAuth.contracts.sendContractRequest({
                contractUri,
                targetEmail: randomEmail(),
                targetProfileId: learner.profileId,
            })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        await expect(send('not-an-email')).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        await expect(send(randomEmail(), 'x', outsider)).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });
        expect(mocks.send).not.toHaveBeenCalled();
    });

    it('counts the rate limit before it looks at the email', async () => {
        await cache.set(
            `contract-request-rate:${id(contractUri)}:${recipient.profileId}`,
            '500',
            3600
        );
        await expect(send(randomEmail())).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
        expect(mocks.send).not.toHaveBeenCalled();
    });

    it('never logs the email address', async () => {
        const email = randomEmail();
        const spies = (['log', 'info', 'warn', 'error'] as const).map(level =>
            vi.spyOn(console, level).mockImplementation(() => undefined)
        );
        mocks.send.mockRejectedValueOnce(new Error(`cannot deliver to ${email}`));
        await send(email);
        await addEmail(learner.profileId, email);
        await send(email, 'second');
        expect(JSON.stringify(spies.flatMap(spy => spy.mock.calls))).not.toContain(email);
    });

    it('leaves delivery to the worker, and retries an invite email that failed', async () => {
        const email = randomEmail();
        const { requestId } = await recipient.clients.fullAuth.contracts.sendContractRequest({
            contractUri,
            targetEmail: email,
        });
        expect(mocks.send).not.toHaveBeenCalled();

        mocks.send.mockRejectedValueOnce(new Error('synthetic outage'));
        await deliverContractRequestInvites();
        expect(mocks.send).toHaveBeenCalledTimes(1);
        const failed = await getContractRequestInvite(id(contractUri), requestId);
        expect(failed?.emailSentAt ?? null).toBeNull();
        expect(failed?.deliveryPending).toBe(true);
        expect(Number(failed?.deliveryAttempts)).toBe(1);

        await neogma.queryRunner.run(
            'MATCH (i:ContractRequestInvite {id: $requestId}) SET i.deliveryNextAt = $past',
            { requestId, past: '2000-01-01T00:00:00.000Z' }
        );
        await deliverContractRequestInvites();
        expect(mocks.send).toHaveBeenCalledTimes(2);
        const invite = await getContractRequestInvite(id(contractUri), requestId);
        expect(invite?.emailSentAt).toEqual(expect.any(String));
        expect(invite?.deliveryPending ?? null).toBeNull();
    });

    const makeDue = (requestId: string) =>
        neogma.queryRunner.run(
            'MATCH (i:ContractRequestInvite {id: $requestId}) SET i.deliveryNextAt = $past',
            { requestId, past: '2000-01-01T00:00:00.000Z' }
        );

    it('retries the invite email when a read before the send fails', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        vi.spyOn(inviteReads, 'getContractOwnerDisplayName').mockRejectedValueOnce(
            new Error('synthetic read failure')
        );
        const { requestId } = await send(randomEmail());
        expect(mocks.send).not.toHaveBeenCalled();
        const failed = await getContractRequestInvite(id(contractUri), requestId);
        expect(failed?.emailSentAt ?? null).toBeNull();
        expect(failed?.deliveryPending).toBe(true);
        expect(Number(failed?.deliveryAttempts)).toBe(1);

        await makeDue(requestId);
        await deliverContractRequestInvites();
        expect(mocks.send).toHaveBeenCalledTimes(1);
        expect(
            (await getContractRequestInvite(id(contractUri), requestId))?.deliveryPending ?? null
        ).toBeNull();
    });

    it('sends again when a worker stopped after claiming the email', async () => {
        const { requestId } = await recipient.clients.fullAuth.contracts.sendContractRequest({
            contractUri,
            targetEmail: randomEmail(),
        });
        await neogma.queryRunner.run(
            `MATCH (i:ContractRequestInvite {id: $requestId})
             SET i.emailSentAt = $claimedAt, i.deliveryNextAt = $past`,
            {
                requestId,
                claimedAt: new Date(Date.now() - 10 * 60_000).toISOString(),
                past: '2000-01-01T00:00:00.000Z',
            }
        );
        await deliverContractRequestInvites();
        expect(mocks.send).toHaveBeenCalledTimes(1);
        expect(
            (await getContractRequestInvite(id(contractUri), requestId))?.deliveryPending ?? null
        ).toBeNull();
    });

    it('retries an attach that failed instead of dropping it from the queue', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const email = randomEmail();
        await addEmail(learner.profileId, email);
        vi.spyOn(requestHelpers, 'createRequestForProfile').mockRejectedValueOnce(
            new Error('synthetic write failure')
        );
        const { requestId } = await send(email);
        expect(await learnerRequest()).toBeNull();
        expect((await getContractRequestInvite(id(contractUri), requestId))?.deliveryPending).toBe(
            true
        );

        await makeDue(requestId);
        await deliverContractRequestInvites();
        expect(await learnerRequest()).toMatchObject({ requestId, status: 'pending' });
    });

    it('gives a resend after expiry a new request, whether or not the first invite attached', async () => {
        const attachedEmail = randomEmail();
        const unattachedEmail = randomEmail();
        await addEmail(learner.profileId, attachedEmail);
        const attached = await send(attachedEmail);
        const unattached = await send(unattachedEmail);
        expect(await learnerRequest()).toMatchObject({ requestId: attached.requestId });

        // Past the expiry date, before the daily job has marked anything.
        await neogma.queryRunner.run(
            `MATCH (c:ConsentFlowContract {id: $contractId})-[:HAS_REQUEST_INVITE]->(i:ContractRequestInvite)
             WHERE i.id IN $ids
             SET i.expiresAt = $past
             WITH c, i
             OPTIONAL MATCH (c)-[r:REQUESTED_FOR]->(:Profile) WHERE r.requestId = i.id
             SET r.expiresAt = $past`,
            {
                contractId: id(contractUri),
                ids: [attached.requestId, unattached.requestId],
                past: '2000-01-01T00:00:00.000Z',
            }
        );
        const attachedAgain = await send(attachedEmail);
        const unattachedAgain = await send(unattachedEmail);
        expect(attachedAgain.requestId).not.toBe(attached.requestId);
        expect(unattachedAgain.requestId).not.toBe(unattached.requestId);
        expect(await learnerRequest()).toMatchObject({
            requestId: attachedAgain.requestId,
            status: 'pending',
        });

        const read = (requestId: string) =>
            recipient.clients.fullAuth.contracts.getContractRequest({ contractUri, requestId });
        const [oldAttached, oldUnattached] = await Promise.all([
            read(attached.requestId),
            read(unattached.requestId),
        ]);
        expect(oldAttached).toMatchObject({ status: 'expired', target: { email: attachedEmail } });
        expect(oldUnattached).toMatchObject({
            status: 'expired',
            target: { email: unattachedEmail },
        });
        expect(Object.keys(oldAttached ?? {}).sort()).toEqual(
            Object.keys(oldUnattached ?? {}).sort()
        );
    });

    it('cancelling by ID never cancels a request that replaced it in the meantime', async () => {
        const email = randomEmail();
        await addEmail(learner.profileId, email);
        const { requestId: oldId } = await send(email);
        let newId: string | undefined;
        const real = requestReads.getStoredContractRequest;
        vi.spyOn(requestReads, 'getStoredContractRequest').mockImplementationOnce(
            async (...args) => {
                const found = await real(...args);
                newId = (
                    await recipient.clients.fullAuth.contracts.sendContractRequest({
                        contractUri,
                        targetProfileId: learner.profileId,
                    })
                ).requestId;
                return found;
            }
        );

        await expect(
            recipient.clients.fullAuth.contracts.cancelContractRequest({
                contractUri,
                requestId: oldId,
            })
        ).resolves.toBe(true);
        expect(newId).toBeDefined();
        expect(newId).not.toBe(oldId);
        expect(await learnerRequest()).toMatchObject({ requestId: newId, status: 'pending' });
        expect(
            await recipient.clients.fullAuth.contracts.getContractRequest({
                contractUri,
                requestId: oldId,
            })
        ).toMatchObject({ status: 'cancelled' });
    });

    it('leaves an invite queued while another worker holds its email lease', async () => {
        const { requestId } = await recipient.clients.fullAuth.contracts.sendContractRequest({
            contractUri,
            targetEmail: randomEmail(),
        });
        // Another worker has just claimed the email; this worker read the invite as due before that.
        await neogma.queryRunner.run(
            `MATCH (i:ContractRequestInvite {id: $requestId})
             SET i.emailSentAt = $claimedAt, i.deliveryNextAt = $past`,
            { requestId, claimedAt: new Date().toISOString(), past: '2000-01-01T00:00:00.000Z' }
        );
        await deliverContractRequestInvites();
        expect(mocks.send).not.toHaveBeenCalled();
        expect((await getContractRequestInvite(id(contractUri), requestId))?.deliveryPending).toBe(
            true
        );

        // That worker stopped before sending; once its lease has passed the email still goes out.
        await neogma.queryRunner.run(
            'MATCH (i:ContractRequestInvite {id: $requestId}) SET i.emailSentAt = $claimedAt',
            { requestId, claimedAt: new Date(Date.now() - 10 * 60_000).toISOString() }
        );
        await deliverContractRequestInvites();
        expect(mocks.send).toHaveBeenCalledTimes(1);
    });

    it('attaches a repeat invite when the person verifies the email again', async () => {
        const email = randomEmail();
        await addEmail(learner.profileId, email);
        const first = await send(email);
        await recipient.clients.fullAuth.contracts.cancelContractRequest({
            contractUri,
            requestId: first.requestId,
        });

        // The address is removed from the profile, so the repeat invite is emailed instead.
        await neogma.queryRunner.run(
            `MATCH (:Profile {profileId: $profileId})-[:HAS_CONTACT_METHOD]->(cm:ContactMethod)
             WHERE cm.value = $email DETACH DELETE cm`,
            { profileId: learner.profileId, email }
        );
        const repeat = await send(email);
        expect(repeat.requestId).not.toBe(first.requestId);
        expect(mocks.send).toHaveBeenCalledTimes(1);
        expect(await learnerRequest()).toMatchObject({
            requestId: first.requestId,
            status: 'cancelled',
        });

        // Verifying the address again runs the same attach the verification routes call.
        await addEmail(learner.profileId, email);
        await attachContractRequestInvitesForProfile(
            { profileId: learner.profileId },
            defaultDomain()
        );
        expect(await learnerRequest()).toMatchObject({
            requestId: repeat.requestId,
            status: 'pending',
        });
    });
});
