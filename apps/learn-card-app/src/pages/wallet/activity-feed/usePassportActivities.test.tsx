import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const getMyActivities = vi.fn();
const initWallet = vi.fn(async () => ({ invoke: { getMyActivities } }));
vi.mock('learn-card-base', () => ({ useWallet: () => ({ initWallet }) }));

import { usePassportActivities } from './usePassportActivities';

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
        {children}
    </QueryClientProvider>
);

beforeEach(() => {
    getMyActivities.mockReset();
    initWallet.mockClear();
});

describe('usePassportActivities', () => {
    it('fetches the first page and exposes hasNextPage from cursor', async () => {
        getMyActivities.mockResolvedValue({
            records: [
                {
                    id: 'a1',
                    activityId: 'x',
                    eventType: 'CREATED',
                    timestamp: '2026-06-23T00:00:00Z',
                    recipientType: 'profile',
                    recipientIdentifier: 'r',
                    source: 'sendBoost',
                },
            ],
            hasMore: true,
            cursor: '2026-06-23T00:00:00Z',
        });
        const { result } = renderHook(() => usePassportActivities(), { wrapper });
        await waitFor(() => expect(result.current.isPending).toBe(false));
        expect(getMyActivities).toHaveBeenCalledWith({
            limit: 25,
            cursor: undefined,
            groupByLatestStatus: true,
        });
        expect(result.current.hasNextPage).toBe(true);
        expect(result.current.data?.pages[0].records[0].id).toBe('a1');
    });

    it('passes the eventType filter through to the invoke call', async () => {
        getMyActivities.mockResolvedValue({ records: [], hasMore: false });
        const { result } = renderHook(() => usePassportActivities({ eventType: 'CLAIMED' }), {
            wrapper,
        });
        await waitFor(() => expect(result.current.isPending).toBe(false));
        expect(getMyActivities).toHaveBeenCalledWith({
            limit: 25,
            cursor: undefined,
            groupByLatestStatus: true,
            eventType: 'CLAIMED',
        });
    });
});
