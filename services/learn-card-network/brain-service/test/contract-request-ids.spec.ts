import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomBytes } from 'node:crypto';
import { getUser } from './helpers/getClient';
import { normalContract } from './helpers/contract';
import cache from '@cache';
import * as notifications from '@helpers/notifications.helpers';

const actor = async (role: string) => {
    const user = await getUser(randomBytes(32).toString('hex'));
    const profileId = `reqid-${role}-${randomBytes(5).toString('hex')}`;
    await user.clients.fullAuth.profile.createProfile({ profileId });
    return { ...user, profileId };
};
type Actor = Awaited<ReturnType<typeof actor>>;
const id = (uri: string): string => uri.split(':').at(-1)!;

describe('contract request IDs', () => {
    let owner: Actor;
    let writer: Actor;
    let recipient: Actor;
    let learner: Actor;

    beforeEach(async () => {
        [owner, writer, recipient, learner] = await Promise.all([
            actor('owner'),
            actor('writer'),
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
            writers: [writer.profileId],
            recipients: [recipient.profileId],
        });

    it('returns the request id with pending status, and the same id for an identical retry', async () => {
        const contractUri = await create();
        const input = {
            contractUri,
            targetProfileId: learner.profileId,
            externalReferenceId: 'synthetic-ref-1',
        };
        const first = await writer.clients.fullAuth.contracts.sendContractRequest(input);
        expect(first).toEqual({ requestId: expect.any(String), status: 'pending' });
        await expect(writer.clients.fullAuth.contracts.sendContractRequest(input)).resolves.toEqual(
            first
        );
        const stored = await learner.clients.fullAuth.contracts.getRequestStatusForProfile({
            contractUri,
            targetProfileId: learner.profileId,
        });
        expect(stored?.requestId).toBe(first.requestId);
    });

    it('rejects a conflicting request from another sender', async () => {
        const contractUri = await create();
        await writer.clients.fullAuth.contracts.sendContractRequest({
            contractUri,
            targetProfileId: learner.profileId,
        });
        await expect(
            recipient.clients.fullAuth.contracts.sendContractRequest({
                contractUri,
                targetProfileId: learner.profileId,
            })
        ).rejects.toMatchObject({ code: 'CONFLICT' });
    });

    it('counts the rate limit before it resolves the target', async () => {
        const contractUri = await create();
        await cache.set(
            `contract-request-rate:${id(contractUri)}:${writer.profileId}`,
            '500',
            3600
        );
        await expect(
            writer.clients.fullAuth.contracts.sendContractRequest({
                contractUri,
                targetProfileId: 'missing-profile',
            })
        ).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
    });
});
