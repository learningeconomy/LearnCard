import { useQuery } from '@tanstack/react-query';

import { PreferencesType, useWallet } from 'learn-card-base';

export const useGetPreferencesForDid = (enabled: boolean = true) => {
    const { initWallet } = useWallet();

    return useQuery<PreferencesType>({
        queryKey: ['useGetPreferencesForDid'],
        queryFn: async () => {
            const wallet = await initWallet();
            return wallet.invoke.getPreferencesForDid();
        },
        enabled,
    });
};
