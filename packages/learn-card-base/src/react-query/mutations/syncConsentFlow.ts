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
import { CredentialMetadata } from 'learn-card-base/types/credential-records';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
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
    expiresAt?: string;
    oneTime?: boolean;
};

const getSharedUrisForOwner = async (
    learnCard: BespokeLearnCard,
    ownerDid: string
): Promise<Set<string>> => {
    const sharedUris = new Set<string>();

    let cursor: string | undefined;
    let page = await learnCard.index.LearnCloud.getPage!<CredentialMetadata>(undefined, {
        limit: 100,
    });

    do {
        (page?.records ?? []).forEach(record => {
            (record.sharedUris?.[ownerDid] ?? []).forEach(uri => sharedUris.add(uri));
        });

        cursor = page?.hasMore ? page.cursor : undefined;
        if (cursor) {
            page = await learnCard.index.LearnCloud.getPage!<CredentialMetadata>(undefined, {
                cursor,
                limit: 100,
            });
        }
    } while (cursor);

    return sharedUris;
};

const pruneStaleSharedUris = (terms: ConsentFlowTerms, validSharedUris: Set<string>) => {
    const nextTerms = JSON.parse(JSON.stringify(terms)) as ConsentFlowTerms;
    let removed = 0;

    Object.values(nextTerms.read.credentials.categories).forEach(categoryInfo => {
        const previous = categoryInfo.shared ?? [];
        const pruned = previous.filter(uri => validSharedUris.has(uri));
        removed += previous.length - pruned.length;
        categoryInfo.shared = pruned;
    });

    return { nextTerms, removed };
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

            for (const { contract, terms, uri: termsUri, expiresAt, oneTime } of allContracts) {
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

                let contractTerms = terms;
                try {
                    const validSharedUris = await getSharedUrisForOwner(learnCard, contract.owner.did);
                    const { nextTerms, removed } = pruneStaleSharedUris(terms, validSharedUris);

                    if (removed > 0) {
                        await learnCard.invoke.updateContractTerms(termsUri, {
                            terms: nextTerms,
                            ...(typeof expiresAt === 'string' ? { expiresAt } : {}),
                            ...(typeof oneTime === 'boolean' ? { oneTime } : {}),
                        });

                        contractTerms = nextTerms;

                        console.log('[ConsentSync] Pruned stale shared URIs', {
                            ownerDid: contract.owner.did,
                            termsUri,
                            removed,
                        });
                    }
                } catch (err) {
                    const msg = `Prune failed for owner=${contract.owner.did} termsUri=${termsUri} :: ${
                        (err as any)?.message || String(err)
                    }`;
                    try {
                        console.error('[ConsentSync] ERROR', msg, err);
                        syncProgressStore.set.lastError(msg);
                    } catch {}
                    throw new Error(msg);
                }

                const categoryMap: Partial<Record<CredentialCategory, string[]>> = {};

                await Promise.all(
                    (Object.entries(recordsByCategory) as [CredentialCategory, string[]][]).map(
                        async ([category, credUris]) => {
                            const categoryInfo = contractTerms.read.credentials.categories[category];

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
