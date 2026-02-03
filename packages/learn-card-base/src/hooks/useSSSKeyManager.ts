import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';

import {
    createSSSKeyManager,
    splitPrivateKey,
    reconstructFromShares,
    storeDeviceShare,
    getDeviceShare,
    hasDeviceShare,
    clearAllShares,
    generateEd25519PrivateKey,
    bytesToHex,
    type AuthProvider,
    type SSSKeyManager,
} from '@learncard/sss-key-manager';

import useWallet from 'learn-card-base/hooks/useWallet';
import useSQLiteStorage from 'learn-card-base/hooks/useSQLiteStorage';

import { getRandomBaseColor } from 'learn-card-base/helpers/colorHelpers';
import { pushUtilities } from 'learn-card-base/utils/pushUtilities';
import { unsetAuthToken, clearAuthServiceProvider } from 'learn-card-base/helpers/authHelpers';

import { walletStore } from 'learn-card-base/stores/walletStore';
import web3AuthStore from 'learn-card-base/stores/web3AuthStore';
import firebaseAuthStore from 'learn-card-base/stores/firebaseAuthStore';
import currentUserStore from 'learn-card-base/stores/currentUserStore';
import authStore from 'learn-card-base/stores/authStore';
import redirectStore from 'learn-card-base/stores/redirectStore';
import { chapiStore } from 'learn-card-base/stores/chapiStore';
import firstStartupStore from 'learn-card-base/stores/firstStartupStore';
import { clearAll as clearWebSecureAll } from 'learn-card-base/security/webSecureStorage';
import {
    setPlatformPrivateKey,
    clearPlatformPrivateKey,
} from 'learn-card-base/security/platformPrivateKeyStorage';

export interface SSSConfig {
    serverUrl: string;
}

export type AuthProviderAdapter = AuthProvider;

