import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('consumer className overrides after the Tailwind upgrade', () => {
    it('lets a consumer replace sibling spacing while preserving independent utilities', () => {
        expect(cn('p-4 space-y-v3-2', 'p-6 space-y-v3-4')).toBe('p-6 space-y-v3-4');
        expect(cn('space-y-2', 'space-y-v3-4')).toBe('space-y-v3-4');
    });

    it('merges negative, important and arbitrary spacing values', () => {
        expect(cn('space-x-v3-2', '-space-x-v3-4')).toBe('-space-x-v3-4');
        expect(cn('space-x-v3-2!', 'space-x-v3-[12px]!')).toBe('space-x-v3-[12px]!');
    });

    it('keeps responsive and reversal controls independent', () => {
        expect(cn('space-y-v3-2 space-y-v3-reverse', 'md:space-y-v3-4')).toBe(
            'space-y-v3-2 space-y-v3-reverse md:space-y-v3-4'
        );
    });
});
