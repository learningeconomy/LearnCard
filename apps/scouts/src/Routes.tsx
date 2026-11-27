import React, { Suspense } from 'react';
import { Navigate, Route, Routes as RouterRoutes, useLocation } from 'react-router';
import type { Location } from 'react-router';
import {
    DIDAuthModal,
    VCClaimModalController,
    useIsLoggedIn,
    lazyWithRetry,
    ChunkBoundary,
    InAppMessageDeepLinkRoute,
    getInAppMessageEntryPath,
} from 'learn-card-base';

import * as Sentry from '@sentry/react';
import { LoadingPageDumb } from './pages/loadingPage/LoadingPage';
import WalletPage from './pages/wallet/WalletPage';
import LaunchPad from './pages/launchPad/LaunchPad';
import NotificationsPage from './pages/notificationsPage/NotificationsPage';

import LoginPage from './pages/login/LoginPage';
const CurrenciesPage = lazyWithRetry(() => import('./pages/currencies/CurrenciesPage'));
const AchievementsPage = lazyWithRetry(() => import('./pages/achievements/AchievementsPage'));
const AddressBook = lazyWithRetry(() => import('./pages/addressBook/AddressBook'));
const SkillsPage = lazyWithRetry(() => import('./pages/skills/SkillsPage'));
const IdsPage = lazyWithRetry(() => import('./pages/ids/IdsPage'));
const LearningHistoryPage = lazyWithRetry(
    () => import('./pages/learninghistory/LearningHistoryPage')
);
const WorkHistoryPage = lazyWithRetry(() => import('./pages/workhistory/WorkHistoryPage'));
import LoadingPage from './pages/loadingPage/LoadingPage';
import { LoadingPage2 } from './pages/loadingPage/LoadingPage';
import CredentialStorage from './pages/credentialStorage/CredentialStorage';
import CredentialStorageGet from './pages/credentialStorage/CredentialStorageGet';
const BoostCMS = lazyWithRetry(() => import('./components/boost/boostCMS/BoostCMS'));
const UpdateBoostCMS = lazyWithRetry(() => import('./components/boost/boostCMS/UpdateBoostCMS'));

import ConnectPage from './pages/connectPage/ConnectPage';
import WalletServiceWorker from './pages/walletServiceWorker/WalletServiceWorker';

const ViewCredsBundle = lazyWithRetry(() => import('./components/creds-bundle/ViewCredsBundle'));
const InvitePage = lazyWithRetry(() => import('./pages/invitePage/InvitePage'));

const ViewCredentialsSharedWithApp = lazyWithRetry(
    () => import('learn-card-base/components/sharecreds/ViewCredentialsSharedWithApp')
);

const ViewSharedBoost = lazyWithRetry(() => import('./components/creds-bundle/ViewSharedBoost'));

import { tabRoutes } from './constants';
import ShareCredentialsWithApp from 'learn-card-base/components/sharecreds/ShareCredentialsWithApp';

import ClaimBoost from './pages/claimBoost/ClaimBoost';
import MembershipPage from './pages/membership/MembershipPage';
import BoostsPage from './pages/socialBadgesPage/BoostsPage';
import MeritBadgesPage from './pages/meritbadges/MeritBadgesPage';
import AdminToolsPage from './pages/adminToolsPage/AdminToolsPage';
import ViewAllManagedBoosts from './pages/adminToolsPage/ViewAllManagedBoosts';
import BulkBoostImportPage from './pages/adminToolsPage/bulk-import/BulkBoostImportPage';
import GenericErrorBoundary from './components/generic/GenericErrorBoundary';

const ExternalConsentFlowDoor = lazyWithRetry(
    () => import('./pages/consentFlow/ExternalConsentFlowDoor')
);

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
                    : '/login'
            }
        />
    );
};

const RootRedirect: React.FC = () => {
    const isLoggedIn = useIsLoggedIn();
    return <Navigate replace to={isLoggedIn ? tabRoutes.tab2 : '/login'} />;
};

