import { useQuery } from '@tanstack/react-query';
import { RegistryEntry, useWallet } from 'learn-card-base';
import useRegistry from 'learn-card-base/hooks/useRegistry';

export const SYNC_STATE = {
    notSynced: 'Login & Sync',
    syncing: 'Syncing...',
    reconnect: 'Reconnect',
    tryAgain: 'Try Again',
    synced: 'Synced',
} as const;
export type SyncState = typeof SYNC_STATE[keyof typeof SYNC_STATE];

export const useDataSources = () => {
    const { data: registry } = useRegistry();
    const { initWallet } = useWallet();

    return useQuery({
        queryKey: ['useDataSources'],
        queryFn: async () => {
            const wallet = await initWallet();

            const syncedSources = await wallet.invoke.learnCloudRead<{ sources: RegistryEntry[] }>({
                id: 'syncedSources',
            });

            const membershipIds =
                registry?.map(entry => entry.membershipId ?? '').filter(Boolean) ?? [];

            const ownedMemberships = (
                await Promise.all(
                    membershipIds.map(async id => {
                        const count = await wallet.index.LearnCloud.getCount?.({ id });

                        return count === 0 ? '' : id;
                    })
                )
            ).filter(Boolean);

            return registry
                ?.filter(
                    entry => !entry.membershipId || ownedMemberships.includes(entry.membershipId)
                )
                ?.map(entry => ({
                    ...entry,
                    state: syncedSources[0]?.sources.find(source => source.id === entry.id)
                        ? SYNC_STATE.synced
                        : SYNC_STATE.notSynced,
                }));
        },
        enabled: Boolean(registry),
    });
};
