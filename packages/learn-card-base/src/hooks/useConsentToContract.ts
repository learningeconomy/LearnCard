import { ConsentFlowTerms } from '@learncard/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { switchedProfileStore, useWallet } from 'learn-card-base';
import { useSharedUrisInTerms } from './useSharedUrisInTerms';

export const useConsentToContract = (
    uri: string,
    contractOwnerDid: string,
    recipientToken?: string // required for SmartResume and SmartResume only
) => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    const { getTermsWithSharedUris } = useSharedUrisInTerms(contractOwnerDid);

    return useMutation({
        mutationFn: async (_terms: {
            terms: ConsentFlowTerms;
            expiresAt?: string;
            oneTime?: boolean;
        }) => {
            const wallet = await initWallet();

            const terms = await getTermsWithSharedUris(_terms);

            return wallet.invoke.consentToContract(uri, terms, recipientToken);
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
