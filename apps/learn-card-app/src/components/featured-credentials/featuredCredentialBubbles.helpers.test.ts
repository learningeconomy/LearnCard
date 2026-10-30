import { describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';

vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    unwrapBoostCredential: (credential: VC & { boostCredential?: VC }) =>
        credential.boostCredential ?? credential,
    getDefaultCategoryForCredential: (credential: VC & { category?: string }) =>
        credential.category,
    getCredentialName: (credential: VC) => credential.name ?? '',
    getImageUrlFromCredential: (credential: VC) => credential.image,
}));

import {
    boostCategoryMetadata,
    BoostCategoryOptionsEnum,
} from 'learn-card-base/types/boostAndCredentialMetadata';

import {
    getFeaturedCredentialDisplay,
    selectFeaturedCredentialUris,
} from './featuredCredentialBubbles.helpers';

describe('selectFeaturedCredentialUris', () => {
    it('returns nothing for a profile without a selection', () => {
        expect(selectFeaturedCredentialUris(undefined)).toEqual([]);
        expect(selectFeaturedCredentialUris([])).toEqual([]);
    });

    it('keeps the stored order while dropping blanks and repeats', () => {
        expect(
            selectFeaturedCredentialUris([
                'lc:boost:third',
                '',
                'lc:boost:first',
                undefined,
                'lc:boost:third',
                'lc:boost:second',
            ])
        ).toEqual(['lc:boost:third', 'lc:boost:first', 'lc:boost:second']);
    });
});

describe('getFeaturedCredentialDisplay', () => {
    it('reads the title and image from the unwrapped boost credential', () => {
        const credential = {
            category: BoostCategoryOptionsEnum.socialBadge,
            boostCredential: { name: 'Team Player', image: 'https://example.test/team.png' },
        } as unknown as VC;

        const display = getFeaturedCredentialDisplay(credential);

        expect(display.title).toBe('Team Player');
        expect(display.imageUrl).toBe('https://example.test/team.png');
        expect(display.categoryType).toBe(BoostCategoryOptionsEnum.socialBadge);
        expect(display.FallbackIcon).toBe(
            boostCategoryMetadata[BoostCategoryOptionsEnum.socialBadge].IconWithShape
        );
    });

    it('prefers an image carried by the resolved credential wrapper', () => {
        const credential = {
            category: BoostCategoryOptionsEnum.socialBadge,
            image: 'https://example.test/issued-badge.png',
            boostCredential: { name: 'Team Player', image: 'https://example.test/template.png' },
        } as unknown as VC;

        expect(getFeaturedCredentialDisplay(credential).imageUrl).toBe(
            'https://example.test/issued-badge.png'
        );
    });

    it('falls back to the achievement category when the credential category is unknown', () => {
        const credential = { name: 'Mystery', image: '' } as unknown as VC;

        const display = getFeaturedCredentialDisplay(credential);

        expect(display.imageUrl).toBeUndefined();
        expect(display.categoryType).toBe(BoostCategoryOptionsEnum.achievement);
        expect(display.FallbackIcon).toBe(
            boostCategoryMetadata[BoostCategoryOptionsEnum.achievement].IconWithShape
        );
    });
});
