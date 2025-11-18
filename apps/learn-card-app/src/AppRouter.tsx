import React, { useEffect } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useLocation, useHistory } from 'react-router-dom';
import queryString from 'query-string';

import { IonSplitPane } from '@ionic/react';
import SideMenu from './components/sidemenu/SideMenu';
import NewMyData from './components/new-my-data/NewMyData';
import MobileNavBar from './components/mobile-nav-bar/MobileNavBar';
import LoginLoadingPage from './pages/login/LoginPageLoader/LoginLoader';
import GenericErrorBoundary from './components/generic/GenericErrorBoundary';
import AiSessionAssessmentPreviewContainer from './components/ai-assessment/AiSessionAssessmentPreviewContainer';

import {
    useIsLoggedIn,
    QRCodeScannerStore,
    usePrefetchCredentials,
    useIsCollapsed,
    usePrefetchBoosts,
    useModal,
    ModalTypes,
    useWeb3Auth,
    LOGIN_REDIRECTS,
    useSyncConsentFlow,
    useWallet,
    useCurrentUser,
    useIsCurrentUserLCNUser,
} from 'learn-card-base';
import { useNetworkConsentMutation } from 'learn-card-base/react-query/mutations/networkConsent';
import { useQueryClient } from '@tanstack/react-query';

import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import { WALLET_ADAPTERS } from '@web3auth/base';

import { useFirebase } from './hooks/useFirebase';
import { useLaunchDarklyIdentify } from 'learn-card-base/hooks/useLaunchDarklyIdentify';
import { useIsChapiInteraction } from 'learn-card-base/stores/chapiStore';
import { useSentryIdentify } from './constants/sentry';
import { useUserflowIdentify } from './constants/userflow';
import { Modals } from 'learn-card-base';
import { useSetFirebaseAnalyticsUserId } from './hooks/useSetFirebaseAnalyticsUserId';
import { useDeviceTypeByWidth } from 'learn-card-base';
import { redirectStore } from 'learn-card-base/stores/redirectStore';
import { useAutoVerifyContactMethodWithProofOfLogin } from './hooks/useAutoVerifyContactMethodWithProofOfLogin';
import { useFinalizeInboxCredentials } from './hooks/useFinalizeInboxCredentials';

export const aiRoutes = ['/ai/topics', '/ai/sessions', '/chats'];

