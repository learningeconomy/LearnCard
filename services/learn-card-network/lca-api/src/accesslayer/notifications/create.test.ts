import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    updateOne: vi.fn(),
    ensureManagedCredentialRefreshNotificationIndex: vi.fn(),
}));

vi.mock('.', () => ({
    Notifications: { updateOne: mocks.updateOne },
    ensureManagedCredentialRefreshNotificationIndex:
        mocks.ensureManagedCredentialRefreshNotificationIndex,
}));

import {
    createNotification,
    isManagedCredentialRefreshNotification,
    upsertCredentialRefreshNotification,
} from './create';

const notification = (type: 'CREDENTIAL_RECEIVED' | 'CREDENTIAL_REFRESHED', metadata?: object) =>
    ({
        type,
        to: { did: 'did:key:holder' },
        from: { did: 'did:key:issuer' },
        data: metadata ? { metadata } : undefined,
    }) as never;

describe('managed credential refresh notification detection', () => {
    it('recognizes tagged managed initial credential deliveries', () => {
        expect(
            isManagedCredentialRefreshNotification(
                notification('CREDENTIAL_RECEIVED', {
                    managedCredentialRefreshInitial: true,
                    deliveryKey: 'opaque-initial-key',
                })
            )
        ).toBe(true);
    });

    it('does not change generic CREDENTIAL_RECEIVED delivery semantics', () => {
        expect(isManagedCredentialRefreshNotification(notification('CREDENTIAL_RECEIVED'))).toBe(
            false
        );
        expect(
            isManagedCredentialRefreshNotification(
                notification('CREDENTIAL_RECEIVED', { deliveryKey: 'unrelated-key' })
            )
        ).toBe(false);
    });

    it('retains CREDENTIAL_REFRESHED collapse behavior', () => {
        expect(isManagedCredentialRefreshNotification(notification('CREDENTIAL_REFRESHED'))).toBe(
            true
        );
    });
});

describe('managed credential refresh notification persistence', () => {
    beforeEach(() => {
        mocks.updateOne.mockReset();
        mocks.updateOne.mockResolvedValue({ upsertedCount: 1 });
        mocks.ensureManagedCredentialRefreshNotificationIndex.mockReset();
        mocks.ensureManagedCredentialRefreshNotificationIndex.mockResolvedValue(undefined);
    });

    it('fails closed before writing when the managed-refresh index is not ready', async () => {
        const failure = new Error('index unavailable');
        mocks.ensureManagedCredentialRefreshNotificationIndex.mockRejectedValue(failure);

        await expect(
            upsertCredentialRefreshNotification(
                notification('CREDENTIAL_REFRESHED', { deliveryKey: 'window-key' })
            )
        ).rejects.toBe(failure);
        expect(mocks.updateOne).not.toHaveBeenCalled();
    });

    it('uses insert-only semantics for retried managed initial deliveries', async () => {
        await upsertCredentialRefreshNotification(
            notification('CREDENTIAL_RECEIVED', {
                managedCredentialRefreshInitial: true,
                deliveryKey: 'initial-key',
            })
        );

        const [, update] = mocks.updateOne.mock.calls[0]!;
        expect(update.$set).toBeUndefined();
        expect(update.$setOnInsert).toMatchObject({
            read: false,
            managedCredentialRefreshDeliveryKey: expect.any(String),
        });
    });

    it('retains update-in-place semantics for refreshed delivery windows', async () => {
        await upsertCredentialRefreshNotification(
            notification('CREDENTIAL_REFRESHED', { deliveryKey: 'window-key', version: 2 })
        );

        const [, update] = mocks.updateOne.mock.calls[0]!;
        expect(update.$set).toMatchObject({
            read: false,
            managedCredentialRefreshDeliveryKey: expect.any(String),
        });
        expect(update.$setOnInsert).toMatchObject({ archived: false });
    });
});

describe('campaign notification persistence', () => {
    const campaignNotification = {
        type: 'ANNOUNCEMENT' as const,
        to: { did: 'did:web:brain.example:users:learner' },
        from: 'did:web:brain.example',
        message: { title: 'Welcome', body: 'Explore your next step' },
        data: { metadata: { campaignId: 'pilot-clr', campaignCreatedAt: '2026-01-01T00:00:00Z' } },
    };
    beforeEach(() => {
        mocks.updateOne.mockReset();
    });

    it('collapses concurrent retries into one insertion without changing read state or copy', async () => {
        const stored = new Map<string, unknown>();
        mocks.updateOne.mockImplementation(async (filter, update) => {
            if (stored.has(filter._id)) return { upsertedCount: 0 };
            stored.set(filter._id, update.$setOnInsert);
            return { upsertedCount: 1 };
        });
        const results = await Promise.all(
            Array.from({ length: 10 }, () => createNotification(campaignNotification))
        );
        expect(results.filter(result => result && result.created)).toHaveLength(1);
        expect(stored.size).toBe(1);
        await createNotification({ ...campaignNotification, message: { title: 'Edited' } });
        expect([...stored.values()][0]).toMatchObject({ message: campaignNotification.message });
        for (const [filter, update, options] of mocks.updateOne.mock.calls) {
            expect(filter._id).toMatch(/^campaign:[a-f0-9]{64}$/);
            expect(update.$set).toBeUndefined();
            expect(options).toEqual({ upsert: true });
        }
    });

    it('keeps separate recipients, recreated campaigns and explicit tests independent', async () => {
        mocks.updateOne.mockResolvedValue({ upsertedCount: 1 });
        await createNotification(campaignNotification);
        await createNotification({ ...campaignNotification, to: { did: 'did:key:other' } });
        await createNotification({
            ...campaignNotification,
            data: {
                metadata: {
                    ...campaignNotification.data.metadata,
                    campaignCreatedAt: '2026-02-01T00:00:00Z',
                },
            },
        });
        await createNotification({
            ...campaignNotification,
            data: {
                metadata: {
                    ...campaignNotification.data.metadata,
                    campaignTestId: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
                },
            },
        });
        expect(new Set(mocks.updateOne.mock.calls.map(([filter]) => filter._id)).size).toBe(4);
    });

    it('does not turn ambiguous storage errors into a successful delivery', async () => {
        const error = Object.assign(new Error('lost response'), { name: 'MongoNetworkError' });
        mocks.updateOne.mockRejectedValue(error);
        await expect(createNotification(campaignNotification)).rejects.toBe(error);
        mocks.updateOne.mockResolvedValue({ upsertedCount: 0 });
        await expect(createNotification(campaignNotification)).resolves.toEqual({ created: false });
    });

    it('treats an atomic duplicate-key race as an existing delivery', async () => {
        mocks.updateOne.mockRejectedValue({ code: 11000 });
        await expect(createNotification(campaignNotification)).resolves.toEqual({ created: false });
    });

    it('rejects missing campaign identity before storing or pushing', async () => {
        await expect(
            createNotification({ ...campaignNotification, data: undefined })
        ).resolves.toBe(false);
        expect(mocks.updateOne).not.toHaveBeenCalled();
    });
});
