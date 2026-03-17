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
            }
        ) => {
            try {
                const wallet = await initWallet(undefined, input.didOverride);
                const { uri, id, title, imgUrl, didOverride } = input;

                let _id = id;
                if (!uri) throw new Error('No uri was provided, uri required');

                if (!id) _id = uuidv4();

                const vc = await VCValidator.parseAsync(await wallet.read.get(uri));

                const category = getDefaultCategoryForCredential(vc) || 'Achievement';

                const res = await wallet.index.LearnCloud.add({
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
            const didForCredentials = didWeb;
            const didForListsAndCounts = didWeb ?? '';

            await queryClient.cancelQueries({
                queryKey: ['useGetCredentialList', didForListsAndCounts, category],
            });
            await queryClient.invalidateQueries({
                queryKey: ['useGetCredentialCount', didForListsAndCounts, category],
            });

            // Update cache
            insertItem(queryClient, ['useGetCredentialList', didForListsAndCounts, category], {
                id,
                category,
                uri,
            });

            // Keep resume-builder selectors and wallet credential views in sync after any issuance.
            // Intentionally don't await these to keep this mutation fast.
            queryClient.invalidateQueries({ queryKey: ['useGetCredentials', didForCredentials] });
            queryClient.invalidateQueries({
                queryKey: ['useGetCredentialList', didForListsAndCounts],
            });
            queryClient.invalidateQueries({
                queryKey: ['useGetCredentialCount', didForListsAndCounts],
            });
            queryClient.invalidateQueries({
                queryKey: ['useGetIDs', didForListsAndCounts],
            });

            queryClient.refetchQueries({
                queryKey: ['useGetCredentials', didForCredentials, category],
            });
            queryClient.refetchQueries({
                queryKey: ['useGetCredentialList', didForListsAndCounts],
            });
            queryClient.refetchQueries({
                queryKey: ['useGetCredentialCount', didForListsAndCounts],
            });
            queryClient.refetchQueries({
                queryKey: ['useGetIDs', didForListsAndCounts],
            });

            await syncCredentialToContracts({ record: data, category });
        },
    });
};
