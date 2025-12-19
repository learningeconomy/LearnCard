import { useQuery } from '@tanstack/react-query';
import { useIsLoggedIn, useWallet } from 'learn-card-base';
import { BoostQuery } from '@learncard/types';

export const useCountBoostChildren = (
    uri: string | undefined,
    numberOfGenerations: number = 1, // i.e. 2 for the grandchildren, must be > 0
    query: BoostQuery | undefined,
    enabled = true
) => {
    const isLoggedIn = useIsLoggedIn();
    const { initWallet } = useWallet();

    return useQuery<any | undefined>({
        queryKey: ['useCountBoostChildren', uri!, query!, numberOfGenerations],
        queryFn: async () => {
            if (!uri) return;

            try {
                const wallet = isLoggedIn ? await initWallet() : await initWallet('a'.repeat(64));

                const deets = await wallet.invoke.countBoostChildren(uri, {
                    query,
                    numberOfGenerations,
                });

                return deets;
            } catch (error) {
                return Promise.reject(error);
            }
        },
        enabled: enabled && Boolean(uri),
    });
};
