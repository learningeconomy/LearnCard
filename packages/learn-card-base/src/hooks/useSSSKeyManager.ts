import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';

import {
    createSSSKeyManager,
    reconstructFromShares,
    storeDeviceShare,
    getDeviceShare,
    hasDeviceShare,
    clearAllShares,
    generateEd25519PrivateKey,
    bytesToHex,
    encryptWithPassword,
    decryptWithPassword,
    DEFAULT_KDF_PARAMS,
    shareToRecoveryPhrase,
    recoveryPhraseToShare,
    validateRecoveryPhrase,
    createPasskeyCredential,
    encryptShareWithPasskey,
    decryptShareWithPasskey,
    isWebAuthnSupported,
    splitAndVerify,
    type AuthProvider,
    type SSSKeyManager,
    type RecoveryMethod,
    type RecoveryMethodInfo,
    type BackupFile,
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

// Module-level variable to share auth provider across hook instances
let sharedAuthProvider: AuthProvider | null = null;

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

            // Store the auth provider for later use (shared across all hook instances)
            sharedAuthProvider = authProvider;

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

            // Verify the reconstructed key produces the expected DID
            // If DID doesn't match, the device share is stale (from a previous split)
            const expectedDid = serverResponse.primaryDid;
            const wallet = await initWallet(privateKey);
            
            if (wallet && expectedDid) {
                const reconstructedDid = wallet.id.did();
                if (reconstructedDid !== expectedDid) {
                    console.log('Device share is stale - DID mismatch. Clearing device share.');
                    console.log('Expected:', expectedDid);
                    console.log('Got:', reconstructedDid);
                    await clearAllShares();
                    walletStore.set.wallet(null);
                    setConnecting(false);
                    setInitLoading(false);
                    return null; // Force recovery flow
                }
            }

            await finalizeLogin(privateKey, wallet);

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

    const finalizeLogin = useCallback(async (privateKey: string, existingWallet?: any) => {
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

        // Use existing wallet if provided, otherwise initialize a new one
        const wallet = existingWallet ?? await initWallet(privateKey);
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

            // Store the auth provider for later use (shared across all hook instances)
            sharedAuthProvider = authProvider;

            console.log('[sss] splitting private key', privateKey);
            const { shares } = await splitAndVerify(privateKey);

            console.log('[sss] storing device share', shares.deviceShare);
            await storeDeviceShare(shares.deviceShare);

            console.log('[sss] storing auth share', shares.authShare);
            await storeAuthShare(
                authProvider,
                {
                    encryptedData: shares.authShare,
                    encryptedDek: '',
                    iv: '',
                },
                primaryDid
            );

            console.log('[sss] finalizing login');
            await finalizeLogin(privateKey);

            console.log('[sss] setup complete');
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

    const checkAuthShareExists = useCallback(async (authProvider: AuthProvider): Promise<{ exists: boolean; isSSSMigrated: boolean }> => {
        try {
            const serverResponse = await fetchAuthShare(authProvider);

            if (!serverResponse || !serverResponse.authShare) {
                return { exists: false, isSSSMigrated: false };
            }

            const isSSSMigrated = serverResponse.keyProvider === 'sss';

            return { exists: true, isSSSMigrated };
        } catch (e) {
            console.error('Error checking auth share:', e);
            return { exists: false, isSSSMigrated: false };
        }
    }, [fetchAuthShare]);

    const getRecoveryMethods = useCallback(async (authProvider: AuthProvider): Promise<RecoveryMethodInfo[]> => {
        try {
            const serverResponse = await fetchAuthShare(authProvider);
            return serverResponse?.recoveryMethods || [];
        } catch (e) {
            console.error('Error getting recovery methods:', e);
            return [];
        }
    }, [fetchAuthShare]);

    const addPasswordRecovery = useCallback(async (
        authProvider: AuthProvider,
        password: string,
        currentPrivateKey: string
    ) => {
        // Generate NEW shares - we must update device and auth shares too
        // so all shares come from the same split operation
        const { shares } = await splitAndVerify(currentPrivateKey);
        const encrypted = await encryptWithPassword(shares.recoveryShare, password);

        // Update device share locally
        await storeDeviceShare(shares.deviceShare);

        const headers = await getAuthHeaders(authProvider);
        const providerType = authProvider.getProviderType();

        // Get current primaryDid from server
        const currentData = await fetchAuthShare(authProvider);
        const primaryDid = currentData?.primaryDid || '';

        // Update auth share on server with new share from same split
        await fetch(`${serverUrl}/keys/auth-share`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                authToken: await authProvider.getIdToken(),
                providerType,
                authShare: {
                    encryptedData: shares.authShare,
                    encryptedDek: '',
                    iv: '',
                },
                primaryDid,
                securityLevel: 'basic',
            }),
        });

        // Now add the recovery method with the recovery share from the same split
        const response = await fetch(`${serverUrl}/keys/recovery`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                authToken: await authProvider.getIdToken(),
                providerType,
                type: 'password',
                encryptedShare: {
                    encryptedData: encrypted.ciphertext,
                    iv: encrypted.iv,
                    salt: encrypted.salt,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to add password recovery: ${response.statusText}`);
        }
    }, [serverUrl, getAuthHeaders, fetchAuthShare]);

    const addPasskeyRecovery = useCallback(async (
        authProvider: AuthProvider,
        currentPrivateKey: string
    ) => {
        if (!isWebAuthnSupported()) {
            throw new Error('WebAuthn is not supported in this browser');
        }

        const user = await authProvider.getCurrentUser();
        if (!user) {
            throw new Error('No authenticated user');
        }

        const credential = await createPasskeyCredential(
            user.id,
            user.email || user.phone || user.id
        );

        // Generate NEW shares - we must update device and auth shares too
        // so all shares come from the same split operation
        const { shares } = await splitAndVerify(currentPrivateKey);
        const encryptedShare = await encryptShareWithPasskey(
            shares.recoveryShare,
            credential.credentialId
        );

        // Update device share locally
        await storeDeviceShare(shares.deviceShare);

        const headers = await getAuthHeaders(authProvider);
        const providerType = authProvider.getProviderType();

        // Get current primaryDid from server
        const currentData = await fetchAuthShare(authProvider);
        const primaryDid = currentData?.primaryDid || '';

        // Update auth share on server with new share from same split
        await fetch(`${serverUrl}/keys/auth-share`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                authToken: await authProvider.getIdToken(),
                providerType,
                authShare: {
                    encryptedData: shares.authShare,
                    encryptedDek: '',
                    iv: '',
                },
                primaryDid,
                securityLevel: 'basic',
            }),
        });

        // Now add the recovery method with the recovery share from the same split
        const response = await fetch(`${serverUrl}/keys/recovery`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                authToken: await authProvider.getIdToken(),
                providerType,
                type: 'passkey',
                encryptedShare: {
                    encryptedData: encryptedShare.encryptedData,
                    iv: encryptedShare.iv,
                },
                credentialId: credential.credentialId,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to add passkey recovery: ${response.statusText}`);
        }

        return credential.credentialId;
    }, [serverUrl, getAuthHeaders, fetchAuthShare]);

    const generateRecoveryPhrase = useCallback(async (
        currentPrivateKey: string,
        authProvider?: AuthProvider | null
    ): Promise<string> => {
        // Generate NEW shares - the phrase IS the recovery share encoded as BIP39
        const { shares } = await splitAndVerify(currentPrivateKey);
        const phrase = await shareToRecoveryPhrase(shares.recoveryShare);

        // If we have an auth provider, update device and auth shares
        // so they're from the same split as the phrase
        if (authProvider) {
            await storeDeviceShare(shares.deviceShare);

            const headers = await getAuthHeaders(authProvider);
            const providerType = authProvider.getProviderType();

            const currentData = await fetchAuthShare(authProvider);
            const primaryDid = currentData?.primaryDid || '';

            await fetch(`${serverUrl}/keys/auth-share`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    authToken: await authProvider.getIdToken(),
                    providerType,
                    authShare: {
                        encryptedData: shares.authShare,
                        encryptedDek: '',
                        iv: '',
                    },
                    primaryDid,
                    securityLevel: 'basic',
                }),
            });
        }

        return phrase;
    }, [serverUrl, getAuthHeaders, fetchAuthShare]);

    const recoverWithPassword = useCallback(async (
        authProvider: AuthProvider,
        password: string
    ): Promise<string> => {
        setConnecting(true);
        setError(null);

        try {
            const token = await authProvider.getIdToken();
            const providerType = authProvider.getProviderType();

            const params = new URLSearchParams({
                type: 'password',
                providerType,
                authToken: token,
            });

            const recoveryResponse = await fetch(
                `${serverUrl}/keys/recovery?${params}`,
                { method: 'GET', headers: { 'Content-Type': 'application/json' } }
            );

            if (!recoveryResponse.ok) {
                throw new Error('No password recovery share found');
            }

            const encryptedShare = await recoveryResponse.json();

            if (!encryptedShare || !encryptedShare.salt) {
                throw new Error('Invalid recovery share data');
            }

            const recoveryShare = await decryptWithPassword(
                encryptedShare.encryptedData,
                encryptedShare.iv,
                encryptedShare.salt,
                password,
                DEFAULT_KDF_PARAMS
            );

            const serverResponse = await fetchAuthShare(authProvider);

            if (!serverResponse || !serverResponse.authShare) {
                throw new Error('No auth share found on server');
            }

            const privateKey = await reconstructFromShares([
                recoveryShare,
                serverResponse.authShare.encryptedData,
            ]);

            // Generate new shares and update BOTH device and auth shares
            // so they're from the same split for future logins
            const { shares: newShares } = await splitAndVerify(privateKey);

            await storeDeviceShare(newShares.deviceShare);

            // Update auth share on server with new share from same split
            const primaryDid = serverResponse.primaryDid || '';
            await fetch(`${serverUrl}/keys/auth-share`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: token,
                    providerType,
                    authShare: {
                        encryptedData: newShares.authShare,
                        encryptedDek: '',
                        iv: '',
                    },
                    primaryDid,
                    securityLevel: 'basic',
                }),
            });

            await finalizeLogin(privateKey);

            setConnecting(false);
            return privateKey;
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Recovery failed';
            setError(message);
            setConnecting(false);
            throw e;
        }
    }, [serverUrl, fetchAuthShare, finalizeLogin]);

    const recoverWithPasskey = useCallback(async (
        authProvider: AuthProvider,
        credentialId: string
    ): Promise<string> => {
        setConnecting(true);
        setError(null);

        try {
            const token = await authProvider.getIdToken();
            const providerType = authProvider.getProviderType();

            const params = new URLSearchParams({
                type: 'passkey',
                providerType,
                authToken: token,
                credentialId,
            });

            const recoveryResponse = await fetch(
                `${serverUrl}/keys/recovery?${params}`,
                { method: 'GET', headers: { 'Content-Type': 'application/json' } }
            );

            if (!recoveryResponse.ok) {
                throw new Error('No passkey recovery share found');
            }

            const encryptedShare = await recoveryResponse.json();

            const recoveryShare = await decryptShareWithPasskey({
                encryptedData: encryptedShare.encryptedData,
                iv: encryptedShare.iv,
                credentialId,
            });

            const serverResponse = await fetchAuthShare(authProvider);

            if (!serverResponse || !serverResponse.authShare) {
                throw new Error('No auth share found on server');
            }

            const privateKey = await reconstructFromShares([
                recoveryShare,
                serverResponse.authShare.encryptedData,
            ]);

            // Generate new shares and update BOTH device and auth shares
            const { shares: newShares } = await splitAndVerify(privateKey);

            await storeDeviceShare(newShares.deviceShare);

            // Update auth share on server with new share from same split
            const primaryDid = serverResponse.primaryDid || '';
            await fetch(`${serverUrl}/keys/auth-share`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: token,
                    providerType,
                    authShare: {
                        encryptedData: newShares.authShare,
                        encryptedDek: '',
                        iv: '',
                    },
                    primaryDid,
                    securityLevel: 'basic',
                }),
            });

            await finalizeLogin(privateKey);

            setConnecting(false);
            return privateKey;
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Recovery failed';
            setError(message);
            setConnecting(false);
            throw e;
        }
    }, [serverUrl, fetchAuthShare, finalizeLogin]);

    const recoverWithPhrase = useCallback(async (
        authProvider: AuthProvider,
        phrase: string
    ): Promise<string> => {
        setConnecting(true);
        setError(null);

        try {
            const isValid = await validateRecoveryPhrase(phrase);
            if (!isValid) {
                throw new Error('Invalid recovery phrase');
            }

            const recoveryShare = await recoveryPhraseToShare(phrase);

            const serverResponse = await fetchAuthShare(authProvider);

            if (!serverResponse || !serverResponse.authShare) {
                throw new Error('No auth share found on server');
            }

            const privateKey = await reconstructFromShares([
                recoveryShare,
                serverResponse.authShare.encryptedData,
            ]);

            // Generate new shares and update BOTH device and auth shares
            const { shares: newShares } = await splitAndVerify(privateKey);

            await storeDeviceShare(newShares.deviceShare);

            // Update auth share on server with new share from same split
            const token = await authProvider.getIdToken();
            const providerType = authProvider.getProviderType();
            const primaryDid = serverResponse.primaryDid || '';

            await fetch(`${serverUrl}/keys/auth-share`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: token,
                    providerType,
                    authShare: {
                        encryptedData: newShares.authShare,
                        encryptedDek: '',
                        iv: '',
                    },
                    primaryDid,
                    securityLevel: 'basic',
                }),
            });

            await finalizeLogin(privateKey);

            setConnecting(false);
            return privateKey;
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Recovery failed';
            setError(message);
            setConnecting(false);
            throw e;
        }
    }, [serverUrl, fetchAuthShare, finalizeLogin]);

    const exportBackup = useCallback(async (
        currentPrivateKey: string,
        password: string,
        primaryDid: string
    ): Promise<BackupFile> => {
        const { shares } = await splitAndVerify(currentPrivateKey);
        const encrypted = await encryptWithPassword(shares.recoveryShare, password);

        return {
            version: 1,
            createdAt: new Date().toISOString(),
            primaryDid,
            encryptedShare: {
                ciphertext: encrypted.ciphertext,
                iv: encrypted.iv,
                salt: encrypted.salt,
                kdfParams: encrypted.kdfParams,
            },
        };
    }, []);

    const recoverWithBackup = useCallback(async (
        authProvider: AuthProvider,
        backupFileContents: string,
        password: string
    ): Promise<string> => {
        setConnecting(true);
        setError(null);

        try {
            const backup: BackupFile = JSON.parse(backupFileContents);

            if (backup.version !== 1) {
                throw new Error('Unsupported backup file version');
            }

            const recoveryShare = await decryptWithPassword(
                backup.encryptedShare.ciphertext,
                backup.encryptedShare.iv,
                backup.encryptedShare.salt,
                password,
                backup.encryptedShare.kdfParams
            );

            const serverResponse = await fetchAuthShare(authProvider);

            if (!serverResponse || !serverResponse.authShare) {
                throw new Error('No auth share found on server');
            }

            const privateKey = await reconstructFromShares([
                recoveryShare,
                serverResponse.authShare.encryptedData,
            ]);

            // Generate new shares and update BOTH device and auth shares
            const { shares: newShares } = await splitAndVerify(privateKey);

            await storeDeviceShare(newShares.deviceShare);

            // Update auth share on server with new share from same split
            const token = await authProvider.getIdToken();
            const providerType = authProvider.getProviderType();
            const primaryDid = serverResponse.primaryDid || '';

            await fetch(`${serverUrl}/keys/auth-share`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: token,
                    providerType,
                    authShare: {
                        encryptedData: newShares.authShare,
                        encryptedDek: '',
                        iv: '',
                    },
                    primaryDid,
                    securityLevel: 'basic',
                }),
            });

            await finalizeLogin(privateKey);

            setConnecting(false);
            return privateKey;
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Recovery failed';
            setError(message);
            setConnecting(false);
            throw e;
        }
    }, [serverUrl, fetchAuthShare, finalizeLogin]);

    const clearAllIndexedDB = async () => {
        try {
            const databases = await window.indexedDB.databases();
            databases.forEach(db => {
                const dbName = db.name;
                if (!dbName) return;

                // Preserve SSS device share database across logouts
                if (dbName === 'lcb-sss-keys') {
                    console.log(`Preserving SSS device share database: ${dbName}`);
                    return;
                }

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

    const setAuthProvider = useCallback((provider: AuthProvider | null) => {
        sharedAuthProvider = provider;
    }, []);

    const getAuthProvider = useCallback(() => {
        return sharedAuthProvider;
    }, []);

    return {
        connect,
        setupWithPrivateKey,
        migrateFromWeb3Auth,
        checkAuthShareExists,
        getRecoveryMethods,
        addPasswordRecovery,
        addPasskeyRecovery,
        generateRecoveryPhrase,
        recoverWithPassword,
        recoverWithPasskey,
        recoverWithPhrase,
        exportBackup,
        recoverWithBackup,
        logout,
        loggingOut,
        connecting,
        error,
        setAuthProvider,
        getAuthProvider,
    };
};

export default useSSSKeyManager;
