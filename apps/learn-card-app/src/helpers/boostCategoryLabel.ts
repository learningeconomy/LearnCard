import * as m from '../paraglide/messages.js';
import { BoostCategoryOptionsEnum, boostCategoryMetadata } from 'learn-card-base';

/**
 * Maps each boost category to the SAME wallet-catalog label the wallet uses
 * (`wallet.categories.*`), so every boost category selector/header stays in
 * sync with the wallet sections. `all` has no wallet equivalent, so it reuses
 * the generic `launchpad.tabs.all`.
 *
 * These are message-function REFERENCES (captured at module load), not
 * invocations — the locale is resolved when `getBoostCategoryLabel` CALLS them
 * inside render, so there is no module-load locale freeze.
 */
const CATEGORY_LABEL_FNS: Partial<Record<BoostCategoryOptionsEnum, () => string>> = {
    [BoostCategoryOptionsEnum.all]: m['launchpad.tabs.all'],
    [BoostCategoryOptionsEnum.socialBadge]: m['wallet.categories.socialBadges'],
    [BoostCategoryOptionsEnum.achievement]: m['wallet.categories.achievements'],
    [BoostCategoryOptionsEnum.id]: m['wallet.categories.ids'],
    [BoostCategoryOptionsEnum.workHistory]: m['wallet.categories.experiences'],
    [BoostCategoryOptionsEnum.course]: m['wallet.categories.studies'],
    [BoostCategoryOptionsEnum.learningHistory]: m['wallet.categories.studies'],
    [BoostCategoryOptionsEnum.family]: m['wallet.categories.families'],
    [BoostCategoryOptionsEnum.accomplishment]: m['wallet.categories.portfolio'],
    [BoostCategoryOptionsEnum.accommodation]: m['wallet.categories.assistance'],
    [BoostCategoryOptionsEnum.skill]: m['wallet.categories.skills'],
};

/**
 * Returns the localized label for a boost category, resolved at call time.
 * Falls back to the caller-supplied label, then to the static English
 * `boostCategoryMetadata` title, so unmapped categories never render blank.
 */
export const getBoostCategoryLabel = (
    category: BoostCategoryOptionsEnum,
    fallback?: string
): string =>
    CATEGORY_LABEL_FNS[category]?.() ?? fallback ?? boostCategoryMetadata[category]?.title ?? '';

/**
 * Card title banners render a free-form "display type" string that, for the
 * category-level fallback, equals a `boostCategoryMetadata.title` (plural, e.g.
 * "Achievements") or an SDK category enum value (singular, e.g. "Achievement").
 * This maps those CATEGORY-level English labels to the shared wallet catalog so
 * the banner matches the translated wallet sections.
 *
 * Achievement SUBTYPES ("Online Badge", "Degree", …) are intentionally NOT
 * mapped — they pass through as-is until they get their own localization pass.
 * References (not invocations) so the locale resolves at call time.
 */
const DISPLAY_LABEL_FNS: Record<string, () => string> = {
    // Plural — boostCategoryMetadata.title / wallet.categories.*
    Boosts: m['wallet.categories.socialBadges'],
    Achievements: m['wallet.categories.achievements'],
    Studies: m['wallet.categories.studies'],
    Experiences: m['wallet.categories.experiences'],
    Portfolio: m['wallet.categories.portfolio'],
    Assistance: m['wallet.categories.assistance'],
    Families: m['wallet.categories.families'],
    IDs: m['wallet.categories.ids'],
    Skills: m['wallet.categories.skills'],
    'AI Sessions': m['wallet.categories.aiSessions'],
    'AI Pathways': m['wallet.categories.aiPathways'],
    'AI Insights': m['wallet.categories.aiInsights'],
    // Singular — SDK category enum values / wallet.categoriesSingular.*
    Boost: m['wallet.categoriesSingular.socialBadges'],
    Achievement: m['wallet.categoriesSingular.achievements'],
    Study: m['wallet.categoriesSingular.studies'],
    Experience: m['wallet.categoriesSingular.experiences'],
    Family: m['wallet.categoriesSingular.families'],
    ID: m['wallet.categoriesSingular.ids'],
    Skill: m['wallet.categoriesSingular.skills'],
    'AI Session': m['wallet.categoriesSingular.aiSessions'],
    'AI Pathway': m['wallet.categoriesSingular.aiPathways'],
    'AI Insight': m['wallet.categoriesSingular.aiInsights'],
};

/**
 * Localizes a category-level card banner label, resolved at call time. Unknown
 * strings (achievement subtypes, custom types) pass through unchanged.
 */
export const getLocalizedCategoryDisplayLabel = (text?: string): string => {
    if (!text) return '';
    return DISPLAY_LABEL_FNS[text]?.() ?? text;
};
