import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import type { Persister } from '@tanstack/react-query-persist-client';

import { subscribeBatched } from './BatchedPersistQueryClientProvider';

describe('subscribeBatched', () => {
    afterEach(() => vi.useRealTimers());

    it('dehydrates once per window, and flushes a pending save on unsubscribe', async () => {
        vi.useFakeTimers();
        const queryClient = new QueryClient();
        const persistClient = vi.fn();
        const persister: Persister = {
            persistClient,
            restoreClient: async () => undefined,
            removeClient: async () => undefined,
        };
        const unsubscribe = subscribeBatched({ queryClient, persister }, 500);

        for (let i = 0; i < 50; i++) queryClient.setQueryData(['q', i], i);
        await vi.advanceTimersByTimeAsync(499);
        expect(persistClient).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1);
        expect(persistClient).toHaveBeenCalledTimes(1);
        expect(persistClient.mock.calls[0][0].clientState.queries).toHaveLength(50);

        queryClient.setQueryData(['q', 'late'], 1);
        unsubscribe();
        await vi.advanceTimersByTimeAsync(0);
        expect(persistClient).toHaveBeenCalledTimes(2);
        expect(persistClient.mock.calls[1][0].clientState.queries).toHaveLength(51);
    });
});
