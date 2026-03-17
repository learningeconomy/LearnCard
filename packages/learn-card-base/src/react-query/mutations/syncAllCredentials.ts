import { useMutation, useQueryClient } from '@tanstack/react-query';
import { VC } from '@learncard/types';
import { useWallet, getCategoryForCredential } from 'learn-card-base';
import { CredentialCategory } from 'learn-card-base/types/credentials';
import { CredentialMetadata } from 'learn-card-base/types/credential-records';
import { getOrFetchConsentedContracts } from 'learn-card-base/hooks/useConsentedContracts';
import { useSyncConsentContractsMutation } from './syncConsentFlow';
import { syncProgressStore, resetSyncProgress } from 'learn-card-base';

/**
 * Mutation that scans the entire wallet, groups all credentials by category,
 * fetches all consented contracts, and syncs grouped credentials to each
 * consented contract according to the user's sharing settings.
 */
export const useSyncAllCredentialsToContractsMutation = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();
    const syncContracts = useSyncConsentContractsMutation();

    return useMutation<void, Error, void>({
        mutationFn: async () => {
            resetSyncProgress();
            syncProgressStore.set.isActive(true);
            syncProgressStore.set.phase('scanning');
            syncProgressStore.set.startedAt(Date.now());

            try {
                const wallet = await initWallet();

                // 1) Page defensively through ALL credentials in LearnCloud index
                const recordsByCategory: Partial<Record<CredentialCategory, string[]>> = {};

                let cursor: string | undefined = undefined;
                let page = await wallet.index.LearnCloud.getPage!<CredentialMetadata>(undefined, {
                    limit: 100,
                });
                do {
                    const pageRecords = page?.records ?? [];

                    // Progress: page processed + records scanned
                    const prevPages = syncProgressStore.get.pagesProcessed();
                    syncProgressStore.set.pagesProcessed(prevPages + 1);
                    const prevRecords = syncProgressStore.get.recordsScanned();
                    syncProgressStore.set.recordsScanned(prevRecords + pageRecords.length);

                    // Resolve categories robustly (handles boost creds) and group URIs
                    const grouped = await Promise.all(
                        pageRecords.map(async record => {
                            try {
                                const vc = (await wallet.read.get(record.uri)) as VC | undefined;
                                const category: CredentialCategory = vc
                                    ? await getCategoryForCredential(vc, wallet)
                                    : (record.category as CredentialCategory) || 'Achievement';

                                return { uri: record.uri, category } as const;
                            } catch {
                                // Fallback to index category if resolution fails
                                const fallbackCat =
                                    (record.category as CredentialCategory) || 'Achievement';
                                return { uri: record.uri, category: fallbackCat } as const;
                            }
                        })
                    );

                    for (const { uri, category } of grouped) {
                        if (!recordsByCategory[category]) recordsByCategory[category] = [];
                        // Avoid duplicates
                        if (!recordsByCategory[category]!.includes(uri)) {
                            recordsByCategory[category]!.push(uri);
                        }
                    }

                    // Progress: categories found
                    syncProgressStore.set.categoriesFound(
                        Object.keys(recordsByCategory).length
                    );

                    cursor = page?.hasMore ? page?.cursor : undefined;

                    if (cursor) {
                        page = await wallet.index.LearnCloud.getPage!<CredentialMetadata>(
                            undefined,
                            {
                                cursor,
                                limit: 100,
                            }
                        );
                    }
                } while (cursor);

                // 2) Fetch all consented contracts for the current user
                const allContracts = await getOrFetchConsentedContracts(queryClient, wallet);

                if (!allContracts?.length) {
                    syncProgressStore.set.phase('done');
                    syncProgressStore.set.finishedAt(Date.now());
                    syncProgressStore.set.isActive(false);
                    return; // Nothing to sync to
                }

                // Prepare for syncing phase
                syncProgressStore.set.phase('syncing');
                syncProgressStore.set.totalContracts(allContracts.length);
                syncProgressStore.set.contractsCompleted(0);
                syncProgressStore.set.currentContract(null);

                // 3) Delegate syncing logic to the existing mutation which:
                //    - Filters per-contract categories by share settings and expiry
                //    - Creates or reuses shared URIs per contract owner to avoid re-sharing
                //    - Calls syncCredentialsToContract per contract
                await syncContracts.mutateAsync({
                    recordsByCategory,
                    allContracts: allContracts.map(c => ({
                        contract: c.contract,
                        terms: c.terms,
                        uri: c.uri,
                        expiresAt: c.expiresAt,
                        oneTime: c.oneTime,
                    })),
                });

                syncProgressStore.set.phase('done');
                syncProgressStore.set.finishedAt(Date.now());
                syncProgressStore.set.isActive(false);
            } catch (e) {
                syncProgressStore.set.phase('error');
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                syncProgressStore.set.lastError((e as any)?.message ?? 'Unknown error');
                syncProgressStore.set.finishedAt(Date.now());
                syncProgressStore.set.isActive(false);
                throw e;
            }
        },
    });
};
