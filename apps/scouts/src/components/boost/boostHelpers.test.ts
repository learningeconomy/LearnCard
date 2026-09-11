import { afterEach, describe, expect, it, vi } from 'vitest';

import { AchievementTypes } from 'learn-card-base/components/IssueVC/constants';
import { BoostCategoryOptionsEnum } from 'learn-card-base/types/boostAndCredentialMetadata';

import { setLocale } from '../../paraglide/runtime.js';
import { CATEGORY_TO_SUBCATEGORY_LIST } from './boost-options/boostOptions';
import {
    getDefaultBoostCriteria,
    getDefaultBoostDescription,
    getDefaultBoostTitle,
} from './boostHelpers';
import { getBoostPresetLocalization, refreshLocalizedPresetFields } from './localizedPresetFields';

vi.mock('../../paraglide/messages.js', async importOriginal => {
    const messages = await importOriginal<Record<string, unknown>>();

    return {
        ...messages,
        'boostContent.subcategories.socialBadge.notAPreset.description': () =>
            'Unregistered preset copy',
    };
});

const englishDefaults = {
    name: 'Archery',
    description: 'Learn the fundamentals of archery.',
    narrative: 'Complete the archery requirements.',
};

const spanishDefaults = {
    name: 'Tiro con arco',
    description: 'Aprende los fundamentos del tiro con arco.',
    narrative: 'Completa los requisitos de tiro con arco.',
};

afterEach(() => {
    setLocale('en', { reload: false });
});

describe('localized Boost preset defaults', () => {
    it('uses bundled images for every Merit Badge preset', () => {
        const externalImagePresets = CATEGORY_TO_SUBCATEGORY_LIST[
            BoostCategoryOptionsEnum.meritBadge
        ]
            .filter(preset => /^https?:\/\//.test(preset.image ?? ''))
            .map(preset => preset.type);

        expect(externalImagePresets).toEqual([]);
    });

    it('uses the active locale when no content locale override is provided', () => {
        setLocale('es', { reload: false });

        expect(
            getDefaultBoostTitle(BoostCategoryOptionsEnum.socialBadge, AchievementTypes.Adventurer)
        ).toBe('Aliado de la Aventura');
        expect(
            getDefaultBoostDescription(
                BoostCategoryOptionsEnum.socialBadge,
                AchievementTypes.Adventurer
            )
        ).toBe('¡Para el Scout que siempre está listo para una aventura!');
    });

    it('uses canonical English when the content locale override is English', () => {
        setLocale('es', { reload: false });

        expect(
            getDefaultBoostTitle(
                BoostCategoryOptionsEnum.socialBadge,
                AchievementTypes.Adventurer,
                { locale: 'en' }
            )
        ).toBe('Adventure Ally');
        expect(
            getDefaultBoostDescription(
                BoostCategoryOptionsEnum.socialBadge,
                AchievementTypes.Adventurer,
                { locale: 'en' }
            )
        ).toBe('For the Scout who is always up for an adventure!');
        expect(
            getDefaultBoostCriteria(BoostCategoryOptionsEnum.meritBadge, AchievementTypes.Archery, {
                locale: 'en',
            })
        ).toMatch(/^1\. Do the following:/);
    });

    it('resolves canonical English for every localized Social Boost and Merit Badge preset', () => {
        setLocale('en', { reload: false });

        const expectedPresets = [
            BoostCategoryOptionsEnum.socialBadge,
            BoostCategoryOptionsEnum.meritBadge,
        ].flatMap(category =>
            CATEGORY_TO_SUBCATEGORY_LIST[category].map(preset => ({
                category,
                type: preset.type,
                title: preset.presetTitle,
                description: preset.description,
                criteria: preset.criteria,
            }))
        );

        setLocale('es', { reload: false });

        for (const preset of expectedPresets) {
            expect(getDefaultBoostTitle(preset.category, preset.type, { locale: 'en' })).toBe(
                preset.title
            );
            expect(getDefaultBoostDescription(preset.category, preset.type, { locale: 'en' })).toBe(
                preset.description
            );
            expect(getDefaultBoostCriteria(preset.category, preset.type, { locale: 'en' })).toBe(
                preset.criteria
            );
        }
    });

    it('rejects catalog messages that are not registered Boost presets', () => {
        expect(
            getDefaultBoostDescription(BoostCategoryOptionsEnum.socialBadge, 'ext:NotAPreset', {
                locale: 'en',
            })
        ).toBe('');
    });
});

describe('Boost preset localization rollout policy', () => {
    it('uses canonical English when the LaunchDarkly flag is missing or disabled', () => {
        expect(getBoostPresetLocalization(undefined)).toEqual({
            enabled: false,
            contentOptions: { locale: 'en' },
        });
        expect(getBoostPresetLocalization(false)).toEqual({
            enabled: false,
            contentOptions: { locale: 'en' },
        });
    });

    it('uses the active locale only when the LaunchDarkly flag is enabled', () => {
        expect(getBoostPresetLocalization(true)).toEqual({
            enabled: true,
            contentOptions: {},
        });
    });
});

describe('refreshLocalizedPresetFields', () => {
    it('preserves preset fields when localized template content is disabled', () => {
        const current = { ...englishDefaults };

        expect(refreshLocalizedPresetFields(current, englishDefaults, spanishDefaults, false)).toBe(
            current
        );
    });

    it('refreshes untouched preset fields in the next locale', () => {
        expect(
            refreshLocalizedPresetFields(englishDefaults, englishDefaults, spanishDefaults)
        ).toEqual(spanishDefaults);
    });

    it('preserves fields the user edited while refreshing untouched fields', () => {
        const current = {
            ...englishDefaults,
            description: 'My custom description',
        };

        expect(refreshLocalizedPresetFields(current, englishDefaults, spanishDefaults)).toEqual({
            ...spanishDefaults,
            description: 'My custom description',
        });
    });

    it('preserves the current object when the localized defaults did not change', () => {
        const current = { ...englishDefaults };

        expect(refreshLocalizedPresetFields(current, englishDefaults, englishDefaults)).toBe(
            current
        );
    });
});
