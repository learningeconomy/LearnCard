import { useMutation, useQueryClient } from '@tanstack/react-query';
import { switchedProfileStore, useWallet } from 'learn-card-base';

export const useWithdrawConsent = (_termsUri?: string) => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (termsUri: string | undefined = _termsUri) => {
            if (!termsUri) throw new Error('Cannot withdraw consent without a terms URI');

            const wallet = await initWallet();

            return wallet.invoke.withdrawConsent(termsUri);
        },
        onSuccess: async () => {
            const switchedDid = switchedProfileStore.get.switchedDid();

            await queryClient.invalidateQueries({
                queryKey: ['useConsentedContracts'],
            });

            await queryClient.refetchQueries({
                queryKey: ['useConsentedContracts', switchedDid ?? ''],
            });
        },
    });
};
