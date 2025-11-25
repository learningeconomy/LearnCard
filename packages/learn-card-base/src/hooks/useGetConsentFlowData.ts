import { useQuery } from '@tanstack/react-query';
import { useWallet } from 'learn-card-base';
import { PaginatedConsentFlowData } from '@learncard/types';

export const useGetConsentFlowData = (contractUri: string) => {
    const { initWallet } = useWallet();

    return useQuery<PaginatedConsentFlowData['records']>({
        queryKey: ['useGetConsentFlowData', contractUri],
        queryFn: async () => {
            try {
                const wallet = await initWallet();
                return wallet.invoke.getConsentFlowData(contractUri);
            } catch (error) {
                return Promise.reject(error);
            }
        },
    });
};
