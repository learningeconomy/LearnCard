import { describe, it, expect, vi } from 'vitest';

// learn-card-base's runtime barrel (src/index.ts) pulls in heavy UI components
// (e.g. BecomeTrustedIssuerForm -> @typeform/embed-react, which isn't resolvable
// under the app's vitest resolver). We only need CredentialCategoryEnum, so we
// stub the barrel with the REAL enum re-exported from its source module. This
// keeps the provided test/SUT imports (`from 'learn-card-base'`) intact while
// avoiding the unresolvable barrel.
vi.mock('learn-card-base', async () => {
    const mod = await import('learn-card-base/types/boostAndCredentialMetadata');
    return { CredentialCategoryEnum: mod.CredentialCategoryEnum };
});

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