export const Routes: React.FC = () => {
    const location = useLocation();

    // The `backgroundLocation` state is the location that we were at when one of
    // it's what is displayed in the background when we open the modal route
    const background = (location.state as { background?: Location } | null)?.background;
    const isModalRoute =
        location.pathname.startsWith('/claim-credential/') ||
        location.pathname.startsWith('/did-auth/') ||
        location.pathname.startsWith('/share-creds/');
    const switchLocation = background && isModalRoute ? background : location;

    return (
        <ChunkBoundary>
            <Suspense fallback={<LoadingPageDumb />}>
                <GenericErrorBoundary>
                    <SentryRoutes location={switchLocation}>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/acctmgmt/__/auth/action" element={<LoginPage />} />
                        <Route path="/share-boost" element={<ViewSharedBoost />} />
                        <Route
                            path="/share-creds/:uri/:seed"
                            element={
                                <PrivateRoute
                                    path="/share-creds/:uri/:seed"
                                    component={ViewCredsBundle}
                                />
                            }
                        />
                        {/* <Route path="/home" element={<PrivateRoute path="/home" component={WalletPage} />} /> */}
                        <Route
                            path="/wallet"
                            element={<PrivateRoute path="/wallet" component={WalletPage} />}
                        />
                        <Route
                            path="/home"
                            element={<PrivateRoute path="/home" component={LaunchPad} />}
                        />
                        <Route
                            path="/launchpad"
                            element={<PrivateRoute path="/launchpad" component={LaunchPad} />}
                        />
                        <Route
                            path="/campfire"
                            element={<PrivateRoute path="/campfire" component={LaunchPad} />}
                        />
                        <Route
                            path="/notifications"
                            element={
                                <PrivateRoute path="/notifications" component={NotificationsPage} />
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
                            path="/badges"
                            element={<PrivateRoute path="/badges" component={MeritBadgesPage} />}
                        />
                        <Route
                            path="/boosts"
                            element={<PrivateRoute path="/boosts" component={BoostsPage} />}
                        />
                        {/* <Route path="/socialBadges" element={<PrivateRoute path="/socialBadges" component={BoostsPage} />} /> */}
                        <Route
                            path="/achievements"
                            element={
                                <PrivateRoute path="/achievements" component={AchievementsPage} />
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
                            path="/workhistory"
                            element={
                                <PrivateRoute path="/workhistory" component={WorkHistoryPage} />
                            }
                        />
                        <Route
                            path="/competencies"
                            element={<PrivateRoute path="/competencies" component={SkillsPage} />}
                        />
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
                            path="/memberships"
                            element={
                                <PrivateRoute path="/memberships" component={MembershipPage} />
                            }
                        />
                        <Route
                            path="/troops"
                            element={<PrivateRoute path="/troops" component={MembershipPage} />}
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

                        <Route path="/wallet-worker" element={<WalletServiceWorker />} />
                        <Route
                            path="/store"
                            element={<PrivateRoute path="/store" component={CredentialStorage} />}
                        />
                        <Route
                            path="/get"
                            element={<PrivateRoute path="/get" component={CredentialStorageGet} />}
                        />

                        <Route path="/waitingsofa/*" element={<LoadingPage2 />} />
                        <Route
                            path="/admin-tools"
                            element={
                                <PrivateRoute path="/admin-tools" component={AdminToolsPage} />
                            }
                        />
                        <Route
                            path="/admin-tools/view-managed-boosts"
                            element={
                                <PrivateRoute
                                    path="/admin-tools/view-managed-boosts"
                                    component={ViewAllManagedBoosts}
                                />
                            }
                        />
                        <Route
                            path="/admin-tools/bulk-import"
                            element={
                                <PrivateRoute
                                    path="/admin-tools/bulk-import"
                                    component={BulkBoostImportPage}
                                />
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

                        <Route
                            path="/frameworks/:frameworkId/skills/:skillId"
                            element={<LaunchPad />}
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

                        <Route path="/" element={<RootRedirect />} />

                        <Route path="/consent-flow" element={<ExternalConsentFlowDoor />} />
                    </SentryRoutes>
                </GenericErrorBoundary>
            </Suspense>
        </ChunkBoundary>
    );
};
