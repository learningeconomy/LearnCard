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

export type ChecklistCredentialCounts = Record<UploadTypesEnum, number>;

export const useGetChecklistCredentialCounts = () => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.get.switchedDid();

    return useQuery({
        queryKey: ['getChecklistCredentialCounts', switchedDid ?? ''],
        queryFn: async (): Promise<ChecklistCredentialCounts> => {
            const wallet = await initWallet();
            const [resumes, certificates, transcripts, diplomas, rawVCs] = await Promise.all([
                wallet.index.LearnCloud.get({ category: UploadTypesEnum.Resume }),
                wallet.index.LearnCloud.get({ category: UploadTypesEnum.Certificate }),
                wallet.index.LearnCloud.get({ category: UploadTypesEnum.Transcript }),
                wallet.index.LearnCloud.get({ category: UploadTypesEnum.Diploma }),
                // Imported credentials span many categories, so uploadType is their stable source tag.
                wallet.index.LearnCloud.get({ uploadType: UploadTypesEnum.RawVC }),
            ]);

            return {
                [UploadTypesEnum.Resume]: resumes?.length ?? 0,
                [UploadTypesEnum.Certificate]: certificates?.length ?? 0,
                [UploadTypesEnum.Transcript]: transcripts?.length ?? 0,
                [UploadTypesEnum.Diploma]: diplomas?.length ?? 0,
                [UploadTypesEnum.RawVC]: rawVCs?.length ?? 0,
            };
        },
    });
};
