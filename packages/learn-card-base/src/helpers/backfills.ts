import { LCR } from 'learn-card-base/types/credential-records';
import { useWallet } from 'learn-card-base';
import { useQueryClient } from '@tanstack/react-query';
import { getOrFetchResolvedCredential } from 'learn-card-base/react-query/queries/vcQueries';

export const useBackfillBoostUris = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    return async (records: LCR[]) => {
        const recordsToBackfill = records.filter(record => !record.boostUri && !record.__v);

        return Promise.all(
            recordsToBackfill.map(async record => {
                const wallet = await initWallet();
                const vc = await getOrFetchResolvedCredential(record.uri, initWallet, queryClient);

                const boostUri = vc?.boostId;

                return wallet.index.LearnCloud.update(record.id, {
                    ...(boostUri && { boostUri }),
                    __v: 1,
                });
            })
        );
    };
};
