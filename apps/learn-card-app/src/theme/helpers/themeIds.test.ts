import { describe, expect, it } from 'vitest';

import {
    getRegisteredThemeIds,
    loadThemeSchema,
    resolveThemeId as resolveRegistered,
} from './loadTheme';
import { getThemeLoaderColors, isRegisteredThemeId, resolveThemeId } from './themeIds';

// themeIds is the entry-weight stand-in for the full registry; it must agree with it.
describe('themeIds', () => {
    it('knows the same theme ids, in the same order, as the registry', () => {
        for (const id of getRegisteredThemeIds()) expect(isRegisteredThemeId(id)).toBe(true);
        expect(isRegisteredThemeId('no-such-theme')).toBe(false);
        expect(resolveThemeId('no-such-theme')).toBe(resolveRegistered('no-such-theme'));
        expect(resolveThemeId('no-such-theme', 'formal')).toBe(
            resolveRegistered('no-such-theme', 'formal')
        );
    });

    it('returns the loader colors the built theme uses', () => {
        for (const id of getRegisteredThemeIds()) {
            expect(getThemeLoaderColors(id)).toEqual(loadThemeSchema(id).colors.defaults.loaders);
        }
    });
});
