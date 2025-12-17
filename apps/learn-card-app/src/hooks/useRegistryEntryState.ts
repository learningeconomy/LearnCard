import { useQuery, useQueries } from '@tanstack/react-query';
import { RegistryEntry, useWallet } from 'learn-card-base';
import useRegistry from 'learn-card-base/hooks/useRegistry';

export const SYNC_STATE = {
    notSynced: 'Login & Sync',
    syncing: 'Syncing...',
    reconnect: 'Reconnect',
    tryAgain: 'Try Again',
    synced: 'Synced',
    hidden: 'Hidden',
} as const;
export type SyncState = typeof SYNC_STATE[keyof typeof SYNC_STATE];

export const useRegistryEntryState = (entry?: RegistryEntry) => {
    const { initWallet } = useWallet();

    return useQuery<SyncState>({
        queryKey: ['useRegistryEntryState', entry?.id],
        initialData: entry?.membershipId ? SYNC_STATE.hidden : SYNC_STATE.syncing,
        queryFn: async () => {
            const wallet = await initWallet();

            if (
                entry?.membershipId &&
                ((await wallet.index.LearnCloud.getCount?.({ id: entry.membershipId })) ?? 0) === 0
            ) {
                return SYNC_STATE.hidden;
            }

            const syncedSources = await wallet.invoke.learnCloudRead<{ sources: RegistryEntry[] }>({
                id: 'syncedSources',
            });

            if (syncedSources?.[0]?.sources.find(source => source.id === entry?.id)) {
                return SYNC_STATE.synced;
            }

            return SYNC_STATE.notSynced;
        },
        enabled: Boolean(entry),
    });
};

export const useRegistryState = () => {
    const { initWallet } = useWallet();
    const { data: registry } = useRegistry();

    return useQueries({
        queries:
            registry?.map(entry => ({
                queryKey: ['useRegistryEntryState', entry?.id],
                initialData: entry?.membershipId ? SYNC_STATE.hidden : SYNC_STATE.syncing,
                queryFn: async () => {
                    const wallet = await initWallet();

                    if (
                        entry?.membershipId &&
                        ((await wallet.index.LearnCloud.getCount?.({ id: entry.membershipId })) ??
                            0) === 0
                    ) {
                        return SYNC_STATE.hidden;
                    }

                    const syncedSources = await wallet.invoke.learnCloudRead<{
                        sources: RegistryEntry[];
                    }>({ id: 'syncedSources' });

                    if (syncedSources?.[0]?.sources.find(source => source.id === entry?.id)) {
                        return SYNC_STATE.synced;
                    }

                    return SYNC_STATE.notSynced;
                },
                enabled: Boolean(entry),
            })) ?? [],
        combine: result =>
            result.map((state, index) => ({
                ...state,
                data: { ...registry![index]!, state: state.data! },
            })),
    });
};
