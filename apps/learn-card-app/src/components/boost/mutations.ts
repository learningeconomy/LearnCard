/*mutations related to boosts */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { useWallet, insertItem, switchedProfileStore, CredentialCategory } from 'learn-card-base';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import { VC, Boost, CredentialRecord, VCValidator } from '@learncard/types';

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
    category: CredentialCategory;
    vc: VC;
    uri: string;
    id: string;
};

export const useAddCredentialToWallet = () => {
    const { initWallet, syncCredentialToContracts } = useWallet();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (
            input: AddVCInput & {
                didOverride?: string | true; // true for parent user's did
            },
            location: 'SQLite' | 'LearnCloud' = 'LearnCloud' // never actually used 🙃
        ) => {
            try {
                const wallet = await initWallet(undefined, input.didOverride);
                const { uri, id, title, imgUrl, didOverride } = input;

                let _id = id;
                if (!uri) throw new Error('No uri was provided, uri required');

                if (!id) _id = uuidv4();

                const vc = await VCValidator.parseAsync(await wallet.read.get(uri));

                const category = getDefaultCategoryForCredential(vc) || 'Achievement';

                // get VC From stream given streamId
                // this does not return the added vc, it just adds the streamId to the wallet

                const res = await wallet.index[location].add({
                    id: _id,
                    uri,
                    category,
                    ...(title ? { title } : {}),
                    ...(imgUrl ? { imgUrl } : {}),
                });

                return { vc, category, uri, id, didOverride };
            } catch (error) {
                console.log('///mutation error', error);
                return Promise.reject(new Error(error));
            }
        },
        onSuccess: async data => {
            const { category, vc, uri, id, didOverride } = data;
            // didOverride === true means this is the parent profile because switchedDid is undefined in the case of the parent
            const didWeb =
                didOverride === true
                    ? undefined
                    : didOverride || switchedProfileStore.get.switchedDid();

            await queryClient.cancelQueries({
                queryKey: ['useGetCredentialList', didWeb ?? '', category],
            });
            await queryClient.invalidateQueries({
                queryKey: ['useGetCredentialCount', didWeb ?? '', category],
            });

            // Update cache
            insertItem(queryClient, ['useGetCredentialList', didWeb ?? '', category], {
                id,
                category,
                uri,
            });

            // Intentionally don't await these to keep this mutation fast!
            queryClient.refetchQueries({ queryKey: ['useGetCredentials', didWeb ?? '', category] });
            queryClient.refetchQueries({
                queryKey: ['useGetCredentialCount', didWeb ?? '', category],
            });
            queryClient.refetchQueries({
                queryKey: ['useGetCredentialList', didWeb ?? '', category],
            });

            await syncCredentialToContracts({ record: data, category });
        },
    });
};
