import { useInfiniteQuery } from '@tanstack/react-query';
import useWallet from './useWallet';

export const useTermsTransactions = (uri?: string) => {
    const { initWallet } = useWallet();

    return useInfiniteQuery({
        queryKey: ['useTermsTransactions', uri],
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
