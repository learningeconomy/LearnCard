import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const listShareLinks = vi.fn(async () => ({ records: [], hasMore: false }));
const getReceivedPresentations = vi.fn(async () => []);

vi.mock('learn-card-base', () => ({
    ToastTypeEnum: { Success: 'success', Error: 'error' },
    useToast: () => ({ presentToast: vi.fn() }),
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

describe('useSharedLinks', () => {
    it('loads links and received collections as soon as the page opens', async () => {
        const { useSharedLinks } = await import('./useSharedLinks');
        renderHook(() => useSharedLinks(true, true, vi.fn(), vi.fn(), vi.fn(), vi.fn()));

        await waitFor(() => expect(listShareLinks).toHaveBeenCalledOnce());
        await waitFor(() => expect(getReceivedPresentations).toHaveBeenCalled());
    }, 10000);
});
