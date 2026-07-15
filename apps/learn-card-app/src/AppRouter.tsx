import React, { useEffect, useRef } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
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
import useAutoConsentLearnCardAi from './hooks/useAutoConsentLearnCardAi';

import {
    useIsLoggedIn,
    QRCodeScannerStore,
    usePrefetchCredentials,
    useIsCollapsed,
    usePrefetchBoosts,
    useModal,
    ModalTypes,
    LOGIN_REDIRECTS,
    useSyncConsentFlow,
    useCurrentUser,
    useIsCurrentUserLCNUser,
    useContract,
    usePendingContractSync,
    switchedProfileStore,
    usePrivacyGate,
    useAiFeatureGate,
    useNetworkConsentMutation,
    BrandingEnum,
    useLaunchDarklyIdentify,
    useIsChapiInteraction,
    redirectStore,
} from 'learn-card-base';
import { useAppAuth } from './providers/AuthCoordinatorProvider';
import { useAuthStatus } from 'learn-card-base';
import { OfflineBootGate } from './components/network-listener/OfflineBootGate';
import { connectivityStore } from 'learn-card-base';
import { useQueryClient } from '@tanstack/react-query';

import endorsementsRequestStore from './stores/endorsementsRequestStore';
import { useFirebase } from './hooks/useFirebase';
import { useSentryIdentify } from './constants/sentry';

import { Modals, getLogger } from 'learn-card-base';
import { useSetAnalyticsUserId, useAnalytics } from '@analytics';
import { useAccountCreatedAndReturningSession } from '@analytics';
import { useDeviceTypeByWidth } from 'learn-card-base';
import { AI_ROUTES } from './constants/aiRoutes';
import { useAutoVerifyContactMethodWithProofOfLogin } from './hooks/useAutoVerifyContactMethodWithProofOfLogin';
import { useFinalizeInboxCredentials } from './hooks/useFinalizeInboxCredentials';
import useConsentFlow from './pages/consentFlow/useConsentFlow';

const log = getLogger('app-router');

