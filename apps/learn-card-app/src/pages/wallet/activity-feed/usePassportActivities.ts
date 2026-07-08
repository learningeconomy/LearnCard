import { useInfiniteQuery } from '@tanstack/react-query';
import { useWallet } from 'learn-card-base';
import type { CredentialActivityEventType } from '@learncard/types';

export type PassportActivityFilters = {
    eventType?: CredentialActivityEventType;
    boostUri?: string;
};

const PAGE_SIZE = 25;

export const usePassportActivities = (filters: PassportActivityFilters = {}) => {
    const { initWallet } = useWallet();
    return useInfiniteQuery({
        queryKey: ['passportActivities', filters],
        queryFn: async ({ pageParam }) => {
            const wallet = await initWallet();
            return wallet.invoke.getMyActivities({
                limit: PAGE_SIZE,
                cursor: pageParam,
                // Collapse each credential's event chain (created → delivered →
                // claimed …) to a single row at its latest status, so the feed is
                // one entry per credential rather than one per lifecycle event.
                groupByLatestStatus: true,
                ...filters,
            });
        },
        initialPageParam: undefined as undefined | string,
        getNextPageParam: lastPage => (lastPage?.hasMore ? lastPage?.cursor : undefined),
    });
};
