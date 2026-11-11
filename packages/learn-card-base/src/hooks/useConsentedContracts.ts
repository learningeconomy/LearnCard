import { useQuery, type QueryClient } from '@tanstack/react-query';
import { switchedProfileStore, walletStore } from '../stores/walletStore';
import type { BespokeLearnCard } from '../types/learn-card';
import { consentedContractsQueryOptions } from '../react-query/queries/consentedContracts';

export const useConsentedContracts = () => {
    const wallet = walletStore.use.wallet();
    const switchedDid = switchedProfileStore.use.switchedDid();
    const reader = switchedDid && wallet?.id.did() !== switchedDid ? null : wallet;
    return useQuery({
        ...consentedContractsQueryOptions(reader, switchedDid),
        enabled: Boolean(reader),
    });
};

/** Uses the same freshness window and in-flight request as the hook. */
export const getOrFetchConsentedContracts = (
    queryClient: QueryClient,
    learnCard: BespokeLearnCard
) =>
    queryClient.fetchQuery(
        consentedContractsQueryOptions(learnCard, switchedProfileStore.get.switchedDid())
    );
