import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RegistryEntry, useWallet } from 'learn-card-base';
import useRegistry from 'learn-card-base/hooks/useRegistry';

export const useDisconnectDataSource = (id: string) => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();
    const { data: registry } = useRegistry();

    return useMutation({
        mutationFn: async () => {
            if (!registry) throw new Error('Could not get registry');

            const entry = registry.find(registryEntry => registryEntry.id === id);

            if (!entry) throw new Error('ID Not in Registry');

            const wallet = await initWallet();

            const syncedSources = await wallet.invoke.learnCloudRead<{ sources: RegistryEntry[] }>({
                id: 'syncedSources',
            });

            if (!syncedSources[0]?.sources.find(source => source.id === id)) return false;

            await wallet.invoke.learnCloudUpdate(
                { id: 'syncedSources' },
                { sources: syncedSources[0].sources.filter(source => source.id !== id) }
            );

            return true;
        },
        onSuccess: data => {
            if (data) queryClient.refetchQueries({ queryKey: ['useDataSources'] });
        },
    });
};
