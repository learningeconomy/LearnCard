import { createStore } from '@udecode/zustood';

import { SocialLoginTypes } from '../hooks/useSocialLogins';

export const authStore = createStore('authStore')<{
    jwt: string | null;
    discord: string | null;
    typeOfLogin: SocialLoginTypes | null;
    loginAttempts: number;
    deviceToken: string | null; // native device push token
    pinToken: string;
    pinTokenExpire: Date | null;
}>(
    {
        jwt: null,
        discord: null,
        typeOfLogin: null,
        loginAttempts: 0,
        deviceToken: null,
        pinToken: '',
        pinTokenExpire: null,
    },
    {
        persist: {
            name: 'auth',
            enabled: true,
            partialize: state => ({ ...state }),
        },
    }
);

export const useAuthToken = authStore.use.jwt;
export const useDiscordToken = authStore.use.discord;
export const useLoginAttempts = authStore.use.loginAttempts;

export default authStore;
