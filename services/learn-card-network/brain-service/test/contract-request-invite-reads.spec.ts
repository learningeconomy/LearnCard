import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomBytes, randomUUID } from 'node:crypto';

const mocks = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('@services/delivery/delivery.factory', () => ({
    getDeliveryService: () => ({ send: mocks.send }),
}));

import { getUser } from './helpers/getClient';
import { normalContract } from './helpers/contract';
import { neogma } from '@instance';
import * as notifications from '@helpers/notifications.helpers';

const actor = async (role: string) => {
    const user = await getUser(randomBytes(32).toString('hex'));
    const profileId = `invite-read-${role}-${randomBytes(5).toString('hex')}`;
    await user.clients.fullAuth.profile.createProfile({ profileId });
    return { ...user, profileId };
};
type Actor = Awaited<ReturnType<typeof actor>>;
const randomEmail = (): string => `${randomBytes(6).toString('hex')}@example.com`;

const addEmail = (profileId: string, value: string) =>
    neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId})
         CREATE (p)-[:HAS_CONTACT_METHOD]->(:ContactMethod {id: $id, type: 'email', value: $value,
             isVerified: true, verifiedAt: $now, isPrimary: false, createdAt: $now})`,
        { profileId, id: randomUUID(), value, now: new Date().toISOString() }
    );

describe('reading and cancelling unattached contract request invites', () => {
    let owner: Actor;
    let recipient: Actor;
    let otherRecipient: Actor;
    let learner: Actor;
    let contractUri: string;

    beforeEach(async () => {
        [owner, recipient, otherRecipient, learner] = await Promise.all([
            actor('owner'),
            actor('recipient'),
            actor('other'),
            actor('learner'),
        ]);
        contractUri = await owner.clients.fullAuth.contracts.createConsentFlowContract({
            name: 'Synthetic referral',
            contract: normalContract,
            recipients: [recipient.profileId, otherRecipient.profileId],
        });
        mocks.send.mockReset();
        mocks.send.mockResolvedValue(undefined);
        vi.spyOn(notifications, 'addNotificationToQueue').mockImplementation(async () => undefined);
    });
    afterEach(() => vi.restoreAllMocks());

    const send = (targetEmail: string, externalReferenceId = 'synthetic-ref-1') =>
        recipient.clients.fullAuth.contracts.sendContractRequest({
            contractUri,
            targetEmail,
            externalReferenceId,
            message: 'Synthetic invitation',
        });

    it('returns an unattached invite from getContractRequest to its sender and the owner', async () => {
        const email = randomEmail();
        const { requestId } = await send(email);
        for (const viewer of [recipient, owner]) {
            const request = await viewer.clients.fullAuth.contracts.getContractRequest({
                contractUri,
                requestId,
            });
            expect(request).toEqual({
                requestId,
                status: 'pending',
                externalReferenceId: 'synthetic-ref-1',
                requestedAt: expect.any(String),
                expiresAt: expect.any(String),
                target: { email },
            });
        }
        await expect(
            otherRecipient.clients.fullAuth.contracts.getContractRequest({ contractUri, requestId })
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('reports an overdue pending invite as expired', async () => {
        const { requestId } = await send(randomEmail());
        await neogma.queryRunner.run(
            `MATCH (i:ContractRequestInvite {id: $requestId}) SET i.expiresAt = $past`,
            { requestId, past: '2000-01-01T00:00:00.000Z' }
        );
        expect(
            await recipient.clients.fullAuth.contracts.getContractRequest({
                contractUri,
                requestId,
            })
        ).toMatchObject({ status: 'expired', expiresAt: '2000-01-01T00:00:00.000Z' });
    });

    it('lists attached and unattached invites with the same fields', async () => {
        const knownEmail = randomEmail();
        await addEmail(learner.profileId, knownEmail);
        const attached = await send(knownEmail, 'ref-known');
        const unknownEmail = randomEmail();
        const unattached = await send(unknownEmail, 'ref-unknown');

        const rows = await recipient.clients.fullAuth.contracts.getContractSentRequests({
            contractUri,
        });
        expect(rows).toHaveLength(2);
        const attachedRow = rows.find(row => row.requestId === attached.requestId)!;
        const unattachedRow = rows.find(row => row.requestId === unattached.requestId)!;
        expect(attachedRow).toMatchObject({ status: 'pending', target: { email: knownEmail } });
        expect(unattachedRow).toEqual({
            requestId: unattached.requestId,
            requestedBy: recipient.profileId,
            externalReferenceId: 'ref-unknown',
            requestedAt: expect.any(String),
            message: 'Synthetic invitation',
            status: 'pending',
            readStatus: null,
            expiresAt: expect.any(String),
            target: { email: unknownEmail },
        });
        expect(Object.keys(attachedRow).sort()).toEqual(Object.keys(unattachedRow).sort());
        expect(JSON.stringify(rows)).not.toContain(learner.profileId);

        expect(
            await otherRecipient.clients.fullAuth.contracts.getContractSentRequests({ contractUri })
        ).toEqual([]);
        expect(
            await owner.clients.fullAuth.contracts.getContractSentRequests({ contractUri })
        ).toHaveLength(2);
    });

    it('lists requests in send order whether or not the email has an account', async () => {
        const knownEmail = randomEmail();
        await addEmail(learner.profileId, knownEmail);
        const unattached = await send(randomEmail(), 'ref-first');
        const attached = await send(knownEmail, 'ref-second');
        const last = await send(randomEmail(), 'ref-third');

        const rows = await recipient.clients.fullAuth.contracts.getContractSentRequests({
            contractUri,
        });
        expect(rows.map(row => row.requestId)).toEqual([
            unattached.requestId,
            attached.requestId,
            last.requestId,
        ]);
    });

    it('cancels an unattached invite by request ID', async () => {
        const email = randomEmail();
        const { requestId } = await send(email);
        await expect(
            otherRecipient.clients.fullAuth.contracts.cancelContractRequest({
                contractUri,
                requestId,
            })
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        await expect(
            recipient.clients.fullAuth.contracts.cancelContractRequest({ contractUri, requestId })
        ).resolves.toBe(true);
        await expect(
            recipient.clients.fullAuth.contracts.cancelContractRequest({ contractUri, requestId })
        ).resolves.toBe(true);
        expect(
            await recipient.clients.fullAuth.contracts.getContractRequest({
                contractUri,
                requestId,
            })
        ).toMatchObject({ status: 'cancelled', target: { email } });

        const again = await send(email);
        expect(again.requestId).not.toBe(requestId);

        await addEmail(learner.profileId, email);
        const { attachContractRequestInvitesForProfile } =
            await import('@helpers/contract-request-invites.helpers');
        expect(await attachContractRequestInvitesForProfile(learner, 'localhost%3A3000')).toBe(1);
        expect(
            (
                await learner.clients.fullAuth.contracts.getRequestStatusForProfile({
                    contractUri,
                    targetProfileId: learner.profileId,
                })
            )?.requestId
        ).toBe(again.requestId);
    });
});
