import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    log: vi.fn(),
    send: vi.fn(),
    notify: vi.fn(),
    session: vi.fn(),
    begin: vi.fn(),
    close: vi.fn(),
    transaction: { commit: vi.fn(), rollback: vi.fn() },
}));
vi.mock('@instance', () => ({ neogma: { driver: { session: mocks.session } } }));
vi.mock('./activity.helpers', () => ({ logCredentialSent: mocks.log }));
vi.mock('./boost.helpers', () => ({
    persistBoostDelivery: mocks.send,
    notifyBoostRecipient: mocks.notify,
}));

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

describe('atomic credential delivery with activity', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mocks.log.mockResolvedValue('activity:logged');
        mocks.send.mockResolvedValue('credential:sent');
        mocks.transaction.commit.mockResolvedValue(undefined);
        mocks.transaction.rollback.mockResolvedValue(undefined);
        mocks.close.mockResolvedValue(undefined);
        mocks.begin.mockReturnValue(mocks.transaction);
        mocks.session.mockReturnValue({ beginTransaction: mocks.begin, close: mocks.close });
    });
    afterEach(() => vi.restoreAllMocks());

    it('finishes activity writes before delivery and shares their transaction and activity ID', async () => {
        let finishActivity!: (id: string) => void;
        mocks.log.mockImplementation(
            () => new Promise<string>(resolve => (finishActivity = resolve))
        );
        const pending = sendBoostWithActivity(activity, delivery);
        await Promise.resolve();
        expect(mocks.log).toHaveBeenCalledExactlyOnceWith(activity, mocks.transaction);
        expect(mocks.send).not.toHaveBeenCalled();
        finishActivity('activity:logged');
        await expect(pending).resolves.toBe('credential:sent');
        expect(mocks.send).toHaveBeenCalledExactlyOnceWith(
            { ...delivery, activityId: 'activity:logged' },
            mocks.transaction
        );
        expect(mocks.transaction.commit).toHaveBeenCalledOnce();
        expect(mocks.transaction.rollback).not.toHaveBeenCalled();
        expect(mocks.begin).toHaveBeenCalledExactlyOnceWith({ timeout: 30_000 });
        expect(mocks.close).toHaveBeenCalledOnce();
    });

    it('does not notify until the transaction has committed', async () => {
        let finishCommit!: () => void;
        mocks.transaction.commit.mockImplementation(
            () => new Promise<void>(resolve => (finishCommit = resolve))
        );
        const pending = sendBoostWithActivity(activity, delivery);
        await vi.waitFor(() => expect(mocks.transaction.commit).toHaveBeenCalledOnce());
        expect(mocks.notify).not.toHaveBeenCalled();
        finishCommit();
        await expect(pending).resolves.toBe('credential:sent');
        expect(mocks.notify).toHaveBeenCalledExactlyOnceWith(delivery, 'credential:sent');
    });

    it.each(['log', 'send', 'commit'] as const)(
        'rolls back on %s failure without notifying or replaying delivery',
        async stage => {
            const error = new Error(`${stage} failed`);
            (stage === 'commit' ? mocks.transaction.commit : mocks[stage]).mockRejectedValue(error);
            await expect(sendBoostWithActivity(activity, delivery)).rejects.toBe(error);
            expect(mocks.transaction.rollback).toHaveBeenCalledOnce();
            expect(mocks.notify).not.toHaveBeenCalled();
            expect(mocks.log).toHaveBeenCalledOnce();
            expect(mocks.send).toHaveBeenCalledTimes(stage === 'log' ? 0 : 1);
            expect(mocks.close).toHaveBeenCalledOnce();
        }
    );

    it('preserves the original failure if rollback also fails', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const error = new Error('Delivery failed');
        mocks.send.mockRejectedValue(error);
        mocks.transaction.rollback.mockRejectedValue(new Error('Rollback failed'));
        await expect(sendBoostWithActivity(activity, delivery)).rejects.toBe(error);
        expect(mocks.close).toHaveBeenCalledOnce();
        expect(mocks.notify).not.toHaveBeenCalled();
    });

    it.each(['close', 'notify'] as const)(
        'does not report committed delivery as failed when %s fails',
        async stage => {
            vi.spyOn(console, 'error').mockImplementation(() => undefined);
            if (stage === 'close') mocks.close.mockRejectedValue(new Error('Close failed'));
            else
                mocks.notify.mockImplementation(() => {
                    throw new Error('Notification failed');
                });
            await expect(sendBoostWithActivity(activity, delivery)).resolves.toBe(
                'credential:sent'
            );
            expect(mocks.transaction.commit).toHaveBeenCalledOnce();
            expect(mocks.transaction.rollback).not.toHaveBeenCalled();
            expect(mocks.send).toHaveBeenCalledOnce();
        }
    );

    it('honors notification suppression', async () => {
        await expect(
            sendBoostWithActivity(activity, { ...delivery, skipNotification: true })
        ).resolves.toBe('credential:sent');
        expect(mocks.notify).not.toHaveBeenCalled();
    });
});
