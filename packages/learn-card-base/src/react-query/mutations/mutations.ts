import { InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet } from 'learn-card-base';
import { switchedProfileStore } from '../../stores/walletStore';
import { LCR } from '../../types/credential-records';
import { cloneDeep } from 'lodash';
import { queueAiInsightCredentialRefresh } from './ai-passport';
import { deleteCredentialFromAllContracts } from './pruneConsentFlowDeletedCredentials';
import { useSyncAllCredentialsToContractsMutation } from './syncAllCredentials';
import { ToastTypeEnum, useToast } from '../../hooks/useToast';
import { getLogger } from '../../logging/logger';
const log = getLogger('mutations');

export const getDeletedUrisForCredentialRecord = (record: LCR): string[] => {
    const sharedUris = Object.values(record.sharedUris ?? {}).reduce<string[]>(
        (allSharedUris, recordSharedUris) => {
            return allSharedUris.concat(
                recordSharedUris.filter((uri): uri is string => Boolean(uri))
            );
        },
        []
    );

    return [...new Set([record.uri, ...sharedUris])];
};

// ** CONNECTION MUTATIONS **

type ProfileIdParam = { profileId: string };

export const useConnectWithMutation = () => {
    const { initWallet } = useWallet();

    return useMutation<boolean, Error, ProfileIdParam>({
        mutationFn: async ({ profileId }) => {
            try {
                const wallet = await initWallet();
                const data = await wallet?.invoke?.connectWith(profileId);

                return data;
            } catch (error) {
                return Promise.reject(new Error(String(error)));
            }
        },
    });
};

export const useDisconnectWithMutation = () => {
    const { initWallet } = useWallet();

    return useMutation<boolean, Error, ProfileIdParam>({
        mutationFn: async ({ profileId }) => {
            try {
                const wallet = await initWallet();
                const data = await wallet?.invoke?.disconnectWith(profileId);

                return data;
            } catch (error) {
                return Promise.reject(new Error(String(error)));
            }
        },
    });
};

export const useCancelConnectionRequestMutation = () => {
    const { initWallet } = useWallet();

    return useMutation<boolean, Error, ProfileIdParam>({
        mutationFn: async ({ profileId }) => {
            try {
                const wallet = await initWallet();
                const data = await wallet?.invoke?.cancelConnectionRequest(profileId);

                return data;
            } catch (error) {
                return Promise.reject(new Error(String(error)));
            }
        },
    });
};

export const useAcceptConnectionRequestMutation = () => {
    const { initWallet } = useWallet();

    return useMutation<boolean, Error, ProfileIdParam>({
        mutationFn: async ({ profileId }) => {
            try {
                const wallet = await initWallet();
                const data = await wallet?.invoke?.acceptConnectionRequest(profileId);

                return data;
            } catch (error) {
                return Promise.reject(new Error(String(error)));
            }
        },
    });
};

export const useUnblockProfileMutation = () => {
    const { initWallet } = useWallet();

    return useMutation<boolean, Error, ProfileIdParam>({
        mutationFn: async ({ profileId }) => {
            try {
                const wallet = await initWallet();
                const data = await wallet?.invoke?.unblockProfile(profileId);

                return data;
            } catch (error) {
                return Promise.reject(new Error(String(error)));
            }
        },
    });
};

export const useBlockProfileMutation = () => {
    const { initWallet } = useWallet();

    return useMutation<boolean, Error, ProfileIdParam>({
        mutationFn: async ({ profileId }) => {
            try {
                const wallet = await initWallet();
                const data = await wallet?.invoke?.blockProfile(profileId);

                return data;
            } catch (error) {
                return Promise.reject(new Error(String(error)));
            }
        },
    });
};

// ** CREDENTIAL MUTATIONS **
export const useAcceptCredentialMutation = () => {
    const { initWallet } = useWallet();

    return useMutation({
        mutationFn: async ({
            uri,
            metadata,
        }: {
            uri: string;
            metadata?: Record<string, unknown>;
        }) => {
            const wallet = await initWallet();
            const data = await wallet?.invoke?.acceptCredential(uri, {
                ...(metadata ? { metadata } : {}),
            });

            return data;
        },
    });
};

