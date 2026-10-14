// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

vi.mock('learn-card-base', async () => ({
    CredentialCategoryEnum: (await import('../../types/boostAndCredentialMetadata'))
        .CredentialCategoryEnum,
}));

import { CredentialCategoryEnum } from '../../types/boostAndCredentialMetadata';
import { DisplayTypeEnum } from '../display-types';
import { getDefaultDisplayType } from '../display.helpers';

describe('qualification display fallback', () => {
    it('renders an ordinary certification as a certificate without display metadata', () => {
        expect(getDefaultDisplayType(CredentialCategoryEnum.qualifications, 'Certification')).toBe(
            DisplayTypeEnum.Certificate
        );
    });

    it('preserves an explicit display hint over the category and achievement type', () => {
        expect(
            getDefaultDisplayType(
                CredentialCategoryEnum.qualifications,
                'Award',
                DisplayTypeEnum.Badge
            )
        ).toBe(DisplayTypeEnum.Badge);
    });

    it('preserves a recognized achievement display type over the category fallback', () => {
        expect(getDefaultDisplayType(CredentialCategoryEnum.qualifications, 'Award')).toBe(
            DisplayTypeEnum.Award
        );
    });
});