export const useSSSKeyManager = (config?: SSSConfig) => {
    const [loggingOut, setLoggingOut] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { initWallet } = useWallet();
    const queryClient = useQueryClient();
    const { setCurrentUser, clearDB } = useSQLiteStorage();

    const setInitLoading = authStore.set.initLoading;

    const serverUrl = config?.serverUrl || process.env.REACT_APP_SSS_SERVER_URL || '';

    const getAuthHeaders = useCallback(async (authProvider: AuthProviderAdapter) => {
        const token = await authProvider.getIdToken();
        return {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        };
    }, []);

    const fetchAuthShare = useCallback(async (authProvider: AuthProviderAdapter) => {
        const headers = await getAuthHeaders(authProvider);
        const providerType = authProvider.getProviderType();

        const response = await fetch(`${serverUrl}/keys/auth-share`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ 
                authToken: await authProvider.getIdToken(),
                providerType,
            }),
        });

        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error(`Failed to get auth share: ${response.statusText}`);
        }

        return response.json();
    }, [serverUrl, getAuthHeaders]);

    const storeAuthShare = useCallback(async (
        authProvider: AuthProviderAdapter,
        authShare: { encryptedData: string; encryptedDek: string; iv: string },
        primaryDid: string
    ) => {
        const headers = await getAuthHeaders(authProvider);
        const providerType = authProvider.getProviderType();

        const response = await fetch(`${serverUrl}/keys/auth-share`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                authToken: await authProvider.getIdToken(),
                providerType,
                authShare,
                primaryDid,
                securityLevel: 'basic',
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to store auth share: ${response.statusText}`);
        }
    }, [serverUrl, getAuthHeaders]);

    const connect = useCallback(async (authProvider: AuthProvider): Promise<string | null> => {
        try {
            setConnecting(true);
            setError(null);
            setInitLoading(true);

            const user = await authProvider.getCurrentUser();
            if (!user) {
                throw new Error('No authenticated user');
            }

            const deviceShareExists = await hasDeviceShare();
            if (!deviceShareExists) {
                console.log('No device share found - user needs to set up or recover');
                setConnecting(false);
                setInitLoading(false);
                return null;
            }

            const serverResponse = await fetchAuthShare(authProvider);

            if (!serverResponse || !serverResponse.authShare) {
                console.log('No SSS shares found on server - user needs to set up or migrate');
                setConnecting(false);
                setInitLoading(false);
                return null;
            }

            if (serverResponse.keyProvider !== 'sss') {
                console.log('User is still on Web3Auth - migration needed');
                setConnecting(false);
                setInitLoading(false);
                return null;
            }

            const deviceShare = await getDeviceShare();
            if (!deviceShare) {
                throw new Error('Failed to retrieve device share');
            }

            const authShareData = serverResponse.authShare.encryptedData;
            const privateKey = await reconstructFromShares([deviceShare, authShareData]);

            await finalizeLogin(privateKey);

            setConnecting(false);
            setInitLoading(false);

            return privateKey;
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Unknown error';
            setError(message);
            setConnecting(false);
            setInitLoading(false);
            throw e;
        }
    }, [fetchAuthShare, setInitLoading]);

    const finalizeLogin = useCallback(async (privateKey: string) => {
        const firebaseCurrentUser = firebaseAuthStore.get.currentUser();

        const sqliteUserPayload = {
            uid: firebaseCurrentUser?.uid ?? '',
            email: firebaseCurrentUser?.email ?? '',
            phoneNumber: firebaseCurrentUser?.phoneNumber ?? '',
            name: firebaseCurrentUser?.displayName ?? '',
            profileImage: firebaseCurrentUser?.photoUrl ?? '',
            privateKey,
            baseColor: getRandomBaseColor(),
        };

        await setCurrentUser(sqliteUserPayload);

        if (privateKey) {
            try {
                await setPlatformPrivateKey(privateKey);
            } catch (e) {
                console.warn('Failed to set secure PK', e);
            }
        }

        const wallet = await initWallet(privateKey);
        if (wallet) {
            walletStore.set.wallet(wallet);
            currentUserStore.set.currentUser({ ...sqliteUserPayload });
            await pushUtilities.syncPushToken();
        }
    }, [setCurrentUser, initWallet]);

    const setupWithPrivateKey = useCallback(async (
        authProvider: AuthProvider,
        privateKey: string,
        primaryDid: string
    ) => {
        try {
            setConnecting(true);
            setError(null);

            const shares = await splitPrivateKey(privateKey);

            await storeDeviceShare(shares.deviceShare);

            await storeAuthShare(
                authProvider,
                {
                    encryptedData: shares.authShare,
                    encryptedDek: '',
                    iv: '',
                },
                primaryDid
            );

            await finalizeLogin(privateKey);

            setConnecting(false);
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Unknown error';
            setError(message);
            setConnecting(false);
            throw e;
        }
    }, [storeAuthShare, finalizeLogin]);

    const migrateFromWeb3Auth = useCallback(async (
        authProvider: AuthProvider,
        privateKey: string,
        primaryDid: string
    ) => {
        await setupWithPrivateKey(authProvider, privateKey, primaryDid);

        const headers = await getAuthHeaders(authProvider);
        const providerType = authProvider.getProviderType();

        await fetch(`${serverUrl}/keys/migrate`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                authToken: await authProvider.getIdToken(),
                providerType,
            }),
        });
    }, [setupWithPrivateKey, serverUrl, getAuthHeaders]);

    const clearAllIndexedDB = async () => {
        try {
            const databases = await window.indexedDB.databases();
            databases.forEach(db => {
                const dbName = db.name;
                if (!dbName) return;
                const request = window.indexedDB.deleteDatabase(dbName);
                request.onsuccess = () => console.log(`Deleted database: ${dbName}`);
                request.onerror = (e) => console.log(`Couldn't delete: ${dbName}`, e);
            });
        } catch (e) {
            console.error('Error clearing IndexedDB:', e);
        }
    };

    const logout = useCallback(async (redirectUrl?: string) => {
        try {
            setLoggingOut(true);
            setInitLoading(true);

            await queryClient?.clear();

            walletStore.set.wallet(null);
            web3AuthStore.set.web3Auth(null);
            web3AuthStore.set.provider(null);
            redirectStore.set.lcnRedirect(null);
            firebaseAuthStore.set.firebaseAuth(null);
            authStore.set.typeOfLogin(null);
            chapiStore.set.isChapiInteraction(null);

            window.localStorage.removeItem('emailForSignIn');
            window.localStorage.removeItem('openlogin_store');
            clearAuthServiceProvider();

            try {
                await clearDB();
            } catch (error) {
                console.log('clearDB::error', error);
            }

            unsetAuthToken();
            currentUserStore.set.currentUser(null);
            currentUserStore.set.currentUserPK(null);
            currentUserStore.set.currentUserIsLoggedIn(false);

            window?.localStorage?.clear();
            window?.sessionStorage?.clear();

            firstStartupStore.set.introSlidesCompleted(true);
            firstStartupStore.set.firstStart(false);

            try {
                await clearPlatformPrivateKey();
            } catch (e) {
                console.warn('Failed to clear platform private key', e);
            }

            try {
                await clearWebSecureAll();
            } catch (e) {
                console.warn('Failed to clear secure storage', e);
            }

            await clearAllIndexedDB();

            setInitLoading(false);
            setLoggingOut(false);

            const isNative = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
            if (isNative) {
                window.location.replace('/login');
            } else if (redirectUrl && typeof redirectUrl === 'string') {
                window.location.href = redirectUrl;
            } else {
                window.location.href = '/login';
            }
        } catch (e) {
            console.error('Error logging out', e);
            setInitLoading(false);
            setLoggingOut(false);
        }
    }, [queryClient, clearDB, setInitLoading]);

    return {
        connect,
        setupWithPrivateKey,
        migrateFromWeb3Auth,
        logout,
        loggingOut,
        connecting,
        error,
    };
};

export default useSSSKeyManager;
