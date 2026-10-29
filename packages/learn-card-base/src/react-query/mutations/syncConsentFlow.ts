import { InfiniteData, QueryClient, useMutation } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
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
import { loadContractAudience } from '../../hooks/consentAudience';
import { CredentialMetadata } from 'learn-card-base/types/credential-records';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { useAcceptCredentialMutation } from './mutations';
import { ConsentFlowContractDetails, ConsentFlowTerms } from '@learncard/types';
import { LEARNCARD_AI_PASSPORT_CONTRACT_URI } from 'learn-card-base/constants/aiPassport';
import { queueAiInsightCredentialRefresh } from './ai-passport';
import { getLogger } from '../../logging/logger';
import { getAcceptLifecycleRejection, LifecycleRejection } from './consentFlowLifecycle';
import {
    clearConsentFlowRecordMarker,
    getConsentFlowRecordMarker,
    setConsentFlowRecordMarker,
} from './consentFlowRecordMarkers';

const log = getLogger('sync-consent-flow');

export type ConsentRecord = {
    credentialUri: string;
    contractUri: string;
    termsUri: string;
    category?: string;
    /** Already in the wallet index, so the sync only needs to accept it on the server. */
    alreadyStored?: boolean;
};

export type ConsentedContract = {
    contract: ConsentFlowContractDetails;
    terms: ConsentFlowTerms;
    uri: string;
    expiresAt?: string;
    oneTime?: boolean;
    status?: 'live' | 'stale' | 'withdrawn';
};

// Retained historical copies still belong to credentials in the personal index.
// An audience change must not silently erase individually selected credentials.
const getIndexedSharedUris = async (learnCard: BespokeLearnCard): Promise<Set<string>> => {
    const sharedUris = new Set<string>();

    let cursor: string | undefined;
    let page = await learnCard.index.LearnCloud.getPage!<CredentialMetadata>(undefined, {
        limit: 100,
    });

    do {
        (page?.records ?? []).forEach(record => {
            Object.values(record.sharedUris ?? {})
                .flat()
                .forEach(uri => sharedUris.add(uri));
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

            for (const {
                contract,
                terms,
                uri: termsUri,
                expiresAt,
                oneTime,
                status,
            } of allContracts) {
                if (
                    (status && status !== 'live') ||
                    oneTime ||
                    (expiresAt && Date.parse(expiresAt) <= Date.now()) ||
                    (contract.expiresAt && Date.parse(contract.expiresAt) <= Date.now())
                )
                    continue;
                // Update current contract progress
                try {
                    syncProgressStore.set.currentContract(contract.owner.did);
                } catch {}

                const audience = await loadContractAudience(learnCard, contract.uri);
                let contractTerms = terms;
                try {
                    const validSharedUris = await getIndexedSharedUris(learnCard);
                    const { nextTerms, removed } = pruneStaleSharedUris(terms, validSharedUris);

                    if (removed > 0) {
                        await learnCard.invoke.updateContractTerms(termsUri, {
                            terms: nextTerms,
                            audienceVersion: audience.audienceVersion,
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
                                            audience.recipients,
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
                            categoryMap as Record<string, string[]>,
                            audience.audienceVersion
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
        // Sync may update terms before a later operation fails. Mark cached consent
        // records stale on settlement so active and imperative consumers stay current.
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['useConsentedContracts'] }),
    });
};

class LifecycleRejectedError extends Error {
    constructor(
        readonly status: LifecycleRejection,
        readonly rolledBack: boolean
    ) {
        super(`Credential is ${status}`);
        this.name = 'LifecycleRejectedError';
    }
}

/**
 * Remove a record this sync indexed, plus the caches addVCtoWallet updated for it. Idempotent:
 * an id that was never written, or that's already gone (e.g. revoked-credential cleanup got
 * there first), is a no-op. Only ever called with an id from the sync's ownership marker.
 */
const rollBackIndexedRecord = async (
    learnCard: BespokeLearnCard,
    queryClient: QueryClient,
    { recordId, uri }: { recordId: string; uri: string }
) => {
    try {
        await learnCard.index.LearnCloud.remove(recordId);
    } catch (error) {
        const remaining = await learnCard.index.LearnCloud.get({ uri });
        if (remaining.some(record => record.id === recordId)) throw error;
    }

    try {
        await learnCard.cache?.flushIndex?.();
    } catch (error) {
        log.warn('Failed to flush index cache after consent flow rollback', uri, error);
    }

    queryClient.setQueriesData<InfiniteData<{ records: { id?: string }[] }>>(
        { queryKey: ['useGetCredentialList'] },
        data =>
            data?.pages
                ? {
                      ...data,
                      pages: data.pages.map(page => ({
                          ...page,
                          records: (page.records ?? []).filter(record => record.id !== recordId),
                      })),
                  }
                : data
    );
    queryClient.removeQueries({ queryKey: ['useGetResolvedCredential', uri] });
    await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['useGetCredentialList'] }),
        queryClient.invalidateQueries({ queryKey: ['useGetCredentialCount'] }),
    ]);
};

