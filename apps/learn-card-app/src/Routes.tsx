import React, { Suspense } from 'react';
import { Redirect, Route, Switch, useLocation } from 'react-router-dom';
import { useFlags } from 'launchdarkly-react-client-sdk';
import {
    DIDAuthModal,
    VCClaimModalController,
    useIsLoggedIn,
    lcRoutes as tabRoutes,
    lazyWithRetry,
    ChunkBoundary,
} from 'learn-card-base';
import * as Sentry from '@sentry/react';

import GenericErrorBoundary from './components/generic/GenericErrorBoundary';

const WalletPage = lazyWithRetry(() => import('./pages/wallet/WalletPage'));
const LaunchPad = lazyWithRetry(() => import('./pages/launchPad/LaunchPad'));
const EmbedAppFullScreen = lazyWithRetry(() => import('./pages/launchPad/EmbedAppFullScreen'));
const AppListingPage = lazyWithRetry(() => import('./pages/launchPad/AppListingPage'));
const NotificationsPage = lazyWithRetry(
    () => import('./pages/notificationsPage/NotificationsPage')
);
const LoginPage = lazyWithRetry(() => import('./pages/login/LoginPage'));
const AchievementsPage = lazyWithRetry(() => import('./pages/achievements/AchievementsPage'));

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
const SkillsPage = lazyWithRetry(() => import('./pages/skills/SkillsPage'));
const AiInsights = lazyWithRetry(() => import('./pages/ai-insights/AiInsights'));
const PrivacySettingsPage = lazyWithRetry(
    () => import('./pages/privacy-settings/PrivacySettingsPage')
);
const ResumeBuilderPage = lazyWithRetry(() => import('./pages/resume-builder/ResumeBuilderPage'));
const VerifySharedResume = lazyWithRetry(
    () => import('./pages/resume-builder/VerifySharedResume')
);
const AiPathways = lazyWithRetry(() => import('./pages/ai-pathways/AiPathways'));
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
const WalletServiceWorker = lazyWithRetry(
    () => import('./pages/walletServiceWorker/WalletServiceWorker')
);
const ClaimBoost = lazyWithRetry(() => import('./pages/claimBoost/ClaimBoost'));
const ApproveAccount = lazyWithRetry(() => import('./pages/approveAccount/ApproveAccount'));

const SocialBadgesPage = lazyWithRetry(() => import('./pages/socialBadgesPage/SocialBadgesPage'));

import { LoadingPage2 } from './pages/loadingPage/LoadingPage';
const AccomplishmentsPage = lazyWithRetry(
    () => import('./pages/accomplishments/AccomplishmentsPage')
);
const AccommodationsPage = lazyWithRetry(() => import('./pages/accommodations/AccommodationsPage'));

const CustomWallet = lazyWithRetry(() => import('./pages/hidden/CustomWallet'));
const ClaimFromDashboard = lazyWithRetry(
    () => import('./pages/claim-from-dashboard/ClaimFromDashboard')
);
const ClaimFromRequest = lazyWithRetry(() => import('./pages/claim-from-request/ClaimFromRequest'));
const InteractionsPage = lazyWithRetry(() => import('./pages/interactions/InteractionsPage'));
const GuardianCredentialApprovalPage = lazyWithRetry(
    () => import('./pages/interactions/GuardianCredentialApprovalPage')
);
const LoginWithSeed = lazyWithRetry(() => import('./pages/hidden/LoginWithSeed'));
const FamilyPage = lazyWithRetry(() => import('./pages/familyPage/FamilyPage'));
const AuthHandoff = lazyWithRetry(() => import('./pages/auth/AuthHandoff'));

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
// import ExternalConsentFlowDoor from './pages/consentFlow/ExternalConsentFlowDoor';
// import CustomWallet from './pages/hidden/CustomWallet';
// import ClaimFromDashboard from './pages/claim-from-dashboard/ClaimFromDashboard';
// import LoginWithSeed from './pages/hidden/LoginWithSeed';
// import FamilyPage from './pages/familyPage/FamilyPage';
const AdminToolsPage = lazyWithRetry(() => import('./pages/adminToolsPage/AdminToolsPage'));
const ViewAllManagedBoostsPage = lazyWithRetry(
    () => import('./pages/adminToolsPage/ViewAllManagedBoostsPage')
);
const BulkBoostImportPage = lazyWithRetry(
    () => import('./pages/adminToolsPage/bulk-import/BulkBoostImportPage')
);
const ManageServiceProfilesPage = lazyWithRetry(
    () => import('./pages/adminToolsPage/ManageServiceProfilePage')
);
const ManageConsentFlowContractsPage = lazyWithRetry(
    () => import('./pages/adminToolsPage/ManageConsentFlowContractsPage')
);
const SigningAuthoritiesPage = lazyWithRetry(
    () => import('./pages/adminToolsPage/SigningAuthoritiesPage')
);
const APITokensPage = lazyWithRetry(
    () => import('./pages/adminToolsPage/api-tokens/APITokensPage')
);
const LearnerContextPromptTestPage = lazyWithRetry(
    () => import('./pages/adminToolsPage/learner-context-test/LearnerContextPromptTestPage')
);

