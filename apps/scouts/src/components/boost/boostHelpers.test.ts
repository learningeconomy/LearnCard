import { describe, expect, it } from 'vitest';

import { refreshLocalizedPresetFields } from './localizedPresetFields';

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

describe('refreshLocalizedPresetFields', () => {
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
