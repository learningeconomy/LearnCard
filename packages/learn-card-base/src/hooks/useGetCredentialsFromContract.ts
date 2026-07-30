import { useQueries, useQuery } from '@tanstack/react-query';
import { switchedProfileStore, useWallet } from 'learn-card-base';
import { LCR } from 'learn-card-base/types/credential-records';

export interface UseGetCredentialsFromContractsResult {
    data: LCR[] | undefined;
    isFetching: boolean;
    isLoading: boolean;
}

// Gets all Earned credentials that were issued by a contract
export const useGetCredentialsFromContract = (uri: string | undefined, enabled = true) => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();

    return useQuery<LCR[] | undefined>({
        queryKey: ['useGetCredentialsFromContract', uri!, switchedDid ?? ''],
        queryFn: async () => {
            if (!uri) return;

            try {
                const wallet = await initWallet();

                const contractCreds = (await wallet.index.LearnCloud.get({
                    contractUri: uri,
                })) as LCR[];

                return contractCreds;
            } catch (error) {
                return Promise.reject(error);
            }
        },
        enabled: enabled && Boolean(uri),
    });
};

// Gets all Earned credentials that were issued by one or more contracts
export const useGetCredentialsFromContracts = (
    uris: string[] | undefined,
    enabled = true
): UseGetCredentialsFromContractsResult => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();
    const contractUris = [
        ...new Set(
            (uris ?? []).filter(
                (value): value is string => typeof value === 'string' && value.length > 0
            )
        ),
    ];

    const queries = useQueries({
        queries: contractUris.map(uri => ({
            queryKey: ['useGetCredentialsFromContract', uri, switchedDid ?? ''],
            queryFn: async () => {
                const wallet = await initWallet();

                const contractCreds = (await wallet.index.LearnCloud.get({
                    contractUri: uri,
                })) as LCR[];

                return contractCreds;
            },
            enabled: enabled && Boolean(uri),
        })),
    });
    const isLoading = queries.some(query => query.isLoading);
    const isFetching = queries.some(query => query.isFetching);
    const seenUris = new Set<string>();
    const data = isLoading
        ? undefined
        : queries
              .flatMap(query => query.data ?? [])
              .filter(record => {
                  if (!record.uri) return true;
                  if (seenUris.has(record.uri)) return false;

                  seenUris.add(record.uri);

                  return true;
              });

    return { data, isFetching, isLoading };
};
