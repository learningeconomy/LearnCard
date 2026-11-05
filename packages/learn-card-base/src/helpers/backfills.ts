import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import type { VC } from '@learncard/types';
import type { LCR } from '../types/credential-records';
import type { BespokeLearnCard } from '../types/learn-card';

/** Backfill only documents already opened; collection scans must remain metadata-only. */
export const backfillResolvedCredentialRecord = async (
    queryClient: QueryClient,
    wallet: BespokeLearnCard,
    uri: string,
    credential: VC
): Promise<void> => {
    const accountDid = wallet.id.did();
    const queries = queryClient.getQueriesData<InfiniteData<{ records: LCR[] }>>({
        queryKey: ['useGetCredentialList'],
        predicate: query => query.queryKey[3] === accountDid,
    });
    const records = new Map<string, LCR>();
    for (const [, data] of queries) {
        for (const page of data?.pages ?? []) {
            for (const record of page.records) {
                if (record.uri === uri && record.id && !record.boostUri && !record.__v) {
                    records.set(record.id, record);
                }
            }
        }
    }
    const metadata = { ...(credential.boostId && { boostUri: credential.boostId }), __v: 1 };
    for (const record of records.values()) {
        await wallet.index.LearnCloud.update(record.id, metadata);
        queryClient.setQueriesData<InfiniteData<{ records: LCR[] }>>(
            {
                queryKey: ['useGetCredentialList'],
                predicate: query => query.queryKey[3] === accountDid,
            },
            data =>
                data && {
                    ...data,
                    pages: data.pages.map(page => ({
                        ...page,
                        records: page.records.map(row =>
                            row.id === record.id ? { ...row, ...metadata } : row
                        ),
                    })),
                }
        );
    }
};