const DevCli = lazyWithRetry(() => import('./pages/devCli/DevCli'));
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

// Create Custom Sentry Route component
// https://docs.sentry.io/platforms/javascript/guides/react/configuration/integrations/react-router/#react-router-v4v5
const SentryRoute = Sentry.withSentryRouting(Route);

const PrivateRoute = ({ component: Component, ...rest }) => {
    const isLoggedIn = useIsLoggedIn();

    return isLoggedIn ? (
        <SentryRoute {...rest} render={props => <Component {...props} {...rest} />} />
    ) : (
        <Redirect to="/login" />
    );
};

export const Routes: React.FC = () => {
    const isLoggedIn = useIsLoggedIn();
    const location = useLocation<{ background: any }>();
    const flags = useFlags();

    // The `backgroundLocation` state is the location that we were at when one of
    // it's what is displayed in the background when we open the modal route
    const background = location.state && location?.state?.background;

    return (
        <ChunkBoundary>
            <Suspense
                fallback={
                    <DelayedFallback delayMs={200}>
                        <RouteTransitionLoader />
                    </DelayedFallback>
                }
            >
                <GenericErrorBoundary>
                    <Switch location={background || location}>
                        <SentryRoute exact path="/login" component={LoginPage} />
                        <SentryRoute exact path="/__/auth/action" component={LoginPage} />
                        <SentryRoute exact path="/legal/terms" component={TermsOfServicePage} />
                        <SentryRoute exact path="/legal/privacy" component={PrivacyPolicyPage} />
                        <SentryRoute
                            exact
                            path="/share-creds/:uri/:seed"
                            component={ViewCredsBundle}
                        />
                        <SentryRoute exact path="/auth/handoff" component={AuthHandoff} />
                        <SentryRoute exact path="/share-boost" component={ViewSharedBoost} />
                        <SentryRoute exact path="/verify/resume" component={VerifySharedResume} />
                        <SentryRoute path="/waitingsofa" children={<LoadingPage2 />} />
                        <PrivateRoute
                            exact
                            path="/share-creds/:uri/:seed"
                            component={ViewCredsBundle}
                        />
                        <PrivateRoute exact path="/home" component={WalletPage} />
                        <PrivateRoute exact path="/wallet" component={WalletPage} />
                        <PrivateRoute exact path="/passport" component={WalletPage} />
                        <PrivateRoute exact path="/launchpad" component={LaunchPad} />
                        <PrivateRoute exact path="/apps/:appId" component={EmbedAppFullScreen} />
                        <SentryRoute exact path="/app/:listingId" component={AppListingPage} />

                        {/* App Store Developer Portal - all routes wrapped in context provider */}
                        <PrivateRoute
                            path="/app-store/developer"
                            component={DeveloperPortalRoutes}
                        />

                        <PrivateRoute
                            exact
                            path="/app-store/admin"
                            component={AppStoreAdminWithProvider}
                        />

                        <PrivateRoute exact path="/notifications" component={NotificationsPage} />
                        <PrivateRoute exact path="/contacts" component={AddressBook} />
                        <PrivateRoute exact path="/contacts/pending" component={AddressBook} />
                        <PrivateRoute exact path="/contacts/requests" component={AddressBook} />
                        <PrivateRoute exact path="/contacts/blocked" component={AddressBook} />
                        <PrivateRoute exact path="/contacts/search" component={AddressBook} />
                        <PrivateRoute exact path="/socialBadges" component={SocialBadgesPage} />
                        <PrivateRoute exact path="/achievements" component={AchievementsPage} />
                        <PrivateRoute
                            exact
                            path="/accomplishments"
                            component={AccomplishmentsPage}
                        />
                        <PrivateRoute exact path="/accommodations" component={AccommodationsPage} />
                        <PrivateRoute exact path="/currencies" component={CurrenciesPage} />
                        <PrivateRoute exact path="/ids" component={IdsPage} />
                        <PrivateRoute exact path="/memberships" component={MembershipPage} />
                        <PrivateRoute exact path="/workhistory" component={WorkHistoryPage} />
                        <PrivateRoute exact path="/families" component={FamilyPage} />
                        <PrivateRoute exact path="/skills" component={SkillsPage} />
                        <PrivateRoute exact path="/ai/insights" component={AiInsights} />
                        <PrivateRoute
                            exact
                            path="/privacy-and-data"
                            component={PrivacySettingsPage}
                        />
                        <PrivateRoute exact path="/resume-builder" component={ResumeBuilderPage} />
                        <PrivateRoute exact path="/ai/pathways" component={AiPathways} />
                        <Route
                            exact
                            path="/ai/pathways/discovery"
                            component={AiPathwaysDiscovery}
                        />
                        <PrivateRoute
                            exact
                            path="/learninghistory"
                            component={LearningHistoryPage}
                        />
                        <PrivateRoute exact path="/boost" component={BoostCMS} />
                        <PrivateRoute exact path="/boost/update" component={UpdateBoostCMS} />
                        <PrivateRoute exact path="/test" component={VprQueryByExample} />
                        <SentryRoute exact path="/wallet-worker" component={WalletServiceWorker} />
                        <PrivateRoute exact path="/store" component={CredentialStorage} />
                        <PrivateRoute exact path="/exchange" component={CredentialExchange} />
                        <PrivateRoute exact path="/get" component={CredentialStorageGet} />

                        <PrivateRoute
                            exact
                            path="/ai/topics"
                            component={AiSessionTopicsContainer}
                        />
                        <PrivateRoute exact path="/ai/sessions" component={AiSessionsContainer} />

                        <SentryRoute
                            path="/claim-credential/:uri"
                            children={<VCClaimModalController />}
                        />
                        <SentryRoute path="/did-auth/:challenge" children={<DIDAuthModal />} />
                        <PrivateRoute exact path="/admin-tools" component={AdminToolsPage} />
                        <PrivateRoute
                            exact
                            path="/admin-tools/view-managed-boosts"
                            component={ViewAllManagedBoostsPage}
                        />
                        <PrivateRoute
                            exact
                            path="/admin-tools/bulk-import"
                            component={BulkBoostImportPage}
                        />
                        <PrivateRoute
                            exact
                            path="/admin-tools/service-profiles"
                            component={ManageServiceProfilesPage}
                        />
                        <PrivateRoute
                            exact
                            path="/admin-tools/manage-contracts"
                            component={ManageConsentFlowContractsPage}
                        />
                        <PrivateRoute
                            exact
                            path="/admin-tools/signing-authorities"
                            component={SigningAuthoritiesPage}
                        />
                        <PrivateRoute
                            exact
                            path="/admin-tools/api-tokens"
                            component={APITokensPage}
                        />
                        {flags.enableLearnerContextTest && (
                            <PrivateRoute
                                exact
                                path="/admin-tools/learner-context-test"
                                component={LearnerContextPromptTestPage}
                            />
                        )}

                        <SentryRoute
                            path="/claim-credential/:uri"
                            children={<VCClaimModalController />}
                        />
                        <SentryRoute path="/did-auth/:challenge" children={<DIDAuthModal />} />

                        <SentryRoute exact path="/connect" component={ConnectPage} />
                        <SentryRoute exact path="/connect/:profileId" component={ConnectPage} />
                        <SentryRoute exact path="/invite" component={InvitePage} />
                        <SentryRoute exact path="/claim/boost" component={ClaimBoost} />
                        <SentryRoute exact path="/approve-account" component={ApproveAccount} />
                        <SentryRoute
                            exact
                            path="/claim/from-dashboard"
                            component={ClaimFromDashboard}
                        />
                        <SentryRoute
                            exact
                            path="/interactions/guardian-credential-approval/:token"
                            component={GuardianCredentialApprovalPage}
                        />
                        <SentryRoute path="/interactions/*" component={InteractionsPage} />
                        <SentryRoute exact path="/request" component={ClaimFromRequest} />

                        <SentryRoute
                            exact
                            path="/consent-flow"
                            component={ExternalConsentFlowDoor}
                        />
                        <SentryRoute
                            exact
                            path="/consent-flow-login"
                            render={() => <ExternalConsentFlowDoor login />}
                        />
                        <SentryRoute exact path="/consent-flow-sync-data" component={LaunchPad} />

                        <PrivateRoute
                            exact
                            path="/select-credentials/:profileId"
                            component={ShareCredentialsWithApp}
                        />
                        <PrivateRoute
                            exact
                            path="/view-shared-credentials/:profileId"
                            component={ViewCredentialsSharedWithApp}
                        />
                        <PrivateRoute path="/chats" component={LearnCardAiChatBot} />

                        <SentryRoute
                            exact
                            path="/"
                            render={() =>
                                isLoggedIn ? (
                                    <Redirect to={tabRoutes.tab1} />
                                ) : (
                                    <Redirect to="/login" />
                                )
                            }
                        />

                        <SentryRoute exact path="/verify-email" component={UserVerifyEmail} />

                        <Route exact path="/hidden/custom-wallet" component={CustomWallet} />

                        <Route exact path="/hidden/seed" component={LoginWithSeed} />

                        <PrivateRoute exact path="/cli" component={DevCli} />
                    </Switch>
                </GenericErrorBoundary>
            </Suspense>
        </ChunkBoundary>
    );
};

