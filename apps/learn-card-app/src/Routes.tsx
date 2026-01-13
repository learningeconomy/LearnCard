import React, { Suspense } from 'react';
import { Redirect, Route, Switch, useLocation } from 'react-router-dom';
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
import LaunchPad from './pages/launchPad/LaunchPad';
const EmbedAppFullScreen = lazyWithRetry(() => import('./pages/launchPad/EmbedAppFullScreen'));
const AppListingPage = lazyWithRetry(() => import('./pages/launchPad/AppListingPage'));
const NotificationsPage = lazyWithRetry(
    () => import('./pages/notificationsPage/NotificationsPage')
);
import LoginPage from './pages/login/LoginPage';
import AchievementsPage from './pages/achievements/AchievementsPage';

import IdsPage from './pages/ids/IdsPage';

import LearningHistoryPage from './pages/learninghistory/LearningHistoryPage';
import WorkHistoryPage from './pages/workhistory/WorkHistoryPage';
import { LoadingPageDumb } from './pages/loadingPage/LoadingPage';

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

import SocialBadgesPage from './pages/socialBadgesPage/SocialBadgesPage';

import { LoadingPage2 } from './pages/loadingPage/LoadingPage';
import AccomplishmentsPage from './pages/accomplishments/AccomplishmentsPage';
import AccommodationsPage from './pages/accommodations/AccommodationsPage';

const CustomWallet = lazyWithRetry(() => import('./pages/hidden/CustomWallet'));
const ClaimFromDashboard = lazyWithRetry(
    () => import('./pages/claim-from-dashboard/ClaimFromDashboard')
);
const ClaimFromRequest = lazyWithRetry(() => import('./pages/claim-from-request/ClaimFromRequest'));
const InteractionsPage = lazyWithRetry(() => import('./pages/interactions/InteractionsPage'));
const LoginWithSeed = lazyWithRetry(() => import('./pages/hidden/LoginWithSeed'));
const FamilyPage = lazyWithRetry(() => import('./pages/familyPage/FamilyPage'));
const PostConsentFlowDataFeed = lazyWithRetry(
    () => import('./pages/launchPad/PostConsentFlowDataFeed')
);
const AuthHandoff = lazyWithRetry(() => import('./pages/auth/AuthHandoff'));

// App Store Developer Portal
const DeveloperPortal = lazyWithRetry(() => import('./pages/appStoreDeveloper/DeveloperPortal'));
const SubmissionForm = lazyWithRetry(() => import('./pages/appStoreDeveloper/SubmissionForm'));
const AppStoreAdminDashboard = lazyWithRetry(() => import('./pages/appStoreAdmin/AdminDashboard'));
// import ExternalConsentFlowDoor from './pages/consentFlow/ExternalConsentFlowDoor';
// import CustomWallet from './pages/hidden/CustomWallet';
// import ClaimFromDashboard from './pages/claim-from-dashboard/ClaimFromDashboard';
// import LoginWithSeed from './pages/hidden/LoginWithSeed';
// import FamilyPage from './pages/familyPage/FamilyPage';
import AdminToolsPage from './pages/adminToolsPage/AdminToolsPage';
import ViewAllManagedBoostsPage from './pages/adminToolsPage/ViewAllManagedBoostsPage';
import BulkBoostImportPage from './pages/adminToolsPage/bulk-import/BulkBoostImportPage';
import ManageServiceProfilesPage from './pages/adminToolsPage/ManageServiceProfilePage';
import ManageConsentFlowContractsPage from './pages/adminToolsPage/ManageConsentFlowContractsPage';
import SigningAuthoritiesPage from './pages/adminToolsPage/SigningAuthoritiesPage';
import APITokensPage from './pages/adminToolsPage/api-tokens/APITokensPage';

const DevCli = lazyWithRetry(() => import('./pages/devCli/DevCli'));

import AiSessionTopicsContainer from './components/ai-sessions/AiSessionTopicsContainer';
import AiSessionsContainer from './components/ai-sessions/AiSessionsContainer';
import UserVerifyEmail from './components/user-profile/UserContact/UserVerifyEmail';
const LearnCardAiChatBot = lazyWithRetry(
    () => import('./components/new-ai-session/LearnCardAiChatBot/LearnCardAiChatBot')
);

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

    // The `backgroundLocation` state is the location that we were at when one of
    // it's what is displayed in the background when we open the modal route
    const background = location.state && location?.state?.background;

    return (
        <ChunkBoundary>
            <Suspense fallback={<LoadingPageDumb />}>
                <GenericErrorBoundary>
                    <Switch location={background || location}>
                        <SentryRoute exact path="/login" component={LoginPage} />
                        <SentryRoute exact path="/__/auth/action" component={LoginPage} />
                        <SentryRoute
                            exact
                            path="/share-creds/:uri/:seed"
                            component={ViewCredsBundle}
                        />
                        <SentryRoute exact path="/auth/handoff" component={AuthHandoff} />
                        <SentryRoute exact path="/share-boost" component={ViewSharedBoost} />
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

                        {/* App Store Developer Portal */}
                        <PrivateRoute
                            exact
                            path="/app-store/developer"
                            component={DeveloperPortal}
                        />
                        <PrivateRoute
                            exact
                            path="/app-store/developer/new"
                            component={SubmissionForm}
                        />
                        <PrivateRoute
                            exact
                            path="/app-store/developer/edit/:listingId"
                            component={SubmissionForm}
                        />
                        <PrivateRoute
                            exact
                            path="/app-store/admin"
                            component={AppStoreAdminDashboard}
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
                        <PrivateRoute exact path="/ai/pathways" component={AiPathways} />
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
                        <PrivateRoute exact path="/data-feed" component={PostConsentFlowDataFeed} />

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
