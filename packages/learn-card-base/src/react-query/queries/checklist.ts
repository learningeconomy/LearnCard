import { useQuery } from '@tanstack/react-query';

import useWallet from 'learn-card-base/hooks/useWallet';

import { switchedProfileStore } from 'learn-card-base/stores/walletStore';

export enum UploadTypesEnum {
    Resume = 'resume',
    Certificate = 'certificate',
    Transcript = 'transcript',
    Diploma = 'diploma',
    RawVC = 'rawVC',
}

export const useGetResumeCredential = () => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.get.switchedDid();

    return useQuery({
        queryKey: ['getResumeCredential', switchedDid ?? ''],
        queryFn: async () => {
            const wallet = await initWallet();

            const record = await wallet.index.LearnCloud.get({ category: UploadTypesEnum.Resume });

            const recordUri = record?.[0]?.uri as string;

            if (!recordUri) return null;

            const resumeCredential = await wallet.read.get(recordUri);
            return resumeCredential;
        },
    });
};

export const useGetCertCredential = () => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.get.switchedDid();

    return useQuery({
        queryKey: ['getCertCredential', switchedDid ?? ''],
        queryFn: async () => {
            const wallet = await initWallet();

            const record = await wallet.index.LearnCloud.get({
                category: UploadTypesEnum.Certificate,
            });

            const recordUri = record?.[0]?.uri as string;

            if (!recordUri) return null;

            const certCredential = await wallet.read.get(recordUri);
            return certCredential;
        },
    });
};

export const useGetTranscriptCredential = () => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.get.switchedDid();

    return useQuery({
        queryKey: ['getTranscriptCredential', switchedDid ?? ''],
        queryFn: async () => {
            const wallet = await initWallet();

            const record = await wallet.index.LearnCloud.get({
                category: UploadTypesEnum.Transcript,
            });

            const recordUri = record?.[0]?.uri as string;

            if (!recordUri) return null;

            const transcriptCredential = await wallet.read.get(recordUri);
            return transcriptCredential;
        },
    });
};

export const useGetDiplomaCredential = () => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.get.switchedDid();

    return useQuery({
        queryKey: ['getDiplomaCredential', switchedDid ?? ''],
        queryFn: async () => {
            const wallet = await initWallet();

            const record = await wallet.index.LearnCloud.get({
                category: UploadTypesEnum.Diploma,
            });

            const recordUri = record?.[0]?.uri as string;

            if (!recordUri) return null;

            const diplomaCredential = await wallet.read.get(recordUri);
            return diplomaCredential;
        },
    });
};

export const useGetRawVCsCredential = () => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.get.switchedDid();

    return useQuery({
        queryKey: ['getRawVCsCredential', switchedDid ?? ''],
        queryFn: async () => {
            const wallet = await initWallet();

            const record = await wallet.index.LearnCloud.get({
                uploadType: UploadTypesEnum.RawVC,
            });

            const recordUri = record?.[0]?.uri as string;

            if (!recordUri) return null;

            const rawVCsCredential = await wallet.read.get(recordUri);
            return rawVCsCredential;
        },
    });
};
