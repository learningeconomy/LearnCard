import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

type ListPage = {
    records: { id: string; version: number; status?: string }[];
    cursor?: string;
    hasMore: boolean;
};
const listShareLinks = vi.fn(
    async (_input?: { limit?: number; cursor?: string }): Promise<ListPage> => ({
        records: [],
        hasMore: false,
    })
);
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
    describe('reload behavior', () => {
        const rec = (id: string) => ({ id, version: 1, status: 'active' });
        const pagesByCursor = () => {
            listShareLinks.mockImplementation(async input => {
                if (!input?.cursor)
                    return { records: [rec('a'), rec('b')], cursor: 'c1', hasMore: true };
                if (input.cursor === 'c1')
                    return { records: [rec('c'), rec('d')], cursor: 'c2', hasMore: true };
                return { records: [rec('e')], hasMore: false };
            });
        };

        it('keeps pages loaded via Load more when refreshing', async () => {
            pagesByCursor();
            const { result } = renderHook(() =>
                useSharedLinks(true, true, vi.fn(), vi.fn(), vi.fn(), vi.fn())
            );
            await waitFor(() => expect(result.current?.records).toHaveLength(2));

            await act(async () => {
                await result.current?.onLoadMore();
            });
            expect(result.current?.records.map(r => r.id)).toEqual(['a', 'b', 'c', 'd']);

            await act(async () => {
                await result.current?.onRefresh();
            });
            expect(result.current?.records.map(r => r.id)).toEqual(['a', 'b', 'c', 'd']);
            expect(result.current?.hasMore).toBe(true);

            // The final cursor is kept, so Load more continues from page 3.
            await act(async () => {
                await result.current?.onLoadMore();
            });
            expect(result.current?.records.map(r => r.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
            expect(result.current?.hasMore).toBe(false);
        });

        it('stops refreshing once hasMore is false', async () => {
            pagesByCursor();
            const { result } = renderHook(() =>
                useSharedLinks(true, true, vi.fn(), vi.fn(), vi.fn(), vi.fn())
            );
            await waitFor(() => expect(result.current?.records).toHaveLength(2));
            await act(async () => {
                await result.current?.onLoadMore();
            });
            await act(async () => {
                await result.current?.onLoadMore();
            });
            expect(result.current?.records).toHaveLength(5);
            listShareLinks.mockClear();
            await act(async () => {
                await result.current?.onRefresh();
            });
            expect(listShareLinks).toHaveBeenCalledTimes(3);
            expect(result.current?.records).toHaveLength(5);
            expect(result.current?.hasMore).toBe(false);
        });
    });

    describe('referential stability', () => {
        it('returns the same view model when rerendered with the same inputs', async () => {
            const onPreview = vi.fn();
            const onPreviewSaved = vi.fn();
            const onUpdate = vi.fn();
            const onCreate = vi.fn();
            const { result, rerender } = renderHook(() =>
                useSharedLinks(true, true, onPreview, onPreviewSaved, onUpdate, onCreate)
            );
            await waitFor(() => expect(result.current?.isLoading).toBe(false));
            await waitFor(() => expect(result.current?.savedCollections.isLoading).toBe(false));

            const first = result.current;
            rerender();
            expect(result.current).toBe(first);
            expect(result.current?.savedCollections).toBe(first?.savedCollections);
            expect(result.current?.pendingActions).toBe(first?.pendingActions);
            expect(result.current?.onRefresh).toBe(first?.onRefresh);
            expect(result.current?.onLoadMore).toBe(first?.onLoadMore);
        });
    });
});
