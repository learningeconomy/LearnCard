import { Capacitor } from '@capacitor/core';
import { Web3AuthNoModal } from '@web3auth/no-modal';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { OpenloginAdapter } from '@web3auth/openlogin-adapter';
import { useQueryClient } from '@tanstack/react-query';

import {
    CHAIN_NAMESPACES,
    ADAPTER_EVENTS,
    CONNECTED_EVENT_DATA,
    IProvider,
    UserInfo,
} from '@web3auth/base';

import useWallet from 'learn-card-base/hooks/useWallet';
import useSQLiteStorage from 'learn-card-base/hooks/useSQLiteStorage';
import { useToast, ToastTypeEnum } from 'learn-card-base';
import { useIsLoggedIn } from 'learn-card-base/stores/currentUserStore';

import web3AuthStore from 'learn-card-base/stores/web3AuthStore';
import currentUserStore from 'learn-card-base/stores/currentUserStore';
import { walletStore } from 'learn-card-base/stores/walletStore';
import authStore, { useInitLoading } from 'learn-card-base/stores/authStore';
import redirectStore from 'learn-card-base/stores/redirectStore';
import { chapiStore } from 'learn-card-base/stores/chapiStore';
import firebaseAuthStore from 'learn-card-base/stores/firebaseAuthStore';

import {
    unsetAuthToken,
    setDiscordAuthToken,
    clearAuthServiceProvider,
} from 'learn-card-base/helpers/authHelpers';
import { isPlatformIOS, isPlatformAndroid } from 'learn-card-base/helpers/platformHelpers';
import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import { getRandomBaseColor } from 'learn-card-base/helpers/colorHelpers';
import { pushUtilities } from 'learn-card-base/utils/pushUtilities';
import { getWeb3AuthNetworkConfig } from 'learn-card-base/constants/web3AuthConfig';
import firstStartupStore from 'learn-card-base/stores/firstStartupStore';
import { clearLearnCardCache } from 'learn-card-base/helpers/walletHelpers';
import { clearAll as clearWebSecureAll } from 'learn-card-base/security/webSecureStorage';
import {
    setPlatformPrivateKey,
    clearPlatformPrivateKey,
} from 'learn-card-base/security/platformPrivateKeyStorage';
import { getCurrentUserPrivateKey } from 'learn-card-base/helpers/privateKeyHelpers';

type Web3AuthWhiteLabel = {
    appName?: string;
    logoLight?: string;
    logoDark?: string;
    defaultLanguage?: string;
    mode?: 'dark' | 'light';
    theme?: {
        primary?: string;
    };
    useLogoLoader?: boolean;
};

