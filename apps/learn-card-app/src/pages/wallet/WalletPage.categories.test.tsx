import { describe, it, expect, vi } from 'vitest';

// learn-card-base's runtime barrel pulls in heavy UI deps that aren't resolvable
// under the app's vitest resolver. We only need CredentialCategoryEnum, so stub
// the barrel with the REAL enum re-exported from its source module.
vi.mock('learn-card-base', async () => {
    const mod = await import('learn-card-base/types/boostAndCredentialMetadata');
    return { CredentialCategoryEnum: mod.CredentialCategoryEnum };
});

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
