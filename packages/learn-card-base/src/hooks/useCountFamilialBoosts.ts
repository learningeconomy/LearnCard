import { useQuery } from '@tanstack/react-query';
import { useIsLoggedIn, useWallet } from 'learn-card-base';
import { BoostQuery } from '@learncard/types';

export const useCountFamilialBoosts = (
    uri: string | undefined,
    childGenerations: number,
    parentGenerations: number,
    query: BoostQuery | undefined,
    enabled = true,
    includeExtendedFamily: boolean = false
) => {
    const isLoggedIn = useIsLoggedIn();
    const { initWallet } = useWallet();

    return useQuery<any | undefined>({
        queryKey: [
            'useCountFamilialBoosts',
            uri!,
            query!,
            childGenerations,
            parentGenerations,
            includeExtendedFamily,
        ],
        queryFn: async () => {
            if (!uri) return;

            try {
                const wallet = isLoggedIn ? await initWallet() : await initWallet('a'.repeat(64));

                const deets = await wallet.invoke.countFamilialBoosts(uri, {
                    query,
                    childGenerations,
                    parentGenerations,
                    includeExtendedFamily,
                });

                return deets;
            } catch (error) {
                return Promise.reject(error);
            }
        },
        enabled: enabled && Boolean(uri),
    });
};
