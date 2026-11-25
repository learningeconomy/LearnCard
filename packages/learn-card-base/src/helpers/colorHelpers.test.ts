import { describe, expect, it, vi } from 'vitest';

vi.mock('learn-card-base', () => ({ CredentialCategoryEnum: {} }));

import { tailwindColorWithOpacity } from './colorHelpers';

describe('tailwindColorWithOpacity', () => {
    it.each([
        'blue-400',
        'bg-blue-400',
        'bg-blue-400!',
        '!bg-blue-400',
        'hover:bg-blue-400!',
        'dark:hover:!bg-blue-400',
        'text-blue-400!',
        'border-blue-400!',
    ])('resolves the named token in %s', color => {
        expect(tailwindColorWithOpacity(color, 30)).toBe(
            'color-mix(in srgb, var(--color-blue-400) 30%, transparent)'
        );
    });

    it('handles the important white background in the category themes', () => {
        expect(tailwindColorWithOpacity('bg-white!', 30)).toBe(
            'color-mix(in srgb, var(--color-white) 30%, transparent)'
        );
    });

    it.each([undefined, '', 'bg-blue-400 bg-white', 'bg-[red]', 'bg-blue-400/50'])(
        'rejects unsupported input %s',
        color => expect(tailwindColorWithOpacity(color, 30)).toBeUndefined()
    );

    it('bounds the percentage and rejects non-finite opacity', () => {
        expect(tailwindColorWithOpacity('white', -10)).toContain(' 0%,');
        expect(tailwindColorWithOpacity('white', 120)).toContain(' 100%,');
        expect(tailwindColorWithOpacity('white', Number.NaN)).toBeUndefined();
    });
});
