import React, { useEffect } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useLocation, useHistory } from 'react-router-dom';
import queryString from 'query-string';

import { IonSplitPane } from '@ionic/react';
import SideMenu from './components/sidemenu/SideMenu';
import NewMyData from './components/new-my-data/NewMyData';
import ViewSharedBoost from './components/creds-bundle/ViewSharedBoost';
import MobileNavBar from './components/mobile-nav-bar/MobileNavBar';
import LoginLoadingPage from './pages/login/LoginPageLoader/LoginLoader';
import GenericErrorBoundary from './components/generic/GenericErrorBoundary';
import { ShareInsightsWithUserWrapper } from './pages/ai-insights/share-insights/ShareInsightsWithUser';
import AiSessionAssessmentPreviewContainer from './components/ai-assessment/AiSessionAssessmentPreviewContainer';
import { RequestInsightsFromUserModalWrapper } from './pages/ai-insights/request-insights/RequestInsightsFromUserModal';

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
    useCurrentUser,
    useIsCurrentUserLCNUser,
    useContract,
    switchedProfileStore,
} from 'learn-card-base';
import { useNetworkConsentMutation } from 'learn-card-base/react-query/mutations/networkConsent';
import { useQueryClient } from '@tanstack/react-query';

import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import { WALLET_ADAPTERS } from '@web3auth/base';

import endorsementsRequestStore from './stores/endorsementsRequestStore';
import { useFirebase } from './hooks/useFirebase';
import { useLaunchDarklyIdentify } from 'learn-card-base/hooks/useLaunchDarklyIdentify';
import { useIsChapiInteraction } from 'learn-card-base/stores/chapiStore';
import { useSentryIdentify } from './constants/sentry';

import { Modals } from 'learn-card-base';
import { useSetFirebaseAnalyticsUserId } from './hooks/useSetFirebaseAnalyticsUserId';
import { useDeviceTypeByWidth } from 'learn-card-base';
import { redirectStore } from 'learn-card-base/stores/redirectStore';
import { useAutoVerifyContactMethodWithProofOfLogin } from './hooks/useAutoVerifyContactMethodWithProofOfLogin';
import { useFinalizeInboxCredentials } from './hooks/useFinalizeInboxCredentials';
import useConsentFlow from './pages/consentFlow/useConsentFlow';

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

    const boostUri = params.uri;
    const seed = params.seed;
    const pin = params.pin;
    const endorsementRequest = params.endorsementRequest;
    const draftEndorsementRequest = endorsementsRequestStore.useTracked.endorsementRequest();

    // Insights Consent
    const insightsConsent = params.insightsConsent;
    const shareInsightsRequest = params.shareInsights;
    const contractUri = params.contractUri;
    const teacherProfileId = params.teacherProfileId;
    const learnerProfileId = params.learnerProfileId;

    const profileType = switchedProfileStore.use.profileType();
    const isChild = profileType === 'child';

    const isInsightsConsent = insightsConsent && contractUri && teacherProfileId;
    const isShareInsightsRequest = shareInsightsRequest && learnerProfileId;

    const { data: contract } = useContract(contractUri, !!contractUri);
    const { openConsentFlowModal } = useConsentFlow(contract, undefined, contractUri);

    const hideSideMenu =
        ['/consent-flow', '/consent-flow-login', '/claim/from-dashboard/', '/chats'].includes(
            location.pathname
        ) ||
        (collapsed && aiRoutes.includes(location.pathname) && !isMobile) ||
        location.pathname.includes('/app-store');

    const { newModal } = useModal();

    useEffect(() => {
        if (isInsightsConsent && contract) {
            if (isChild) {
                newModal(
                    <ShareInsightsWithUserWrapper targetProfileId={teacherProfileId as string} />,
                    { className: '!bg-transparent' },
                    { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
                );
            } else {
                openConsentFlowModal(true, undefined, teacherProfileId as string);
            }
        }
    }, [contract, isInsightsConsent]);

    useEffect(() => {
        if (isShareInsightsRequest) {
            newModal(
                <RequestInsightsFromUserModalWrapper profileId={learnerProfileId as string} />,
                { className: '!bg-transparent' },
                { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
            );
        }
    }, [isShareInsightsRequest]);

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

    useEffect(() => {
        if (boostUri && endorsementRequest) {
            if (!isLoggedIn) {
                endorsementsRequestStore.set.credentialInfo({
                    uri: boostUri as string,
                    seed: seed as string,
                    pin: pin as string,
                });
            }
            newModal(
                <ViewSharedBoost boostUri={boostUri as string} showEndorsementRequest />,
                {},
                { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
            );
        }
    }, []);

    useEffect(() => {
        if (
            isLoggedIn &&
            draftEndorsementRequest?.relationship?.type &&
            draftEndorsementRequest?.relationship?.type
        ) {
            newModal(
                <ViewSharedBoost showDraftSuccess showEndorsementRequest={false} />,
                {},
                { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
            );
        }
    }, [isLoggedIn]);

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
