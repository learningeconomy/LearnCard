import { useMemo, useSyncExternalStore } from 'react';
import { useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { CREDENTIAL_LIST_STALE_TIME, getCredentialListWalkedAt } from './vcQueries';
import type { LCR } from '../../types/credential-records';
import {
    UNCOUNTED_CATEGORY_VALUES,
    isCredentialCollectionRecordVisible,
} from '../../helpers/credentialCollection';
import {
    getCredentialVisibilityBackfillKey,
    isCredentialVisibilityBackfillComplete,
    loadCredentialIndexSnapshot,
    readCredentialVisibilityMarker,
    runCredentialIndexBackfills,
    subscribeCredentialVisibilityBackfill,
} from '../../helpers/credentialVisibilityBackfill';
import { walletStore, switchedProfileStore } from '../../stores/walletStore';
import { networkStore } from '../../stores/NetworkStore';
import { getVisibleCredentialCountKey } from '../visibleCredentialCountKeys';

export * from '../visibleCredentialCountKeys';

/**
 * Index query for the records Passport (one category) or Home (all) shows.
 *
 * Duplicate uri rows already in an index are counted once per row: the server only sees the
 * uri encrypted, so it can't dedupe. New duplicates are blocked when they're added (the
 * LearnCloud plugin's index.add), and the list walk still dedupes (LC-2413).
 */
export const getVisibleCredentialCountQuery = (category?: string) =>
    category
        ? { category, hidden: { $ne: true } }
        : { hidden: { $ne: true }, category: { $nin: [...UNCOUNTED_CATEGORY_VALUES] } };

type ListPage = { records?: LCR[]; hasMore?: boolean; walkedAt?: number };

/** What the list walk shows from these records: visible, first row per uri, then category. */
const countVisibleRecords = (records: LCR[], category?: string) => {
    const unique = new Map<string, LCR>();
    for (const record of records) {
        if (isCredentialCollectionRecordVisible(record) && !unique.has(record.uri))
            unique.set(record.uri, record);
    }
    let count = 0;
    for (const record of unique.values()) if (!category || record.category === category) count++;
    return count;
};

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
 * Passport/Home count from one index count request. The count only leaves internal records
 * out once the account's visibility backfill has marked them, so a device that hasn't seen
 * the backfill reads the LearnCloud marker alongside the counts (one batched request). With
 * no marker, the count comes from one read of the whole index, filtered on the client.
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
        // null: no device has finished the backfill yet, so this count can't be trusted.
        queryFn: async ({ signal }): Promise<number | null> => {
            if (!reader) throw new Error('Credential reader changed');
            const [count, trusted] = await Promise.all([
                reader.index.LearnCloud.getCount?.(
                    getVisibleCredentialCountQuery(category) as never
                ),
                readCredentialVisibilityMarker(reader, cloudUrl),
            ]);
            signal.throwIfAborted();
            if (!trusted) return null;
            // didkit can decrypt numbers as BigInt.
            const value = Number(count);
            if (!Number.isFinite(value)) throw new Error('Count unavailable');
            return value;
        },
        enabled: enabled && Boolean(reader),
        // Same freshness as the list walk; a count restored from an earlier launch revalidates once.
        staleTime: query =>
            query.state.dataUpdatedAt < performance.timeOrigin ? 0 : CREDENTIAL_LIST_STALE_TIME,
    });

    const needsSnapshot =
        !backfilled &&
        (countQuery.data === null || (countQuery.isError && countQuery.data === undefined));
    const snapshot = useQuery({
        // Under the count prefix, so every writer's count invalidation reaches it.
        queryKey: ['useGetCredentialCount', switchedDid ?? '', '', readerDid, 'index-snapshot'],
        queryFn: async () => {
            if (!reader) throw new Error('Credential reader changed');
            const records = await loadCredentialIndexSnapshot(reader);
            // Start the backfill here too, reusing this read: the app shell only starts it after
            // an auth coordinator sign-in, so other sign-ins would never write the marker.
            void runCredentialIndexBackfills(reader, queryClient, cloudUrl);
            return records;
        },
        enabled: enabled && Boolean(reader) && needsSnapshot,
        staleTime: CREDENTIAL_LIST_STALE_TIME,
    });
    const snapshotCount = useMemo(
        () => (snapshot.data ? countVisibleRecords(snapshot.data, category) : null),
        [snapshot.data, category]
    );

    if (backfilled) {
        // Right after the backfill finishes, keep the earlier number until the count lands.
        const count =
            countQuery.data ??
            snapshotCount ??
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
        count: snapshotCount,
        loading: enabled && snapshotCount === null && !snapshot.isError,
        unavailable: snapshotCount === null && snapshot.isError,
        isError: snapshot.isError,
        isFetching: countQuery.isFetching || snapshot.isFetching,
        retry: () =>
            needsSnapshot
                ? snapshot.refetch({ cancelRefetch: false })
                : countQuery.refetch({ cancelRefetch: false }),
        source: 'walk',
    };
};
