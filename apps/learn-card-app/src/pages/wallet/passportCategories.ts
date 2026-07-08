import { CredentialCategoryEnum } from 'learn-card-base';

/**
 * The single source of truth for the LC-1919 Passport reorg.
 *
 * Exactly the 7 core credential categories the Passport page renders, in the
 * fixed display order. Any category not in this list (AI Sessions/Pathways/
 * Insights, Skills, Families, etc.) is intentionally excluded from the Passport.
 */
export const PASSPORT_CATEGORY_ORDER: CredentialCategoryEnum[] = [
    CredentialCategoryEnum.socialBadge,
    CredentialCategoryEnum.achievement,
    CredentialCategoryEnum.learningHistory,
    CredentialCategoryEnum.accomplishment,
    CredentialCategoryEnum.accommodation,
    CredentialCategoryEnum.workHistory,
    CredentialCategoryEnum.id,
];

const ORDER_INDEX = new Map(PASSPORT_CATEGORY_ORDER.map((id, i) => [id, i]));

/**
 * Filters an arbitrary list of theme categories down to the allow-listed
 * Passport categories, sorted into PASSPORT_CATEGORY_ORDER. Input order is
 * ignored; absent allow-listed categories are simply skipped.
 */
export const filterPassportCategories = <T extends { categoryId: CredentialCategoryEnum }>(
    categories: T[]
): T[] =>
    categories
        .filter(c => ORDER_INDEX.has(c.categoryId))
        .sort((a, b) => ORDER_INDEX.get(a.categoryId)! - ORDER_INDEX.get(b.categoryId)!);
