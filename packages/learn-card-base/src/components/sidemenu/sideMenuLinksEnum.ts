import { CredentialCategoryEnum } from 'learn-card-base/types/boostAndCredentialMetadata';

// Own module so theme validators can use the ids without importing sidemenuHelpers, whose top-level
// SideNavIcons destructuring keeps every side-nav icon in the startup entry.
export enum SideMenuLinksEnum {
    //  root links
    launchPad = 'launchPad',
    contacts = 'contacts',
    alerts = 'alerts',
    myAssistant = 'myAssistant',
    personalize = 'personalize',

    // secondary links
    wallet = 'wallet',
    passport = 'passport',
    aiTopics = CredentialCategoryEnum.aiTopic,
    aiInsights = CredentialCategoryEnum.aiInsight,
    aiPathways = CredentialCategoryEnum.aiPathway,
    skills = CredentialCategoryEnum.skill,
    socialBadges = CredentialCategoryEnum.socialBadge,
    achievements = CredentialCategoryEnum.achievement,
    qualifications = CredentialCategoryEnum.qualifications,
    studies = CredentialCategoryEnum.learningHistory,
    portfolio = CredentialCategoryEnum.accomplishment,
    assistance = CredentialCategoryEnum.accommodation,
    experiences = CredentialCategoryEnum.workHistory,
    families = CredentialCategoryEnum.family,
    ids = CredentialCategoryEnum.id,

    // Feature-flagged routes (not backed by a credential category).
    // Pathways v2 — the new dynamic-pathways feature, gated by the
    // `features.pathways` tenant config + the `enableJourneys`
    // LaunchDarkly flag. Displays as "Journey" in the side menu while
    // the legacy `aiPathways` link still owns the "Pathways" label.
    pathways = 'pathways',

    // Returning-user home surface. Top-of-list above Passport — shows
    // a welcome header, last credential activity, and the learner's
    // current Pathway goal when one is active. See
    // `apps/learn-card-app/src/pages/dashboard/DashboardPage.tsx`.
    dashboard = 'dashboard',
}
