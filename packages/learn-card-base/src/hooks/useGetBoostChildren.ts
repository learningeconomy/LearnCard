import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useIsLoggedIn, useWallet } from 'learn-card-base';
import { BoostQuery } from '@learncard/types';

export const useGetBoostChildren = (
    uri: string | undefined,
    numberOfGenerations: number = 1, // i.e. 2 for the grandchildren, must be > 0
    query?: BoostQuery | undefined,
    enabled = true
) => {
    const isLoggedIn = useIsLoggedIn();
    const { initWallet } = useWallet();

    return useQuery<any | undefined>({
        queryKey: ['useGetBoostChildren', uri!, query!, numberOfGenerations],
        queryFn: async () => {
            if (!uri) return;

            try {
                const wallet = isLoggedIn ? await initWallet() : await initWallet('a'.repeat(64));

                const deets = await wallet.invoke.getBoostChildren(uri, {
                    query: query,
                    numberOfGenerations,
                    limit: 10,
                });

                return deets;
            } catch (error) {
                return Promise.reject(error);
            }
        },
        enabled: enabled && Boolean(uri),
    });
};

export const useGetPaginatedBoostChildren = (
    uri: string,
    numberOfGenerations: number = 1, // i.e. 2 for the grandchildren, must be > 0
    query?: BoostQuery | undefined,
    enabled: boolean = true
) => {
    const { initWallet } = useWallet();

    return useInfiniteQuery({
        queryKey: ['useGetPaginatedBoostChildren', uri, numberOfGenerations, query],
        queryFn: async ({ pageParam }) => {
            const wallet = await initWallet();

            const data = await wallet.invoke.getBoostChildren(uri, {
                query: query,
                numberOfGenerations,
                limit: 10,
                cursor: pageParam,
            });

            return data;
        },
        initialPageParam: undefined as undefined | string,
        getNextPageParam: lastPage => (lastPage?.hasMore ? lastPage?.cursor : undefined),
        enabled,
    });
};
