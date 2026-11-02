import { InfiniteData, QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet } from 'learn-card-base';
import { queueAiInsightCredentialRefresh } from './ai-passport';
import { getDeletedUrisForCredentialRecord, useDeleteCredentialRecord } from './mutations';
import { deleteCredentialFromAllContracts } from './pruneConsentFlowDeletedCredentials';
import { switchedProfileStore } from '../../stores/walletStore';
import { LCR } from '../../types/credential-records';
import { getRecordCategory } from './archiveCredentials';

const CONCURRENCY = 4;

type CredentialListPage = {
    cursor?: string;
    hasMore: boolean;
    records: LCR[];
};

export type BulkDeleteFailure = {
    record: LCR;
    error: Error;
};

export type BulkDeleteResult = {
    succeeded: LCR[];
    failed: BulkDeleteFailure[];
};

export type BulkDeleteInput = {
    records: LCR[];
    onProgress?: (completed: number, total: number) => void;
};

export const runBulkDelete = async (
    records: readonly LCR[],
    deleteRecord: (record: LCR) => Promise<void>,
    onProgress?: BulkDeleteInput['onProgress']
): Promise<BulkDeleteResult> => {
    const succeeded: LCR[] = [];
    const failed: BulkDeleteFailure[] = [];
    let next = 0;
    let completed = 0;
    const run = async (): Promise<void> => {
        while (next < records.length) {
            const record = records[next++];
            try {
                await deleteRecord(record);
                succeeded.push(record);
            } catch (error) {
                failed.push({
                    record,
                    error: error instanceof Error ? error : new Error(String(error)),
                });
            } finally {
                completed += 1;
                onProgress?.(completed, records.length);
            }
        }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, records.length) }, run));
    return { succeeded, failed };
};

export const runBulkDeleteWithCleanup = async (
    records: readonly LCR[],
    deleteRecord: (record: LCR) => Promise<void>,
    cleanup: (succeeded: readonly LCR[]) => Promise<void>,
    onProgress?: BulkDeleteInput['onProgress']
): Promise<BulkDeleteResult> => {
    const result = await runBulkDelete(records, deleteRecord, onProgress);
    if (result.succeeded.length) await cleanup(result.succeeded);
    return result;
};

const removeFromCredentialListCaches = (
    queryClient: QueryClient,
    did: string,
    records: LCR[]
): void => {
    const uris = new Set(records.map(record => record.uri));
    queryClient.setQueriesData<InfiniteData<CredentialListPage>>(
        { queryKey: ['useGetCredentialList', did] },
        current =>
            current
                ? {
                      ...current,
                      pages: current.pages.map(page => ({
                          ...page,
                          records: page.records.filter(record => !uris.has(record.uri)),
                      })),
                  }
                : current
    );
};

const restoreFailedCredentialListCaches = (
    queryClient: QueryClient,
    did: string,
    records: LCR[]
): void => {
    const byCategory = Map.groupBy(records, getRecordCategory);
    byCategory.forEach((categoryRecords, category) => {
        queryClient.setQueriesData<InfiniteData<CredentialListPage>>(
            { queryKey: ['useGetCredentialList', did, category] },
            current => {
                if (!current) return current;
                const present = new Set(
                    current.pages.flatMap(page => page.records.map(record => record.uri))
                );
                const additions = categoryRecords.filter(record => !present.has(record.uri));
                return additions.length
                    ? {
                          ...current,
                          pages: current.pages.map((page, index) =>
                              index === 0
                                  ? { ...page, records: [...additions, ...page.records] }
                                  : page
                          ),
                      }
                    : current;
            }
        );
    });
};

export const useBulkDeleteCredentialRecords = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();
    const deleteCredentialRecord = useDeleteCredentialRecord();

    return useMutation<BulkDeleteResult, Error, BulkDeleteInput, { did: string; records: LCR[] }>({
        mutationFn: async ({ records, onProgress }) => {
            const result = await runBulkDeleteWithCleanup(
                records,
                async record => {
                    await deleteCredentialRecord.mutateAsync({
                        ...record,
                        skipPostDeleteCleanup: true,
                    });
                },
                async succeeded => {
                    const wallet = await initWallet();
                    const deletedUris = succeeded.flatMap(getDeletedUrisForCredentialRecord);
                    await deleteCredentialFromAllContracts({ wallet, queryClient, deletedUris });
                    await queueAiInsightCredentialRefresh({ wallet, queryClient });
                },
                onProgress
            );
            return result;
        },
        onMutate: async ({ records }) => {
            const did = switchedProfileStore.get.switchedDid() ?? '';
            await queryClient.cancelQueries({ queryKey: ['useGetCredentialList', did] });
            removeFromCredentialListCaches(queryClient, did, records);
            return { did, records };
        },
        onSuccess: async (result, _, context) => {
            if (result.failed.length) {
                restoreFailedCredentialListCaches(
                    queryClient,
                    context?.did ?? switchedProfileStore.get.switchedDid() ?? '',
                    result.failed.map(({ record }) => record)
                );
            }
            const categories = new Set(
                context?.records.map(getRecordCategory) ?? result.succeeded.map(getRecordCategory)
            );
            await Promise.all([
                ...[...categories].flatMap(category => [
                    queryClient.invalidateQueries({
                        queryKey: ['useGetCredentialList', context?.did ?? '', category],
                    }),
                    queryClient.invalidateQueries({
                        queryKey: ['useGetCredentialCount', context?.did ?? '', category],
                    }),
                ]),
                queryClient.invalidateQueries({ queryKey: ['getChecklistCredentialCounts'] }),
            ]);
        },
        onError: (_, __, context) => {
            if (context)
                restoreFailedCredentialListCaches(queryClient, context.did, context.records);
        },
    });
};
