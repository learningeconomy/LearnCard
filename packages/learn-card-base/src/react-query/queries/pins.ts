import { useQuery } from '@tanstack/react-query';

import { useWallet } from 'learn-card-base';

export const useGetDidHasPin = () => {
    const { initWallet } = useWallet();

    return useQuery({
        queryKey: ['useGetDidHasPin'],
        queryFn: async () => {
            const wallet = await initWallet();
            return wallet.invoke.hasPin();
        },
    });
};