/**
 * Efficiently delete a credential record using the complete record information
 * instead of searching for it by URI in a category.
 */
export const useDeleteCredentialRecord = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();
    const syncAllCredentialsToContracts = useSyncAllCredentialsToContractsMutation();
    const { presentToast } = useToast();
    const ENABLE_DELETE_CREDENTIAL_LOGS = false;

    const getRecordCategory = (record: LCR) => record.metadata?.category ?? record.category;

    const resolveRecordForDeletion = async (
        wallet: Awaited<ReturnType<typeof initWallet>>,
        record: LCR
    ) => {
        try {
            const resolvedRecord = (await wallet.index.LearnCloud.get?.({ uri: record.uri }))?.[0];

            return (resolvedRecord ?? record) as LCR;
        } catch {
            return record;
        }
    };

    const logDeleteCredentialRefresh = (message: string, data?: Record<string, unknown>) => {
        if (!ENABLE_DELETE_CREDENTIAL_LOGS) return;

        try {
            if (data) {
                log.debug(`[DeleteCredentialRecord] ${message}`, data);
            } else {
                log.debug(`[DeleteCredentialRecord] ${message}`);
            }
        } catch {
            // logging should never break deletion flows
        }
    };

    type DeleteCredentialResult = {
        uri: string;
        category: string | undefined;
        contractUri?: string;
        deletedUris: string[];
        skipPostDeleteCleanup?: boolean;
        deferPostDeleteCleanup?: boolean;
    };

    type DeleteCredentialInput = LCR & {
        skipPostDeleteCleanup?: boolean;
        ignoreMissingRemoteRecord?: boolean;
        onLocalDeleteComplete?: () => void;
        deferPostDeleteCleanup?: boolean;
    };

    type DeleteCredentialContext = {
        currentQuery?: LCR[];
        oldStaleTime?: unknown;
        oldListStaleTime?: unknown;
        category?: string;
        uri: string;
        skipPostDeleteCleanup?: boolean;
    };

    const isMissingDeleteCredentialFromAllContractsProcedureError = (error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);

        return (
            message.includes('contracts.deleteCredentialFromAllContracts') ||
            message.includes(
                'No procedure found on path "contracts.deleteCredentialFromAllContracts"'
            )
        );
    };

    const isMissingCredentialRecordError = (error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);

        return message.includes('Could not delete record');
    };

    return useMutation<
        DeleteCredentialResult,
        Error,
        DeleteCredentialInput,
        DeleteCredentialContext
    >({
        mutationFn: async record => {
            try {
                log.debug('deleting record (in mutation)', record);
                const wallet = await initWallet();
                await wallet.cache.flushIndex();
                const recordToDelete = await resolveRecordForDeletion(wallet, record);
                const category = getRecordCategory(record);
                const deletedUris = getDeletedUrisForCredentialRecord(recordToDelete);

                // Direct deletion using the record ID - no need to search for it
                if (recordToDelete.id) {
                    try {
                        await wallet.index.LearnCloud.remove(recordToDelete.id);
                    } catch (error) {
                        if (
                            !record.ignoreMissingRemoteRecord ||
                            !isMissingCredentialRecordError(error)
                        ) {
                            throw error;
                        }
                    }

                    // Also try SQLite index for completeness (if available)
                    try {
                        const sqliteIndex = await wallet.index.SQLite?.get?.().catch(err =>
                            log.error('SQLite index get failed', err)
                        );
                        const foundIndex = sqliteIndex?.find(
                            index => index?.uri === recordToDelete.uri
                        );

                        if (foundIndex?.id) {
                            await wallet.index.SQLite?.remove?.(foundIndex.id);
                        }
                    } catch (error) {
                        log.error('SQLite removal error:', error);
                    }

                    try {
                        record.onLocalDeleteComplete?.();
                    } catch (error) {
                        log.error('Local delete completion callback failed:', error);
                    }
                } else {
                    log.error('Record ID not provided for deletion');

                    try {
                        record.onLocalDeleteComplete?.();
                    } catch (error) {
                        log.error('Local delete completion callback failed:', error);
                    }
                }

                return {
                    uri: recordToDelete.uri,
                    category,
                    contractUri: recordToDelete.metadata?.contractUri,
                    deletedUris,
                    skipPostDeleteCleanup: Boolean(record.skipPostDeleteCleanup),
                    deferPostDeleteCleanup: Boolean(record.deferPostDeleteCleanup),
                };
            } catch (error) {
                return Promise.reject(new Error(String(error)));
            }
        },
        onMutate: async record => {
            log.debug('deleting record (in mutation onMutate)', record);
            const uri = record.uri;
            const category = getRecordCategory(record);

            if (record.skipPostDeleteCleanup) {
                return {
                    uri,
                    skipPostDeleteCleanup: true,
                } satisfies DeleteCredentialContext;
            }

            const didWeb = switchedProfileStore.get.switchedDid();

            if (!category) {
                return { uri } satisfies DeleteCredentialContext;
            }

            // Cancel related queries
            await queryClient.cancelQueries({
                queryKey: ['useGetCredentials', didWeb ?? '', category],
            });
            await queryClient.cancelQueries({
                queryKey: ['useGetCredentialList', didWeb ?? '', category],
            });
            await queryClient.cancelQueries({
                queryKey: ['boosts'],
            });

            // Get current cached data
            const currentQuery = queryClient.getQueryData<LCR[]>([
                'useGetCredentials',
                didWeb ?? '',
                category,
            ]) as LCR[] | undefined;
            const currentQueryList = queryClient.getQueryData<
                InfiniteData<{
                    cursor?: string;
                    hasMore: boolean;
                    records: LCR[];
                }>
            >(['useGetCredentialList', didWeb ?? '', category]);

            log.debug('optimistic update');

            // Update cache optimistically
            if (currentQuery || currentQueryList) {
                // Filter out the credential from useGetCredentials cache
                const updatedQuery = currentQuery?.filter(index => index?.uri !== uri);

                // Update useGetCredentialList cache
                const updatedQueryList = cloneDeep(currentQueryList);
                if (updatedQueryList?.pages?.[0]?.records) {
                    updatedQueryList.pages[0].records = updatedQueryList.pages[0].records.filter(
                        index => {
                            return index.uri !== uri;
                        }
                    );
                }

                // Save original stale times to restore later
                const oldStaleTime: any =
                    queryClient.getQueryDefaults([
                        'useGetCredentials',
                        didWeb ?? '',
                        category,
                        true,
                    ])?.staleTime ?? 0;

                const oldListStaleTime: any =
                    queryClient.getQueryDefaults(['useGetCredentialList', didWeb ?? '', category])
                        ?.staleTime ?? 0;

                // Set stale time to infinity to prevent refetching during the mutation
                queryClient.setQueryDefaults(['useGetCredentials', didWeb ?? '', category, true], {
                    staleTime: Infinity,
                });
                queryClient.setQueryDefaults(['useGetCredentialList', didWeb ?? '', category], {
                    staleTime: Infinity,
                });

                // Write updated data to cache
                queryClient.setQueryData(
                    ['useGetCredentials', didWeb ?? '', category, true],
                    updatedQuery
                );

                log.debug('setting list', updatedQueryList);
                queryClient.setQueryData(
                    ['useGetCredentialList', didWeb ?? '', category],
                    updatedQueryList
                );

                const context: DeleteCredentialContext = {
                    uri,
                    ...(category ? { category } : {}),
                    ...(currentQuery ? { currentQuery } : {}),
                    oldStaleTime,
                    oldListStaleTime,
                    skipPostDeleteCleanup: Boolean(record.skipPostDeleteCleanup),
                };

                return context;
            }

            return {
                uri,
                ...(category ? { category } : {}),
            };
        },
        onError: (_, __, context) => {
            if (context?.skipPostDeleteCleanup) {
                return;
            }

            // On error, restore previous query data if it exists
            if (context?.category && context?.currentQuery) {
                const didWeb = switchedProfileStore.get.switchedDid();

                // Restore original queries
                queryClient.setQueryData(
                    ['useGetCredentials', didWeb ?? '', context.category, true],
                    context.currentQuery
                );
            }
        },
        onSuccess: async result => {
            if (result.skipPostDeleteCleanup) {
                return;
            }

            const { category } = result;
            const didWeb = switchedProfileStore.get.switchedDid();

            const runPostDeleteCleanup = async () => {
                logDeleteCredentialRefresh('Running credential cleanup after delete', {
                    uri: result.uri,
                    category,
                    contractUri: result.contractUri ?? null,
                    deletedUriCount: result.deletedUris.length,
                });

                const wallet = await initWallet();

                try {
                    const cleanupResult = await deleteCredentialFromAllContracts({
                        wallet,
                        queryClient,
                        deletedUris: result.deletedUris,
                    });

                    logDeleteCredentialRefresh('Credential cleanup completed after delete', {
                        uri: result.uri,
                        category,
                        contractUri: result.contractUri ?? null,
                        deletedUriCount: result.deletedUris.length,
                        contractsUpdated: cleanupResult.contractsUpdated,
                        removedSharedUris: cleanupResult.removedSharedUris,
                    });

                    logDeleteCredentialRefresh(
                        'Queueing AI Insight refresh after credential cleanup',
                        {
                            uri: result.uri,
                            category,
                            contractUri: result.contractUri ?? null,
                            deletedUriCount: result.deletedUris.length,
                            contractsUpdated: cleanupResult.contractsUpdated,
                            removedSharedUris: cleanupResult.removedSharedUris,
                        }
                    );
                    await queueAiInsightCredentialRefresh({
                        wallet,
                        queryClient,
                    });
                } catch (error) {
                    if (isMissingDeleteCredentialFromAllContractsProcedureError(error)) {
                        logDeleteCredentialRefresh(
                            'Credential cleanup procedure missing; running full sync fallback',
                            {
                                uri: result.uri,
                                category,
                                contractUri: result.contractUri ?? null,
                                deletedUriCount: result.deletedUris.length,
                            }
                        );

                        await syncAllCredentialsToContracts.mutateAsync();

                        logDeleteCredentialRefresh(
                            'Queueing AI Insight refresh after full sync fallback',
                            {
                                uri: result.uri,
                                category,
                                contractUri: result.contractUri ?? null,
                                deletedUriCount: result.deletedUris.length,
                            }
                        );

                        await queueAiInsightCredentialRefresh({
                            wallet: await initWallet(),
                            queryClient,
                        });
                        return;
                    }

                    if (ENABLE_DELETE_CREDENTIAL_LOGS) {
                        log.error('Failed to run post-delete cleanup:', error);
                    }

                    presentToast(
                        'Credential deleted. Some connected data may take a moment to update. We’ll try again automatically.',
                        {
                            title: 'Update delayed',
                            type: ToastTypeEnum.Error,
                            hasDismissButton: true,
                        }
                    );
                } finally {
                    queryClient.invalidateQueries({ queryKey: ['boosts'] });
                }
            };

            queryClient.invalidateQueries({
                queryKey: ['getChecklistCredentialCounts'],
            });

            if (category) {
                // Invalidate related queries to refresh data
                queryClient.invalidateQueries({
                    queryKey: ['useGetCredentials', didWeb ?? '', category],
                });
                queryClient.invalidateQueries({
                    queryKey: ['useGetCredentialList', didWeb ?? '', category],
                });
                queryClient.invalidateQueries({
                    queryKey: ['useGetCredentialCount', didWeb ?? '', category],
                });
            }

            if (result.deferPostDeleteCleanup) {
                void runPostDeleteCleanup();
                return;
            }

            await runPostDeleteCleanup();
        },
        onSettled: (_, __, ___, context) => {
            // Reset stale times to original values when mutation is complete
            if (context?.category) {
                const didWeb = switchedProfileStore.get.switchedDid();

                // Reset stale times to their original values
                if (context.oldStaleTime !== undefined) {
                    queryClient.setQueryDefaults(
                        ['useGetCredentials', didWeb ?? '', context.category, true],
                        {
                            staleTime: context.oldStaleTime as number,
                        }
                    );
                }

                if (context.oldListStaleTime !== undefined) {
                    queryClient.setQueryDefaults(
                        ['useGetCredentialList', didWeb ?? '', context.category],
                        {
                            staleTime: context.oldListStaleTime as number,
                        }
                    );
                }

                // Invalidate affected queries to refresh the data
                queryClient.invalidateQueries({
                    queryKey: ['useGetCredentials', didWeb ?? '', context.category],
                });
                queryClient.invalidateQueries({
                    queryKey: ['useGetCredentialList', didWeb ?? '', context.category],
                });
                queryClient.invalidateQueries({
                    queryKey: ['boosts'],
                });
            }
        },
    });
};

