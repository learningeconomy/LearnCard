import { useQuery } from '@tanstack/react-query';
import { switchedProfileStore, useWallet } from 'learn-card-base';
import { LCR } from 'learn-card-base/types/credential-records';

// Gets all Earned credentials that were issued by a contract
export const useGetCredentialsFromContract = (uri: string | undefined, enabled = true) => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();

    return useQuery<LCR[] | undefined>({
        queryKey: ['useGetCredentialsFromContract', uri!, switchedDid ?? ''],
        queryFn: async () => {
            if (!uri) return;

            try {
                const wallet = await initWallet();

                const contractCreds = (await wallet.index.LearnCloud.get({
                    contractUri: uri,
                })) as LCR[];

                return contractCreds;
            } catch (error) {
                return Promise.reject(error);
            }
        },
        enabled: enabled && Boolean(uri),
    });
};
