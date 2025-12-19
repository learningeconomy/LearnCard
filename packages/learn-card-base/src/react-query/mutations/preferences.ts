import { useMutation } from '@tanstack/react-query';

import { useWallet } from 'learn-card-base';

export enum ThemeEnum {
    Colorful = 'colorful',
    Formal = 'formal',
}

export type PreferencesType = {
    theme: ThemeEnum;
};

export const useUpdatePreferences = () => {
    const { initWallet } = useWallet();

    return useMutation<boolean, Error, PreferencesType>({
        mutationFn: async (preferences: PreferencesType) => {
            const wallet = await initWallet();
            return wallet.invoke.updatePreferences(preferences);
        },
    });
};

export const useCreatePreferences = () => {
    const { initWallet } = useWallet();

    return useMutation<boolean, Error, PreferencesType>({
        mutationFn: async (preferences: PreferencesType) => {
            const wallet = await initWallet();
            return wallet.invoke.createPreferences(preferences);
        },
    });
};
