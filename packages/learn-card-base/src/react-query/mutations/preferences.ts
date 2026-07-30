import { QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';

import { useWallet } from '../../hooks/useWallet';
import {
    PREFERENCES_QUERY_KEY,
    PreferencesQuerySnapshot,
    PreferencesType,
    optimisticallyMergePreferenceQueries,
    restorePreferenceQueries,
} from '../preferences.shared';

export enum ThemeEnum {
    Colorful = 'colorful',
    Formal = 'formal',
}

export type { PreferencesType } from '../preferences.shared';

type PreferencesMutationContext = {
    previousPreferenceQueries: PreferencesQuerySnapshot;
};

const createPreferencesMutationOptions = (
    queryClient: QueryClient,
    mutation: (preferences: PreferencesType) => Promise<boolean>
) => ({
    mutationFn: async (preferences: PreferencesType) => mutation(preferences),
    onMutate: async (preferences: PreferencesType): Promise<PreferencesMutationContext> => {
        await queryClient.cancelQueries({ queryKey: PREFERENCES_QUERY_KEY });

        const previousPreferenceQueries = optimisticallyMergePreferenceQueries(
            queryClient,
            preferences
        );

        return { previousPreferenceQueries };
    },
    onError: (
        _error: Error,
        _preferences: PreferencesType,
        context?: PreferencesMutationContext
    ) => {
        if (!context?.previousPreferenceQueries) return;

        restorePreferenceQueries(queryClient, context.previousPreferenceQueries);
    },
    onSettled: () => {
        queryClient.invalidateQueries({ queryKey: PREFERENCES_QUERY_KEY });
    },
});

export const useUpdatePreferences = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    return useMutation<boolean, Error, PreferencesType, PreferencesMutationContext>(
        createPreferencesMutationOptions(queryClient, async preferences => {
            const wallet = await initWallet();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return wallet.invoke.updatePreferences(preferences as any);
        })
    );
};

export const useCreatePreferences = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    return useMutation<boolean, Error, PreferencesType, PreferencesMutationContext>(
        createPreferencesMutationOptions(queryClient, async preferences => {
            const wallet = await initWallet();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return wallet.invoke.createPreferences(preferences as any);
        })
    );
};
