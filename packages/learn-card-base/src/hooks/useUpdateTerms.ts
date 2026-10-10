import { ConsentFlowTerms, ConsentFlowContractDetails } from '@learncard/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { switchedProfileStore, useWallet } from 'learn-card-base';
import { getTermsWithSharedUrisForWallet } from './useSharedUrisInTerms';
import { loadContractAudience } from './consentAudience';
import { useConsentAudienceReview } from './useConsentAudienceReview';

export const useUpdateTerms = (
    termsUri: string,
    _contractOwnerDid: string,
    contractUri?: string
) => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    const reviewAudience = useConsentAudienceReview();

    return useMutation({
        mutationFn: async (_terms: {
            terms: ConsentFlowTerms;
            expiresAt?: string;
            oneTime?: boolean;
            /** Runs after credential preparation, immediately before submitting terms. */
            beforeSubmit?: () => Promise<void>;
        }) => {
            const wallet = await initWallet();

            const { beforeSubmit, ...submission } = _terms;
            let resolvedContractUri = contractUri;
            // Older callers can still discover the contract through their consent records.
            if (!resolvedContractUri) {
                const records: {
                    records: { uri: string; contract: ConsentFlowContractDetails }[];
                    hasMore: boolean;
                    cursor?: string;
                } = await wallet.invoke.getConsentedContracts();
                let record = records.records.find(item => item.uri === termsUri);
                let page = records;
                while (!record && page.hasMore) {
                    page = await wallet.invoke.getConsentedContracts({ cursor: page.cursor });
                    record = page.records.find(item => item.uri === termsUri);
                }
                if (!record) throw new Error('Could not find sharing settings.');
                resolvedContractUri = record.contract.uri;
            }
            const audience = await loadContractAudience(wallet, resolvedContractUri);
            await reviewAudience(audience.contract);
            const terms = await getTermsWithSharedUrisForWallet(
                wallet,
                audience.recipients,
                queryClient,
                submission
            );

            await beforeSubmit?.();

            return wallet.invoke.updateContractTerms(termsUri, {
                ...terms,
                audienceVersion: audience.audienceVersion,
            });
        },
        onSuccess: data => {
            if (data) {
                const switchedDid = switchedProfileStore.get.switchedDid();
                return queryClient.invalidateQueries({
                    queryKey: ['useConsentedContracts', switchedDid ?? ''],
                });
            }
        },
    });
};
