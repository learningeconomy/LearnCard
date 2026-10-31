import { InfiniteData, QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet } from 'learn-card-base';
import { switchedProfileStore } from '../../stores/walletStore';
import {
    ARCHIVED_CATEGORY,
    CredentialListCategory,
    CredentialMetadata,
    LCR,
} from '../../types/credential-records';
import { CredentialCategory } from '../../types/credentials';

const CONCURRENCY = 4;

type CredentialListPage = {
    cursor?: string;
    hasMore: boolean;
    records: LCR[];
};

type CacheTransition = {
    record: LCR;
    from: CredentialListCategory;
    to: CredentialListCategory;
    replacement: LCR;
};

type CategoryMutationContext = {
    did: string;
    transitions: CacheTransition[];
};

export type CredentialMutationFailure = {
    record: LCR;
    error: Error;
};

export type CredentialRecordsMutationResult = {
    succeeded: LCR[];
    failed: CredentialMutationFailure[];
};

type CredentialMutationOutcome = { record: LCR } | CredentialMutationFailure;

const cacheKeyFor = (did: string, category: CredentialListCategory) => [
    'useGetCredentialList',
    did,
    category,
];

const replaceRecordCategory = (
    record: LCR,
    category: CredentialListCategory,
    archive: CredentialMetadata['archive']
): LCR => ({
    ...record,
    category,
    categorySource: 'manual',
    archive,
});

export const getRecordCategory = (record: LCR): CredentialListCategory =>
    record.metadata?.category ?? record.category;

export const toArchivedRecord = (record: LCR, archivedAt = new Date().toISOString()): LCR => {
    const category = getRecordCategory(record);
    if (category === ARCHIVED_CATEGORY) return record;

    return replaceRecordCategory(record, ARCHIVED_CATEGORY, {
        fromCategory: category,
        ...(record.categorySource ? { fromCategorySource: record.categorySource } : {}),
        archivedAt,
    });
};

export const toRestoredRecord = (record: LCR): LCR | undefined => {
    const archive = record.archive;
    if (!archive) return undefined;

    return {
        ...record,
        category: archive.fromCategory,
        ...(archive.fromCategorySource ? { categorySource: archive.fromCategorySource } : {}),
        ...(!archive.fromCategorySource ? { categorySource: undefined } : {}),
        archive: null,
    };
};

/** Updates every loaded page so list caches stay coherent while a category moves. */
export const moveCredentialRecordsInCache = (
    queryClient: QueryClient,
    did: string,
    transitions: CacheTransition[]
): void => {
    const bySource = new Map<CredentialListCategory, CacheTransition[]>();
    const byDestination = new Map<CredentialListCategory, CacheTransition[]>();

    transitions.forEach(transition => {
        bySource.set(transition.from, [...(bySource.get(transition.from) ?? []), transition]);
        byDestination.set(transition.to, [...(byDestination.get(transition.to) ?? []), transition]);
    });

    bySource.forEach((sourceTransitions, category) => {
        queryClient.setQueriesData<InfiniteData<CredentialListPage>>(
            { queryKey: cacheKeyFor(did, category) },
            current => {
                if (!current) return current;
                const movedUris = new Set(
                    sourceTransitions.map(transition => transition.record.uri)
                );
                return {
                    ...current,
                    pages: current.pages.map(page => ({
                        ...page,
                        records: page.records.filter(record => !movedUris.has(record.uri)),
                    })),
                };
            }
        );
    });

    byDestination.forEach((destinationTransitions, category) => {
        queryClient.setQueriesData<InfiniteData<CredentialListPage>>(
            { queryKey: cacheKeyFor(did, category) },
            current => {
                if (!current) return current;
                const existingUris = new Set(
                    current.pages.flatMap(page => page.records.map(record => record.uri))
                );
                const additions = destinationTransitions
                    .map(transition => transition.replacement)
                    .filter(record => !existingUris.has(record.uri));
                if (!additions.length) return current;
                return {
                    ...current,
                    pages: current.pages.map((page, index) =>
                        index === 0 ? { ...page, records: [...additions, ...page.records] } : page
                    ),
                };
            }
        );
    });
};

