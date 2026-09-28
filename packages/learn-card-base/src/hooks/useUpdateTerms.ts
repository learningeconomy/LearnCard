import { ConsentFlowTerms } from '@learncard/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { switchedProfileStore, useWallet } from 'learn-card-base';
import { useSharedUrisInTerms } from './useSharedUrisInTerms';

export const useUpdateTerms = (termsUri: string, contractOwnerDid: string) => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    const { getTermsWithSharedUris } = useSharedUrisInTerms(contractOwnerDid);

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
            const terms = await getTermsWithSharedUris(submission);

            await beforeSubmit?.();

            return wallet.invoke.updateContractTerms(termsUri, terms);
        },
        onSuccess: data => {
            if (data) {
                const switchedDid = switchedProfileStore.get.switchedDid();
                queryClient.refetchQueries({
                    queryKey: ['useConsentedContracts', switchedDid ?? ''],
                });
            }
        },
    });
};
