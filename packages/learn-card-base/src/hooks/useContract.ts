import { useQuery } from '@tanstack/react-query';
import { useIsLoggedIn, useWallet } from 'learn-card-base';
import { ConsentFlowContractDetails } from '@learncard/types';

export const useContract = (uri: string | undefined, enabled = true) => {
    const isLoggedIn = useIsLoggedIn();
    const { initWallet } = useWallet();

    return useQuery<ConsentFlowContractDetails | undefined>({
        queryKey: ['useContract', uri!],
        queryFn: async () => {
            if (!uri) return;

            try {
                const wallet = isLoggedIn ? await initWallet() : await initWallet('a'.repeat(64));

                const deets = await wallet.invoke.getContract(uri);

                return deets;
            } catch (error) {
                return Promise.reject(error);
            }
        },
        enabled: enabled && Boolean(uri),
    });
};
