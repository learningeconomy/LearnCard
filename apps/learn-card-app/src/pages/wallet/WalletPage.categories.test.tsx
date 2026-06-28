import { describe, it, expect, vi } from 'vitest';

// Stub learn-card-base's unresolvable runtime barrel with the REAL enum.
// See test-utils/mockLearnCardBase for the why.
vi.mock('learn-card-base', async () =>
    (await import('../../test-utils/mockLearnCardBase')).learnCardBaseEnumMock()
);

import { CredentialCategoryEnum } from 'learn-card-base';
import { filterPassportCategories } from './passportCategories';

describe('WalletPage category contract', () => {
    it('renders exactly the 7 Passport categories from a full theme list', () => {
        const fullTheme = [
            CredentialCategoryEnum.aiTopic,
            CredentialCategoryEnum.aiPathway,
            CredentialCategoryEnum.aiInsight,
            CredentialCategoryEnum.skill,
            CredentialCategoryEnum.socialBadge,
            CredentialCategoryEnum.achievement,
            CredentialCategoryEnum.learningHistory,
            CredentialCategoryEnum.accomplishment,
            CredentialCategoryEnum.accommodation,
            CredentialCategoryEnum.workHistory,
            CredentialCategoryEnum.family,
            CredentialCategoryEnum.id,
        ].map(categoryId => ({ categoryId, labels: { singular: 'x', plural: 'x' } }));
        const visible = filterPassportCategories(fullTheme).map(c => c.categoryId);
        expect(visible).toEqual([
            CredentialCategoryEnum.socialBadge,
            CredentialCategoryEnum.achievement,
            CredentialCategoryEnum.learningHistory,
            CredentialCategoryEnum.accomplishment,
            CredentialCategoryEnum.accommodation,
            CredentialCategoryEnum.workHistory,
            CredentialCategoryEnum.id,
        ]);
        expect(visible).toHaveLength(7);
    });
});
