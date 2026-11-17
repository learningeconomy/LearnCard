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

    const send = (
        targetEmail: string,
        externalReferenceId = 'synthetic-ref-1',
        sender = recipient
    ) =>
        sender.clients.fullAuth.contracts.sendContractRequest({
            contractUri,
            targetEmail,
            externalReferenceId,
        });
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
});