export const WEB3AUTH_WHITE_LABEL_CONFIG: Partial<Record<BrandingEnum, Web3AuthWhiteLabel>> = {
    [BrandingEnum.learncard]: {
        appName: 'LearnCard',
        logoLight:
            'https://cdn.filestackcontent.com/rotate=deg:exif/auto_image/tRrHF9W2Q9ugaiIAAJI8',
        logoDark:
            'https://cdn.filestackcontent.com/rotate=deg:exif/auto_image/tRrHF9W2Q9ugaiIAAJI8',
        defaultLanguage: 'en',
        mode: 'dark', // whether to enable dark mode. defaultValue: false
        theme: {
            primary: '#20c397',
        },
        useLogoLoader: true,
    },
    [BrandingEnum.metaversity]: {
        appName: 'Metaversity',
        logoLight:
            'https://cdn.filestackcontent.com/rotate=deg:exif/auto_image/BFYnDhOQiqznCPbbfUDQ',
        logoDark:
            'https://cdn.filestackcontent.com/rotate=deg:exif/auto_image/BFYnDhOQiqznCPbbfUDQ',
        defaultLanguage: 'en',
        mode: 'dark', // whether to enable dark mode. defaultValue: false
        theme: {
            primary: '#0A73BC',
        },
        useLogoLoader: true,
    },

    [BrandingEnum.scoutPass]: {
        appName: 'ScoutPass',
        logoLight: 'https://cdn.filestackcontent.com/KOCODV32TlCAnZ9nEdRg',
        logoDark: 'https://cdn.filestackcontent.com/KOCODV32TlCAnZ9nEdRg',
        defaultLanguage: 'en',
        mode: 'dark', // whether to enable dark mode. defaultValue: false
        theme: {
            primary: '#622599',
        },
        useLogoLoader: true,
    },
    // plaidLibs apps - branding names/icons must align with whitelabel settings at https://cms.madlib.ai/admin/content/Apps
    [BrandingEnum['PlaidLibs']]: {
        appName: 'PlaidLibs',
        logoLight: 'https://cms.madlib.ai/assets/1d39b1c7-fc32-40d2-be72-e8e631d6e9d7',
        logoDark: 'https://cms.madlib.ai/assets/1d39b1c7-fc32-40d2-be72-e8e631d6e9d7',
        defaultLanguage: 'en',
        mode: 'dark',
        theme: {
            primary: '#6366F1',
        },
        useLogoLoader: true,
    },
    [BrandingEnum['PlaidLibs Dev']]: {
        appName: 'PlaidLibs Dev',
        logoLight: 'https://cms.madlib.ai/assets/1d39b1c7-fc32-40d2-be72-e8e631d6e9d7',
        logoDark: 'https://cms.madlib.ai/assets/1d39b1c7-fc32-40d2-be72-e8e631d6e9d7',
        defaultLanguage: 'en',
        mode: 'dark',
        theme: {
            primary: '#6366F1',
        },
        useLogoLoader: true,
    },
    [BrandingEnum['Daily Wizard']]: {
        appName: 'Daily Wizard',
        logoLight: 'https://cdn.filestackcontent.com/x8f096CT6SqGEFJuB8Dq',
        logoDark: 'https://cdn.filestackcontent.com/x8f096CT6SqGEFJuB8Dq',
        defaultLanguage: 'en',
        mode: 'dark',
        theme: {
            primary: '#6366F1',
        },
        useLogoLoader: true,
    },
    [BrandingEnum['Daily Wizard Dev']]: {
        appName: 'Daily Wizard',
        logoLight: 'https://cdn.filestackcontent.com/x8f096CT6SqGEFJuB8Dq',
        logoDark: 'https://cdn.filestackcontent.com/x8f096CT6SqGEFJuB8Dq',
        defaultLanguage: 'en',
        mode: 'dark',
        theme: {
            primary: '#6366F1',
        },
        useLogoLoader: true,
    },
    [BrandingEnum['Bedtime Tales']]: {
        appName: 'Bedtime Tales',
        logoLight: 'https://cdn.filestackcontent.com/D2mmF95hRkeuHjwWRmea',
        logoDark: 'https://cdn.filestackcontent.com/D2mmF95hRkeuHjwWRmea',
        defaultLanguage: 'en',
        mode: 'dark',
        theme: {
            primary: '#6366F1',
        },
        useLogoLoader: true,
    },
    [BrandingEnum['Bedtime Tales Dev']]: {
        appName: 'Bedtime Tales',
        logoLight: 'https://cdn.filestackcontent.com/D2mmF95hRkeuHjwWRmea',
        logoDark: 'https://cdn.filestackcontent.com/D2mmF95hRkeuHjwWRmea',
        defaultLanguage: 'en',
        mode: 'dark',
        theme: {
            primary: '#6366F1',
        },
        useLogoLoader: true,
    },
    [BrandingEnum['Dev Test App']]: {
        appName: 'Dev Test App',
        logoLight: 'https://cdn.filestackcontent.com/L1YDBoPXRnmWu1qSq60d',
        logoDark: 'https://cdn.filestackcontent.com/L1YDBoPXRnmWu1qSq60d',
        defaultLanguage: 'en',
        mode: 'dark',
        theme: {
            primary: '#6366F1',
        },
        useLogoLoader: true,
    },
    [BrandingEnum['Asana Buddy']]: {
        appName: 'Asana Buddy',
        logoLight: 'https://cdn.filestackcontent.com/btgPLMWTRx2d7uV7ufOP',
        logoDark: 'https://cdn.filestackcontent.com/btgPLMWTRx2d7uV7ufOP',
        defaultLanguage: 'en',
        mode: 'dark',
        theme: {
            primary: '#6366F1',
        },
        useLogoLoader: true,
    },
    [BrandingEnum['Dev Apps']]: {
        appName: 'Dev Apps',
        logoLight: 'https://cdn.filestackcontent.com/btgPLMWTRx2d7uV7ufOP', // TODO
        logoDark: 'https://cdn.filestackcontent.com/btgPLMWTRx2d7uV7ufOP',
        defaultLanguage: 'en',
        mode: 'dark',
        theme: {
            primary: '#6366F1',
        },
        useLogoLoader: true,
    },
    [BrandingEnum['ClimbUp']]: {
        appName: 'ClimbUp',
        logoLight: 'https://cms.madlib.ai/assets/1d39b1c7-fc32-40d2-be72-e8e631d6e9d7',
        logoDark: 'https://cms.madlib.ai/assets/1d39b1c7-fc32-40d2-be72-e8e631d6e9d7',
        defaultLanguage: 'en',
        mode: 'dark',
        theme: {
            primary: '#6366F1',
        },
        useLogoLoader: true,
    },
};

