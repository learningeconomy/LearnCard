import React, { Suspense } from 'react';
import { Redirect, Route, Switch, useLocation } from 'react-router-dom';
import {
    DIDAuthModal,
    VCClaimModalController,
    useIsLoggedIn,
    lazyWithRetry,
    ChunkBoundary,
} from 'learn-card-base';

import { createBrowserHistory } from 'history';
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

// Create Custom Sentry Route component
// https://docs.sentry.io/platforms/javascript/guides/react/configuration/integrations/react-router/#react-router-v4v5
const SentryRoute = Sentry.withSentryRouting(Route);

const history = createBrowserHistory();

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
                <Switch location={background || location}>
                    <GenericErrorBoundary>
                        <SentryRoute exact path="/login" component={LoginPage} />
                        <SentryRoute exact path="/acctmgmt/__/auth/action" component={LoginPage} />
                        <SentryRoute
                            exact
                            path="/share-creds/:uri/:seed"
                            component={ViewCredsBundle}
                        />
                        <SentryRoute exact path="/share-boost" component={ViewSharedBoost} />
                        <PrivateRoute
                            exact
                            path="/share-creds/:uri/:seed"
                            component={ViewCredsBundle}
                        />
                        {/* <PrivateRoute exact path="/home" component={WalletPage} /> */}
                        <PrivateRoute exact path="/wallet" component={WalletPage} />
                        <PrivateRoute exact path="/home" component={LaunchPad} />
                        <PrivateRoute exact path="/launchpad" component={LaunchPad} />
                        <PrivateRoute exact path="/campfire" component={LaunchPad} />
                        <PrivateRoute exact path="/notifications" component={NotificationsPage} />
                        <PrivateRoute exact path="/contacts" component={AddressBook} />
                        <PrivateRoute exact path="/contacts/pending" component={AddressBook} />
                        <PrivateRoute exact path="/contacts/requests" component={AddressBook} />
                        <PrivateRoute exact path="/contacts/blocked" component={AddressBook} />
                        <PrivateRoute exact path="/contacts/search" component={AddressBook} />
                        <PrivateRoute exact path="/badges" component={MeritBadgesPage} />
                        <PrivateRoute exact path="/boosts" component={BoostsPage} />
                        {/* <PrivateRoute exact path="/socialBadges" component={BoostsPage} /> */}
                        <PrivateRoute exact path="/achievements" component={AchievementsPage} />
                        <PrivateRoute exact path="/currencies" component={CurrenciesPage} />
                        <PrivateRoute exact path="/ids" component={IdsPage} />
                        <PrivateRoute exact path="/workhistory" component={WorkHistoryPage} />
                        <PrivateRoute exact path="/skills" component={SkillsPage} />
                        <PrivateRoute
                            exact
                            path="/learninghistory"
                            component={LearningHistoryPage}
                        />
                        <PrivateRoute exact path="/memberships" component={MembershipPage} />
                        <PrivateRoute exact path="/troops" component={MembershipPage} />
                        <PrivateRoute exact path="/boost" component={BoostCMS} />
                        <PrivateRoute exact path="/boost/update" component={UpdateBoostCMS} />

                        <SentryRoute exact path="/wallet-worker" component={WalletServiceWorker} />
                        <PrivateRoute exact path="/store" component={CredentialStorage} />
                        <PrivateRoute exact path="/get" component={CredentialStorageGet} />

                        <SentryRoute path="/waitingsofa" children={<LoadingPage2 />} />
                        <PrivateRoute exact path="/admin-tools" component={AdminToolsPage} />
                        <PrivateRoute
                            exact
                            path="/admin-tools/view-managed-boosts"
                            component={ViewAllManagedBoosts}
                        />
                        <PrivateRoute
                            exact
                            path="/admin-tools/bulk-import"
                            component={BulkBoostImportPage}
                        />

                        <SentryRoute path="/waitingsofa" children={<LoadingPage2 />} />

                        <SentryRoute
                            path="/claim-credential/:uri"
                            children={<VCClaimModalController />}
                        />
                        <SentryRoute path="/did-auth/:challenge" children={<DIDAuthModal />} />

                        <SentryRoute exact path="/connect" component={ConnectPage} />
                        <SentryRoute exact path="/connect/:profileId" component={ConnectPage} />
                        <SentryRoute exact path="/invite" component={InvitePage} />
                        <SentryRoute exact path="/claim/boost" component={ClaimBoost} />

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

                        <SentryRoute
                            exact
                            path="/"
                            render={() =>
                                isLoggedIn ? (
                                    <Redirect to={tabRoutes.tab2} />
                                ) : (
                                    <Redirect to="/login" />
                                )
                            }
                        />

                        <SentryRoute
                            exact
                            path="/consent-flow"
                            component={ExternalConsentFlowDoor}
                        />
                    </GenericErrorBoundary>
                </Switch>
            </Suspense>
        </ChunkBoundary>
    );
};
