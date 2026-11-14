import { useMemo, useSyncExternalStore } from 'react';
import { useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useCredentialCollection } from './useCredentialCollection';
import { CREDENTIAL_LIST_STALE_TIME, getCredentialListWalkedAt } from './vcQueries';
import type { LCR } from '../../types/credential-records';
import {
    UNCOUNTED_CATEGORY_VALUES,
    isCredentialCollectionRecordVisible,
} from '../../helpers/credentialCollection';
import {
    getCredentialVisibilityBackfillKey,
    isCredentialVisibilityBackfillComplete,
    subscribeCredentialVisibilityBackfill,
} from '../../helpers/credentialVisibilityBackfill';
import { walletStore, switchedProfileStore } from '../../stores/walletStore';
import { networkStore } from '../../stores/NetworkStore';
import { getVisibleCredentialCountKey } from '../visibleCredentialCountKeys';

export * from '../visibleCredentialCountKeys';

/** Index query for the records Passport (one category) or Home (all) shows. */
export const getVisibleCredentialCountQuery = (category?: string) =>
    category
        ? { category, hidden: { $ne: true } }
        : { hidden: { $ne: true }, category: { $nin: [...UNCOUNTED_CATEGORY_VALUES] } };

type ListPage = { records?: LCR[]; hasMore?: boolean; walkedAt?: number };

/** Count from a finished server walk already in the cache, or null. */
const countFinishedWalk = (data: InfiniteData<ListPage> | undefined, category?: string) => {
    const pages = Array.isArray(data?.pages) ? data.pages : [];
    if (!pages.length || pages.at(-1)?.hasMore || getCredentialListWalkedAt(data) === undefined)
        return null;
    const uris = new Set<string>();
    for (const page of pages) {
        for (const record of page?.records ?? []) {
            if (
                isCredentialCollectionRecordVisible(record) &&
                (!category || record.category === category)
            )
                uris.add(record.uri);
        }
    }
    return uris.size;
};

export type VisibleCredentialCount = {
    /** Last known count, kept through refetches and failed refreshes (LC-2412). */
    count: number | null;
    /** No count yet and one is on the way. */
    loading: boolean;
    /** No count, and the last attempt failed: show the unavailable state. */
    unavailable: boolean;
    /** The last attempt failed, even if a count is still shown. */
    isError: boolean;
    isFetching: boolean;
    retry: () => Promise<unknown>;
    source: 'count' | 'walk';
};

/**
 * Passport/Home count from one index count request. Until this account's visibility
 * backfill has marked internal records `hidden`, the count endpoint cannot leave them out,
 * so the count falls back to the full list walk (which filters on the client).
 */
export const useVisibleCredentialCount = (
    category?: string,
    options: { enabled?: boolean } = {}
): VisibleCredentialCount => {
    const enabled = options.enabled !== false;
    const queryClient = useQueryClient();
    const wallet = walletStore.use.wallet();
    const switchedDid = switchedProfileStore.use.switchedDid();
    const cloudUrl = networkStore.use.cloudUrl();
    const reader = switchedDid && wallet?.id.did() !== switchedDid ? null : wallet;
    const readerDid = reader?.id.did() ?? '';
    const backfillKey = getCredentialVisibilityBackfillKey(readerDid, cloudUrl);
    const backfilled = useSyncExternalStore(
        subscribeCredentialVisibilityBackfill,
        () => Boolean(readerDid) && isCredentialVisibilityBackfillComplete(backfillKey),
        () => false
    );

    const countQuery = useQuery({
        queryKey: getVisibleCredentialCountKey(switchedDid ?? '', category ?? '', readerDid),
        queryFn: async ({ signal }) => {
            if (!reader) throw new Error('Credential reader changed');
            const count = await reader.index.LearnCloud.getCount?.(
                getVisibleCredentialCountQuery(category) as never
            );
            signal.throwIfAborted();
            // didkit can decrypt numbers as BigInt.
            const value = Number(count);
            if (!Number.isFinite(value)) throw new Error('Count unavailable');
            return value;
        },
        enabled: enabled && backfilled && Boolean(reader),
        // Same freshness as the list walk; a count restored from an earlier launch revalidates once.
        staleTime: query =>
            query.state.dataUpdatedAt < performance.timeOrigin ? 0 : CREDENTIAL_LIST_STALE_TIME,
    });

    const walk = useCredentialCollection(undefined, {
        mode: 'complete',
        enabled: enabled && !backfilled,
    });

    const walkCount = useMemo(() => {
        if (!walk.isComplete) return null;
        return category
            ? walk.records.filter(record => record.category === category).length
            : walk.records.length;
    }, [walk.isComplete, walk.records, category]);

    if (backfilled) {
        // Right after the backfill finishes, keep the walk's number until the count lands.
        const count =
            countQuery.data ??
            countFinishedWalk(
                queryClient.getQueryData<InfiniteData<ListPage>>([
                    'useGetCredentialList',
                    switchedDid ?? '',
                    '',
                    readerDid,
                ]),
                category
            );
        return {
            count,
            loading: enabled && count === null && !countQuery.isError,
            unavailable: count === null && countQuery.isError,
            isError: countQuery.isError,
            isFetching: countQuery.isFetching,
            retry: () => countQuery.refetch({ cancelRefetch: false }),
            source: 'count',
        };
    }
    return {
        count: walkCount,
        loading: enabled && walkCount === null && !walk.isError,
        unavailable: walkCount === null && walk.isError,
        isError: walk.isError,
        isFetching: walk.isFetching,
        retry: walk.retry,
        source: 'walk',
    };
};
