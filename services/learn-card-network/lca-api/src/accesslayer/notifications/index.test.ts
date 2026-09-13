import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    createIndex: vi.fn(),
    dropIndex: vi.fn(),
}));

vi.mock('@mongo', () => ({
    default: {
        collection: vi.fn(() => ({
            createIndex: mocks.createIndex,
            dropIndex: mocks.dropIndex,
        })),
    },
}));

beforeEach(() => {
    vi.resetModules();
    mocks.createIndex.mockReset();
    mocks.dropIndex.mockReset();
    mocks.createIndex.mockResolvedValue('index-name');
    mocks.dropIndex.mockResolvedValue(undefined);
});

describe('managed credential refresh notification index readiness', () => {
    it('shares an awaited scoped-index migration across concurrent callers', async () => {
        const { ensureManagedCredentialRefreshNotificationIndex } = await import('.');

        const first = ensureManagedCredentialRefreshNotificationIndex();
        const second = ensureManagedCredentialRefreshNotificationIndex();

        expect(second).toBe(first);
        await Promise.all([first, second]);

        expect(mocks.createIndex).toHaveBeenCalledWith(
            { managedCredentialRefreshDeliveryKey: 1 },
            expect.objectContaining({
                unique: true,
                partialFilterExpression: {
                    managedCredentialRefreshDeliveryKey: { $type: 'string' },
                },
            })
        );
        expect(mocks.dropIndex).toHaveBeenCalledWith('to.did_1_type_1_data.metadata.deliveryKey_1');
    });

    it('clears failed readiness so a later delivery can retry', async () => {
        const failure = new Error('index unavailable');
        const { ensureManagedCredentialRefreshNotificationIndex } = await import('.');
        mocks.createIndex.mockRejectedValueOnce(failure).mockResolvedValue('index-name');

        await expect(ensureManagedCredentialRefreshNotificationIndex()).rejects.toBe(failure);
        await expect(ensureManagedCredentialRefreshNotificationIndex()).resolves.toBeUndefined();
    });
});
