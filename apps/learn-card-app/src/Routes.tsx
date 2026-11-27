import UnsubscribePage from './pages/unsubscribe/UnsubscribePage';
import React, { Suspense } from 'react';
import { Navigate, Route, Routes as RouterRoutes, useLocation } from 'react-router';
import { useFlags } from 'launchdarkly-react-client-sdk';
import {
    DIDAuthModal,
    VCClaimModalController,
    useIsLoggedIn,
    lazyWithRetry,
    ChunkBoundary,
    InAppMessageDeepLinkRoute,
    getInAppMessageEntryPath,
} from 'learn-card-base';

import { usePathwaysEnabled } from './pages/pathways/hooks/usePathwaysEnabled';
import { useDashboardAsHome } from './pages/dashboard/hooks/useDashboardAsHome';
import { environment } from './config/environment';
import * as Sentry from '@sentry/react';

import GenericErrorBoundary from './components/generic/GenericErrorBoundary';

const CampaignsPage = lazyWithRetry(() => import('./pages/campaigns/CampaignsPage'));
const WalletPage = lazyWithRetry(() => import('./pages/wallet/WalletPage'));
import { DashboardPageRoute, preloadDashboardPage } from './pages/dashboard/DashboardPageRoute';
const LaunchPad = lazyWithRetry(() => import('./pages/launchPad/LaunchPad'));
const MyAppsLanding = lazyWithRetry(() => import('./pages/myApps/MyAppsLanding'));
const EmbedAppFullScreen = lazyWithRetry(() => import('./pages/launchPad/EmbedAppFullScreen'));
const AppListingPage = lazyWithRetry(() => import('./pages/launchPad/AppListingPage'));
const NotificationsPage = lazyWithRetry(
    () => import('./pages/notificationsPage/NotificationsPage')
);
const LoginPage = lazyWithRetry(() => import('./pages/login/LoginPage'));
const CancelRecoveryPage = lazyWithRetry(() => import('./pages/recovery/CancelRecoveryPage'));
const SecureAccountPage = lazyWithRetry(() => import('./pages/recovery/SecureAccountPage'));
const AchievementsPage = lazyWithRetry(() => import('./pages/achievements/AchievementsPage'));
const QualificationsPage = lazyWithRetry(() => import('./pages/qualifications/QualificationsPage'));

const IdsPage = lazyWithRetry(() => import('./pages/ids/IdsPage'));

const LearningHistoryPage = lazyWithRetry(
    () => import('./pages/learninghistory/LearningHistoryPage')
);
const WorkHistoryPage = lazyWithRetry(() => import('./pages/workhistory/WorkHistoryPage'));
import DelayedFallback from './components/generic/DelayedFallback';
import RouteTransitionLoader from './components/generic/RouteTransitionLoader';

