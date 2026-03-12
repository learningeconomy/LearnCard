import { useQuery } from '@tanstack/react-query';
import { VC } from '@learncard/types';
import { CredentialCategoryEnum, useWallet } from 'learn-card-base';
import { switchedProfileStore } from 'learn-card-base/stores/walletStore';

type ResumeIndexRecord = {
    id: string;
    uri?: string;
    credentialId?: string;
    lerRecordId?: string;
    [key: string]: unknown;
};

export type ExistingResume = {
    record: ResumeIndexRecord;
    vc: VC | null;
    lerRecordId: string | null;
};

export const useExistingResumes = () => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.get.switchedDid();

    return useQuery({
        queryKey: ['existing-resumes', switchedDid ?? ''],
        queryFn: async (): Promise<ExistingResume[]> => {
            const wallet = await initWallet();

            const records = (await wallet.index.LearnCloud.get({
                category: CredentialCategoryEnum.resume,
            })) as ResumeIndexRecord[];

            return Promise.all(
                records.map(async record => {
                    let vc: VC | null = null;
                    if (record.uri) {
                        try {
                            vc = (await wallet.read.get(record.uri)) as VC;
                        } catch {
                            vc = null;
                        }
                    }

                    const lerRecordId =
                        (typeof record.lerRecordId === 'string' && record.lerRecordId) ||
                        vc?.id ||
                        (typeof record.credentialId === 'string' && record.credentialId) ||
                        null;

                    return {
                        record,
                        vc,
                        lerRecordId,
                    };
                })
            );
        },
    });
};

export default useExistingResumes;
