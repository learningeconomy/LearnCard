import { useState } from 'react';
import { Web3Auth } from '@web3auth/single-factor-auth';
import { useQueryClient } from '@tanstack/react-query';

import {
    CHAIN_NAMESPACES,
    ADAPTER_EVENTS,
    CONNECTED_EVENT_DATA,
    IProvider,
    UserInfo,
} from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { getWeb3AuthNetworkConfig } from 'learn-card-base/constants/web3AuthConfig';

import useWallet from 'learn-card-base/hooks/useWallet';
import useSQLiteStorage from 'learn-card-base/hooks/useSQLiteStorage';

import { getRandomBaseColor } from 'learn-card-base/helpers/colorHelpers';
import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
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
import { getCurrentUserPrivateKey } from 'learn-card-base/helpers/privateKeyHelpers';

export const useWeb3AuthSFA = () => {
    const [loggingOut, setLoggingOut] = useState(false);
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();
    const { setCurrentUser, clearDB } = useSQLiteStorage();
    const { getProviderAuthToken } = useSQLiteStorage();

    const setInitLoading = authStore.set.initLoading;

    const getPrivateKey = async (provider: IProvider): Promise<string | null> => {
        const privateKey = await provider.request({
            method: 'eth_private_key',
        });

        return privateKey as string;
    };

    const subscribeAuthEvents = (web3auth: Web3Auth) => {
        web3auth.on(ADAPTER_EVENTS.CONNECTED, async (_data: CONNECTED_EVENT_DATA) => {
            if (web3auth && !loggingOut) {
                const user: Partial<UserInfo> = await web3auth.getUserInfo();

                const provider = web3auth.provider;
                if (!provider) {
                    console.warn('Web3Auth provider unavailable on CONNECTED');
                    setInitLoading(false);
                    return;
                }

                const userPK: string = (await getPrivateKey(provider)) ?? '';
                const firebaseCurrentUser = firebaseAuthStore.get.currentUser();

                const sqliteUserPayload = {
                    ...user,
                    uid: firebaseCurrentUser?.uid ?? '',
                    email: firebaseCurrentUser?.email ?? '',
                    phoneNumber: firebaseCurrentUser?.phoneNumber ?? '',
                    name: firebaseCurrentUser?.displayName ?? '',
                    profileImage: firebaseCurrentUser?.photoUrl ?? '',
                    privateKey: userPK,
                    baseColor: getRandomBaseColor(),
                };

                // set user in sqlite
                await setCurrentUser(sqliteUserPayload);

                // Store the private key using platform-aware storage (web: AES-GCM+IndexedDB, native: encrypted SQLite)
                if (userPK) {
                    try {
                        await setPlatformPrivateKey(userPK);
                    } catch (e) {
                        console.warn('Failed to set secure PK', e);
                    }
                }

                // Use centralized helper for final PK selection (override with freshly fetched PK)
                const finalPk = await getCurrentUserPrivateKey(userPK);

                if (finalPk) {
                    const wallet = await initWallet(finalPk);
                    if (wallet) {
                        walletStore.set.wallet(wallet);
                        // set the user is logged in if the private key was stored in sqlite
                        currentUserStore.set.currentUser({ ...sqliteUserPayload });
                        // sync device token on login
                        await pushUtilities.syncPushToken();

                        // await onLogin?.();
                    } else {
                        throw new Error('Error: Could not initialize wallet');
                    }
                }

                web3AuthStore.set.provider(web3auth.provider);
                setInitLoading(false);
            }
        });
        web3auth.on(ADAPTER_EVENTS.CONNECTING, () => {
            setInitLoading(true);
        });
        web3auth.on(ADAPTER_EVENTS.DISCONNECTED, () => {
            setInitLoading(false);
        });
        web3auth.on(ADAPTER_EVENTS.ERRORED, (error: unknown) => {
            console.warn('Web3Auth SFA error event', error);
            setInitLoading(false);
        });
    };

    const web3AuthSFAInit = async (branding = BrandingEnum.learncard) => {
        const web3AuthNetworkConfig = getWeb3AuthNetworkConfig(branding);

        // Initializing Ethereum Provider
        const privateKeyProvider = new EthereumPrivateKeyProvider({
            config: {
                chainConfig: {
                    chainNamespace: CHAIN_NAMESPACES.EIP155,
                    chainId: '0x1',
                    rpcTarget: 'https://mainnet.infura.io/v3/af590ea7328444e4b20c75bb401b6105',
                    displayName: 'Ethereum Mainnet',
                    blockExplorerUrl: 'https://etherscan.io/',
                    ticker: 'ETH',
                    tickerName: 'Ethereum',
                },
            },
        });

        // Initialising Web3Auth Single Factor Auth SDK
        const web3authSfa = new Web3Auth({
            clientId: web3AuthNetworkConfig?.modalConfig?.clientId, // Get your Client ID from Web3Auth Dashboard
            web3AuthNetwork: web3AuthNetworkConfig?.modalConfig?.web3AuthNetwork, // Get your Network from Web3Auth Dashboard
            privateKeyProvider,
            usePnPKey: true, // Setting this to true returns the same key as PnP Web SDK, By default, this SDK returns CoreKitKey.
        });

        subscribeAuthEvents(web3authSfa);
        web3AuthStore.set.web3Auth(web3authSfa);

        await web3authSfa.init();

        return web3authSfa;
    };

    const clearAllIndexedDB = async () => {
        try {
            // Get all database names
            const databases = await window.indexedDB.databases();
            databases.forEach(db => {
                const dbName = db.name;
                if (!dbName) return;
                // Request to delete each database
                const request = window.indexedDB.deleteDatabase(dbName);
                request.onsuccess = function () {
                    console.log(`Deleted database successfully: ${dbName}`);
                };
                request.onerror = function (event) {
                    const req = (event?.target as IDBRequest) ?? null;
                    console.log(`Couldn't delete database: ${dbName}. Error: ${req?.error}`);
                };
                request.onblocked = function () {
                    console.log(
                        `Couldn't delete database due to the operation being blocked: ${dbName}`
                    );
                };
            });
        } catch (e) {
            console.error('Error clearing IndexedDB databases:', e);

            try {
                const knownDatabases = [
                    'jeepSqliteStore',
                    'firebaseLocalStorageDb',
                    'firebase-installations-database',
                    'firebase-heartbeat-database',
                ];
                knownDatabases.forEach(dbName => {
                    const request = indexedDB.deleteDatabase(dbName);
                    request.onsuccess = function () {
                        console.log(`Deleted database successfully: ${dbName}`);
                    };
                    request.onerror = function (e) {
                        const req = (e?.target as IDBRequest) ?? null;
                        console.log(`Couldn't delete database: ${dbName}. Error: ${req?.error}`);
                    };
                    request.onblocked = function () {
                        console.log(
                            `Couldn't delete database due to the operation being blocked: ${dbName}`
                        );
                    };
                });
            } catch (e2) {
                console.error('Error clearing KNOWN IndexedDB databases', e2);
            }
        }
    };

    const logout = async (
        redirectUrl: string = 'https://learncard.app/',
        _branding: BrandingEnum = BrandingEnum.learncard
    ) => {
        try {
            setLoggingOut(true);
            setInitLoading(true);
            const web3Auth = await web3AuthSFAInit(BrandingEnum.scoutPass);

            if (web3Auth) {
                try {
                    await web3Auth?.logout();
                } catch (error) {
                    console.log('web3Auth::logout::error', error);
                }
            }

            // logout from auth provider if auth provider token exists
            const authProvider = await getProviderAuthToken('motlow');
            const endpoint = 'https://apis.le-int-svcs.com/auth/logout';

            if (authProvider?.token) {
                try {
                    const response = await fetch(endpoint, {
                        headers: {
                            Authorization: `Bearer ${authProvider?.token}`,
                        },
                    });
                    const data = await response.json();
                    return data;
                } catch (error) {
                    console.error(error);
                }
            }

            await queryClient?.clear();

            // prevent startup screens from appearing again
            firstStartupStore.set.introSlidesCompleted(true);
            firstStartupStore.set.firstStart(false);

            // clear stores
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

            // clear user store & sqlite
            try {
                await clearDB();
            } catch (error) {
                console.log('clearDB::error', error);
            }

            unsetAuthToken();
            currentUserStore.set.currentUser(null);
            currentUserStore.set.currentUserPK(null);
            currentUserStore.set.currentUserIsLoggedIn(false);

            // Clear localStorage
            window?.localStorage?.clear();

            // Clear sessionStorage
            window?.sessionStorage?.clear();

            // Clear platform-aware private key (native SQLite or web secure storage)
            try {
                await clearPlatformPrivateKey();
            } catch (e) {
                console.warn('Failed to clear platform private key', e);
            }

            // Clear secure storage (master key and secrets)
            try {
                await clearWebSecureAll();
            } catch (e) {
                console.warn('Failed to clear secure storage', e);
            }

            await clearAllIndexedDB();

            setInitLoading(false);
            if (redirectUrl) {
                if (typeof redirectUrl === 'string') {
                    window.location.href = redirectUrl;
                } else {
                    window.location.href = '/login';
                }
            }
            // One day we will solve this weird logout issue - must be hard refresh or state resets itself in a race condition somewhere.
            //history.push('/login');
        } catch (e) {
            console.error('Error logging out', e);
            setInitLoading(false);
            setLoggingOut(false);
        }
    };

    return { web3AuthSFAInit, logout, loggingOut };
};

export default useWeb3AuthSFA;
