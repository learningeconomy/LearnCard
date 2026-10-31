/*mutations related to boosts */
import { useMutation, useQueryClient, type Query } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { useWallet, insertItem, switchedProfileStore } from 'learn-card-base';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import { VC, Boost, CredentialRecord, VP, VCValidator } from '@learncard/types';

type CredentialRecordMinusId = Omit<CredentialRecord, 'id'>;

export type BoostAndVCType = {
    boost: Boost;
    boostVC: VC;
};

interface AddVCInput extends CredentialRecordMinusId {
    title?: string;
    imgUrl?: string;
    boostUri?: string;
}

type useAddCredentialToWalletReturn = {
    category: string;
    vc: VC;
    uri: string;
    id: string;
    readerDid: string;
    didWeb: string;
};

export const useAddCredentialToWallet = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: AddVCInput) => {
            const wallet = await initWallet();
            const didWeb = switchedProfileStore.get.switchedDid() ?? '';
            const { uri, id, title, imgUrl, boostUri } = input;
            const _id = id || uuidv4();

            if (!uri) throw new Error('No uri was provided, uri required');

            const vc = await VCValidator.parseAsync(await wallet.read.get(uri));

            const category = getDefaultCategoryForCredential(vc) || 'Achievement';

            // get VC From stream given streamId
            // this does not return the added vc, it just adds the streamId to the wallet
            await wallet.index.LearnCloud.add({
                id: _id,
                uri,
                category,
                ...(title ? { title } : {}),
                ...(imgUrl ? { imgUrl } : {}),
                ...(boostUri ? { boostUri } : {}),
                // tags: ['Jamboree 2023'],
            });

            return { vc, category, uri, id: _id, readerDid: wallet.id.did(), didWeb };
        },
        onSuccess: async (data: useAddCredentialToWalletReturn) => {
            const { category, vc, uri, id, readerDid, didWeb } = data;
            const listPrefix = ['useGetCredentialList', didWeb];
            const listFilters = {
                queryKey: listPrefix,
                predicate: (query: Query) => query.queryKey[3] === readerDid,
            };

            await queryClient.cancelQueries(listFilters);
            await queryClient.invalidateQueries({
                queryKey: ['useGetCredentialCount', didWeb, category],
            });

            // Update cache
            await insertItem(queryClient, [...listPrefix, category, readerDid], {
                id,
                category,
                uri,
            });

            // Intentionally don't await these to keep this mutation fast!
            queryClient.refetchQueries({
                queryKey: ['useGetCredentials', didWeb || undefined, category],
            });
            void queryClient.invalidateQueries(listFilters);

            await queryClient.cancelQueries({ queryKey: ['useGetIDs'] });
            await queryClient.invalidateQueries({ queryKey: ['useGetIDs'] });
            queryClient.refetchQueries({ queryKey: ['useGetIDs'] });
        },
    });
};
