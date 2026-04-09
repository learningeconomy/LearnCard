import { CredentialCategoryEnum } from 'learn-card-base';

import type { CategoryColor } from '../validators/colors.validators';

/**
 * Create a color table where every credential category shares the same base
 * colors, with optional per-category overrides.
 *
 * This eliminates the need to repeat identical color blocks for each of the
 * 12 credential categories (as formal currently does).
 *
 * @example
 * ```ts
 * const categoryColors = createUniformCategoryColors(
 *     { primaryColor: 'off-white-50', secondaryColor: 'grayscale-800' },
 *     { [CredentialCategoryEnum.achievement]: { tabActiveColor: 'bg-red-200' } },
 * );
 * ```
 */
export const createUniformCategoryColors = (
    base: CategoryColor,
    overrides?: Partial<Record<CredentialCategoryEnum, Partial<CategoryColor>>>,
): Record<CredentialCategoryEnum, CategoryColor> => {
    const table = {} as Record<CredentialCategoryEnum, CategoryColor>;

    for (const cat of Object.values(CredentialCategoryEnum)) {
        table[cat] = { ...base, ...overrides?.[cat] };
    }

    return table;
};
