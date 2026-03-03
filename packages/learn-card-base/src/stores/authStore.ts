import { createStore } from '@udecode/zustood';

import { SocialLoginTypes } from '../hooks/useSocialLogins';

export const authStore = createStore('authStore')<{
    jwt: string | null;
    discord: string | null;
    initLoading: boolean;
    typeOfLogin: SocialLoginTypes | null;
    verificationId: string | null; // exclusive to firebase sms login
    loginAttempts: number;
    deviceToken: string | null; // native device push token
    pinToken: string;
    pinTokenExpire: Date | null;
}>(
    {
        jwt: null,
        discord: null,
        initLoading: false,
        typeOfLogin: null,
        verificationId: null,
        loginAttempts: 0,
        deviceToken: null,
        pinToken: '',
        pinTokenExpire: null,
    },
    { persist: { name: 'auth', enabled: true } }
);

export const useAuthToken = authStore.use.jwt;
export const useDiscordToken = authStore.use.discord;
export const useInitLoading = authStore.use.initLoading;
export const useLoginAttempts = authStore.use.loginAttempts;
export const useVerificationId = authStore.use.verificationId;

export default authStore;
