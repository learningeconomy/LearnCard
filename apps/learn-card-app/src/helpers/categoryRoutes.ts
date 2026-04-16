import { CredentialCategoryEnum } from 'learn-card-base';
import { CATEGORY_MAP } from 'learn-card-base/helpers/credentialHelpers';

/**
 * Maps credential category enum values to their wallet route paths.
 * Single source of truth — used by WalletPage and notification navigation.
 */
export const CATEGORY_TO_ROUTE: Partial<Record<CredentialCategoryEnum, string>> = {
    [CredentialCategoryEnum.aiTopic]: '/ai/topics',
    [CredentialCategoryEnum.aiPathway]: '/ai/pathways',
    [CredentialCategoryEnum.aiInsight]: '/ai/insights',
    [CredentialCategoryEnum.skill]: '/skills',
    [CredentialCategoryEnum.socialBadge]: '/socialBadges',
    [CredentialCategoryEnum.achievement]: '/achievements',
    [CredentialCategoryEnum.learningHistory]: '/learninghistory',
    [CredentialCategoryEnum.accomplishment]: '/accomplishments',
    [CredentialCategoryEnum.accommodation]: '/accommodations',
    [CredentialCategoryEnum.workHistory]: '/workhistory',
    [CredentialCategoryEnum.family]: '/families',
    [CredentialCategoryEnum.id]: '/ids',
    [CredentialCategoryEnum.membership]: '/memberships',
};

/** Reverse map: category display name (e.g. "Achievement") → route path */
const CATEGORY_DISPLAY_TO_ROUTE: Record<string, string> = Object.fromEntries(
    Object.entries(CATEGORY_TO_ROUTE).map(([enumKey, path]) => {
        // CredentialCategoryEnum values ARE the display names (e.g. "Achievement", "Social Badge")
        const displayName = enumKey as string;
        return [displayName, path];
    })
);

/**
 * Given an achievementType from a credential (e.g. "Badge", "ext:Job"),
 * returns the wallet route path (e.g. "/achievements", "/workhistory").
 * Returns undefined if the type can't be mapped.
 */
export const getCategoryRouteForAchievementType = (
    achievementType: string | undefined
): string | undefined => {
    if (!achievementType) return undefined;
    const categoryName = CATEGORY_MAP[achievementType];
    if (!categoryName) return undefined;
    return CATEGORY_DISPLAY_TO_ROUTE[categoryName];
};
