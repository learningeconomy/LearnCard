import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ log: vi.fn(), send: vi.fn() }));
vi.mock('./activity.helpers', () => ({ logCredentialSent: mocks.log }));
vi.mock('./boost.helpers', () => ({ sendBoost: mocks.send }));

import { sendBoostWithActivity } from './credential-delivery.helpers';

const activity = {
    actorProfileId: 'issuer',
    recipientType: 'profile',
    recipientIdentifier: 'recipient',
    recipientProfileId: 'recipient',
    listingId: 'listing',
    source: 'appEvent',
} satisfies Parameters<typeof sendBoostWithActivity>[0];
const delivery = {
    from: { type: 'profile', profile: { profileId: 'issuer' } },
    to: { profileId: 'recipient' },
    boost: { id: 'boost' },
    credential: { ciphertext: 'encrypted' },
    domain: 'network.example',
    listingId: 'listing',
} as unknown as Parameters<typeof sendBoostWithActivity>[1];

describe('credential delivery with activity', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mocks.send.mockResolvedValue('credential:sent');
    });

    it('waits for activity writes and links delivery to their activity ID', async () => {
        let finishActivity!: (id: string) => void;
        mocks.log.mockImplementation(
            () => new Promise<string>(resolve => (finishActivity = resolve))
        );

        const pending = sendBoostWithActivity(activity, delivery);
        await Promise.resolve();
        expect(mocks.log).toHaveBeenCalledExactlyOnceWith(activity);
        expect(mocks.send).not.toHaveBeenCalled();

        finishActivity('activity:logged');
        await expect(pending).resolves.toBe('credential:sent');
        expect(mocks.send).toHaveBeenCalledExactlyOnceWith({
            ...delivery,
            activityId: 'activity:logged',
        });
    });

    it('does not deliver a credential when activity logging fails', async () => {
        const error = new Error('Neo.TransientError.Transaction.DeadlockDetected');
        mocks.log.mockRejectedValue(error);

        await expect(sendBoostWithActivity(activity, delivery)).rejects.toBe(error);
        expect(mocks.send).not.toHaveBeenCalled();
    });

    it('propagates delivery failures without replaying issuance', async () => {
        const error = new Error('Delivery failed');
        mocks.log.mockResolvedValue('activity:logged');
        mocks.send.mockRejectedValue(error);

        await expect(sendBoostWithActivity(activity, delivery)).rejects.toBe(error);
        expect(mocks.log).toHaveBeenCalledOnce();
        expect(mocks.send).toHaveBeenCalledOnce();
    });
});