const CurrenciesPage = lazyWithRetry(() => import('./pages/currencies/CurrenciesPage'));
const CredentialStorage = lazyWithRetry(
    () => import('./pages/credentialStorage/CredentialStorage')
);
const CredentialStorageGet = lazyWithRetry(
    () => import('./pages/credentialStorage/CredentialStorageGet')
);
const AddressBook = lazyWithRetry(() => import('./pages/addressBook/AddressBook'));
const BoostCMS = lazyWithRetry(() => import('./components/boost/boostCMS/BoostCMS'));
const UpdateBoostCMS = lazyWithRetry(() => import('./components/boost/boostCMS/UpdateBoostCMS'));
const IssueCredentialPage = lazyWithRetry(() => import('./pages/issue/IssueCredentialPage'));
const BoostAFriendPage = lazyWithRetry(() => import('./pages/boostAFriend/BoostAFriendPage'));
const SkillsPage = lazyWithRetry(() => import('./pages/skills/SkillsPage'));
const AiInsights = lazyWithRetry(() => import('./pages/ai-insights/AiInsights'));
const PrivacySettingsPage = lazyWithRetry(
    () => import('./pages/privacy-settings/PrivacySettingsPage')
);
const ResumeBuilderPage = lazyWithRetry(() => import('./pages/resume-builder/ResumeBuilderPage'));
const VerifySharedResume = lazyWithRetry(() => import('./pages/resume-builder/VerifySharedResume'));
const AiPathways = lazyWithRetry(() => import('./pages/ai-pathways/AiPathways'));
const MyAssistantPage = lazyWithRetry(() => import('./pages/my-assistant/MyAssistantPage'));
const PathwaysShell = lazyWithRetry(() => import('./pages/pathways/PathwaysShell'));
const ShareLinkViewer = lazyWithRetry(() => import('./components/share-links/ShareLinkViewer'));
const ViewCredsBundle = lazyWithRetry(() => import('./components/creds-bundle/ViewCredsBundle'));
const ViewSharedBoost = lazyWithRetry(() => import('./components/creds-bundle/ViewSharedBoost'));
const MembershipPage = lazyWithRetry(() => import('./pages/membership/MembershipPage'));
const ConnectPage = lazyWithRetry(() => import('./pages/connectPage/ConnectPage'));
const InvitePage = lazyWithRetry(() => import('./pages/invitePage/InvitePage'));
const CredentialExchange = lazyWithRetry(
    () => import('./pages/credentialStorage/CredentialExchange')
);
const VprQueryByExample = lazyWithRetry(
    () => import('./pages/credentialStorage/vpr/VprQueryByExample')
);
const ViewCredentialsSharedWithApp = lazyWithRetry(
    () => import('learn-card-base/components/sharecreds/ViewCredentialsSharedWithApp')
);
const ShareCredentialsWithApp = lazyWithRetry(
    () => import('learn-card-base/components/sharecreds/ShareCredentialsWithApp')
);
const ExternalConsentFlowDoor = lazyWithRetry(
    () => import('./pages/consentFlow/ExternalConsentFlowDoor')
);
const ContractUpdateReviewRoute = lazyWithRetry(
    () => import('./pages/consentFlow/ContractUpdateReviewRoute')
);
const WalletServiceWorker = lazyWithRetry(
    () => import('./pages/walletServiceWorker/WalletServiceWorker')
);
const ClaimBoost = lazyWithRetry(() => import('./pages/claimBoost/ClaimBoost'));
const ApproveAccount = lazyWithRetry(() => import('./pages/approveAccount/ApproveAccount'));

const SocialBadgesPage = lazyWithRetry(() => import('./pages/socialBadgesPage/SocialBadgesPage'));

import { LoadingPage2 } from './pages/loadingPage/LoadingPage';
import {
    FallbackMarker,
    markDashboardPath,
    useDashboardPathMark,
} from './helpers/dashboardPathMarks';
const markRoutesFallbackTimer = () => markDashboardPath('routes_fallback_timer', true);
const AccomplishmentsPage = lazyWithRetry(
    () => import('./pages/accomplishments/AccomplishmentsPage')
);
const AccommodationsPage = lazyWithRetry(() => import('./pages/accommodations/AccommodationsPage'));

const CustomWallet = lazyWithRetry(() => import('./pages/hidden/CustomWallet'));
const ClaimFromDashboard = lazyWithRetry(
    () => import('./pages/claim-from-dashboard/ClaimFromDashboard')
);
const ClaimFromRequest = lazyWithRetry(() => import('./pages/claim-from-request/ClaimFromRequest'));
const Oid4vciExchange = lazyWithRetry(() => import('./pages/oid4vci/Oid4vciExchange'));
const Oid4vpExchange = lazyWithRetry(() => import('./pages/oid4vp/Oid4vpExchange'));
const NativeDigitalCredentialFlow = lazyWithRetry(
    () => import('./native-digital-credentials/NativeDigitalCredentialFlow')
);
const InteractionsPage = lazyWithRetry(() => import('./pages/interactions/InteractionsPage'));
const GuardianCredentialApprovalPage = lazyWithRetry(
    () => import('./pages/interactions/GuardianCredentialApprovalPage')
);
const GuardianAccountApprovalPage = lazyWithRetry(
    () => import('./pages/interactions/GuardianAccountApprovalPage')
);
const DeveloperSignInPage = lazyWithRetry(() => import('./pages/developer/DeveloperSignInPage'));
const PublishSignInGate = lazyWithRetry(
    () => import('./pages/appStoreDeveloper/submit/PublishSignInGate')
);
const FamilyPage = lazyWithRetry(() => import('./pages/familyPage/FamilyPage'));
const SchoolConnectPage = lazyWithRetry(() => import('./pages/schoolConnect/SchoolConnectPage'));
const AuthHandoff = lazyWithRetry(() => import('./pages/auth/AuthHandoff'));
const ClassLinkCallback = lazyWithRetry(() => import('./pages/auth/ClassLinkCallback'));
const ClassLinkStart = lazyWithRetry(() => import('./pages/auth/ClassLinkStart'));

