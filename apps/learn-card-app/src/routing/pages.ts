import React from 'react';

import { DashboardPageRoute, preloadDashboardPage } from '../pages/dashboard/DashboardPageRoute';
import { lazyNamedPage, lazyPage, type LazyPage } from './lazyPage';

/**
 * Every page the router can render, each its own chunk. Route modules (`src/routes/pages/`) render
 * these, their clientLoaders load them, and ROUTE_PRELOAD warms them ahead of navigation.
 *
 * Route modules run before entry.client and in Node at build time, so this module may only import
 * pages lazily (DashboardPageRoute is itself a lazy wrapper with no app imports of its own).
 */
export const PAGES = {
    rootRedirect: lazyNamedPage(() => import('./elements/RootRedirect'), 'RootRedirect'),
    developerPortal: lazyNamedPage(
        () => import('./elements/DeveloperPortalGate'),
        'DeveloperPortalGate'
    ),
    appStoreAdmin: lazyNamedPage(() => import('./elements/AppStoreAdmin'), 'AppStoreAdmin'),
    myAssistant: lazyNamedPage(() => import('./elements/MyAssistantRoute'), 'MyAssistantRoute'),
    pathways: lazyNamedPage(() => import('./elements/PathwaysRoute'), 'PathwaysRoute'),

    dashboard: { preload: preloadDashboardPage, Component: DashboardPageRoute },
    wallet: lazyPage(() => import('../pages/wallet/WalletPage')),
    campaigns: lazyPage(() => import('../pages/campaigns/CampaignsPage')),
    launchPad: lazyPage(() => import('../pages/launchPad/LaunchPad')),
    myApps: lazyPage(() => import('../pages/myApps/MyAppsLanding')),
    embedApp: lazyPage(() => import('../pages/launchPad/EmbedAppFullScreen')),
    appListing: lazyPage(() => import('../pages/launchPad/AppListingPage')),
    notifications: lazyPage(() => import('../pages/notificationsPage/NotificationsPage')),
    login: lazyPage(() => import('../pages/login/LoginPage')),
    cancelRecovery: lazyPage(() => import('../pages/recovery/CancelRecoveryPage')),
    secureAccount: lazyPage(() => import('../pages/recovery/SecureAccountPage')),
    achievements: lazyPage(() => import('../pages/achievements/AchievementsPage')),
    qualifications: lazyPage(() => import('../pages/qualifications/QualificationsPage')),
    ids: lazyPage(() => import('../pages/ids/IdsPage')),
    learningHistory: lazyPage(() => import('../pages/learninghistory/LearningHistoryPage')),
    workHistory: lazyPage(() => import('../pages/workhistory/WorkHistoryPage')),
    currencies: lazyPage(() => import('../pages/currencies/CurrenciesPage')),
    credentialStorage: lazyPage(() => import('../pages/credentialStorage/CredentialStorage')),
    credentialStorageGet: lazyPage(() => import('../pages/credentialStorage/CredentialStorageGet')),
    addressBook: lazyPage(() => import('../pages/addressBook/AddressBook')),
    boostCms: lazyPage(() => import('../components/boost/boostCMS/BoostCMS')),
    updateBoostCms: lazyPage(() => import('../components/boost/boostCMS/UpdateBoostCMS')),
    issueCredential: lazyPage(() => import('../pages/issue/IssueCredentialPage')),
    boostAFriend: lazyPage(() => import('../pages/boostAFriend/BoostAFriendPage')),
    skills: lazyPage(() => import('../pages/skills/SkillsPage')),
    aiInsights: lazyPage(() => import('../pages/ai-insights/AiInsights')),
    privacySettings: lazyPage(() => import('../pages/privacy-settings/PrivacySettingsPage')),
    resumeBuilder: lazyPage(() => import('../pages/resume-builder/ResumeBuilderPage')),
    verifySharedResume: lazyPage(() => import('../pages/resume-builder/VerifySharedResume')),
    aiPathways: lazyPage(() => import('../pages/ai-pathways/AiPathways')),
    shareLinkViewer: lazyPage(() => import('../components/share-links/ShareLinkViewer')),
    viewCredsBundle: lazyPage(() => import('../components/creds-bundle/ViewCredsBundle')),
    viewSharedBoost: lazyPage(() => import('../components/creds-bundle/ViewSharedBoost')),
    memberships: lazyPage(() => import('../pages/membership/MembershipPage')),
    connect: lazyPage(() => import('../pages/connectPage/ConnectPage')),
    invite: lazyPage(() => import('../pages/invitePage/InvitePage')),
    credentialExchange: lazyPage(() => import('../pages/credentialStorage/CredentialExchange')),
    vprQueryByExample: lazyPage(() => import('../pages/credentialStorage/vpr/VprQueryByExample')),
    viewCredentialsSharedWithApp: lazyPage(
        () => import('learn-card-base/components/sharecreds/ViewCredentialsSharedWithApp')
    ),
    shareCredentialsWithApp: lazyPage(
        () => import('learn-card-base/components/sharecreds/ShareCredentialsWithApp')
    ),
    consentFlowDoor: lazyPage(() => import('../pages/consentFlow/ExternalConsentFlowDoor')),
    consentFlowLogin: lazyPage(() =>
        import('../pages/consentFlow/ExternalConsentFlowDoor').then(module => ({
            default: () => React.createElement(module.default, { login: true }),
        }))
    ),
    contractUpdateReview: lazyPage(() => import('../pages/consentFlow/ContractUpdateReviewRoute')),
    walletServiceWorker: lazyPage(() => import('../pages/walletServiceWorker/WalletServiceWorker')),
    claimBoost: lazyPage(() => import('../pages/claimBoost/ClaimBoost')),
    approveAccount: lazyPage(() => import('../pages/approveAccount/ApproveAccount')),
    socialBadges: lazyPage(() => import('../pages/socialBadgesPage/SocialBadgesPage')),
    accomplishments: lazyPage(() => import('../pages/accomplishments/AccomplishmentsPage')),
    accommodations: lazyPage(() => import('../pages/accommodations/AccommodationsPage')),
    customWallet: lazyPage(() => import('../pages/hidden/CustomWallet')),
    claimFromDashboard: lazyPage(() => import('../pages/claim-from-dashboard/ClaimFromDashboard')),
    claimFromRequest: lazyPage(() => import('../pages/claim-from-request/ClaimFromRequest')),
    oid4vci: lazyPage(() => import('../pages/oid4vci/Oid4vciExchange')),
    oid4vp: lazyPage(() => import('../pages/oid4vp/Oid4vpExchange')),
    nativeDigitalCredentials: lazyPage(
        () => import('../native-digital-credentials/NativeDigitalCredentialFlow')
    ),
    interactions: lazyPage(() => import('../pages/interactions/InteractionsPage')),
    guardianCredentialApproval: lazyPage(
        () => import('../pages/interactions/GuardianCredentialApprovalPage')
    ),
    guardianAccountApproval: lazyPage(
        () => import('../pages/interactions/GuardianAccountApprovalPage')
    ),
    developerSignIn: lazyPage(() => import('../pages/developer/DeveloperSignInPage')),
    families: lazyPage(() => import('../pages/familyPage/FamilyPage')),
    schoolConnect: lazyPage(() => import('../pages/schoolConnect/SchoolConnectPage')),
    authHandoff: lazyPage(() => import('../pages/auth/AuthHandoff')),
    classLinkCallback: lazyPage(() => import('../pages/auth/ClassLinkCallback')),
    classLinkStart: lazyPage(() => import('../pages/auth/ClassLinkStart')),
    devCli: lazyPage(() => import('../pages/devCli/DevCli')),
    clrTranscriptDemo: lazyPage(() => import('../pages/dev/ClrTranscriptRendererDemo')),
    aiPathwaysDiscovery: lazyPage(
        () => import('../pages/ai-pathways/ai-pathways-discovery/AiPathwaysDiscovery')
    ),
    aiTopics: lazyPage(() => import('../components/ai-sessions/AiSessionTopicsContainer')),
    aiSessions: lazyPage(() => import('../components/ai-sessions/AiSessionsContainer')),
    verifyEmail: lazyPage(() => import('../components/user-profile/UserContact/UserVerifyEmail')),
    chatBot: lazyPage(
        () => import('../components/new-ai-session/LearnCardAiChatBot/LearnCardAiChatBot')
    ),
    termsOfService: lazyPage(() => import('../pages/legal/TermsOfServicePage')),
    privacyPolicy: lazyPage(() => import('../pages/legal/PrivacyPolicyPage')),
    unsubscribe: lazyPage(() => import('../pages/unsubscribe/UnsubscribePage')),
    waitingSofa: lazyNamedPage(() => import('../pages/loadingPage/LoadingPage'), 'LoadingPage2'),
    vcClaimModal: lazyNamedPage(
        () => import('learn-card-base/components/vcmodal/VCModal'),
        'VCClaimModalController'
    ),
    didAuthModal: lazyNamedPage(
        () => import('learn-card-base/components/did-auth-modal/DIDAuthModal'),
        'DIDAuthModal'
    ),
    inAppMessage: lazyNamedPage(
        () => import('learn-card-base/in-app-messages/InAppMessageDeepLinkRoute'),
        'InAppMessageDeepLinkRoute'
    ),
    hiddenSeedRedirect: lazyNamedPage(
        () => import('./elements/HiddenSeedRedirect'),
        'HiddenSeedRedirect'
    ),
} satisfies Record<string, LazyPage>;

export type PageKey = keyof typeof PAGES;
