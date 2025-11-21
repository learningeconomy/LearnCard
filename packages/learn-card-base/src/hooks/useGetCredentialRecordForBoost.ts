import { useWallet } from 'learn-card-base';
import { useQuery, QueryClient } from '@tanstack/react-query';
import { switchedProfileStore } from 'learn-card-base/stores/walletStore';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { LCR } from 'learn-card-base/types/credential-records';

export const getCredentialRecordForBoost = async (
    boostUri: string,
    initWallet: () => Promise<BespokeLearnCard>
) => {
    const wallet = await initWallet();

    const results = await wallet.index.all.get<LCR>({ boostUri });

    const record = results[0] && {
        ...results[0],
        ...(results[0].__v && { __v: Number(results[0].__v) }),
    };

    return record ?? null;
};

export const useGetCredentialRecordForBoost = (boostUri?: string) => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();

    return useQuery({
        queryKey: ['useGetCredentialRecordForBoost', boostUri, switchedDid ?? ''],
        queryFn: async () => getCredentialRecordForBoost(boostUri!, initWallet),
        enabled: Boolean(boostUri),
    });
};

export const getOrFetchCredentialRecordForBoost = async (
    boostUri: string,
    initWallet: () => Promise<BespokeLearnCard>,
    queryClient: QueryClient
) => {
    return queryClient.fetchQuery<LCR | null>({
        queryKey: [
            'useGetCredentialRecordForBoost',
            boostUri,
            switchedProfileStore.get.switchedDid() ?? '',
        ],
        queryFn: async () => getCredentialRecordForBoost(boostUri, initWallet),
    });
};
