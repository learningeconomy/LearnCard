import { describe, expect, it } from 'vitest';
import { getScoutPassSubheaderDisplayCopy } from './scoutPassSubheaderCopy';

describe('ScoutPass subheader copy', () => {
    it('keeps an unmapped ScoutPass subheader title and helper copy', () => {
        const fallback = {
            title: 'Currencies',
            helperText: undefined,
            helperTextClickable: undefined,
        };

        expect(
            getScoutPassSubheaderDisplayCopy({
                isScoutPass: true,
                subheaderType: 'currency',
                count: 4,
                fallback,
                categoryCopy: {
                    titleOne: 'Social Boost',
                    titleOther: 'Social Boosts',
                    helperPrefix: 'Showcase your',
                    helperAction: 'social milestones',
                    descriptor: 'Localized social category description',
                },
            })
        ).toEqual(fallback);
    });
});
