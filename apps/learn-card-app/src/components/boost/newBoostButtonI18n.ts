import { CredentialCategoryEnum } from 'learn-card-base';

import { NEW_BOOST_LABEL_KEYS as K } from './newBoostLabelKeys';

/**
 * Localized "New X" label key per credential category, consumed by
 * `NewBoostButton` via a dynamic `m[labelKey]()` lookup. Categories not listed
 * fall back to `K.generic`. The plain key strings live in `newBoostLabelKeys.ts`
 * (no learn-card-base import) so the test can validate them.
 */
export const NEW_LABEL_KEYS: Record<string, string> = {
    [CredentialCategoryEnum.learningHistory]: K.learningHistory,
    [CredentialCategoryEnum.workHistory]: K.workHistory,
    [CredentialCategoryEnum.accommodation]: K.accommodation,
    [CredentialCategoryEnum.accomplishment]: K.accomplishment,
    [CredentialCategoryEnum.socialBadge]: K.socialBadge,
    [CredentialCategoryEnum.achievement]: K.achievement,
    [CredentialCategoryEnum.skill]: K.skill,
    [CredentialCategoryEnum.id]: K.id,
    [CredentialCategoryEnum.membership]: K.membership,
    [CredentialCategoryEnum.course]: K.course,
};
