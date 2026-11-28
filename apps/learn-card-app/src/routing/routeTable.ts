import type { PageKey } from './pages';

/**
 * Every URL the app serves, as data. `src/routes.ts` turns this into React Router's route config
 * (one route module per page, under `src/routes/pages/`), and Sentry names transactions from the
 * same paths, so the two can't drift. Order doesn't matter: React Router ranks paths itself.
 *
 * - `private` routes render inside `routes/_private.tsx`, which sends signed-out visitors to /login.
 * - `id` is only needed when one page serves several paths (React Router ids must be unique).
 *
 * This file is read by Node (react-router.config / routes.ts), so it must stay plain data.
 */
export type RouteEntry = {
    path: string;
    page: PageKey;
    access: 'public' | 'private';
    id?: string;
};

const pub = (path: string, page: PageKey, id?: string): RouteEntry => ({
    path,
    page,
    access: 'public',
    id,
});
const priv = (path: string, page: PageKey, id?: string): RouteEntry => ({
    path,
    page,
    access: 'private',
    id,
});

export const ROUTE_TABLE: readonly RouteEntry[] = [
    pub('/', 'rootRedirect'),
    pub('/recovery/cancel', 'cancelRecovery'),
    pub('/s/:id', 'shareLinkViewer'),
    pub('/unsubscribe', 'unsubscribe'),
    pub('/login', 'login'),
    pub('/__/auth/action', 'login', 'firebase-auth-action'),
    pub('/developer/sign-in', 'developerSignIn'),
    pub('/legal/terms', 'termsOfService'),
    pub('/legal/privacy', 'privacyPolicy'),
    pub('/share-creds/:uri/:seed', 'viewCredsBundle'),
    pub('/auth/handoff', 'authHandoff'),
    pub('/auth/classlink/callback', 'classLinkCallback'),
    pub('/auth/classlink/start', 'classLinkStart'),
    pub('/share-boost', 'viewSharedBoost'),
    pub('/verify/resume', 'verifySharedResume'),
    pub('/waitingsofa/*', 'waitingSofa'),
    pub('/app/:listingId', 'appListing'),
    pub('/app-store/developer/*', 'developerPortal'),
    pub('/admin/campaigns/*', 'campaigns'),
    pub('/ai/pathways/discovery', 'aiPathwaysDiscovery'),
    pub('/wallet-worker', 'walletServiceWorker'),
    pub('/claim-credential/:uri/*', 'vcClaimModal'),
    pub('/did-auth/:challenge/*', 'didAuthModal'),
    pub('/connect', 'connect'),
    pub('/connect/:profileId', 'connect', 'connect-profile'),
    pub('/invite', 'invite'),
    pub('/claim/boost', 'claimBoost'),
    pub('/approve-account', 'approveAccount'),
    pub('/claim/from-dashboard', 'claimFromDashboard'),
    pub('/interactions/guardian-credential-approval/:token', 'guardianCredentialApproval'),
    pub('/interactions/guardian-approval/:token', 'guardianAccountApproval'),
    pub('/interactions/*', 'interactions'),
    pub('/request', 'claimFromRequest'),
    pub('/oid4vci', 'oid4vci'),
    pub('/oid4vp', 'oid4vp'),
    pub('/native-digital-credentials', 'nativeDigitalCredentials'),
    pub('/consent-flow', 'consentFlowDoor'),
    pub('/consent-flow-login', 'consentFlowLogin'),
    pub('/consent-flow-sync-data', 'launchPad', 'consent-flow-sync-data'),
    pub('/verify-email', 'verifyEmail'),
    pub('/hidden/custom-wallet', 'customWallet'),
    pub('/hidden/seed/*', 'hiddenSeedRedirect'),
    pub('/dev/clr-transcript', 'clrTranscriptDemo'),

    priv('/dashboard', 'dashboard'),
    priv('/home', 'wallet', 'wallet-home'),
    priv('/wallet', 'wallet'),
    priv('/passport', 'wallet', 'wallet-passport'),
    priv('/launchpad', 'myApps'),
    priv('/launchpad/browse', 'launchPad'),
    priv('/apps/:appId', 'embedApp'),
    priv('/m/:messageId', 'inAppMessage'),
    priv('/app-store/admin', 'appStoreAdmin'),
    priv('/notifications', 'notifications'),
    priv('/account/secure', 'secureAccount'),
    priv('/contacts', 'addressBook'),
    priv('/contacts/pending', 'addressBook', 'contacts-pending'),
    priv('/contacts/requests', 'addressBook', 'contacts-requests'),
    priv('/contacts/blocked', 'addressBook', 'contacts-blocked'),
    priv('/contacts/search', 'addressBook', 'contacts-search'),
    priv('/socialBadges', 'socialBadges'),
    priv('/achievements', 'achievements'),
    priv('/qualifications', 'qualifications'),
    priv('/accomplishments', 'accomplishments'),
    priv('/accommodations', 'accommodations'),
    priv('/currencies', 'currencies'),
    priv('/ids', 'ids'),
    priv('/memberships', 'memberships'),
    priv('/workhistory', 'workHistory'),
    priv('/families', 'families'),
    priv('/school-connect', 'schoolConnect'),
    priv('/skills', 'skills'),
    priv('/ai/insights', 'aiInsights'),
    priv('/ai/assistant', 'myAssistant'),
    priv('/privacy-and-data', 'privacySettings'),
    priv('/resume-builder', 'resumeBuilder'),
    priv('/ai/pathways', 'aiPathways'),
    priv('/pathways/*', 'pathways'),
    priv('/learninghistory', 'learningHistory'),
    priv('/boost', 'boostCms'),
    priv('/boost/update', 'updateBoostCms'),
    priv('/issue', 'issueCredential'),
    priv('/boost-a-friend', 'boostAFriend'),
    priv('/test', 'vprQueryByExample'),
    priv('/store', 'credentialStorage'),
    priv('/exchange', 'credentialExchange'),
    priv('/get', 'credentialStorageGet'),
    priv('/ai/topics', 'aiTopics'),
    priv('/ai/sessions', 'aiSessions'),
    priv('/consent-flow/review', 'contractUpdateReview'),
    priv('/select-credentials/:profileId', 'shareCredentialsWithApp'),
    priv('/view-shared-credentials/:profileId', 'viewCredentialsSharedWithApp'),
    priv('/chats/*', 'chatBot'),
    priv('/cli', 'devCli'),
];

/** The route module file for a page, relative to `src/`. */
export const routeModuleFile = (page: PageKey): string => `routes/pages/${page}.tsx`;