// ** BOOST MUTATIONS **

type RevokeBoostRecipientParams = {
    boostUri: string;
    recipientProfileId: string;
    credentialUri?: string;
};

/**
 * Revoke a boost recipient, marking their credential as revoked.
 * This will filter the recipient from boost recipients lists and
 * remove any permissions that were granted via claim hooks.
 */
export const useRevokeBoostRecipient = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    return useMutation<boolean, Error, RevokeBoostRecipientParams>({
        mutationFn: async ({ boostUri, recipientProfileId, credentialUri }) => {
            try {
                const wallet = await initWallet();
                const result = await (wallet?.invoke as any)?.revokeBoostRecipient(
                    boostUri,
                    recipientProfileId,
                    credentialUri
                );

                return result;
            } catch (error) {
                return Promise.reject(new Error(String(error)));
            }
        },
        onSuccess: (_, { boostUri }) => {
            // Invalidate boost recipients queries to refresh the data
            queryClient.invalidateQueries({
                queryKey: ['boostRecipients', boostUri],
            });
            queryClient.invalidateQueries({
                queryKey: ['getPaginatedBoostRecipients'],
            });
            queryClient.invalidateQueries({
                queryKey: ['getBoostRecipientCount'],
            });
            queryClient.invalidateQueries({
                queryKey: ['boosts'],
            });
            // Invalidate Scouts app member list query
            queryClient.invalidateQueries({
                queryKey: ['useNetworkMembers'],
            });
        },
    });
};

