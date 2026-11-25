import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ activity: vi.fn(), send: vi.fn() }));
vi.mock('./activity.helpers', () => ({ logCredentialSent: mocks.activity }));
vi.mock('./boost.helpers', () => ({ sendBoost: mocks.send }));

import { sendAppCredentialWithActivity } from './app-credential-delivery.helpers';

const activity: Parameters<typeof sendAppCredentialWithActivity>[0] = {
    actorProfileId: 'owner',
    recipientType: 'profile',
    recipientIdentifier: 'learner',
    listingId: 'app',
    source: 'appEvent',
};
const delivery = { listingId: 'app' } as Parameters<typeof sendAppCredentialWithActivity>[1];

describe('app credential delivery graph ordering', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mocks.send.mockResolvedValue('credential:1');
    });

    it('waits for the activity write to commit and uses its ID before starting delivery', async () => {
        let resolve!: (activityId: string) => void;
        const promise = new Promise<string>(complete => {
            resolve = complete;
        });
        mocks.activity.mockReturnValue(promise);
        const result = sendAppCredentialWithActivity(activity, delivery);
        expect(mocks.activity).toHaveBeenCalledExactlyOnceWith(activity);
        expect(mocks.send).not.toHaveBeenCalled();
        resolve('activity:1');
        expect(await result).toBe('credential:1');
        expect(mocks.send).toHaveBeenCalledExactlyOnceWith({
            ...delivery,
            activityId: 'activity:1',
        });
    });

    it('does not deliver a credential after an activity write fails', async () => {
        const error = new Error('activity write failed');
        mocks.activity.mockRejectedValue(error);
        await expect(sendAppCredentialWithActivity(activity, delivery)).rejects.toBe(error);
        expect(mocks.send).not.toHaveBeenCalled();
    });

    it('propagates delivery failure without retrying activity or delivery', async () => {
        const error = new Error('delivery failed');
        mocks.activity.mockResolvedValue('activity:1');
        mocks.send.mockRejectedValue(error);
        await expect(sendAppCredentialWithActivity(activity, delivery)).rejects.toBe(error);
        expect(mocks.activity).toHaveBeenCalledOnce();
        expect(mocks.send).toHaveBeenCalledOnce();
    });
});
