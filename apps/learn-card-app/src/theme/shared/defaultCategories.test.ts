import { describe, it, expect, vi } from 'vitest';

// Stub learn-card-base's unresolvable runtime barrel with the REAL enum.
// See test-utils/mockLearnCardBase for the why.
vi.mock('learn-card-base', async () =>
    (await import('../../test-utils/mockLearnCardBase')).learnCardBaseEnumMock()
);

import { CredentialCategoryEnum } from 'learn-card-base';
import { DEFAULT_CATEGORIES } from './defaultCategories';

const labelFor = (id: CredentialCategoryEnum) =>
    DEFAULT_CATEGORIES.find(c => c.categoryId === id)?.labels;

describe('DEFAULT_CATEGORIES Passport renames', () => {
    it('renames Boost -> Badge for socialBadge', () => {
        expect(labelFor(CredentialCategoryEnum.socialBadge)).toEqual({
            singular: 'Badge',
            plural: 'Badges',
        });
    });
    it('renames Study -> Course for learningHistory', () => {
        expect(labelFor(CredentialCategoryEnum.learningHistory)).toEqual({
            singular: 'Course',
            plural: 'Courses',
        });
    });
});