// App Store Developer Portal
const DeveloperPortalRoutes = lazyWithRetry(
    () => import('./pages/appStoreDeveloper/DeveloperPortalRoutes')
);
const AppStoreAdminDashboard = lazyWithRetry(() => import('./pages/appStoreAdmin/AdminDashboard'));
const DeveloperPortalProvider = lazyWithRetry(() =>
    import('./pages/appStoreDeveloper/DeveloperPortalContext').then(m => ({
        default: m.DeveloperPortalProvider,
    }))
);

// Wrapper to provide DeveloperPortalContext for admin dashboard
const AppStoreAdminWithProvider: React.FC = () => (
    <Suspense
        fallback={
            <DelayedFallback delayMs={200}>
                <RouteTransitionLoader />
            </DelayedFallback>
        }
    >
        <DeveloperPortalProvider>
            <AppStoreAdminDashboard />
        </DeveloperPortalProvider>
    </Suspense>
);
const DevCli = lazyWithRetry(() => import('./pages/devCli/DevCli'));
const ClrTranscriptRendererDemo = lazyWithRetry(
    () => import('./pages/dev/ClrTranscriptRendererDemo')
);
const AiPathwaysDiscovery = lazyWithRetry(
    () => import('./pages/ai-pathways/ai-pathways-discovery/AiPathwaysDiscovery')
);
const AiSessionTopicsContainer = lazyWithRetry(
    () => import('./components/ai-sessions/AiSessionTopicsContainer')
);
const AiSessionsContainer = lazyWithRetry(
    () => import('./components/ai-sessions/AiSessionsContainer')
);
const UserVerifyEmail = lazyWithRetry(
    () => import('./components/user-profile/UserContact/UserVerifyEmail')
);
const LearnCardAiChatBot = lazyWithRetry(
    () => import('./components/new-ai-session/LearnCardAiChatBot/LearnCardAiChatBot')
);

const TermsOfServicePage = lazyWithRetry(() => import('./pages/legal/TermsOfServicePage'));
const PrivacyPolicyPage = lazyWithRetry(() => import('./pages/legal/PrivacyPolicyPage'));

// Sentry names transactions after the matched route pattern.
// https://docs.sentry.io/platforms/javascript/guides/react/configuration/integrations/react-router/
const SentryRoutes = Sentry.withSentryReactRouterV6Routing(RouterRoutes);

const PrivateRoute = ({
    path,
    component: Component,
}: {
    path: string;
    component: React.ComponentType;
}) => {
    const isLoggedIn = useIsLoggedIn();
    const location = useLocation();

    return isLoggedIn ? (
        <Component />
    ) : (
        <Navigate
            replace
            to={
                path === '/m/:messageId'
                    ? `/login?redirectTo=${encodeURIComponent(getInAppMessageEntryPath(location.pathname))}`
                    : path === '/notifications'
                      ? '/login?redirectTo=%2Fnotifications'
                      : path === '/account/secure'
                        ? '/login?redirectTo=%2Faccount%2Fsecure'
                        : '/login'
            }
        />
    );
};

/** Root redirect: home when signed in, otherwise login. */
const RootRedirect: React.FC<{ dashboardAsHome: boolean }> = ({ dashboardAsHome }) => {
    const isLoggedIn = useIsLoggedIn();
    markDashboardPath(isLoggedIn ? 'root_redirect' : 'root_redirect_login');
    return (
        <Navigate
            replace
            to={isLoggedIn ? (dashboardAsHome ? '/dashboard' : '/wallet') : '/login'}
        />
    );
};

// Developer portal routes need sign-in, except publish links, which arrive from app builders,
// often before the developer has an account.
const DeveloperPortalGate: React.FC = () => {
    const isLoggedIn = useIsLoggedIn();
    const location = useLocation();

    if (isLoggedIn) return <DeveloperPortalRoutes />;
    if (/^\/app-store\/developer\/submit\/?$/.test(location.pathname)) return <PublishSignInGate />;
    return <Navigate replace to="/login" />;
};

