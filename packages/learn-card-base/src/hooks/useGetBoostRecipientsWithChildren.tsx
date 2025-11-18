import { useQuery } from '@tanstack/react-query';
import { useIsLoggedIn, useWallet } from 'learn-card-base';
import { BoostQuery } from '@learncard/types';

export const useGetBoostRecipientsWithChildren = (
    uri: string | undefined,
    numberOfGenerations: number = Infinity,
    query?: BoostQuery | undefined,
    enabled = true
) => {
    const isLoggedIn = useIsLoggedIn();
    const { initWallet } = useWallet();

    return useQuery<any | undefined>({
        queryKey: ['useGetBoostRecipientsWithChildren', uri!, query!, numberOfGenerations],
        queryFn: async () => {
            if (!uri) return;

            try {
                const wallet = isLoggedIn ? await initWallet() : await initWallet('a'.repeat(64));
                //add pagination logic later
                const deets = await wallet.invoke.getPaginatedBoostRecipientsWithChildren(
                    uri,
                    undefined,
                    undefined,
                    false,
                    query,
                    undefined,
                    numberOfGenerations
                );

                return deets;
            } catch (error) {
                return Promise.reject(error);
            }
        },
        enabled: enabled && Boolean(uri),
    });
};
