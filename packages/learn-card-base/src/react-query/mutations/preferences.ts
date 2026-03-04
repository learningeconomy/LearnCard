import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useWallet } from 'learn-card-base';

export enum ThemeEnum {
    Colorful = 'colorful',
    Formal = 'formal',
}

export type PreferencesType = {
    theme?: ThemeEnum;
    aiEnabled?: boolean;
    aiAutoDisabled?: boolean;
    analyticsEnabled?: boolean;
    analyticsAutoDisabled?: boolean;
    bugReportsEnabled?: boolean;
    isMinor?: boolean;
};

export const useUpdatePreferences = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    return useMutation<boolean, Error, PreferencesType>({
        mutationFn: async (preferences: PreferencesType) => {
            const wallet = await initWallet();
            return wallet.invoke.updatePreferences(preferences);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['useGetPreferencesForDid'] });
        },
    });
};

export const useCreatePreferences = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    return useMutation<boolean, Error, PreferencesType>({
        mutationFn: async (preferences: PreferencesType) => {
            const wallet = await initWallet();
            return wallet.invoke.createPreferences(preferences);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['useGetPreferencesForDid'] });
        },
    });
};
