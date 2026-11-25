import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { dropMalformedInfiniteCacheEntry } from '../react-query/infiniteQueryGuard';
import { useIsLoggedIn, useWallet } from 'learn-card-base';
import { BoostQuery } from '@learncard/types';
import { CredentialCategoryEnum } from 'learn-card-base';

export const useGetFamilialBoosts = (
    uri: string | undefined,
    parentGenerations: number = 1, // i.e. 2 for the grandchildren, must be > 0
    childGenerations: number = 1,
    query?: BoostQuery | undefined,
    enabled = true
) => {
    const isLoggedIn = useIsLoggedIn();
    const { initWallet } = useWallet();

    return useQuery<any | undefined>({
        queryKey: ['useGetFamilialBoosts', uri!, query!, parentGenerations, childGenerations],
        queryFn: async () => {
            if (!uri) return;

            try {
                const wallet = isLoggedIn ? await initWallet() : await initWallet('a'.repeat(64));

                const deets = await wallet.invoke.getFamilialBoosts(uri, {
                    query: query,
                    parentGenerations,
                    childGenerations,
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

export const useGetPaginatedFamilialBoosts = (
    uri: string | undefined,
    parentGenerations: number = 1, // i.e. 2 for the grandchildren, must be > 0
    childGenerations: number = 1,
    query: BoostQuery | undefined,
    category: CredentialCategoryEnum,
    includeExtendedFamily: boolean = false,
    enabled = true
) => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();
    const queryKey = [
        'useGetPaginatedFamilialBoosts',
        uri,
        query,
        parentGenerations,
        childGenerations,
        category,
        includeExtendedFamily,
    ] as const;
    dropMalformedInfiniteCacheEntry(queryClient, queryKey, 'useGetPaginatedFamilialBoosts');

    return useInfiniteQuery({
        queryKey,
        queryFn: async ({ pageParam }) => {
            const wallet = await initWallet();

            const data = await wallet.invoke.getFamilialBoosts(uri, {
                query,
                parentGenerations,
                childGenerations,
                limit: 10,
                cursor: pageParam,
                includeExtendedFamily,
            });

            return data;
        },
        initialPageParam: undefined as undefined | string,
        getNextPageParam: lastPage => (lastPage?.hasMore ? lastPage?.cursor : undefined),
        enabled,
    });
};
