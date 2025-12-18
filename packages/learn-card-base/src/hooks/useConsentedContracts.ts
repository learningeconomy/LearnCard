import { useQuery, QueryClient } from '@tanstack/react-query';
import { switchedProfileStore, useWallet } from 'learn-card-base';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { PaginatedConsentFlowTerms } from '@learncard/types';

export const useConsentedContracts = () => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();

    return useQuery({
        queryKey: ['useConsentedContracts', switchedDid ?? ''],
        queryFn: async () => {
            const wallet = await initWallet();

            let result = await wallet.invoke.getConsentedContracts();

            const contracts = [...result.records];

            while (result.hasMore) {
                result = await wallet.invoke.getConsentedContracts({ cursor: result.cursor });

                contracts.push(...result.records);
            }

            return contracts;
        },
    });
};

// Helper to get consented contracts from cache or fetch manually and cache result
export const getOrFetchConsentedContracts = async (
    queryClient: QueryClient,
    learnCard: BespokeLearnCard
) => {
    const queryKey = ['useConsentedContracts', switchedProfileStore.get.switchedDid() ?? ''];
    return queryClient.fetchQuery<PaginatedConsentFlowTerms['records']>({
        queryKey,
        queryFn: async () => {
            let result = await learnCard.invoke.getConsentedContracts();

            const contracts = [...result.records];

            while (result.hasMore) {
                result = await learnCard.invoke.getConsentedContracts({ cursor: result.cursor });

                contracts.push(...result.records);
            }

            return contracts;
        },
    });
};
