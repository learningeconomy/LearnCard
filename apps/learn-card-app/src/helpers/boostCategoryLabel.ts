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