/**
 * Path-keyed preload map for routes reachable from the wallet, side menu, and
 * mobile nav. Consumers (WalletPage's category handler, PreloadingLink, etc.)
 * await the matching preload before calling history.push, which keeps the
 * current page mounted (no Suspense fallback flash) until the destination
 * chunk is in memory.
 */
export const ROUTE_PRELOAD: Record<string, () => Promise<void>> = {
    // Wallet category routes (also rendered as squares on /wallet).
    '/skills': () => SkillsPage.preload(),
    '/socialBadges': () => SocialBadgesPage.preload(),
    '/achievements': () => AchievementsPage.preload(),
    '/learninghistory': () => LearningHistoryPage.preload(),
    '/accomplishments': () => AccomplishmentsPage.preload(),
    '/accommodations': () => AccommodationsPage.preload(),
    '/workhistory': () => WorkHistoryPage.preload(),
    '/families': () => FamilyPage.preload(),
    '/ids': () => IdsPage.preload(),
    '/memberships': () => MembershipPage.preload(),
    '/currencies': () => CurrenciesPage.preload(),
    '/ai/insights': () => AiInsights.preload(),
    '/ai/pathways': () => AiPathways.preload(),
    '/ai/topics': () => AiSessionTopicsContainer.preload(),
    // Side menu root links.
    '/launchpad': () => LaunchPad.preload(),
    '/contacts': () => AddressBook.preload(),
    '/notifications': () => NotificationsPage.preload(),
    '/admin-tools': () => AdminToolsPage.preload(),
    // Mobile navbar / wallet header.
    '/boost': () => BoostCMS.preload(),
    // Other commonly side-menu-linked routes.
    '/privacy-and-data': () => PrivacySettingsPage.preload(),
    '/resume-builder': () => ResumeBuilderPage.preload(),
};

/**
 * Idle-prefetch every route in ROUTE_PRELOAD so first-time navigation from
 * anywhere (wallet squares, side menu, mobile nav, deep links) lands on a
 * warm chunk cache and the Suspense fallback never fires.
 */
export const prefetchRoutes = (): void => {
    const ric: typeof window.requestIdleCallback | undefined =
        (window as any).requestIdleCallback;
    const schedule = (cb: () => void) =>
        ric ? ric(cb, { timeout: 2000 }) : setTimeout(cb, 200);

    schedule(() => {
        Object.values(ROUTE_PRELOAD).forEach(fn => {
            fn();
        });
    });
};