export const useWeb3Auth = (onLogin?: () => Promise<any>) => {
    const isLoggedIn = useIsLoggedIn();
    const { presentToast } = useToast();
    const { setCurrentUser, clearDB } = useSQLiteStorage();
    const { initWallet } = useWallet();
    const initLoading = useInitLoading();
    const queryClient = useQueryClient();
    const { getProviderAuthToken } = useSQLiteStorage();

    const setInitLoading = authStore.set.initLoading;
    const setLoginAttempts = authStore.set.loginAttempts;

    const getPrivateKey = async (provider: IProvider): Promise<string | null> => {
        const privateKey = await provider.request({
            method: 'eth_private_key',
        });

        return privateKey as string;
    };

    const subscribeAuthEvents = (web3auth: Web3AuthNoModal) => {
        web3auth.on(ADAPTER_EVENTS.CONNECTED, async (_data: CONNECTED_EVENT_DATA) => {
            if (web3auth) {
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

                //todo extract this into helper to generalize
                if (user?.typeOfLogin === 'discord' && user?.oAuthAccessToken) {
                    setDiscordAuthToken(user?.oAuthAccessToken);
                }

                // get user from sqlite
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

                        await onLogin?.();
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
            const msg = String(error);
            if (msg.includes('Unable to open window')) {
                presentToast(
                    'Login failed because your browser has blocked the popup window. Please enable popups to login to this site.',
                    {
                        type: ToastTypeEnum.Error,
                        hasDismissButton: true,
                    }
                );
            }
            setInitLoading(false);
            throw new Error(msg);
        });
    };

    const web3AuthInit = async ({
        redirectUrl = 'https://learncard.app/',
        showLoading = true,
        forceInit = false,
        branding = BrandingEnum.learncard,
    }) => {
        if (isLoggedIn && !forceInit) {
            setInitLoading(true);
            setTimeout(() => {
                setInitLoading(false);
            }, 2000);
            return;
        }
        try {
            const web3AuthNetworkConfig = getWeb3AuthNetworkConfig(branding);

            setInitLoading(showLoading ?? true);

            const chainConfig = {
                chainNamespace: CHAIN_NAMESPACES.EIP155,
                chainId: '0x1',
                rpcTarget: 'https://mainnet.infura.io/v3/af590ea7328444e4b20c75bb401b6105',
                displayName: 'Ethereum Mainnet',
                blockExplorer: 'https://etherscan.io/',
                ticker: 'ETH',
                tickerName: 'Ethereum',
            };

            const web3auth = new Web3AuthNoModal({
                clientId: web3AuthNetworkConfig?.modalConfig?.clientId,
                web3AuthNetwork: web3AuthNetworkConfig?.modalConfig?.web3AuthNetwork,
                chainConfig: chainConfig,
            });

            const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });

            const isChapiInteraction = chapiStore.get.isChapiInteraction();
            const usePopup = Capacitor.getPlatform() === 'web' && isChapiInteraction;

            const adapter = new OpenloginAdapter({
                privateKeyProvider,
                adapterSettings: {
                    ...web3AuthNetworkConfig?.adapterConfig,
                    ...(isPlatformAndroid() ? ({ no3PC: true } as any) : {}),
                    uxMode: usePopup ? 'popup' : 'redirect',
                    redirectUrl,
                    loginConfig: {
                        learncardFirebase: {
                            name: 'learncardapp-firebase',
                            verifier: 'learncardapp-firebase',
                            typeOfLogin: 'jwt',
                            clientId:
                                '776298253175-kkf562eofl541vu0oedfdvrk40bpkbh7.apps.googleusercontent.com',
                        },
                        learncardFirebaseMainnet: {
                            name: 'learncardapp-firebase-cyan-mainnet',
                            verifier: 'learncardapp-firebase-cyan-mainnet',
                            typeOfLogin: 'jwt',
                            clientId:
                                '776298253175-kkf562eofl541vu0oedfdvrk40bpkbh7.apps.googleusercontent.com',
                        },
                        plaidLibsFirebase: {
                            name: 'plaidlibs-firebase',
                            verifier: 'plaidlibs-firebase',
                            typeOfLogin: 'jwt',
                            clientId:
                                '559228470053-en6i0ikffp2hdp501u2j6d81reonut1p.apps.googleusercontent.com',
                        },
                        scoutPassFirebaseMainnet: {
                            name: 'scoutPass-firebase-cyan-mainnet',
                            verifier: 'scoutPass-firebase-cyan-mainnet',
                            typeOfLogin: 'jwt',
                            clientId:
                                '792471921493-df6n0hb184opgghl84lujffto69bq8g9.apps.googleusercontent.com',
                        },
                    },
                    whiteLabel: WEB3AUTH_WHITE_LABEL_CONFIG[branding] as any,
                },
            });

            web3auth.configureAdapter(adapter);
            subscribeAuthEvents(web3auth);
            web3AuthStore.set.web3Auth(web3auth);

            await web3auth.init();

            return web3auth;
        } catch (error) {
            setInitLoading(false);
            console.log(error);
            return undefined;
        }
    };

    const logout = async (
        redirectUrl: string = 'https://learncard.app/',
        branding: BrandingEnum = BrandingEnum.learncard
    ) => {
        setInitLoading(true);
        const web3Auth = web3AuthStore.get.web3Auth();

        if (web3Auth && !isPlatformIOS()) {
            await web3Auth?.logout({ cleanup: true });
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

        clearLearnCardCache();

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
        await clearDB();
        unsetAuthToken();
        currentUserStore.set.currentUser(null);
        currentUserStore.set.currentUserPK(null);
        currentUserStore.set.currentUserIsLoggedIn(false);

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

        await web3AuthInit({ redirectUrl, showLoading: false, forceInit: true, branding });

        setInitLoading(false);
        setLoginAttempts(0);
        window.location.href = '/login';
        // history.push('/login');
    };

    return {
        web3AuthInit,
        logout,
        initLoading,
        setInitLoading,
    };
};

export default useWeb3Auth;
