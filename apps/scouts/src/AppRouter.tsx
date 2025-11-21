import { useEffect, useCallback, memo } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useLocation, useHistory } from 'react-router-dom';
import { PluginListenerHandle } from '@capacitor/core';
import queryString from 'query-string';

import {
    IonRouterOutlet,
    IonTabBar,
    IonTabButton,
    IonTabs,
    IonSplitPane,
    useIonModal,
    IonMenuToggle,
} from '@ionic/react';
import Burger from './components/svgs/Burger';
import Campfire2 from 'learn-card-base/svgs/Campfire2';
import SideMenu from './components/sidemenu/SideMenu';
import MeritBadgesIcon from 'learn-card-base/svgs/MeritBadgesIcon';
import BoostSelectMenu from './components/boost/boost-select-menu/BoostSelectMenu';
import BoostOutline2 from 'learn-card-base/svgs/BoostOutline2';

import {
    getNavBarColor,
    showNavBar,
    useIsLoggedIn,
    QRCodeScannerStore,
    usePrefetchCredentials,
    useIsCollapsed,
    usePrefetchBoosts,
    useWeb3Auth,
    LOGIN_REDIRECTS,
    Modals,
    useSyncConsentFlow,
    lazyWithRetry,
} from 'learn-card-base';
const Routes = lazyWithRetry(() => import('./Routes').then(module => ({ default: module.Routes })));
import { tabRoutes } from './constants';
import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';

import { useFirebase } from './hooks/useFirebase';
import { useJoinLCNetworkModal } from './components/network-prompts/hooks/useJoinLCNetworkModal';
import { useLaunchDarklyIdentify } from 'learn-card-base/hooks/useLaunchDarklyIdentify';
import { useIsChapiInteraction } from 'learn-card-base/stores/chapiStore';
import { useSentryIdentify, initSentry } from './constants/sentry';
import { useGetUnreadUserNotifications, useIsCurrentUserLCNUser } from 'learn-card-base';
import { useSetFirebaseAnalyticsUserId } from './hooks/useSetFirebaseAnalyticsUserId';
import { redirectStore } from 'learn-card-base/stores/redirectStore';
import { WALLET_ADAPTERS } from '@web3auth/base';

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

const TabBarButton = memo(
    ({
        tab,
        href,
        className,
        children,
    }: {
        tab: string;
        href: string;
        className: string;
        children: React.ReactNode;
    }) => (
        <IonTabButton tab={tab} href={href} className={className}>
            {children}
        </IonTabButton>
    )
);

const AppRouter: React.FC = () => {
    const { web3AuthInit } = useWeb3Auth();
    const { verifySignInLinkAndLogin, verifyAppleLogin } = useFirebase();
    const history = useHistory();
    const location = useLocation();
    const isLoggedIn = useIsLoggedIn();
    const collapsed = useIsCollapsed();
    const isChapiInteraction = useIsChapiInteraction();

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
        isLoading: notificationsLoading,
        refetch: refetchNotifications,
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

    const [presentBoostSelectModal, dismissBoosSelectModal] = useIonModal(BoostSelectMenu, {
        handleCloseModal: () => dismissBoosSelectModal(),
        showCloseButton: false,
        showNewBoost: true,
        title: (
            <p className="font-mouse flex items-center justify-center text-3xl w-full h-full text-grayscale-900">
                Who do you want to send to?
            </p>
        ),
        history,
    });

    const handleLoginAsync = useCallback(async () => {
        const web3Auth = await web3AuthInit({
            redirectUrl:
                IS_PRODUCTION || Capacitor.getPlatform() === 'android'
                    ? LOGIN_REDIRECTS[BrandingEnum.scoutPass].redirectUrl
                    : LOGIN_REDIRECTS[BrandingEnum.scoutPass].devRedirectUrl,
            branding: BrandingEnum.scoutPass,
            showLoading: false,
        });
        await web3Auth?.connectTo(WALLET_ADAPTERS.OPENLOGIN);
    }, [web3AuthInit]);

    useEffect(() => {
        if (!currentLCNUserLoading && currentLCNUser === false) {
            handlePresentJoinNetworkModal();
        }
    }, [currentLCNUser, currentLCNUserLoading]);

    const handleAppUrlOpen = async (data: { url: string }) => {
        const parsedUrl = new URL(data.url);
        const params = new URLSearchParams(parsedUrl.search);
        const isNative = Capacitor?.isNativePlatform();

        if (params.has('loginCompleted') && isNative) {
            await handleLoginAsync();
        } else if (params.get('verifyCode') === 'true' && isNative) {
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
    }, [handleLoginAsync, verifySignInLinkAndLogin, savedEmail]);

    useEffect(() => {
        if (!Capacitor.isNativePlatform() && savedEmail) {
            verifySignInLinkAndLogin(savedEmail, window.location.href);
        }
    }, [savedEmail]);

    useEffect(() => {
        if (params?.verifyCode) {
            const email = params.email as string;
            redirectStore.set.email(email);

            history.replace(`/login?verifyCode=true`);
        }
    }, []);

    const unreadCount = notificationsData?.notifications?.length || null;

    const hideSideMenu = location.pathname === '/consent-flow';

    return (
        <>
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
                                    location.pathname
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
                                    {/*
                                tab prop is needed to prevent hard refresh...
                                set href to # to prevent id undefined errors & rerouting
                            */}
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
