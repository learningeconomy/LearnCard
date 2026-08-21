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
    getNextRetryAt,
    isJobReadyToProcess,
    MAX_JOB_RETRIES,
} from '../stores/pendingContractSyncStore';
import { demoSessionStore } from '../stores/demoSessionStore';
import { getLogger } from '../logging/logger';

const log = getLogger('pending-contract-sync');

const MAX_CONCURRENT_CREDENTIAL_SYNCS = 8;

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

/**
 * Drives the background contract-sync worker. The single-flight guard
 * (`processingJobIdRef`) is per-hook-instance, so this hook MUST be mounted
 * exactly once in the tree. Mounting it in two trees simultaneously would let
 * two workers race on the same jobs.
 */
export const usePendingContractSync = (enabled = true): void => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    // Pause the worker in Sample Wallet mode: contract-sync jobs write real
    // credentials, and firing them would open the demo gate sheet without user
    // intent. Jobs stay queued and resume when demo mode exits.
    const demoPersonaId = demoSessionStore.use.activePersonaId();

    const jobs = usePendingContractSyncJobs(); // get all jobs

    const processingJobIdRef = useRef<string | null>(null); // track currently processing job
    const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [workerTick, setWorkerTick] = useState(0);

    // Cancel any pending retry-wake timer on unmount.
    useEffect(
        () => () => {
            if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        },
        []
    );

    // Prune long-finished jobs once on mount so the persisted store stays bounded
    // even for users who never enqueue new jobs.
    useEffect(() => {
        if (enabled) pendingContractSyncStore.set.pruneDoneJobs();
    }, [enabled]);

    useEffect(() => {
        if (!enabled || demoPersonaId || processingJobIdRef.current) return;

        const pendingJobs = Object.values(jobs)
            .filter(job => job.status !== 'done' && job.retryCount < MAX_JOB_RETRIES)
            .sort((a, b) => a.createdAt - b.createdAt);

        const nextJob = pendingJobs.find(job => isJobReadyToProcess(job));

        // No job is ready right now. If some job is waiting out its retry
        // backoff, schedule a single wake-up for when the soonest one becomes
        // eligible instead of busy-looping the effect.
        if (!nextJob) {
            const soonestRetryAt = pendingJobs.reduce<number | null>((soonest, job) => {
                const retryAt = getNextRetryAt(job);
                if (retryAt <= 0) return soonest;
                return soonest === null ? retryAt : Math.min(soonest, retryAt);
            }, null);

            if (soonestRetryAt !== null) {
                if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
                const delay = Math.max(0, soonestRetryAt - Date.now());
                retryTimerRef.current = setTimeout(() => {
                    retryTimerRef.current = null;
                    setWorkerTick(tick => tick + 1);
                }, delay);
            }

            return;
        }

        processingJobIdRef.current = nextJob.id;
        log.info('Selected pending contract sync job', {
            contractUri: nextJob.contractUri,
            termsUri: nextJob.termsUri,
            ownerDid: nextJob.ownerDid,
            status: nextJob.status,
            retryCount: nextJob.retryCount,
            totalCredentials: nextJob.totalCredentials,
            completedCredentials: nextJob.completedCredentials,
            failedCredentials: nextJob.failedCredentials,
        });

        const processJob = async (job: PendingContractSyncJob): Promise<void> => {
            pendingContractSyncStore.set.markRunning(job.id); // mark job as running
            log.info('Starting pending contract sync job', {
                contractUri: job.contractUri,
                termsUri: job.termsUri,
                ownerDid: job.ownerDid,
                retryCount: job.retryCount,
                completedCredentials: job.completedCredentials,
                failedCredentials: job.failedCredentials,
            });

            try {
                const wallet = await initWallet();
                log.info('Loaded wallet for contract sync job', {
                    contractUri: job.contractUri,
                    termsUri: job.termsUri,
                });
                const contracts = await getOrFetchConsentedContracts(queryClient, wallet);
                const consentedContract = contracts.find(
                    contract =>
                        contract.uri === job.termsUri ||
                        contract.contract.uri === job.contractUri ||
                        contract.contract.owner.did === job.ownerDid
                );

                if (!consentedContract) {
                    log.error('Consented contract terms were not found for background sync', {
                        contractUri: job.contractUri,
                        termsUri: job.termsUri,
                        ownerDid: job.ownerDid,
                    });
                    throw new Error('Consented contract terms were not found for background sync');
                }

                const categoryEntries = Object.entries(
                    consentedContract.terms.read?.credentials?.categories ?? {}
                ).filter(([, categoryConfig]) => isCategoryEligibleForSync(categoryConfig));
                log.info('Resolved contract sync categories', {
                    contractUri: job.contractUri,
                    termsUri: job.termsUri,
                    categoryCount: categoryEntries.length,
                    categories: categoryEntries.map(([categoryName]) => categoryName),
                });

                const taskGroups = await Promise.all(
                    categoryEntries.map(async ([categoryName]) => {
                        const credentialCategory =
                            contractCategoryNameToCategoryMetadata(categoryName)?.credentialType ??
                            categoryName;
                        const records = await wallet.index.LearnCloud.get({
                            category: credentialCategory,
                        });
                        log.info('Loaded contract sync credentials for category', {
                            contractUri: job.contractUri,
                            termsUri: job.termsUri,
                            category: categoryName,
                            credentialCategory,
                            credentialCount: records.length,
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
                log.info('Prepared contract sync tasks', {
                    contractUri: job.contractUri,
                    termsUri: job.termsUri,
                    taskCount: tasks.length,
                });

                const sharedUrisByCategory: Record<string, string[]> = {
                    ...job.syncedSharedUrisByCategory,
                };

                await runWithConcurrency(
                    tasks,
                    MAX_CONCURRENT_CREDENTIAL_SYNCS,
                    async ({ categoryName, credentialCategory, sourceUri }) => {
                        try {
                            log.info('Starting contract sync credential materialization', {
                                contractUri: job.contractUri,
                                termsUri: job.termsUri,
                                category: categoryName,
                                credentialCategory,
                                sourceUri,
                                processedCredentials:
                                    pendingContractSyncStore.get.jobs()[job.id]
                                        ?.processedCredentials,
                                failedCredentials:
                                    pendingContractSyncStore.get.jobs()[job.id]?.failedCredentials,
                            });

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
                                credentialCategory,
                                sourceUri,
                                sharedUri,
                            });
                        } catch (error) {
                            const message = error instanceof Error ? error.message : String(error);
                            pendingContractSyncStore.set.recordCredentialFailed(job.id, message);
                            log.error('Contract sync credential failed', error, {
                                contractUri: job.contractUri,
                                termsUri: job.termsUri,
                                category: categoryName,
                                credentialCategory,
                                sourceUri,
                            });
                        } finally {
                            pendingContractSyncStore.set.recordCredentialProcessed(job.id);
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
                    log.info('Syncing contract terms to contract', {
                        contractUri: job.contractUri,
                        termsUri: job.termsUri,
                        categoryCount: Object.keys(categoriesToSync).length,
                        credentialCount: Object.values(categoriesToSync).reduce(
                            (total: number, uris: string[]) => total + uris.length,
                            0
                        ),
                    });
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
                    });
                }

                const latestJob = pendingContractSyncStore.get.jobs()[job.id];
                if (latestJob?.failedCredentials && latestJob.failedCredentials > 0) {
                    log.error('Contract sync completed with credential failures', {
                        contractUri: job.contractUri,
                        termsUri: job.termsUri,
                        failedCredentials: latestJob.failedCredentials,
                    });
                    throw new Error(
                        `Background sync completed with ${latestJob.failedCredentials} failed credential(s)`
                    );
                }

                pendingContractSyncStore.set.markDone(job.id);
                log.info('Contract sync job completed', {
                    contractUri: job.contractUri,
                    termsUri: job.termsUri,
                    credentialCount: tasks.length,
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                pendingContractSyncStore.set.markError(job.id, message);
                log.error('Contract sync job failed', error, {
                    contractUri: job.contractUri,
                    termsUri: job.termsUri,
                    ownerDid: job.ownerDid,
                    retryCount: job.retryCount,
                });
            }
        };

        processJob(nextJob).finally(() => {
            processingJobIdRef.current = null;
            setWorkerTick(tick => tick + 1);
        });
    }, [enabled, demoPersonaId, initWallet, jobs, queryClient, workerTick]);
};