export const Routes: React.FC = () => {
    markDashboardPath('routes_render');
    useDashboardPathMark('routes_commit');
    const location = useLocation();
    const flags = useFlags();
    const learnCardAssistantEnabled = environment.DEV || Boolean(flags.enableLearnCardAssistant);
    // Pathways v2 visibility — see `usePathwaysEnabled` for the
    // tenant + LaunchDarkly layering. Same hook is used by the side
    // menu so the route and the nav link can't drift.
    const pathwaysEnabled = usePathwaysEnabled();
    // Dashboard-as-home gate — see `useDashboardAsHome`. When off, the `/`
    // post-login redirect lands on `/wallet` (legacy home) exactly as before;
    // the `/dashboard` route stays mounted regardless so existing deep links
    // (e.g. consent-flow `?connected=true` returns) never 404.
    const dashboardAsHome = useDashboardAsHome();

    // The `backgroundLocation` state is the location that we were at when one of
    // it's what is displayed in the background when we open the modal route
    const background = location.state && location?.state?.background;

    return (
        <ChunkBoundary>
            <Suspense
                fallback={
                    <FallbackMarker boundary="routes">
                        <DelayedFallback delayMs={200} onShow={markRoutesFallbackTimer}>
                            <RouteTransitionLoader />
                        </DelayedFallback>
                    </FallbackMarker>
                }
            >
                <GenericErrorBoundary>
                    <SentryRoutes location={background || location}>
                        <Route path="/recovery/cancel" element={<CancelRecoveryPage />} />
                        <Route path="/s/:id" element={<ShareLinkViewer />} />
                        <Route path="/unsubscribe" element={<UnsubscribePage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/developer/sign-in" element={<DeveloperSignInPage />} />
                        <Route path="/__/auth/action" element={<LoginPage />} />
                        <Route path="/legal/terms" element={<TermsOfServicePage />} />
                        <Route path="/legal/privacy" element={<PrivacyPolicyPage />} />
                        <Route path="/share-creds/:uri/:seed" element={<ViewCredsBundle />} />
                        <Route path="/auth/handoff" element={<AuthHandoff />} />
                        <Route path="/auth/classlink/callback" element={<ClassLinkCallback />} />
                        <Route path="/auth/classlink/start" element={<ClassLinkStart />} />
                        <Route path="/share-boost" element={<ViewSharedBoost />} />
                        <Route path="/verify/resume" element={<VerifySharedResume />} />
                        <Route path="/waitingsofa/*" element={<LoadingPage2 />} />
                        <Route
                            path="/dashboard"
                            element={
                                <PrivateRoute path="/dashboard" component={DashboardPageRoute} />
                            }
                        />
                        <Route
                            path="/home"
                            element={<PrivateRoute path="/home" component={WalletPage} />}
                        />
                        <Route
                            path="/wallet"
                            element={<PrivateRoute path="/wallet" component={WalletPage} />}
                        />
                        <Route
                            path="/passport"
                            element={<PrivateRoute path="/passport" component={WalletPage} />}
                        />
                        <Route
                            path="/launchpad"
                            element={<PrivateRoute path="/launchpad" component={MyAppsLanding} />}
                        />
                        <Route
                            path="/launchpad/browse"
                            element={
                                <PrivateRoute path="/launchpad/browse" component={LaunchPad} />
                            }
                        />
                        <Route
                            path="/apps/:appId"
                            element={
                                <PrivateRoute path="/apps/:appId" component={EmbedAppFullScreen} />
                            }
                        />
                        <Route
                            path="/m/:messageId"
                            element={
                                <PrivateRoute
                                    path="/m/:messageId"
                                    component={InAppMessageDeepLinkRoute}
                                />
                            }
                        />
                        <Route path="/app/:listingId" element={<AppListingPage />} />

                        {/* App Store Developer Portal - all routes wrapped in context provider */}
                        <Route path="/app-store/developer/*" element={<DeveloperPortalGate />} />

                        <Route
                            path="/app-store/admin"
                            element={
                                <PrivateRoute
                                    path="/app-store/admin"
                                    component={AppStoreAdminWithProvider}
                                />
                            }
                        />

                        <Route path="/admin/campaigns/*" element={<CampaignsPage />} />

                        <Route
                            path="/notifications"
                            element={
                                <PrivateRoute path="/notifications" component={NotificationsPage} />
                            }
                        />
                        {/* Linked from the "New device signed in with your PIN" email. */}
                        <Route
                            path="/account/secure"
                            element={
                                <PrivateRoute
                                    path="/account/secure"
                                    component={SecureAccountPage}
                                />
                            }
                        />
                        <Route
                            path="/contacts"
                            element={<PrivateRoute path="/contacts" component={AddressBook} />}
                        />
                        <Route
                            path="/contacts/pending"
                            element={
                                <PrivateRoute path="/contacts/pending" component={AddressBook} />
                            }
                        />
                        <Route
                            path="/contacts/requests"
                            element={
                                <PrivateRoute path="/contacts/requests" component={AddressBook} />
                            }
                        />
                        <Route
                            path="/contacts/blocked"
                            element={
                                <PrivateRoute path="/contacts/blocked" component={AddressBook} />
                            }
                        />
                        <Route
                            path="/contacts/search"
                            element={
                                <PrivateRoute path="/contacts/search" component={AddressBook} />
                            }
                        />
                        <Route
                            path="/socialBadges"
                            element={
                                <PrivateRoute path="/socialBadges" component={SocialBadgesPage} />
                            }
                        />
                        <Route
                            path="/achievements"
                            element={
                                <PrivateRoute path="/achievements" component={AchievementsPage} />
                            }
                        />
                        <Route
                            path="/qualifications"
                            element={
                                <PrivateRoute
                                    path="/qualifications"
                                    component={QualificationsPage}
                                />
                            }
                        />
                        <Route
                            path="/accomplishments"
                            element={
                                <PrivateRoute
                                    path="/accomplishments"
                                    component={AccomplishmentsPage}
                                />
                            }
                        />
                        <Route
                            path="/accommodations"
                            element={
                                <PrivateRoute
                                    path="/accommodations"
                                    component={AccommodationsPage}
                                />
                            }
                        />
                        <Route
                            path="/currencies"
                            element={<PrivateRoute path="/currencies" component={CurrenciesPage} />}
                        />
                        <Route
                            path="/ids"
                            element={<PrivateRoute path="/ids" component={IdsPage} />}
                        />
                        <Route
                            path="/memberships"
                            element={
                                <PrivateRoute path="/memberships" component={MembershipPage} />
                            }
                        />
                        <Route
                            path="/workhistory"
                            element={
                                <PrivateRoute path="/workhistory" component={WorkHistoryPage} />
                            }
                        />
                        <Route
                            path="/families"
                            element={<PrivateRoute path="/families" component={FamilyPage} />}
                        />
                        <Route
                            path="/school-connect"
                            element={
                                <PrivateRoute
                                    path="/school-connect"
                                    component={SchoolConnectPage}
                                />
                            }
                        />
                        <Route
                            path="/skills"
                            element={<PrivateRoute path="/skills" component={SkillsPage} />}
                        />
                        <Route
                            path="/ai/insights"
                            element={<PrivateRoute path="/ai/insights" component={AiInsights} />}
                        />
                        {learnCardAssistantEnabled && (
                            <Route
                                path="/ai/assistant"
                                element={
                                    <PrivateRoute
                                        path="/ai/assistant"
                                        component={MyAssistantPage}
                                    />
                                }
                            />
                        )}
                        <Route
                            path="/privacy-and-data"
                            element={
                                <PrivateRoute
                                    path="/privacy-and-data"
                                    component={PrivacySettingsPage}
                                />
                            }
                        />
                        <Route
                            path="/resume-builder"
                            element={
                                <PrivateRoute
                                    path="/resume-builder"
                                    component={ResumeBuilderPage}
                                />
                            }
                        />
                        <Route
                            path="/ai/pathways"
                            element={<PrivateRoute path="/ai/pathways" component={AiPathways} />}
                        />
                        <Route path="/ai/pathways/discovery" element={<AiPathwaysDiscovery />} />
                        {/*
                         * Pathways v2 — greenfield alongside the existing
                         * /ai/pathways feature. Gated by `usePathwaysEnabled`
                         * (tenant `features.pathways` AND LaunchDarkly
                         * `enableJourneys`, both default off). See
                         * pages/pathways/docs/architecture.md.
                         */}
                        {pathwaysEnabled && (
                            <Route
                                path="/pathways/*"
                                element={
                                    <PrivateRoute path="/pathways" component={PathwaysShell} />
                                }
                            />
                        )}
                        <Route
                            path="/learninghistory"
                            element={
                                <PrivateRoute
                                    path="/learninghistory"
                                    component={LearningHistoryPage}
                                />
                            }
                        />
                        <Route
                            path="/boost"
                            element={<PrivateRoute path="/boost" component={BoostCMS} />}
                        />
                        <Route
                            path="/boost/update"
                            element={
                                <PrivateRoute path="/boost/update" component={UpdateBoostCMS} />
                            }
                        />
                        <Route
                            path="/issue"
                            element={<PrivateRoute path="/issue" component={IssueCredentialPage} />}
                        />
                        <Route
                            path="/boost-a-friend"
                            element={
                                <PrivateRoute path="/boost-a-friend" component={BoostAFriendPage} />
                            }
                        />
                        <Route
                            path="/test"
                            element={<PrivateRoute path="/test" component={VprQueryByExample} />}
                        />
                        <Route path="/wallet-worker" element={<WalletServiceWorker />} />
                        <Route
                            path="/store"
                            element={<PrivateRoute path="/store" component={CredentialStorage} />}
                        />
                        <Route
                            path="/exchange"
                            element={
                                <PrivateRoute path="/exchange" component={CredentialExchange} />
                            }
                        />
                        <Route
                            path="/get"
                            element={<PrivateRoute path="/get" component={CredentialStorageGet} />}
                        />

                        <Route
                            path="/ai/topics"
                            element={
                                <PrivateRoute
                                    path="/ai/topics"
                                    component={AiSessionTopicsContainer}
                                />
                            }
                        />
                        <Route
                            path="/ai/sessions"
                            element={
                                <PrivateRoute path="/ai/sessions" component={AiSessionsContainer} />
                            }
                        />

                        <Route
                            path="/claim-credential/:uri/*"
                            element={<VCClaimModalController />}
                        />
                        <Route path="/did-auth/:challenge/*" element={<DIDAuthModal />} />

                        <Route path="/connect" element={<ConnectPage />} />
                        <Route path="/connect/:profileId" element={<ConnectPage />} />
                        <Route path="/invite" element={<InvitePage />} />
                        <Route path="/claim/boost" element={<ClaimBoost />} />
                        <Route path="/approve-account" element={<ApproveAccount />} />
                        <Route path="/claim/from-dashboard" element={<ClaimFromDashboard />} />
                        <Route
                            path="/interactions/guardian-credential-approval/:token"
                            element={<GuardianCredentialApprovalPage />}
                        />
                        <Route
                            path="/interactions/guardian-approval/:token"
                            element={<GuardianAccountApprovalPage />}
                        />
                        <Route path="/interactions/*" element={<InteractionsPage />} />
                        <Route path="/request" element={<ClaimFromRequest />} />
                        <Route path="/oid4vci" element={<Oid4vciExchange />} />
                        <Route path="/oid4vp" element={<Oid4vpExchange />} />
                        <Route
                            path="/native-digital-credentials"
                            element={<NativeDigitalCredentialFlow />}
                        />

                        <Route path="/consent-flow" element={<ExternalConsentFlowDoor />} />
                        <Route
                            path="/consent-flow-login"
                            element={<ExternalConsentFlowDoor login />}
                        />
                        <Route path="/consent-flow-sync-data" element={<LaunchPad />} />
                        <Route
                            path="/consent-flow/review"
                            element={
                                <PrivateRoute
                                    path="/consent-flow/review"
                                    component={ContractUpdateReviewRoute}
                                />
                            }
                        />

                        <Route
                            path="/select-credentials/:profileId"
                            element={
                                <PrivateRoute
                                    path="/select-credentials/:profileId"
                                    component={ShareCredentialsWithApp}
                                />
                            }
                        />
                        <Route
                            path="/view-shared-credentials/:profileId"
                            element={
                                <PrivateRoute
                                    path="/view-shared-credentials/:profileId"
                                    component={ViewCredentialsSharedWithApp}
                                />
                            }
                        />
                        <Route
                            path="/chats/*"
                            element={<PrivateRoute path="/chats" component={LearnCardAiChatBot} />}
                        />

                        <Route
                            path="/"
                            element={<RootRedirect dashboardAsHome={dashboardAsHome} />}
                        />

                        <Route path="/verify-email" element={<UserVerifyEmail />} />

                        <Route path="/hidden/custom-wallet" element={<CustomWallet />} />

                        <Route
                            path="/hidden/seed/*"
                            element={<Navigate replace to="/developer/sign-in" />}
                        />

                        <Route
                            path="/cli"
                            element={<PrivateRoute path="/cli" component={DevCli} />}
                        />
                        <Route path="/dev/clr-transcript" element={<ClrTranscriptRendererDemo />} />
                    </SentryRoutes>
                </GenericErrorBoundary>
            </Suspense>
        </ChunkBoundary>
    );
};

/** Paths gated behind the AI feature flag — only prefetch when enabled. */
const AI_GATED_PATHS = new Set([
    '/ai/assistant',
    '/ai/insights',
    '/ai/pathways',
    '/ai/topics',
    '/ai/sessions',
]);

/**
 * Path-keyed preload map for routes reachable from the wallet, side menu, and
 * mobile nav. Consumers (WalletPage's category handler, PreloadingLink, etc.)
 * await the matching preload before calling history.push, which keeps the
 * current page mounted (no Suspense fallback flash) until the destination
 * chunk is in memory.
 */
export const ROUTE_PRELOAD: Record<string, () => Promise<void>> = {
    '/dashboard': preloadDashboardPage,
    // Wallet (Passport) — same chunk for all three aliases.
    '/passport': () => WalletPage.preload(),
    '/wallet': () => WalletPage.preload(),
    '/home': () => WalletPage.preload(),
    // Wallet category routes (also rendered as squares on /wallet).
    '/skills': () => SkillsPage.preload(),
    '/socialBadges': () => SocialBadgesPage.preload(),
    '/achievements': () => AchievementsPage.preload(),
    '/qualifications': () => QualificationsPage.preload(),
    '/learninghistory': () => LearningHistoryPage.preload(),
    '/accomplishments': () => AccomplishmentsPage.preload(),
    '/accommodations': () => AccommodationsPage.preload(),
    '/workhistory': () => WorkHistoryPage.preload(),
    '/families': () => FamilyPage.preload(),
    '/school-connect': () => SchoolConnectPage.preload(),
    '/ids': () => IdsPage.preload(),
    '/memberships': () => MembershipPage.preload(),
    '/currencies': () => CurrenciesPage.preload(),
    // AI routes — gated by the AI feature flag in prefetchRoutes.
    '/ai/assistant': () => MyAssistantPage.preload(),
    '/ai/insights': () => AiInsights.preload(),
    '/ai/pathways': () => AiPathways.preload(),
    '/ai/topics': () => AiSessionTopicsContainer.preload(),
    '/ai/sessions': () => AiSessionsContainer.preload(),
    // Side menu root links.
    '/launchpad': () => MyAppsLanding.preload(),
    '/launchpad/browse': () => LaunchPad.preload(),
    '/contacts': () => AddressBook.preload(),
    '/notifications': () => NotificationsPage.preload(),
    // Mobile navbar / wallet header.
    '/boost': () => BoostCMS.preload(),
    '/issue': () => IssueCredentialPage.preload(),
    '/boost-a-friend': () => BoostAFriendPage.preload(),
    // Other commonly side-menu-linked routes.
    '/privacy-and-data': () => PrivacySettingsPage.preload(),
    '/resume-builder': () => ResumeBuilderPage.preload(),
};

interface PrefetchOptions {
    /** When false, AI routes are skipped — the user can't access them anyway. */
    aiEnabled?: boolean;
}

/**
 * Idle-prefetch routes in ROUTE_PRELOAD so first-time navigation from anywhere
 * (wallet squares, side menu, mobile nav, deep links) lands on a warm chunk
 * cache and the Suspense fallback never fires. AI routes are skipped when the
 * caller indicates the user doesn't have AI access.
 */
export const prefetchRoutes = ({ aiEnabled = true }: PrefetchOptions = {}): void => {
    const ric: typeof window.requestIdleCallback | undefined = (window as any).requestIdleCallback;
    const schedule = (cb: () => void) => (ric ? ric(cb, { timeout: 2000 }) : setTimeout(cb, 200));

    schedule(() => {
        Object.entries(ROUTE_PRELOAD).forEach(([path, fn]) => {
            if (!aiEnabled && AI_GATED_PATHS.has(path)) return;
            fn();
        });
    });
};
