import { describe, it, expect, vi } from 'vitest';

// learn-card-base's runtime barrel pulls in heavy UI deps that aren't resolvable
// under the app's vitest resolver. We only need CredentialCategoryEnum, so stub
// the barrel with the REAL enum re-exported from its source module.
vi.mock('learn-card-base', async () => {
    const mod = await import('learn-card-base/types/boostAndCredentialMetadata');
    return { CredentialCategoryEnum: mod.CredentialCategoryEnum };
});

import { CredentialCategoryEnum } from 'learn-card-base';
import { PASSPORT_CATEGORY_ORDER, filterPassportCategories } from './passportCategories';

type Cat = {
    categoryId: CredentialCategoryEnum;
    labels: { singular: string; plural: string };
};
const cat = (categoryId: CredentialCategoryEnum): Cat => ({
    categoryId,
    labels: { singular: String(categoryId), plural: String(categoryId) },
});

describe('PASSPORT_CATEGORY_ORDER', () => {
    it('contains exactly the 7 core categories in order', () => {
        expect(PASSPORT_CATEGORY_ORDER).toEqual([
            CredentialCategoryEnum.socialBadge,
            CredentialCategoryEnum.achievement,
            CredentialCategoryEnum.learningHistory,
            CredentialCategoryEnum.accomplishment,
            CredentialCategoryEnum.accommodation,
            CredentialCategoryEnum.workHistory,
            CredentialCategoryEnum.id,
        ]);
    });
});

describe('filterPassportCategories', () => {
    it('drops non-allow-listed categories (AI, skills, families)', () => {
        const input = [
            cat(CredentialCategoryEnum.aiTopic),
            cat(CredentialCategoryEnum.skill),
            cat(CredentialCategoryEnum.socialBadge),
            cat(CredentialCategoryEnum.family),
            cat(CredentialCategoryEnum.id),
        ];
        expect(filterPassportCategories(input).map(c => c.categoryId)).toEqual([
            CredentialCategoryEnum.socialBadge,
            CredentialCategoryEnum.id,
        ]);
    });
    it('orders results by PASSPORT_CATEGORY_ORDER regardless of input order', () => {
        const input = [
            cat(CredentialCategoryEnum.id),
            cat(CredentialCategoryEnum.achievement),
            cat(CredentialCategoryEnum.socialBadge),
        ];
        expect(filterPassportCategories(input).map(c => c.categoryId)).toEqual([
            CredentialCategoryEnum.socialBadge,
            CredentialCategoryEnum.achievement,
            CredentialCategoryEnum.id,
        ]);
    });
    it('ignores allow-listed categories that are absent from input', () => {
        expect(
            filterPassportCategories([cat(CredentialCategoryEnum.socialBadge)]).map(
                c => c.categoryId
            )
        ).toEqual([CredentialCategoryEnum.socialBadge]);
    });
});
