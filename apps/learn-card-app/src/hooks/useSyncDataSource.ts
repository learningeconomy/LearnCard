import { useIonToast } from '@ionic/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    RegistryEntry,
    useWallet,
    useCurrentUser,
    walletStore,
    WalletSyncState,
} from 'learn-card-base';
import useRegistry from 'learn-card-base/hooks/useRegistry';
import { SYNC_STATE, SyncState } from './useRegistryEntryState';

export const useSyncDataSource = (id: string) => {
    const { initWallet, getVCsFromWallet, issueDIDAuthPresentation, storeAndAddManyVCsToWallet } =
        useWallet();
    const user = useCurrentUser();
    const queryClient = useQueryClient();
    const { data: registry } = useRegistry();
    const [presentToast] = useIonToast();

    const setState = (state: SyncState) =>
        queryClient.setQueryData(['useRegistryEntryState', id], state);

    return useMutation({
        mutationFn: async (token?: string) => {
            if (!registry) throw new Error('Could not get registry');

            const entry = registry.find(registryEntry => registryEntry.id === id);

            if (!entry) throw new Error('ID Not in Registry');

            const wallet = await initWallet();

            walletStore.set.setIsSyncing(WalletSyncState.Syncing);

            const { url } = entry;

            let currentIds;
            let challenge = crypto.randomUUID();
            let jwt =
                token ?? (await wallet.invoke.getDidAuthVp({ proofFormat: 'jwt', challenge }));
            const allStoredVCs = await getVCsFromWallet();
            const allStoredVCIds = allStoredVCs.map(vc => vc.id);

            const membership = allStoredVCs.find(vc => vc.id === entry.membershipId);

            try {
                const response = await fetch(`${url}/list`, {
                    method: entry.membershipId ? 'POST' : 'GET',
                    headers: {
                        'Content-type': 'application/json',
                        ...(user?.email === 'demo@learningeconomy.io'
                            ? {}
                            : {
                                  Authorization: `Bearer ${jwt}`,
                              }),
                    },
                    ...(entry.membershipId ? { body: JSON.stringify({ membership }) } : {}),
                });

                currentIds = await response.json();

                if (entry.membershipId) {
                    challenge = currentIds.challenge;
                    currentIds = currentIds.ids;
                }
            } catch (error) {
                walletStore.set.setIsSyncing(WalletSyncState.NotSyncing);
                console.log('fetch::error', error);
                throw new Error('There was an error fetching your credentials.');
            }

            const filteredIds: string[] = currentIds.filter(
                (vc: string) => !allStoredVCIds.includes(vc)
            );

            try {
                if (!filteredIds || filteredIds?.length === 0) {
                    console.warn('No credential Ids provided, skipping request');
                    return false;
                }

                const didAuth = await issueDIDAuthPresentation(challenge, url);

                if (entry.membershipId) {
                    jwt = await wallet.invoke.getDidAuthVp({ proofFormat: 'jwt', challenge });
                }

                const response2 = await fetch(`${url}/issue`, {
                    method: 'POST',
                    headers: {
                        'Content-type': 'application/json',
                        ...(user?.email === 'demo@learningeconomy.io'
                            ? {}
                            : { Authorization: `Bearer ${jwt}` }),
                    },
                    body: JSON.stringify({ ids: filteredIds, presentation: didAuth }),
                });

                if (response2.status === 401) throw new Error('Unauthorized');

                const vcData = await response2.json();

                if (response2.status === 400) throw new Error(vcData.reason);

                // TODO should do something like useSyncConsentFlow here to show the new Credential indicators
                //   ... but I don't know what triggers this flow, so I don't know the shape of the data or how to test it
                // const recordsByCategory = resolvedList.reduce<Record<string, string[]>>(
                //     (records, { credentialUri, vc }) => {
                //         const category = getDefaultCategoryForCredential(vc) || 'Achievement';
                //         records[category] = records[category]
                //             ? [...records[category], credentialUri]
                //             : [credentialUri];
                //         return records;
                //     },
                //     {}
                // );

                // Update the store with the counts
                // newCredsStore.set.addNewCreds(recordsByCategory);

                await storeAndAddManyVCsToWallet(vcData);

                // presentToast({
                //     message: `Successfully synced ${vcData?.length} Credentials!`,
                //     duration: 3000,
                //     position: 'top',
                //     cssClass: 'login-link-success-toast',
                // });
                walletStore.set.setIsSyncing(WalletSyncState.Completed, vcData?.length);

                console.log('2nd req', vcData);
            } catch (error) {
                walletStore.set.setIsSyncing(WalletSyncState.NotSyncing);
                console.log('fetch2::error', error);
                throw new Error('There was an error fetching your credentials.');
            }

            return true;
        },
        onMutate: () => {
            queryClient.cancelQueries({ queryKey: ['useRegistryEntryState', id] });

            const oldStaleTime =
                queryClient.getQueryDefaults(['useRegistryEntryState', id]).staleTime ?? 0;

            queryClient.setQueryDefaults(['useRegistryEntryState', id], { staleTime: Infinity });

            setState(SYNC_STATE.syncing);

            return { oldStaleTime };
        },
        onSettled: (_data, _error, _variables, context) => {
            if (context?.oldStaleTime !== undefined) {
                queryClient.setQueryDefaults(['useRegistryEntryState', id], {
                    staleTime: context.oldStaleTime,
                });
            }
        },
        onError: () => setState(SYNC_STATE.tryAgain),
        onSuccess: async data => {
            setState(SYNC_STATE.synced);
            const entry = registry!.find(registryEntry => registryEntry.id === id)!;

            const wallet = await initWallet();

            const syncedSources = await wallet.invoke.learnCloudRead<{
                sources: RegistryEntry[];
            }>({
                id: 'syncedSources',
            });

            if (syncedSources.length > 0) {
                await wallet.invoke.learnCloudUpdate(
                    { id: 'syncedSources' },
                    { sources: [...syncedSources[0].sources, entry] }
                );
            } else {
                await wallet.invoke.learnCloudCreate({ id: 'syncedSources', sources: [entry] });
            }

            queryClient.refetchQueries({ queryKey: ['useDataSources'] });
        },
    });
};
