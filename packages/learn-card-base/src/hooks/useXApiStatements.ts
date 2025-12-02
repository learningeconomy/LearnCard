import { useInfiniteQuery } from '@tanstack/react-query';
import { useWallet, useGetDid, useCurrentUser } from 'learn-card-base';

export const useXApiStatements = () => {
    const { initWallet } = useWallet();
    const { data: currentUserDidKey } = useGetDid('key');
    const currentUser = useCurrentUser();

    return useInfiniteQuery({
        queryKey: ['useXApiStatements', currentUserDidKey],
        queryFn: async ({ pageParam }) => {
            const wallet = await initWallet();
            if (!wallet) throw new Error('Wallet is not initialized yet.');

            const actor = {
                account: { homePage: 'https://www.w3.org/TR/did-core/', name: currentUserDidKey },
                name: currentUser?.name,
            };

            const params = new URLSearchParams({
                agent: JSON.stringify(actor),
            });
            const url = `https://cloud.learncard.com${pageParam || `/xapi/statements?${params}`}`;

            const vpToken = await wallet.invoke.getDidAuthVp({ proofFormat: 'jwt' });

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Experience-API-Version': '1.0.3',
                    'X-VP': vpToken || '',
                },
            });

            if (!response.ok)
                throw new Error(`Failed to fetch xAPI statements: ${response.status}`);

            return response.json();
        },
        initialPageParam: undefined as undefined | string,
        getNextPageParam: lastPage => lastPage?.more || undefined,
    });
};
