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
import { LEARNCARD_AI_PASSPORT_CONTRACT_URI } from 'learn-card-base/constants/aiPassport';
import { queueAiInsightCredentialRefresh } from './ai-passport';

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

const normalizeCategoryKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const getCategoryInfoForTerms = (
    terms: ConsentFlowTerms,
    category: string
): {
    categoryInfo?: ConsentFlowTerms['read']['credentials']['categories'][string];
} => {
    const exactMatch = terms.read.credentials.categories[category];
    if (exactMatch) return { categoryInfo: exactMatch };

    const normalizedCategory = normalizeCategoryKey(category);
    const fallbackEntry = Object.entries(terms.read.credentials.categories).find(
        ([key]) => normalizeCategoryKey(key) === normalizedCategory
    );

    if (!fallbackEntry) return {};

    const [, categoryInfo] = fallbackEntry;

    return { categoryInfo };
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

            for (const { contract, terms, uri: termsUri, expiresAt, oneTime } of allContracts) {
                // Update current contract progress
                try {
                    syncProgressStore.set.currentContract(contract.owner.did);
                } catch {}

                let contractTerms = terms;
                try {
                    const validSharedUris = await getSharedUrisForOwner(
                        learnCard,
                        contract.owner.did
                    );
                    const { nextTerms, removed } = pruneStaleSharedUris(terms, validSharedUris);

                    if (removed > 0) {
                        await learnCard.invoke.updateContractTerms(termsUri, {
                            terms: nextTerms,
                            ...(typeof expiresAt === 'string' ? { expiresAt } : {}),
                            ...(typeof oneTime === 'boolean' ? { oneTime } : {}),
                        });

                        contractTerms = nextTerms;
                    }
                } catch (err) {
                    const msg = `Prune failed for owner=${
                        contract.owner.did
                    } termsUri=${termsUri} :: ${(err as any)?.message || String(err)}`;
                    try {
                        syncProgressStore.set.lastError(msg);
                    } catch {}
                    throw new Error(msg);
                }

                const categoryMap: Partial<Record<CredentialCategory, string[]>> = {};

                await Promise.all(
                    (Object.entries(recordsByCategory) as [CredentialCategory, string[]][]).map(
                        async ([category, credUris]) => {
                            const { categoryInfo } = getCategoryInfoForTerms(
                                contractTerms,
                                category
                            );

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
                                                ?.credentialType ?? category
                                        )
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
                        if (contract.uri === LEARNCARD_AI_PASSPORT_CONTRACT_URI) {
                            await queueAiInsightCredentialRefresh({
                                wallet: learnCard,
                                queryClient,
                            });
                        }
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
                            syncProgressStore.set.lastError(msg);
                        } catch {}
                        throw new Error(msg);
                    }
                }

                // Increment completed contracts
                try {
                    const prev = syncProgressStore.get.contractsCompleted();
                    syncProgressStore.set.contractsCompleted(prev + 1);
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
