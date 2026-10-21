vi.mock('learn-card-base', async () =>
    (await import('../../test-utils/mockLearnCardBase')).learnCardBaseEnumMock()
);

import { describe, it, expect, vi } from 'vitest';
import { CategoryIconsSchema } from './icons.validators';

const Comp = () => null;

/**
 * Zod strips keys that aren't declared on the schema. Every slot the icon
 * sets populate therefore has to be listed on `CategoryIconsSchema`, or it
 * silently becomes `undefined` at runtime after `validateThemeData` — the
 * failure mode that dropped `navbar.dashboard` in LC-1921.
 */
describe('CategoryIconsSchema', () => {
    it('preserves every icon slot the icon sets populate', () => {
        const parsed = CategoryIconsSchema.parse({
            Icon: Comp,
            IconWithShape: Comp,
            IconWithLightShape: Comp,
            IconSolid: Comp,
        });

        expect(Object.keys(parsed).sort()).toEqual([
            'Icon',
            'IconSolid',
            'IconWithLightShape',
            'IconWithShape',
        ]);
    });

    it('keeps IconSolid — the activity feed reads it (LC-1969)', () => {
        expect(CategoryIconsSchema.parse({ IconSolid: Comp }).IconSolid).toBe(Comp);
    });

    it('allows sets that omit IconSolid', () => {
        expect(CategoryIconsSchema.parse({ Icon: Comp }).IconSolid).toBeUndefined();
    });
});
