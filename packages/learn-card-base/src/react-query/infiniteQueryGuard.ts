import type { InfiniteData, QueryClient, QueryKey } from '@tanstack/react-query';
import { getLogger } from '../logging/logger';

const log = getLogger('infinite-query-guard');

/**
 * React Query's infinite observer reads `data.pages` and `data.pageParams` directly (via
 * hasNextPage → getNextPageParam → pages.length), so a truthy entry without them throws on
 * mount. Seen in persisted caches (LC-2330 credential list; LC-2352 managed boosts / passport).
 */
export const isInfiniteData = <TData = unknown>(data: unknown): data is InfiniteData<TData> =>
    Array.isArray((data as Partial<InfiniteData<TData>> | undefined)?.pages) &&
    Array.isArray((data as Partial<InfiniteData<TData>> | undefined)?.pageParams);

/**
 * Query-key roots that use `useInfiniteQuery` and may be restored from the persister.
 * Keep this list complete: restore sanitization only touches these roots (raw credentials and
 * other docs can carry a top-level `pages` extension and must not be dropped).
 */
export const INFINITE_QUERY_KEY_ROOTS: ReadonlySet<string> = new Set([
    'useGetCredentialList',
    'useGetPaginatedManagedBoosts',
    'useGetPaginatedManagedBoostsQuery',
    'useGetUserNotifications',
    'paginatedBoostRecipients',
    'paginatedConnections',
    'paginatedPendingConnections',
    'paginatedConnectionRequests',
    'getSkillChildrenInfinite',
    'useGetPaginatedBoostChildren',
    'useGetPaginatedFamilialBoosts',
    'useTermsTransactions',
    'useXApiStatements',
    'useXApiStatementsForContract',
    'passportActivities',
    'campaign-list',
    'campaign-audience',
    'getMyActivities',
    'useNetworkMembers',
]);

export const isKnownInfiniteQueryKey = (queryKey: QueryKey): boolean => {
    const root = queryKey[0];
    return typeof root === 'string' && INFINITE_QUERY_KEY_ROOTS.has(root);
};

/**
 * Drop only when this entry is a known infinite-query key and isn't valid InfiniteData.
 * Unknown keys are left alone even if their payload has `pages` / `pageParams` (e.g. a raw
 * credential document with a top-level `pages` extension).
 */
export const shouldDropMalformedInfiniteEntry = (queryKey: QueryKey, data: unknown): boolean => {
    if (data === undefined) return false;
    if (!isKnownInfiniteQueryKey(queryKey)) return false;
    return !isInfiniteData(data);
};

/**
 * Drop a malformed infinite-query cache entry before the observer reads it.
 * Call from every `useInfiniteQuery` hook (runs each render so a late restore is caught).
 * Returns true when an entry was removed.
 */
export const dropMalformedInfiniteCacheEntry = (
    queryClient: QueryClient,
    queryKey: QueryKey,
    label = String(queryKey[0] ?? 'infinite-query')
): boolean => {
    const cached = queryClient.getQueryData(queryKey);
    if (cached === undefined || isInfiniteData(cached)) return false;
    log.warn(`Dropping malformed ${label} cache entry`, queryKey);
    queryClient.removeQueries({ queryKey, exact: true });
    return true;
};

export type PersistableQueryEntry = {
    queryKey: QueryKey;
    state: { data?: unknown };
};

/**
 * Strip malformed infinite-query entries from a dehydrate/restore snapshot before hydrate.
 * Shared restore-boundary guard so a bad managed-boosts (or similar) entry never reaches
 * createResult, even before the owning hook mounts.
 */
export const filterMalformedInfiniteQueries = <T extends PersistableQueryEntry>(
    queries: T[]
): T[] =>
    queries.filter(query => {
        if (!shouldDropMalformedInfiniteEntry(query.queryKey, query.state.data)) return true;
        log.warn('Dropping malformed persisted infinite-query cache entry', query.queryKey);
        return false;
    });

export const sanitizePersistedQueries = <
    T extends { clientState: { queries: PersistableQueryEntry[] } },
>(
    snapshot: T
): T => ({
    ...snapshot,
    clientState: {
        ...snapshot.clientState,
        queries: filterMalformedInfiniteQueries(snapshot.clientState.queries),
    },
});
