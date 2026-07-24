import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet } from 'learn-card-base';
import { newCredsStore } from 'learn-card-base/stores/newCredsStore';

import { getLogger } from '../../logging/logger';
const log = getLogger('checklist');

export const useDeleteChecklistCredentialMutation = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, uri }: { id: string; uri: string }) => {
            const wallet = await initWallet();

            try {
                newCredsStore.set.removeCreds([uri]);
            } catch (error) {
                log.error('Failed to remove credential from newCredsStore', error);
            }

            try {
                await wallet.index.LearnCloud.remove(id);
            } catch (error) {
                log.error('Failed to remove credential from LearnCloud', error);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['getChecklistCredentialCounts'] });
        },
        onError: error => {
            log.error('Failed to delete checklist credential', error);
        },
    });
};

export const useUpdateChecklistItemCategoryMutation = () => {
    const { initWallet } = useWallet();
    return useMutation({
        mutationFn: async ({
            id,
            category,
            uri,
        }: {
            id: string;
            category: string;
            uri: string;
        }) => {
            const wallet = await initWallet();
            await wallet.index.LearnCloud.update(id, { category });

            try {
                newCredsStore.set.removeCreds([uri]);
                newCredsStore.set.addNewCreds({
                    [category]: [uri],
                });
            } catch (error) {
                log.error('Failed to update credential in newCredsStore', error);
            }
        },
        onError: error => {
            log.error('Failed to update checklist credential', error);
        },
    });
};
