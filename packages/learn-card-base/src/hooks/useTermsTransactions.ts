import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { dropMalformedInfiniteCacheEntry } from '../react-query/infiniteQueryGuard';
import useWallet from './useWallet';

export const useTermsTransactions = (uri?: string) => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();
    const queryKey = ['useTermsTransactions', uri] as const;
    dropMalformedInfiniteCacheEntry(queryClient, queryKey, 'useTermsTransactions');

    return useInfiniteQuery({
        queryKey,
        queryFn: async ({ pageParam }) => {
            if (!uri) return;

            try {
                const wallet = await initWallet();

                return await wallet.invoke.getConsentFlowTransactions(uri, { cursor: pageParam });
            } catch (error: any) {
                return Promise.reject(error);
            }
        },
        enabled: Boolean(uri),
        initialPageParam: undefined as undefined | string,
        getNextPageParam: lastPage => (lastPage?.hasMore ? lastPage?.cursor : undefined),
    });
};
