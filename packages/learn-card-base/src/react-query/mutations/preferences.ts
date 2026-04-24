import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useWallet } from 'learn-card-base';

export enum ThemeEnum {
    Colorful = 'colorful',
    Formal = 'formal',
}

export type PreferencesType = {
    theme?: string;
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return wallet.invoke.updatePreferences(preferences as any);
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return wallet.invoke.createPreferences(preferences as any);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['useGetPreferencesForDid'] });
        },
    });
};