export * from './networkConsent';

/**
 * Suspend a boost recipient, temporarily disabling their credential.
 * The recipient remains visible in the list with status='suspended'.
 */
export const useSuspendBoostRecipient = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    return useMutation<boolean, Error, RevokeBoostRecipientParams>({
        mutationFn: async ({ boostUri, recipientProfileId, credentialUri }) => {
            try {
                const wallet = await initWallet();
                const result = await (wallet?.invoke as any)?.suspendBoostRecipient(
                    boostUri,
                    recipientProfileId,
                    credentialUri
                );

                return result;
            } catch (error) {
                return Promise.reject(new Error(String(error)));
            }
        },
        onSuccess: (_, { boostUri }) => {
            queryClient.invalidateQueries({
                queryKey: ['boostRecipients', boostUri],
            });
            queryClient.invalidateQueries({
                queryKey: ['getPaginatedBoostRecipients'],
            });
            queryClient.invalidateQueries({
                queryKey: ['getBoostRecipientCount'],
            });
            queryClient.invalidateQueries({
                queryKey: ['boosts'],
            });
            queryClient.invalidateQueries({
                queryKey: ['useNetworkMembers'],
            });
        },
    });
};

/**
 * Unsuspend a boost recipient, re-enabling their previously suspended credential.
 */
export const useUnsuspendBoostRecipient = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    return useMutation<boolean, Error, RevokeBoostRecipientParams>({
        mutationFn: async ({ boostUri, recipientProfileId, credentialUri }) => {
            try {
                const wallet = await initWallet();
                const result = await (wallet?.invoke as any)?.unsuspendBoostRecipient(
                    boostUri,
                    recipientProfileId,
                    credentialUri
                );

                return result;
            } catch (error) {
                return Promise.reject(new Error(String(error)));
            }
        },
        onSuccess: (_, { boostUri }) => {
            queryClient.invalidateQueries({
                queryKey: ['boostRecipients', boostUri],
            });
            queryClient.invalidateQueries({
                queryKey: ['getPaginatedBoostRecipients'],
            });
            queryClient.invalidateQueries({
                queryKey: ['getBoostRecipientCount'],
            });
            queryClient.invalidateQueries({
                queryKey: ['boosts'],
            });
            queryClient.invalidateQueries({
                queryKey: ['useNetworkMembers'],
            });
        },
    });
};