const AppRouter: React.FC = () => {
    const { state: coordinatorState, walletReady } = useAppAuth();

    // Initial-load gate: when true, render the loader instead of <Routes>.
    //
    // We MUST keep the loader up during every transitional auth state. Otherwise,
    // there is a race window between `coordinator.state.status === 'ready'`
    // (private key derived) and the separate `useEffect` in AuthCoordinatorProvider
    // that constructs the BespokeLearnCard wallet. During that ~100-300ms gap,
    // unmounting the loader causes <Routes> to mount, see `useIsLoggedIn() === false`
    // (currentUserStore not yet populated), and redirect to /login — flashing the
    // LoginPage on cold start before the wallet finishes initializing.
    //
    // Stable states where it's safe to render <Routes>:
    //   - walletReady                              → fully booted (show app)
    //   - state.status === 'idle'                  → genuinely logged out (show /login)
    //   - state.status === 'needs_setup'           → login page can open onboarding
    //   - state.status === 'needs_recovery'        → coordinator overlays recovery modal
    //   - state.status === 'error'                 → coordinator overlays error UI
    // Everything else (`authenticating`, `authenticated`, `checking_key_status`,
    // `needs_migration`, `deriving_key`, and the brief
    // `ready`-without-wallet window) is a transition we bridge with the loader.

    const authStatus = useAuthStatus();
    const isOffline = connectivityStore.use.status() === 'offline';

    // If offline and auth is not settled into a usable state (no wallet and unauthenticated/resolving)
    const showOfflineBootGate =
        isOffline &&
        !walletReady &&
        (authStatus.tag === 'unauthenticated' || authStatus.tag === 'resolving');

    const initLoading = !(
        walletReady ||
        coordinatorState.status === 'idle' ||
        coordinatorState.status === 'needs_setup' ||
        coordinatorState.status === 'needs_recovery' ||
        coordinatorState.status === 'error'
    );

    // Native splash bridge. The Capacitor splash is configured with
    // launchAutoHide=false so it stays visible during the entire JS bootstrap
    // (chunk loading, LaunchDarkly init, AuthCoordinator init, wallet derive).
    // We hide it manually once we know what to render so the user sees a single
    // smooth fade from native splash → final screen, not a stack of JS loaders.
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;
        const ready =
            walletReady ||
            coordinatorState.status === 'idle' ||
            coordinatorState.status === 'needs_setup' ||
            coordinatorState.status === 'needs_recovery' ||
            coordinatorState.status === 'error';
        if (ready) {
            SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => undefined);
        }
    }, [walletReady, coordinatorState.status]);

    // Safety net: never let the native splash stay up longer than 8s even if
    // auth initialization hangs. After this, the user sees whatever the app
    // is currently rendering (likely the in-app loader or login).
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;
        const t = setTimeout(() => {
            SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => undefined);
        }, 8000);
        return () => clearTimeout(t);
    }, []);
    const { verifySignInLinkAndLogin, verifyAppleLogin } = useFirebase();
    const history = useHistory();
    const location = useLocation();
    const isLoggedIn = useIsLoggedIn();
    const isOnboardingOpen = redirectStore.use.isOnboardingOpen();
    const collapsed = useIsCollapsed();
    const { isMobile } = useDeviceTypeByWidth();
    const isChapiInteraction = useIsChapiInteraction();
    const networkConsentMutation = useNetworkConsentMutation();
    const analytics = useAnalytics();
    const { setEnabled: setAnalyticsEnabled } = analytics;
    const { isAiEnabled } = useAiFeatureGate();
    const { autoConsentLearnCardAi } = useAutoConsentLearnCardAi();
    usePrivacyGate({ onAnalyticsChange: setAnalyticsEnabled });

    const currentUser = useCurrentUser();
    const queryClient = useQueryClient();
    const { data: currentLCNUser, isLoading: currentLCNUserLoading } = useIsCurrentUserLCNUser();

    useEffect(() => {
        if (
            !isLoggedIn ||
            !currentUser ||
            !isAiEnabled ||
            isOnboardingOpen ||
            currentLCNUserLoading ||
            !currentLCNUser
        )
            return;

        void autoConsentLearnCardAi({
            enabled: true,
            userOverrides: {
                name: currentUser.name ?? '',
                profileImage: currentUser.profileImage ?? '',
            },
        });
    }, [
        autoConsentLearnCardAi,
        currentUser?.name,
        currentUser?.profileImage,
        isAiEnabled,
        isOnboardingOpen,
        isLoggedIn,
        currentLCNUser,
        currentLCNUserLoading,
    ]);

    const params = queryString.parse(location.search);

    const boostUri = params.uri;
    const seed = params.seed;
    const pin = params.pin;
    const endorsementRequest = params.endorsementRequest;
    const draftEndorsementRequest = endorsementsRequestStore.useTracked.endorsementRequest();

    // Insights Consent
    const insightsConsent = params.insightsConsent;
    const shareInsightsRequest = params.shareInsights;
    const contractUri = typeof params.contractUri === 'string' ? params.contractUri : undefined;
    const teacherProfileId = params.teacherProfileId;
    const learnerProfileId = params.learnerProfileId;

    const profileType = switchedProfileStore.use.profileType();
    const isChild = profileType === 'child';

    const isInsightsConsent = insightsConsent && contractUri && teacherProfileId;
    const isShareInsightsRequest = shareInsightsRequest && learnerProfileId;

    const { data: contract } = useContract(contractUri, !!contractUri);
    const { openConsentFlowModal } = useConsentFlow(contract, undefined, contractUri);

    const hideSideMenu =
        [
            '/consent-flow',
            '/consent-flow-login',
            '/claim/from-dashboard/',
            '/chats',
            '/cli',
        ].includes(location.pathname) ||
        (collapsed &&
            AI_ROUTES.includes(location.pathname as (typeof AI_ROUTES)[number]) &&
            !isMobile) ||
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
                <RequestInsightsFromUserModalWrapper
                    profileId={learnerProfileId as string}
                    redirectToLink={`/passport?shareInsights=${isShareInsightsRequest}&learnerProfileId=${learnerProfileId}`}
                />,
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
            // Clear any stale draft data from previous sessions to prevent auto-submit
            endorsementsRequestStore.set.endorsementRequest({
                description: '',
                qualification: '',
                mediaAttachments: [],
                relationship: null,
            });
            endorsementsRequestStore.set.credentialInfo(undefined);

            // Set credentialInfo so ViewSharedBoost can access the params
            // (needed for both logged-in and logged-out users, especially on native deep links)
            endorsementsRequestStore.set.credentialInfo({
                uri: boostUri as string,
                seed: seed as string,
                pin: pin as string,
            });
            newModal(
                <ViewSharedBoost showEndorsementRequest />,
                {},
                { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
            );
        }
    }, [boostUri, endorsementRequest]);

    useEffect(() => {
        // Skip entirely if this is a fresh endorsement link click - the first useEffect handles it
        if (endorsementRequest) {
            return;
        }

        // Only show draft success if:
        // 1. User just logged in (after filling out the form while logged out)
        // 2. Has a pending draft with credential info
        const currentDraft = endorsementsRequestStore.get.endorsementRequest();
        const currentCredentialInfo = endorsementsRequestStore.get.credentialInfo();

        const hasActiveDraft =
            currentDraft?.relationship?.type && currentDraft?.description && currentCredentialInfo;

        if (isLoggedIn && hasActiveDraft) {
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
    usePendingContractSync(enablePrefetch);

    // Idle-prefetch route chunks once logged in so navigation from any page
    // (side menu, mobile nav, wallet squares, deep link) lands on a warm cache
    // and never hits the Suspense fallback. AI routes are skipped when the
    // user doesn't have AI access — no point downloading what they can't use.
    useEffect(() => {
        if (!enablePrefetch) return;
        // Lazy-import to avoid a circular import on the Routes module graph.
        import('./Routes')
            .then(m => m.prefetchRoutes({ aiEnabled: isAiEnabled }))
            .catch(() => undefined);
    }, [enablePrefetch, isAiEnabled]);

    // Warm the landing chunks immediately — while the boot loader or login
    // form is still up, before auth resolves. The post-login redirect
    // (→ /dashboard) and the post-boot mount of the refreshed route would
    // otherwise only START downloading their chunk after navigation, leaving
    // a white Suspense gap between the loader and the app on a cold cache.
    // The full prefetch above stays gated on login; this is just the entry
    // routes: the default landing pages plus wherever the URL already points.
    const initialPathRef = useRef(window.location.pathname);
    useEffect(() => {
        import('./Routes')
            .then(m => {
                void m.ROUTE_PRELOAD['/dashboard']?.();
                void m.ROUTE_PRELOAD['/wallet']?.();
                void m.ROUTE_PRELOAD[initialPathRef.current]?.();
            })
            .catch(() => undefined);
    }, []);

    const showScanner = QRCodeScannerStore.useTracked.showScanner();
    useLaunchDarklyIdentify({ debug: false });
    useSentryIdentify({ debug: false });

    useSetAnalyticsUserId({ debug: false });
    useAccountCreatedAndReturningSession(currentUser);
    useAutoVerifyContactMethodWithProofOfLogin();
    useFinalizeInboxCredentials();

    const saved_email = window.localStorage.getItem('emailForSignIn');

    useEffect(() => {
        App.addListener('appUrlOpen', data => {
            // get the url when the event "appUrlOpen" is triggered
            const authLink = data?.url;

            // Create a URL object
            const parsedUrl = new URL(data?.url);

            // Get the query parameters
            const params = new URLSearchParams(parsedUrl.search);

            const isNative = Capacitor?.isNativePlatform();

            // Check if this is an endorsement link - let AppUrlListener handle navigation
            const isEndorsementLink =
                params.get('endorsementRequest') === 'true' || params.get('uri');

            if (params.get('verifyCode') === 'true' && isNative) {
                redirectStore.set.email(params.get('email') as string);
                history.replace('/login?verifyCode=true');
            } else if (!isEndorsementLink) {
                // Only run auth verification for non-endorsement links
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

    // Backfill consent logic for existing users — skipped for minors (AI disabled)
    useEffect(() => {
        const handleBackfillConsent = async () => {
            if (
                !isOnboardingOpen &&
                !currentLCNUserLoading &&
                currentLCNUser &&
                currentUser &&
                isAiEnabled
            ) {
                try {
                    // Use the reusable network consent mutation with backfill check
                    await networkConsentMutation.mutateAsync({
                        checkExistingConsent: true,
                        queryClient,
                    });
                } catch (error) {
                    log.error('Backfill consent error (non-blocking)', error);
                }
            }
        };

        handleBackfillConsent();
    }, [currentLCNUser, currentLCNUserLoading, currentUser, isAiEnabled, isOnboardingOpen]);

    // NOTE: <Modals /> must stay mounted across the `initLoading` splash. During
    // new-user key setup the coordinator transitions needs_setup → deriving_key →
    // ready, flipping `initLoading` true for a moment. If <Modals /> were torn down
    // (e.g. behind an early `return <LoginLoadingPage />`), any open modal — like the
    // onboarding flow — would have its component instance destroyed and recreated,
    // resetting its internal step state (bouncing the user back to the age gate).
    // Keeping it as a persistent sibling of the loader/app content preserves the
    // live modal instance across the transition.
    return (
        <GenericErrorBoundary>
            {showOfflineBootGate ? (
                <OfflineBootGate />
            ) : initLoading ? (
                <LoginLoadingPage />
            ) : (
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
            )}
            <Modals />
        </GenericErrorBoundary>
    );
};

export default AppRouter;