const mapWithConcurrency = async <T, R>(
    items: readonly T[],
    worker: (item: T) => Promise<R>
): Promise<R[]> => {
    const results = new Array<R>(items.length);
    let next = 0;
    const run = async (): Promise<void> => {
        while (next < items.length) {
            const index = next++;
            results[index] = await worker(items[index]);
        }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, run));
    return results;
};

const invalidateCredentialCaches = (
    queryClient: QueryClient,
    did: string,
    records: LCR[],
    categories: CredentialListCategory[]
): Promise<unknown[]> =>
    Promise.all(
        [...new Set(categories).values()]
            .flatMap(category => [
                queryClient.invalidateQueries({
                    queryKey: ['useGetCredentialList', did, category],
                }),
                queryClient.invalidateQueries({ queryKey: ['useGetCredentials', did, category] }),
                queryClient.invalidateQueries({
                    queryKey: ['useGetCredentialCount', did, category],
                }),
            ])
            .concat(
                records.map(record =>
                    queryClient.invalidateQueries({
                        queryKey: ['useGetRecordForUri', did, record.uri],
                    })
                )
            )
    );

const createCategoryMutation = (
    transform: (record: LCR) => LCR | undefined,
    getDestination: (record: LCR) => CredentialListCategory
) => {
    return () => {
        const { initWallet } = useWallet();
        const queryClient = useQueryClient();

        return useMutation<CredentialRecordsMutationResult, Error, LCR[], CategoryMutationContext>({
            mutationFn: async records => {
                const wallet = await initWallet();
                const results = await mapWithConcurrency<LCR, CredentialMutationOutcome>(
                    records,
                    async record => {
                        const replacement = transform(record);
                        if (!replacement) {
                            return {
                                record,
                                error: new Error(
                                    'This credential cannot be restored because its archive data is missing.'
                                ),
                            };
                        }
                        try {
                            await wallet.index.LearnCloud.update(record.id, {
                                category: replacement.category,
                                categorySource: replacement.categorySource,
                                archive: replacement.archive,
                            });
                            return { record };
                        } catch (error) {
                            return {
                                record,
                                error: error instanceof Error ? error : new Error(String(error)),
                            };
                        }
                    }
                );
                await wallet.cache.flushIndex();

                const failed = results.filter(
                    (result): result is CredentialMutationFailure => 'error' in result
                );
                return {
                    succeeded: results
                        .filter((result): result is { record: LCR } => !('error' in result))
                        .map(result => result.record),
                    failed,
                };
            },
            onMutate: async records => {
                const did = switchedProfileStore.get.switchedDid() ?? '';
                const transitions = records.flatMap(record => {
                    const replacement = transform(record);
                    return replacement
                        ? [
                              {
                                  record,
                                  replacement,
                                  from: getRecordCategory(record),
                                  to: getDestination(replacement),
                              },
                          ]
                        : [];
                });
                await Promise.all(
                    [...new Set(transitions.flatMap(({ from, to }) => [from, to]))].map(category =>
                        queryClient.cancelQueries({ queryKey: cacheKeyFor(did, category) })
                    )
                );
                moveCredentialRecordsInCache(queryClient, did, transitions);
                return { did, transitions };
            },
            onSuccess: async (result, records, context) => {
                if (context && result.failed.length) {
                    const failedUris = new Set(result.failed.map(({ record }) => record.uri));
                    const failedTransitions = context.transitions
                        .filter(transition => failedUris.has(transition.record.uri))
                        .map(transition => ({
                            record: transition.replacement,
                            replacement: transition.record,
                            from: transition.to,
                            to: transition.from,
                        }));
                    moveCredentialRecordsInCache(queryClient, context.did, failedTransitions);
                }
                const categories = records.flatMap(record => [
                    getRecordCategory(record),
                    getDestination(record),
                ]);
                await invalidateCredentialCaches(
                    queryClient,
                    context?.did ?? switchedProfileStore.get.switchedDid() ?? '',
                    records,
                    categories
                );
            },
        });
    };
};

export const useArchiveCredentialRecords = createCategoryMutation(
    record => toArchivedRecord(record),
    () => ARCHIVED_CATEGORY
);

export const useRestoreCredentialRecords = createCategoryMutation(
    toRestoredRecord,
    record => getRecordCategory(record) as CredentialCategory
);
