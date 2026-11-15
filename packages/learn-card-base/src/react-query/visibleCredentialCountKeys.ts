import type { QueryClient } from '@tanstack/react-query';

/** Shares the `useGetCredentialCount` prefix so every did-wide count invalidation reaches it. */
export const getVisibleCredentialCountKey = (
    profileDid: string,
    category: string,
    readerDid: string
) => ['useGetCredentialCount', profileDid, category, readerDid, 'visible'] as const;

/**
 * Refresh every Passport/Home count for a profile. Call it wherever an index write can change
 * what those counts show; category-scoped count invalidations do not reach the Home total.
 */
export const invalidateVisibleCredentialCounts = (queryClient: QueryClient, profileDid = '') =>
    queryClient.invalidateQueries({
        queryKey: ['useGetCredentialCount', profileDid],
        predicate: query => query.queryKey[4] === 'visible',
    });
