import { useEffect, useCallback, memo, useState } from 'react';
import { App } from '@capacitor/app';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { useLocation, useHistory } from 'react-router-dom';
import queryString from 'query-string';

import {
    IonRouterOutlet,
    IonTabBar,
    IonTabButton,
    IonTabs,
    IonSplitPane,
    IonMenuToggle,
} from '@ionic/react';
import Burger from './components/svgs/Burger';
import Campfire2 from 'learn-card-base/svgs/Campfire2';
import SideMenu from './components/sidemenu/SideMenu';
import MeritBadgesIcon from 'learn-card-base/svgs/MeritBadgesIcon';
import BoostSelectMenu from './components/boost/boost-select-menu/BoostSelectMenu';
import BoostOutline2 from 'learn-card-base/svgs/BoostOutline2';
import LoginOverlay from './components/auth/LoginOverlay';

import {
    getNavBarColor,
    showNavBar,
    useIsLoggedIn,
    QRCodeScannerStore,
    usePrefetchCredentials,
    usePrefetchBoosts,
    useModal,
    ModalTypes,
    useSyncConsentFlow,
    useSyncRevokedCredentials,
    useIsCollapsed,
    LOGIN_REDIRECTS,
    lazyWithRetry,
    useGetUnreadUserNotifications,
    useIsCurrentUserLCNUser,
    Modals,
    redirectStore,
    BrandingEnum,
} from 'learn-card-base';
import { tabRoutes } from './constants';

import { useFirebase } from './hooks/useFirebase';
import { useAppAuth } from './providers/AuthCoordinatorProvider';
import { useJoinLCNetworkModal } from './components/network-prompts/hooks/useJoinLCNetworkModal';
import { useLaunchDarklyIdentify } from 'learn-card-base/hooks/useLaunchDarklyIdentify';
import { useIsChapiInteraction } from 'learn-card-base/stores/chapiStore';
import { useSentryIdentify, initSentry } from './constants/sentry';
import { useSetFirebaseAnalyticsUserId } from './hooks/useSetFirebaseAnalyticsUserId';

const Routes = lazyWithRetry(() => import('./Routes').then(module => ({ default: module.Routes })));

interface NavbarGradientProps {
    path: string;
}

const getBackgroundGradientForNavbar = ({ path }: NavbarGradientProps): string => {
    const gradientMap: Record<string, string> = {
        '/campfire': 'campfire',
        '/badges': 'badges',
        '/boosts': 'boosts',
    };
    return gradientMap[path] || '';
};

