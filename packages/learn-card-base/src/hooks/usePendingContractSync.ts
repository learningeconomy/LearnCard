import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ConsentFlowTerms } from '@learncard/types';

import { useWallet } from './useWallet';
import { getOrCreateSharedUriForWallet } from './useSharedUrisInTerms';
import { getOrFetchConsentedContracts } from './useConsentedContracts';
import { contractCategoryNameToCategoryMetadata } from '../types/boostAndCredentialMetadata';
import {
    PendingContractSyncJob,
    pendingContractSyncStore,
    usePendingContractSyncJobs,
} from '../stores/pendingContractSyncStore';
import { getLogger } from '../logging/logger';

const log = getLogger('pending-contract-sync');

const MAX_CONCURRENT_CREDENTIAL_SYNCS = 8;
const MAX_JOB_RETRIES = 3;

type SyncCredentialTask = {
    categoryName: string;
    credentialCategory: string;
    sourceUri: string;
};

const isCategoryEligibleForSync = (
    categoryConfig: ConsentFlowTerms['read']['credentials']['categories'][string]
): boolean => {
    if (!categoryConfig || typeof categoryConfig === 'boolean') return Boolean(categoryConfig);

    return (
        categoryConfig.shareAll === true &&
        categoryConfig.sharing === true &&
        (!categoryConfig.shareUntil || categoryConfig.shareUntil > new Date().toISOString())
    );
};

const runWithConcurrency = async <T>(
    items: T[],
    limit: number,
    worker: (item: T) => Promise<void>
): Promise<void> => {
    let nextIndex = 0;

    const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (nextIndex < items.length) {
            const item = items[nextIndex];
            nextIndex += 1;
            await worker(item);
        }
    });

    await Promise.all(runners);
};

export const usePendingContractSync = (enabled = true): void => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    const jobs = usePendingContractSyncJobs(); // get all jobs

    const processingJobIdRef = useRef<string | null>(null); // track currently processing job
    const [workerTick, setWorkerTick] = useState(0);

    useEffect(() => {
        if (!enabled || processingJobIdRef.current) return;

        const nextJob = Object.values(jobs)
            .filter(job => job.status !== 'done' && job.retryCount < MAX_JOB_RETRIES)
            .sort((a, b) => a.createdAt - b.createdAt)[0];

        if (!nextJob) return;

        processingJobIdRef.current = nextJob.id;

        const processJob = async (job: PendingContractSyncJob): Promise<void> => {
            const startedAt = Date.now();
            pendingContractSyncStore.set.markRunning(job.id); // mark job as running

            try {
                const wallet = await initWallet();
                const contracts = await getOrFetchConsentedContracts(queryClient, wallet);
                const consentedContract = contracts.find(
                    contract =>
                        contract.uri === job.termsUri ||
                        contract.contract.uri === job.contractUri ||
                        contract.contract.owner.did === job.ownerDid
                );

                if (!consentedContract) {
                    throw new Error('Consented contract terms were not found for background sync');
                }

                const categoryEntries = Object.entries(
                    consentedContract.terms.read?.credentials?.categories ?? {}
                ).filter(([, categoryConfig]) => isCategoryEligibleForSync(categoryConfig));

                const taskGroups = await Promise.all(
                    categoryEntries.map(async ([categoryName]) => {
                        const credentialCategory =
                            contractCategoryNameToCategoryMetadata(categoryName)?.credentialType ??
                            categoryName;
                        const records = await wallet.index.LearnCloud.get({
                            category: credentialCategory,
                        });

                        return records.map(
                            record =>
                                ({
                                    categoryName,
                                    credentialCategory,
                                    sourceUri: record.uri,
                                } as SyncCredentialTask)
                        );
                    })
                );

                const tasks = taskGroups.flat();
                pendingContractSyncStore.set.setTotals(job.id, tasks.length);

                const sharedUrisByCategory: Record<string, string[]> = {
                    ...job.syncedSharedUrisByCategory,
                };

                await runWithConcurrency(
                    tasks,
                    MAX_CONCURRENT_CREDENTIAL_SYNCS,
                    async ({ categoryName, credentialCategory, sourceUri }) => {
                        const stepStartedAt = Date.now();

                        try {
                            const sharedUri = await getOrCreateSharedUriForWallet(
                                wallet,
                                job.ownerDid,
                                queryClient,
                                sourceUri,
                                credentialCategory
                            );

                            if (!sharedUri) {
                                throw new Error('No shared URI was returned');
                            }

                            sharedUrisByCategory[categoryName] = [
                                ...new Set([
                                    ...(sharedUrisByCategory[categoryName] ?? []),
                                    sharedUri,
                                ]),
                            ];

                            pendingContractSyncStore.set.recordCredentialSynced(
                                job.id,
                                categoryName,
                                sharedUri
                            );

                            log.info('Contract sync credential materialized', {
                                contractUri: job.contractUri,
                                termsUri: job.termsUri,
                                category: categoryName,
                                elapsedMs: Date.now() - stepStartedAt,
                            });
                        } catch (error) {
                            const message = error instanceof Error ? error.message : String(error);
                            pendingContractSyncStore.set.recordCredentialFailed(job.id, message);
                            log.error('Contract sync credential failed', error, {
                                contractUri: job.contractUri,
                                termsUri: job.termsUri,
                                category: categoryName,
                                elapsedMs: Date.now() - stepStartedAt,
                            });
                        }
                    }
                );

                const categoriesToSync = Object.fromEntries(
                    Object.entries(sharedUrisByCategory)
                        .map(([category, uris]): [string, string[]] => [
                            category,
                            [...new Set(uris)],
                        ])
                        .filter(([, uris]) => uris.length > 0)
                ) as Record<string, string[]>;

                if (Object.keys(categoriesToSync).length > 0) {
                    const syncStartedAt = Date.now();
                    await wallet.invoke.syncCredentialsToContract(job.termsUri, categoriesToSync);
                    queryClient.invalidateQueries({
                        queryKey: ['useTermsTransactions', job.termsUri],
                    });

                    log.info('Contract sync terms updated', {
                        contractUri: job.contractUri,
                        termsUri: job.termsUri,
                        categoryCount: Object.keys(categoriesToSync).length,
                        credentialCount: Object.values(categoriesToSync).reduce(
                            (total: number, uris: string[]) => total + uris.length,
                            0
                        ),
                        elapsedMs: Date.now() - syncStartedAt,
                    });
                }

                const latestJob = pendingContractSyncStore.get.jobs()[job.id];
                if (latestJob?.failedCredentials && latestJob.failedCredentials > 0) {
                    throw new Error(
                        `Background sync completed with ${latestJob.failedCredentials} failed credential(s)`
                    );
                }

                pendingContractSyncStore.set.markDone(job.id);
                log.info('Contract sync job completed', {
                    contractUri: job.contractUri,
                    termsUri: job.termsUri,
                    credentialCount: tasks.length,
                    elapsedMs: Date.now() - startedAt,
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                pendingContractSyncStore.set.markError(job.id, message);
                log.error('Contract sync job failed', error, {
                    contractUri: job.contractUri,
                    termsUri: job.termsUri,
                    elapsedMs: Date.now() - startedAt,
                });
            }
        };

        processJob(nextJob).finally(() => {
            processingJobIdRef.current = null;
            setWorkerTick(tick => tick + 1);
        });
    }, [enabled, initWallet, jobs, queryClient, workerTick]);
};