/**
 * Accept all credentials and add them to the wallet.
 */
export const useAcceptAndStoreCredentialsMutation = () => {
    const acceptCredential = useAcceptCredentialMutation();
    const { addVCtoWallet, initWallet, recordAcceptedCredentialClaim } = useWallet();
    const queryClient = useQueryClient();

    return useMutation<
        { stored: ConsentRecord[]; failed: ConsentRecord[]; rejected: ConsentRecord[] },
        Error,
        { allRecords: ConsentRecord[] }
    >({
        mutationFn: async ({ allRecords }) => {
            walletStore.set.setIsSyncing(WalletSyncState.Syncing);
            const learnCard = await initWallet();
            const profileDid = learnCard.id.did();
            // Store each credential independently so one failure doesn't fail the batch
            // or keep the successful ones from being stored.
            // Store before accepting: accepting removes the credential from the server's
            // pending list, so if storing failed after an accept, no later sync would ever
            // see it again. In this order, a failed store leaves it pending (retried next
            // sync), and a transient accept failure leaves it pending and indexed (accepted
            // next sync via alreadyStored, without storing a duplicate).
            // If acceptance is definitively refused because the issuer revoked or suspended
            // the credential, the record this sync created is rolled back so it never sits in
            // the normal wallet. Ownership (profile + URI -> record id) is persisted BEFORE the
            // index write, so this still works if the write landed but its response was lost,
            // or the app reloaded before the rejection. Records without a marker were put there
            // by something else and are never removed.
            const results = await Promise.allSettled(
                allRecords.map(async r => {
                    const uri = r.credentialUri;
                    if (!r.alreadyStored) {
                        // Reuse a marker from an earlier attempt so it always names the only
                        // record this sync could have written for this credential.
                        const recordId = getConsentFlowRecordMarker(profileDid, uri) ?? uuidv4();
                        setConsentFlowRecordMarker(profileDid, uri, recordId);
                        await addVCtoWallet({
                            id: recordId,
                            uri,
                            contractUri: r.contractUri,
                            skipSync: true,
                            deferClaim: true,
                        });
                    }

                    try {
                        await acceptCredential.mutateAsync({ uri });
                    } catch (error) {
                        const rejection = await getAcceptLifecycleRejection(learnCard, uri, error);
                        if (!rejection) throw error;

                        const recordId = getConsentFlowRecordMarker(profileDid, uri);
                        if (recordId) {
                            await rollBackIndexedRecord(learnCard, queryClient, { recordId, uri });
                            clearConsentFlowRecordMarker(profileDid, uri);
                        }
                        throw new LifecycleRejectedError(rejection, Boolean(recordId));
                    }
                    clearConsentFlowRecordMarker(profileDid, uri);
                    void recordAcceptedCredentialClaim(learnCard, uri);
                })
            );

            const stored: ConsentRecord[] = [];
            const failed: ConsentRecord[] = [];
            const rejected: ConsentRecord[] = [];
            results.forEach((result, index) => {
                const record = allRecords[index]!;
                if (result.status === 'fulfilled') {
                    stored.push(record);
                } else if (result.reason instanceof LifecycleRejectedError) {
                    rejected.push(record);
                    log.warn(
                        `Consent flow credential is ${result.reason.status}; not keeping it`,
                        record.credentialUri,
                        { rolledBack: result.reason.rolledBack }
                    );
                } else {
                    failed.push(record);
                    log.warn(
                        'Failed to accept/store consent flow credential',
                        record.credentialUri,
                        result.reason
                    );
                }
            });

            return { stored, failed, rejected };
        },
        onSuccess: ({ stored }) => {
            const count = stored.filter(r => !r.alreadyStored).length;
            if (count === 0) {
                walletStore.set.setIsSyncing(WalletSyncState.NotSyncing);
            } else {
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