const AppRouter: React.FC = () => {
    const { isLoading: coordinatorLoading, walletReady } = useAppAuth();

    // The coordinator detects Firebase auth changes via firebaseAuthStore and
    // handles the full lifecycle (authenticating → deriving_key → ready).
    // Once walletReady is true, we always show the app regardless of other signals.
    const initLoading = walletReady ? false : coordinatorLoading;
    const { verifySignInLinkAndLogin } = useFirebase();
    const history = useHistory();
    const location = useLocation();
    const isLoggedIn = useIsLoggedIn();
    const collapsed = useIsCollapsed();
    const isChapiInteraction = useIsChapiInteraction();
    const [showLoginOverlay, setShowLoginOverlay] = useState(false);

    useEffect(() => {
        if (isLoggedIn && location.pathname.includes('/login')) {
            setShowLoginOverlay(true);
        }

        if (isLoggedIn && !location.pathname.includes('/login')) {
            setShowLoginOverlay(false);
        }
    }, [isLoggedIn, location.pathname]);

    // Initialize Sentry only once when the component mounts
    useEffect(() => {
        initSentry();
    }, []);

    const enablePrefetch = isLoggedIn && !isChapiInteraction;
    const savedEmail = localStorage.getItem('emailForSignIn');

    const params = queryString.parse(location.search);

    // Custom hooks
    const { data: currentLCNUser, isLoading: currentLCNUserLoading } = useIsCurrentUserLCNUser();
    const { handlePresentJoinNetworkModal } = useJoinLCNetworkModal();
    const {
        data: notificationsData,
    } = useGetUnreadUserNotifications();

    const showScanner = QRCodeScannerStore.useTracked.showScanner();

    // Prefetch data
    usePrefetchCredentials('Social Badge', isLoggedIn);
    usePrefetchCredentials('Membership', isLoggedIn);
    usePrefetchBoosts(enablePrefetch);
    useLaunchDarklyIdentify({ debug: !IS_PRODUCTION });
    useSentryIdentify({ debug: !IS_PRODUCTION });
    useSetFirebaseAnalyticsUserId({ debug: false });
    useSyncConsentFlow(enablePrefetch);
    useSyncRevokedCredentials(enablePrefetch);

    const { newModal: newBoostSelectModal, closeModal: closeBoostSelectModal } = useModal({
        mobile: ModalTypes.Cancel,
        desktop: ModalTypes.Cancel,
    });

    const openBoostSelectModal = () => {
        newBoostSelectModal(
            <BoostSelectMenu
                handleCloseModal={closeBoostSelectModal}
                showCloseButton={false}
                showNewBoost={true}
                history={history as any}
                boostCredential={{} as any}
                boostUri=""
                profileId=""
            />
        );
    };


    useEffect(() => {
        if (!currentLCNUserLoading && currentLCNUser === false) {
            handlePresentJoinNetworkModal();
        }
    }, [currentLCNUser, currentLCNUserLoading, handlePresentJoinNetworkModal]);

    const handleAppUrlOpen = async (data: { url: string }) => {
        const parsedUrl = new URL(data.url);
        const params = new URLSearchParams(parsedUrl.search);
        const isNative = Capacitor?.isNativePlatform();

        if (params.get('verifyCode') === 'true' && isNative) {
            redirectStore.set.email(params.get('email') as string);
            history.replace('/login?verifyCode=true');
        } else if (data.url) {
            const savedEmailNative = localStorage.getItem('emailForSignIn') ?? '';
            await verifySignInLinkAndLogin(savedEmailNative, data.url);
        }
    };

    useEffect(() => {
        let listener: PluginListenerHandle | null = null;
        // Async setup with proper Promise handling
        const setupListener = async () => {
            listener = await App.addListener('appUrlOpen', handleAppUrlOpen);
        };
        setupListener();

        // Cleanup function
        return () => {
            if (listener) {
                listener.remove();
            }
        };
    }, [verifySignInLinkAndLogin, savedEmail]);

    useEffect(() => {
        if (!Capacitor.isNativePlatform() && savedEmail) {
            verifySignInLinkAndLogin(savedEmail, window.location.href);
        }
    }, [savedEmail, verifySignInLinkAndLogin]);

    useEffect(() => {
        if (params?.verifyCode) {
            const email = params.email as string;
            redirectStore.set.email(email);

            history.replace(`/login?verifyCode=true`);
        }
    }, [params, history]);

    const unreadCount = notificationsData?.notifications?.length || null;

    const hideSideMenu = location.pathname === '/consent-flow' || location.pathname.includes('/login');

    return (
        <>
            <LoginOverlay isOpen={!!showLoginOverlay || !!initLoading} />
            <div id="app-router" style={{ display: showScanner ? 'none' : 'block' }}>
                <IonSplitPane
                    contentId="main"
                    className={
                        collapsed
                            ? 'side-menu-split-pane-container-collapsed'
                            : 'side-menu-split-pane-container-visible'
                    }
                >
                    {isLoggedIn && !hideSideMenu && <SideMenu branding={BrandingEnum.scoutPass} />}
                    <div id="main" className="w-full">
                        <IonTabs
                            className={`${getNavBarColor(
                                location.pathname,
                                BrandingEnum.scoutPass
                            )}`}
                        >
                            <IonRouterOutlet animated={true}>
                                <Routes />
                            </IonRouterOutlet>
                            <div
                                className={`background-gradient-navbar ${getBackgroundGradientForNavbar(
                                    {
                                        path: location.pathname,
                                    }
                                )}`}
                            ></div>
                            {isLoggedIn && showNavBar(location.pathname) ? (
                                <IonTabBar
                                    slot="bottom"
                                    style={{
                                        contain: 'none',
                                        overflow: 'visible',
                                        height: '70px',
                                    }}
                                >
                                    <IonTabButton
                                        tab="/"
                                        href="#"
                                        className="mobile-nav-hamburger-button"
                                    >
                                        <IonMenuToggle menu="appSideMenu">
                                            <Burger className="text-black h-[24px] w-[24px]" />
                                        </IonMenuToggle>
                                    </IonTabButton>
                                    <IonTabButton
                                        tab={tabRoutes.tab1}
                                        href={tabRoutes.tab1}
                                        className="nav-tab-boosts pl-[10px]"
                                    >
                                        <BoostOutline2
                                            className="mb-0"
                                            size="40"
                                            outlineStar="currentColor"
                                            inlineStar="currentColor"
                                        />
                                        Boosts
                                    </IonTabButton>
                                    <IonTabButton
                                        tab={tabRoutes.tab2}
                                        href={tabRoutes.tab2}
                                        className="absolute bg-transparent left-[50%] translate-x-[-50%] z-50 nav-tab-campfire h-[85px] w-[85px]"
                                    >
                                        <div className="bg-sp-purple-base border-[#F5F6FA] border-[3px] border-solid rounded-full flex items-center justify-center flex-col font-bold text-xs px-[15px] pb-[10px]">
                                            {unreadCount && (
                                                <div className="notification-count-mobile alert-indicator-dot">
                                                    {unreadCount}
                                                </div>
                                            )}
                                            <Campfire2
                                                className="mb-[3px]"
                                                firewood="#FFFFFF"
                                                flames="#4D006E"
                                            />
                                            <p>Campfire</p>
                                        </div>
                                    </IonTabButton>
                                    <IonTabButton
                                        tab={tabRoutes.tab3}
                                        href={tabRoutes.tab3}
                                        className="nav-tab-badges"
                                    >
                                        <MeritBadgesIcon className="h-[40px] w-[40px] mt-[0px] mb-0" />
                                        Badges
                                    </IonTabButton>
                                </IonTabBar>
                            ) : (
                                <IonTabBar
                                    slot="bottom"
                                    style={{
                                        display: 'none',
                                    }}
                                />
                            )}
                        </IonTabs>
                    </div>
                </IonSplitPane>
            </div>
            <Modals />
        </>
    );
};

export default memo(AppRouter);
