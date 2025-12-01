import { useMutation } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import {
    useToast,
    useWallet,
    WalletSyncState,
    CredentialCategory,
    contractCategoryNameToCategoryMetadata,
    syncProgressStore,
    walletStore,
} from 'learn-card-base';
import { getOrCreateSharedUriForWallet } from 'learn-card-base/hooks/useSharedUrisInTerms';
import { useAcceptCredentialMutation } from './mutations';
import { ConsentFlowContractDetails, ConsentFlowTerms } from '@learncard/types';

export type ConsentRecord = {
    credentialUri: string;
    contractUri: string;
    termsUri: string;
    category?: string;
};

export type ConsentedContract = {
    contract: ConsentFlowContractDetails;
    terms: ConsentFlowTerms;
    uri: string;
};

/**
 * Sync credentials to each consented contract based on category sharing settings.
 */
export const useSyncConsentContractsMutation = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    return useMutation<
        void,
        Error,
        {
            recordsByCategory: Partial<Record<CredentialCategory, string[]>>;
            allContracts: ConsentedContract[];
        }
    >({
        mutationFn: async ({ recordsByCategory, allContracts }) => {
            const learnCard = await initWallet();
            try {
                const categorySummary = Object.entries(recordsByCategory)
                    .map(([k, v]) => `${k}:${v?.length ?? 0}`)
                    .join(', ');
                console.log('[ConsentSync] Starting sync', {
                    contracts: allContracts.length,
                    categorySummary,
                });
            } catch {}

            for (const { contract, terms, uri: termsUri } of allContracts) {
                // Update current contract progress
                try {
                    syncProgressStore.set.currentContract(contract.owner.did);
                } catch {}

                try {
                    console.log('[ConsentSync] Contract start', {
                        ownerDid: contract.owner.did,
                        termsUri,
                    });
                } catch {}

                const categoryMap: Partial<Record<CredentialCategory, string[]>> = {};

                await Promise.all(
                    (Object.entries(recordsByCategory) as [CredentialCategory, string[]][]).map(
                        async ([category, credUris]) => {
                            const categoryInfo = terms.read.credentials.categories[category];

                            if (
                                categoryInfo &&
                                categoryInfo.shareAll &&
                                categoryInfo.sharing &&
                                (!categoryInfo.shareUntil ||
                                    categoryInfo.shareUntil > new Date().toISOString())
                            ) {
                                const sharedUris = await Promise.all(
                                    credUris.map(uri =>
                                        getOrCreateSharedUriForWallet(
                                            learnCard,
                                            contract.owner.did,
                                            queryClient,
                                            uri,
                                            contractCategoryNameToCategoryMetadata(category)
                                                ?.credentialType!
                                        ).catch(err => {
                                            try {
                                                console.error(
                                                    '[ConsentSync] Share URI failed',
                                                    {
                                                        ownerDid: contract.owner.did,
                                                        category,
                                                        sourceUri: uri,
                                                        termsUri,
                                                        message:
                                                            (err as any)?.message || String(err),
                                                    },
                                                    err
                                                );
                                            } catch {}
                                            throw err;
                                        })
                                    )
                                );
                                const validUris = sharedUris.filter(
                                    (uri): uri is string =>
                                        Boolean(uri) &&
                                        !categoryInfo.shared?.includes(uri as string)
                                );

                                if (validUris.length) {
                                    categoryMap[category] = validUris;
                                }
                            }
                        }
                    )
                );

                if (Object.keys(categoryMap).length) {
                    const payloadSummary = Object.entries(categoryMap)
                        .map(([k, v]) => `${k}:${v?.length ?? 0}`)
                        .join(', ');

                    try {
                        await learnCard.invoke.syncCredentialsToContract(
                            termsUri,
                            categoryMap as Record<string, string[]>
                        );
                        queryClient.invalidateQueries({
                            queryKey: ['useTermsTransactions', termsUri],
                        });
                    } catch (err) {
                        const msg = `Sync failed for owner=${
                            contract.owner.did
                        } termsUri=${termsUri} payload=[${payloadSummary}] :: ${
                            (err as any)?.message || String(err)
                        }`;
                        try {
                            console.error('[ConsentSync] ERROR', msg, err);
                            syncProgressStore.set.lastError(msg);
                        } catch {}
                        throw new Error(msg);
                    }
                } else {
                    try {
                        console.log('[ConsentSync] No credentials to sync for contract', {
                            ownerDid: contract.owner.did,
                            termsUri,
                        });
                    } catch {}
                }

                // Increment completed contracts
                try {
                    const prev = syncProgressStore.get.contractsCompleted();
                    syncProgressStore.set.contractsCompleted(prev + 1);
                    console.log('[ConsentSync] Contract done', {
                        ownerDid: contract.owner.did,
                        termsUri,
                        completed: prev + 1,
                        total: syncProgressStore.get.totalContracts(),
                    });
                } catch {}
            }
        },
    });
};

/**
 * Accept all credentials and add them to the wallet.
 */
export const useAcceptAndStoreCredentialsMutation = () => {
    const acceptCredential = useAcceptCredentialMutation();
    const { addVCtoWallet } = useWallet();

    return useMutation<void, Error, { allRecords: ConsentRecord[] }>({
        mutationFn: async ({ allRecords }) => {
            walletStore.set.setIsSyncing(WalletSyncState.Syncing);
            await Promise.all(
                allRecords.map(r => acceptCredential.mutateAsync({ uri: r.credentialUri }))
            );
            await Promise.all(
                allRecords.map(r =>
                    addVCtoWallet({
                        uri: r.credentialUri,
                        contractUri: r.contractUri,
                        skipSync: true,
                    })
                )
            );
        },
        onSuccess: (_, { allRecords }) => {
            const count = allRecords.length;
            if (count > 0) {
                // presentToast(`Successfully synced ${count} credentials`, {
                //     toastType: ToastTypeEnum.CopySuccess,
                // });
                walletStore.set.setIsSyncing(WalletSyncState.Completed, count);
            }
        },
        onError: () => {
            walletStore.set.setIsSyncing(WalletSyncState.NotSyncing);
        },
    });
};
