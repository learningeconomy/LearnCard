import { useQuery } from '@tanstack/react-query';
import { switchedProfileStore, useWallet } from 'learn-card-base';
import { PaginatedConsentFlowContracts } from '@learncard/types';

export const useGetContracts = () => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.get.switchedDid();

    return useQuery<PaginatedConsentFlowContracts['records']>({
        queryKey: ['useGetContracts', switchedDid ?? ''],
        queryFn: async () => {
            try {
                const wallet = await initWallet();
                return wallet.invoke.getContracts();
            } catch (error) {
                return Promise.reject(error);
            }
        },
    });
};
