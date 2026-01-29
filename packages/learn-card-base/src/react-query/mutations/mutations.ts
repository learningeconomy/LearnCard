import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CredentialCategory, useWallet } from 'learn-card-base';
import { switchedProfileStore } from '../../stores/walletStore';
import { LCR } from '../../types/credential-records';
import { cloneDeep } from 'lodash';
import { UnsignedVC, VC } from '@learncard/types';

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

    return useMutation<{ uri: string; category: string | undefined }, Error, LCR>({
        mutationFn: async record => {
            try {
                console.log('deleting record (in mutation)', record);
                const wallet = await initWallet();
                // Preemptively empty LC cache
                await wallet.cache.flushIndex();

                // Direct deletion using the record ID - no need to search for it
                if (record.id) {
                    // Delete from LearnCloud index
                    await wallet.index.LearnCloud.remove(record.id);

                    // Also try SQLite index for completeness (if available)
                    try {
                        const sqliteIndex = await wallet.index.SQLite?.get?.().catch(console.error);
                        const foundIndex = sqliteIndex?.find(index => index?.uri === record.uri);

                        if (foundIndex?.id) {
                            await wallet.index.SQLite?.remove?.(foundIndex.id);
                        }
                    } catch (error) {
                        console.error('SQLite removal error:', error);
                    }
                } else {
                    console.error('Record ID not provided for deletion');
                }

                return {
                    uri: record.uri,
                    category: record.metadata?.category,
                };
            } catch (error) {
                return Promise.reject(new Error(String(error)));
            }
        },
        onMutate: async record => {
            console.log('deleting record (in mutation onMutate)', record);
            const uri = record.uri;
            const category = record.category;
            const didWeb = switchedProfileStore.get.switchedDid();

            if (!category) {
                return { uri };
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
            const currentQuery = queryClient.getQueryData([
                'useGetCredentials',
                didWeb ?? '',
                category,
            ]);
            const currentQueryList = queryClient.getQueryData([
                'useGetCredentialList',
                didWeb ?? '',
                category,
            ]);

            console.log('optimistic update');

            // Update cache optimistically
            if (currentQuery || currentQueryList) {
                // Filter out the credential from useGetCredentials cache
                const updatedQuery = currentQuery
                    ? currentQuery.filter((index: any) => {
                          return index?.uri !== uri;
                      })
                    : undefined;

                // Update useGetCredentialList cache
                const updatedQueryList = cloneDeep(currentQueryList);
                if ((updatedQueryList as any)?.pages?.[0]?.records) {
                    (updatedQueryList as any).pages[0].records = (
                        updatedQueryList as any
                    ).pages[0].records.filter((index: any) => {
                        return index.uri !== uri;
                    });
                }

                // Save original stale times to restore later
                const oldStaleTime =
                    queryClient.getQueryDefaults([
                        'useGetCredentials',
                        didWeb ?? '',
                        category,
                        true,
                    ])?.staleTime ?? 0;

                const oldListStaleTime =
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

                console.log('setting list', updatedQueryList);
                queryClient.setQueryData(
                    ['useGetCredentialList', didWeb ?? '', category],
                    updatedQueryList
                );

                // Return context for onError
                return {
                    currentQuery,
                    oldStaleTime,
                    oldListStaleTime,
                    category,
                    uri,
                };
            }

            return { uri, category };
        },
        onError: (_, __, context) => {
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
        onSuccess: result => {
            const { category, uri } = result;
            const didWeb = switchedProfileStore.get.switchedDid();

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

            queryClient.invalidateQueries({ queryKey: ['boosts'] });
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
        mutationFn: async ({ boostUri, recipientProfileId }) => {
            try {
                const wallet = await initWallet();
                const result = await (wallet?.invoke as any)?.revokeBoostRecipient(
                    boostUri,
                    recipientProfileId
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
