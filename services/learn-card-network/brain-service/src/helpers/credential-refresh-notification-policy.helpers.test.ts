import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    run: vi.fn(),
}));

vi.mock('@instance', () => ({
    neogma: { queryRunner: { run: mocks.run } },
}));

import { ensureInitialNotificationPolicy } from './credential-refresh-notification-policy.helpers';

const recordFor = (initialNotificationSuppressed: boolean) => ({
    get: vi.fn((key: string) =>
        key === 'initialNotificationSuppressed' ? initialNotificationSuppressed : undefined
    ),
});

describe('initial credential notification policy', () => {
    beforeEach(() => {
        mocks.run.mockReset();
    });

    it.each([
        { requested: true, persisted: false },
        { requested: false, persisted: true },
    ])(
        'preserves the persisted $persisted policy when a retry requests $requested',
        async ({ requested, persisted }) => {
            mocks.run.mockResolvedValue({ records: [recordFor(persisted)] });

            await expect(ensureInitialNotificationPolicy('refresh-id', requested)).resolves.toBe(
                persisted
            );

            const [query, params] = mocks.run.mock.calls[0]!;
            expect(query).toContain(
                'coalesce(refresh.initialNotificationSuppressed, $initialNotificationSuppressed)'
            );
            expect(params).toEqual({
                refreshId: 'refresh-id',
                initialNotificationSuppressed: requested,
            });
        }
    );

    it('fails closed when the aggregate disappears before policy initialization', async () => {
        mocks.run.mockResolvedValue({ records: [] });

        await expect(ensureInitialNotificationPolicy('missing', true)).rejects.toThrow(
            'Credential refresh notification policy could not be initialized'
        );
    });
});
