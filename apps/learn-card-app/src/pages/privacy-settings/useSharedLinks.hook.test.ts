import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

const listShareLinks = vi.fn(async () => ({ records: [], hasMore: false }));
const getReceivedPresentations = vi.fn(async (): Promise<unknown[]> => []);
const presentToast = vi.fn();

vi.mock('learn-card-base', () => ({
    ToastTypeEnum: { Success: 'success', Error: 'error' },
    useToast: () => ({ presentToast }),
    useWallet: () => ({
        initWallet: async () => ({
            invoke: { listShareLinks, getReceivedPresentations },
            read: { get: vi.fn() },
        }),
    }),
}));

vi.mock('../../config/bootstrapTenantConfig', () => ({
    getAppBaseUrl: () => 'https://example.test',
}));

import { useSharedLinks } from './useSharedLinks';

describe('useSharedLinks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('loads links and received collections as soon as the page opens', async () => {
        renderHook(() => useSharedLinks(true, true, vi.fn(), vi.fn(), vi.fn(), vi.fn()));

        await waitFor(() => expect(listShareLinks).toHaveBeenCalledOnce());
        await waitFor(() => expect(getReceivedPresentations).toHaveBeenCalled());
    });

    it('does not load links or received collections when disabled', async () => {
        renderHook(() => useSharedLinks(false, true, vi.fn(), vi.fn(), vi.fn(), vi.fn()));

        await act(async () => {
            await Promise.resolve();
        });

        expect(listShareLinks).not.toHaveBeenCalled();
        expect(getReceivedPresentations).not.toHaveBeenCalled();
    });

    it('does not start a second saved-collection fetch when onRefresh is called during the eager load', async () => {
        let resolveReceived: (value: unknown[]) => void = () => {};
        getReceivedPresentations.mockImplementationOnce(
            () =>
                new Promise<unknown[]>(resolve => {
                    resolveReceived = resolve;
                })
        );

        const { result } = renderHook(() =>
            useSharedLinks(true, true, vi.fn(), vi.fn(), vi.fn(), vi.fn())
        );

        await waitFor(() => expect(getReceivedPresentations).toHaveBeenCalledTimes(1));

        // Still in flight: onRefresh should reuse the pending fetch, not start a new one.
        await act(async () => {
            void result.current?.savedCollections.onRefresh();
            await Promise.resolve();
        });
        expect(getReceivedPresentations).toHaveBeenCalledTimes(1);

        await act(async () => {
            resolveReceived([]);
            await Promise.resolve();
        });

        await waitFor(() => expect(result.current?.savedCollections.isLoading).toBe(false));
    });
});
