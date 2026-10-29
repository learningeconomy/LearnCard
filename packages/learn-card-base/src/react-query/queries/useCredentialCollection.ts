import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueries, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { useGetCredentialList } from './vcQueries';
import { resolvedCredentialQueryOptions } from './credentialResolution';
import type { CredentialCategory } from '../../types/credentials';
import type { LCR } from '../../types/credential-records';
import type { VC } from '@learncard/types';
import { getCredentialName } from '../../helpers/credentialHelpers';
import { isCredentialCollectionRecordVisible } from '../../helpers/credentialCollection';
import { walletStore, switchedProfileStore } from '../../stores/walletStore';

export type CredentialCollectionMode = 'browse' | 'search' | 'complete' | 'recent';
export type CredentialCollectionOptions = {
    mode?: CredentialCollectionMode;
    search?: string;
    limit?: number;
    enabled?: boolean;
};

/**
 * Progress over the existing account-scoped index query, not a second collection cache.
 * Totals use metadata only. Legacy records without an indexed title resolve through the
 * shared document cache, at most four at a time. Unmount/search changes stop scheduling;
 * already-running shared reads may finish and warm that account's cache.
 */
export const useCredentialCollection = (
    category?: CredentialCategory | 'Hidden',
    options: CredentialCollectionOptions = {}
) => {
    const mode = options.mode ?? 'browse';
    const client = useQueryClient();
    const wallet = walletStore.use.wallet();
    const switchedDid = switchedProfileStore.use.switchedDid();
    const reader =
        options.enabled === false || (switchedDid && wallet?.id.did() !== switchedDid)
            ? null
            : wallet;
    // Metadata may be completed by a count consumer; that must not mount every card.
    const scope = JSON.stringify([reader?.id.did(), category]);
    const [browseWindow, setBrowseWindow] = useState({ scope, limit: 12 });
    const browseLimit = browseWindow.scope === scope ? browseWindow.limit : 12;
    const query = useGetCredentialList(
        category as CredentialCategory | undefined,
        options.enabled !== false
    );
    const { data, isFetching, isError, hasNextPage, fetchNextPage, refetch } = query;
    const records = useMemo(() => {
        if (!reader) return [];
        const unique = new Map<string, LCR>();
        for (const page of data?.pages ?? []) {
            for (const record of page?.records ?? []) {
                const visible =
                    category === 'Hidden'
                        ? String(record.category) === 'Hidden' &&
                          !record.id?.startsWith('__verifiable_data_')
                        : isCredentialCollectionRecordVisible(record);
                if (visible && record.uri && !unique.has(record.uri))
                    unique.set(record.uri, record);
            }
        }
        return [...unique.values()];
    }, [data, category, reader]);
    const visibleRecords = useMemo(
        () => (mode === 'browse' ? records.slice(0, browseLimit) : records),
        [mode, records, browseLimit]
    );
    const hasBufferedRecords = mode === 'browse' && browseLimit < records.length;
    const needle = mode === 'search' ? (options.search?.trim().toLowerCase() ?? '') : '';
    const legacy = useMemo(
        () => (needle ? records.filter(record => !record.title?.trim()) : []),
        [records, needle]
    );
    const resolutionOptions = legacy.map(record =>
        resolvedCredentialQueryOptions(reader, record.uri, false)
    );
    const failedResolution = resolutionOptions.some(
        option => client.getQueryState(option.queryKey)?.status === 'error'
    );
    const active = new Set(
        resolutionOptions
            .filter(option => {
                const state = client.getQueryState(option.queryKey);
                return !state?.data && state?.status !== 'error';
            })
            .slice(0, 4)
            .map(option => option.queryKey[1])
    );
    const resolutions: UseQueryResult<VC>[] = useQueries({
        queries: resolutionOptions.map(option => ({
            ...option,
            enabled: Boolean(reader) && !failedResolution && active.has(option.queryKey[1]),
        })),
    });
    const contentError = resolutions.find(result => result.isError)?.error;
    const resolving = resolutions.some(result => !result.data && !result.isError);
    const fetchingContents = resolutions.some(result => result.isFetching);
    const names = Object.fromEntries(
        legacy.map((record, index) => [
            record.uri,
            resolutions[index]?.data ? getCredentialName(resolutions[index].data!) : '',
        ])
    );
    const matches = needle
        ? records.filter(record =>
              (record.title || names[record.uri] || '').toLowerCase().includes(needle)
          )
        : visibleRecords;
    const complete = Boolean(
        reader && data?.pages.length && !hasNextPage && !isFetching && !isError
    );
    const load = useCallback(() => {
        if (reader && hasNextPage && !isFetching && !isError)
            return fetchNextPage({ cancelRefetch: false });
    }, [reader, hasNextPage, isFetching, isError, fetchNextPage]);
    const continueCollection = useCallback(() => {
        if (mode === 'browse') {
            if (!reader || isError) return;
            if (browseLimit < records.length || (hasNextPage && records.length > 0)) {
                setBrowseWindow({ scope, limit: browseLimit + 12 });
            }
        }
        return load();
    }, [mode, reader, isError, browseLimit, records.length, hasNextPage, scope, load]);
    useEffect(() => {
        const shouldContinue =
            mode === 'complete' ||
            mode === 'search' ||
            (mode === 'recent' && records.length < (options.limit ?? 5));
        if (shouldContinue && !contentError) void load();
    }, [mode, records.length, options.limit, contentError, load]);
    const retry = useCallback(async () => {
        if (isError) {
            if (data?.pages.length && query.isFetchNextPageError)
                await fetchNextPage({ cancelRefetch: false });
            else await refetch({ cancelRefetch: false });
        }
        await Promise.all(
            resolutionOptions
                .filter(option => client.getQueryState(option.queryKey)?.status === 'error')
                .map(option => client.resetQueries({ queryKey: option.queryKey, exact: true }))
        );
    }, [
        client,
        isError,
        data,
        query.isFetchNextPageError,
        fetchNextPage,
        refetch,
        resolutionOptions,
    ]);
    return {
        records: visibleRecords,
        matches,
        isComplete: complete && !resolving && !contentError && !hasBufferedRecords,
        isPending: query.isPending,
        isFetching:
            (isFetching && (mode !== 'browse' || records.length < browseLimit)) || fetchingContents,
        isError: isError || Boolean(contentError),
        error: query.error || contentError,
        hasNextPage: Boolean(hasNextPage || hasBufferedRecords),
        hasNextIndexPage: Boolean(hasNextPage),
        fetchNextPage: continueCollection,
        retry,
    };
};
