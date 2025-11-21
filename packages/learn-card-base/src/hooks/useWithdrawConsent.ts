import { useMutation, useQueryClient } from '@tanstack/react-query';
import { switchedProfileStore, useWallet } from 'learn-card-base';

export const useWithdrawConsent = (_termsUri: string) => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (termsUri: string = _termsUri) => {
            const wallet = await initWallet();

            return wallet.invoke.withdrawConsent(termsUri);
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
