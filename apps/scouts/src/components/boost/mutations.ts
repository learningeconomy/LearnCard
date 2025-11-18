/*mutations related to boosts */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { useWallet, insertItem } from 'learn-card-base';
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
}

type useAddCredentialToWalletReturn = {
    category: string;
    vc: VC;
    uri: string;
    id: string;
};

export const useAddCredentialToWallet = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (
            input: AddVCInput,
            location: 'IDX' | 'SQLite' | 'LearnCloud' = 'LearnCloud'
        ) => {
            const wallet = await initWallet();
            const { uri, id, title, imgUrl } = input;
            let _id = id;

            if (!uri) throw new Error('No uri was provided, uri required');

            if (!id) _id = uuidv4();

            const vc = await VCValidator.parseAsync(await wallet.read.get(uri));

            const category = getDefaultCategoryForCredential(vc) || 'Achievement';

            // get VC From stream given streamId
            // this does not return the added vc, it just adds the streamId to the wallet
            await wallet.index[location].add({
                id: _id,
                uri,
                category,
                ...(title ? { title } : {}),
                ...(imgUrl ? { imgUrl } : {}),
                // tags: ['Jamboree 2023'],
            });

            return { vc, category, uri, id };
        },
        onSuccess: async (data: useAddCredentialToWalletReturn) => {
            const { category, vc, uri, id } = data;

            await queryClient.cancelQueries({ queryKey: ['useGetCredentialList', category] });
            await queryClient.invalidateQueries({
                queryKey: ['useGetCredentialCount', category, true],
            });

            // Update cache
            await insertItem(queryClient, ['useGetCredentialList', category], {
                id,
                category,
                uri,
            });

            // Intentionally don't await these to keep this mutation fast!
            queryClient.refetchQueries({ queryKey: ['useGetCredentials', category] });
            queryClient.refetchQueries({ queryKey: ['useGetCredentialCount', category] });
            queryClient.refetchQueries({ queryKey: ['useGetCredentialList', category] });

            await queryClient.cancelQueries({ queryKey: ['useGetIDs'] });
            await queryClient.invalidateQueries({ queryKey: ['useGetIDs'] });
            queryClient.refetchQueries({ queryKey: ['useGetIDs'] });
        },
    });
};
