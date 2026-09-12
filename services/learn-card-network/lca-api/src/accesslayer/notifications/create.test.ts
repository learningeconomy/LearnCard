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
