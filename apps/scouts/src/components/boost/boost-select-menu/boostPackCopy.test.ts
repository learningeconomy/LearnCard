// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from 'vitest';

import { BoostCategoryOptionsEnum } from 'learn-card-base/types/boostAndCredentialMetadata';
import { setLocale } from '../../../paraglide/runtime.js';
import type { BadgePackOptionsEnum } from './badge-pack.helper';
import { getLocalizedBoostPackTypeTitle } from './boostPackCopy';

describe('localized Boost pack type titles', () => {
    beforeEach(() => {
        setLocale('en', { reload: false });
    });

    it('uses the active locale for pack titles interpolated into UI messages', () => {
        expect(
            getLocalizedBoostPackTypeTitle(
                'network' as BadgePackOptionsEnum,
                BoostCategoryOptionsEnum.socialBadge
            )
        ).toBe('Network');
        expect(
            getLocalizedBoostPackTypeTitle(
                'troop' as BadgePackOptionsEnum,
                BoostCategoryOptionsEnum.socialBadge
            )
        ).toBe('Troop');

        setLocale('ar', { reload: false });

        expect(
            getLocalizedBoostPackTypeTitle(
                'network' as BadgePackOptionsEnum,
                BoostCategoryOptionsEnum.socialBadge
            )
        ).toBe('الشبكة');
        expect(
            getLocalizedBoostPackTypeTitle(
                'troop' as BadgePackOptionsEnum,
                BoostCategoryOptionsEnum.socialBadge
            )
        ).toBe('فرقة');
        expect(getLocalizedBoostPackTypeTitle(undefined, BoostCategoryOptionsEnum.meritBadge)).toBe(
            'شارة'
        );
        expect(
            getLocalizedBoostPackTypeTitle(undefined, BoostCategoryOptionsEnum.socialBadge)
        ).toBe('تعزيز');
    });
});
