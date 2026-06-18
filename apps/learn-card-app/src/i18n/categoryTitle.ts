/**
 * Localizes credential/boost category titles for display.
 *
 * The English category titles live in the shared `learn-card-base` metadata
 * (`boostCategoryMetadata` / `categoryMetadata` `.title`), which can't depend on
 * any app's catalog. App display surfaces (data-sharing chips, ConsentFlow
 * read/write rows, boost CMS header, …) call `localizeCategoryTitle(meta.title)`
 * to resolve the title through the app's Paraglide catalog.
 *
 * The main wallet categories already have vetted translations under
 * `wallet.categories.*`; this map reuses those and points the remaining titles
 * at the `category.*` namespace. Unmapped titles fall back to the English
 * string unchanged.
 */
import * as m from '../paraglide/messages.js';

/** English metadata title → Paraglide message key. */
const TITLE_TO_KEY: Record<string, string> = {
    // covered by the existing wallet.categories.* set
    Boosts: 'wallet.categories.socialBadges',
    Achievements: 'wallet.categories.achievements',
    Studies: 'wallet.categories.studies',
    Experiences: 'wallet.categories.experiences',
    Portfolio: 'wallet.categories.portfolio',
    Assistance: 'wallet.categories.assistance',
    IDs: 'wallet.categories.ids',
    Skills: 'wallet.categories.skills',
    Families: 'wallet.categories.families',
    'AI Insights': 'wallet.categories.aiInsights',
    'AI Sessions': 'wallet.categories.aiSessions',
    // category.* namespace
    'AI Summaries': 'category.aiSummaries',
    'AI Topics': 'category.aiTopics',
    'AI Assessments': 'category.aiAssessments',
    'Learning Pathways': 'category.learningPathways',
    Membership: 'category.membership',
    Resumes: 'category.resumes',
    Goals: 'category.goals',
    Events: 'category.events',
    'Verifiable Data': 'category.verifiableData',
    All: 'category.all',
    Course: 'category.course',
    Job: 'category.job',
    Currency: 'category.currency',
    Describe: 'category.describe',
    Relationship: 'category.relationship',
    'Professional Title': 'category.professionalTitle',
    'Role Experience': 'category.roleExperience',
    'Work Experience': 'category.workExperience',
    'Pay Rate': 'category.payRate',
    'Work Life Balance': 'category.workLifeBalance',
    'Job Stability': 'category.jobStability',
    'Self-Assigned Skills': 'category.selfAssignedSkills',
    'Merit Badge': 'category.meritBadge',
    Troop: 'category.troop',
    'Troop Leader ID': 'category.troopLeaderId',
    'Scout ID': 'category.scoutId',
    'Global Admin ID': 'category.globalAdminId',
    'National Network Admin ID': 'category.nationalNetworkAdminId',
};

export const localizeCategoryTitle = (title?: string | null): string => {
    if (!title) return title ?? '';
    const key = TITLE_TO_KEY[title];
    const fn = key ? (m as Record<string, unknown>)[key] : undefined;
    return typeof fn === 'function' ? (fn as () => string)() : title;
};

export default localizeCategoryTitle;