const AppRouter: React.FC<{ initLoading: boolean }> = ({ initLoading }) => {
    const { web3AuthInit } = useWeb3Auth();
    const { verifySignInLinkAndLogin, verifyAppleLogin } = useFirebase();
    const history = useHistory();
    const location = useLocation();
    const isLoggedIn = useIsLoggedIn();
    const collapsed = useIsCollapsed();
    const { isMobile } = useDeviceTypeByWidth();
    const isChapiInteraction = useIsChapiInteraction();
    const networkConsentMutation = useNetworkConsentMutation();

    const currentUser = useCurrentUser();
    const queryClient = useQueryClient();
    const { data: currentLCNUser, isLoading: currentLCNUserLoading } = useIsCurrentUserLCNUser();

    const params = queryString.parse(location.search);

    const hideSideMenu =
        ['/consent-flow', '/consent-flow-login', '/claim/from-dashboard/', '/chats'].includes(
            location.pathname
        ) ||
        (collapsed && aiRoutes.includes(location.pathname) && !isMobile);

    const { newModal } = useModal();

    useEffect(() => {
        if (params.myNewDataOpen) {
            const { myNewDataOpen: _unused, ...allOtherSearchParams } = params;
            history.replace({ search: queryString.stringify(allOtherSearchParams) });
            newModal(
                <NewMyData />,
                { sectionClassName: '!max-w-[350px]' },
                { desktop: ModalTypes.Cancel }
            );
        }
    }, [params.myNewDataOpen]);

    useEffect(() => {
        if (params.summaryUri && isMobile) {
            const { summaryUri, ...allOtherSearchParams } = params;
            history.replace({ search: queryString.stringify(allOtherSearchParams) });
            newModal(
                <AiSessionAssessmentPreviewContainer summaryUri={summaryUri as string} />,
                {},
                { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
            );
        }
    }, [params.summaryUri, isMobile]);

    useEffect(() => {
        if (params?.verifyCode) {
            const email = params.email as string;
            redirectStore.set.email(email);

            history.replace(`/login?verifyCode=true`);
        }
    }, []);

    const enablePrefetch = isLoggedIn && !isChapiInteraction;

    usePrefetchCredentials('Social Badge', enablePrefetch);
    usePrefetchCredentials('Achievement', enablePrefetch);
    usePrefetchCredentials('Learning History', enablePrefetch);
    usePrefetchCredentials('Work History', enablePrefetch);
    usePrefetchCredentials('Skill', enablePrefetch);
    usePrefetchCredentials('ID', enablePrefetch);
    usePrefetchCredentials('Membership', enablePrefetch);
    usePrefetchCredentials('AI Topic', enablePrefetch);
    usePrefetchCredentials(undefined, enablePrefetch);
    usePrefetchBoosts(enablePrefetch);
    useSyncConsentFlow(enablePrefetch);

    const showScanner = QRCodeScannerStore.useTracked.showScanner();
    useLaunchDarklyIdentify({ debug: false });
    useSentryIdentify({ debug: false });
    useUserflowIdentify({ debug: false });
    useSetFirebaseAnalyticsUserId({ debug: false });
    useAutoVerifyContactMethodWithProofOfLogin();
    useFinalizeInboxCredentials();

    const saved_email = window.localStorage.getItem('emailForSignIn');

    useEffect(() => {
        const handleLoginAsync = async () => {
            // re-init
            const web3Auth = await web3AuthInit({
                redirectUrl:
                    IS_PRODUCTION || Capacitor.getPlatform() === 'android'
                        ? LOGIN_REDIRECTS?.[BrandingEnum.learncard].redirectUrl
                        : LOGIN_REDIRECTS?.[BrandingEnum.learncard].devRedirectUrl,
                branding: BrandingEnum.learncard,
                showLoading: false,
            });

            // re-connect
            await web3Auth?.connectTo(WALLET_ADAPTERS.OPENLOGIN);
        };

        App.addListener('appUrlOpen', data => {
            // get the url when the event "appUrlOpen" is triggered
            const authLink = data?.url;

            // Create a URL object
            const parsedUrl = new URL(data?.url);

            // Get the query parameters
            const params = new URLSearchParams(parsedUrl.search);

            const isNative = Capacitor?.isNativePlatform();

            if (params.has('loginCompleted') && isNative) {
                handleLoginAsync();
            } else if (params.get('verifyCode') === 'true' && isNative) {
                redirectStore.set.email(params.get('email') as string);
                history.replace('/login?verifyCode=true');
            } else {
                if (authLink) {
                    // refetch the saved email on event "appUrlOpen" trigger
                    const saved_email_native = window.localStorage.getItem('emailForSignIn') ?? '';

                    // verify the passwordless auth link
                    verifySignInLinkAndLogin(saved_email_native, authLink);
                }
            }
        });

        // verify passwordless, email login link on web
        if (!Capacitor.isNativePlatform() && saved_email) {
            verifySignInLinkAndLogin(saved_email, window.location.href);
        }
    }, [saved_email]);

    useEffect(() => {
        if (!saved_email) {
            verifyAppleLogin();
        }
    }, []);

    useEffect(() => {
        web3AuthInit({
            redirectUrl:
                IS_PRODUCTION || Capacitor.getPlatform() === 'android'
                    ? LOGIN_REDIRECTS[BrandingEnum.learncard].redirectUrl
                    : LOGIN_REDIRECTS[BrandingEnum.learncard].devRedirectUrl,
            branding: BrandingEnum.learncard,
            showLoading: false,
        });
    }, []);

    // Backfill consent logic for existing users
    useEffect(() => {
        const handleBackfillConsent = async () => {
            if (!currentLCNUserLoading && currentLCNUser && currentUser) {
                try {
                    // Use the reusable network consent mutation with backfill check
                    await networkConsentMutation.mutateAsync({
                        checkExistingConsent: true,
                        queryClient,
                    });
                } catch (error) {
                    console.error('Backfill consent error (non-blocking):', error);
                }
            }
        };

        handleBackfillConsent();
    }, [currentLCNUser, currentLCNUserLoading, currentUser]);

    if (initLoading) return <LoginLoadingPage />;

    return (
        <GenericErrorBoundary>
            <div id="app-router" style={{ display: `${showScanner ? 'none' : 'block'}` }}>
                <IonSplitPane
                    contentId="main"
                    className={
                        collapsed
                            ? 'side-menu-split-pane-container-collapsed'
                            : 'side-menu-split-pane-container-visible'
                    }
                >
                    <GenericErrorBoundary>
                        {isLoggedIn && !hideSideMenu && (
                            <SideMenu branding={BrandingEnum.learncard} />
                        )}
                        <div id="main" className="w-full">
                            <MobileNavBar />
                        </div>
                    </GenericErrorBoundary>
                </IonSplitPane>
            </div>
            <Modals />
        </GenericErrorBoundary>
    );
};

export default AppRouter;
