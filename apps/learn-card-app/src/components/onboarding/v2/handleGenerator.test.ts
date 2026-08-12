import { afterEach, describe, expect, it, vi } from 'vitest';

import { generateHandle, generateRandomSuffix } from './handleGenerator';

describe('generateHandle', () => {
    it('slugifies a name to lowercase with dashes', () => {
        expect(generateHandle('Josiah Sampson')).toBe('josiah-sampson');
    });

    it('folds accented characters to ASCII', () => {
        expect(generateHandle('Tobias Müller')).toBe('tobias-muller');
    });

    it('collapses runs of separators and trims leading/trailing dashes', () => {
        expect(generateHandle('  John   O’Brien!! ')).toBe('john-o-brien');
    });

    it('returns an empty string for empty input', () => {
        expect(generateHandle('')).toBe('');
    });

    it('caps length at 20 characters with no trailing dash', () => {
        const result = generateHandle('Alexander Maximilian Montgomery');
        expect(result.length).toBeLessThanOrEqual(20);
        expect(result.endsWith('-')).toBe(false);
    });
});

describe('generateRandomSuffix', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns a 4-character alphanumeric string', () => {
        for (let i = 0; i < 25; i++) {
            expect(generateRandomSuffix()).toMatch(/^[a-z0-9]{4}$/);
        }
    });

    it('is exactly 4 characters at the low boundary (Math.random() === 0)', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0);
        expect(generateRandomSuffix()).toBe('0000');
    });

    it('is exactly 4 characters at the high boundary', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.9999999999);
        expect(generateRandomSuffix()).toMatch(/^[a-z0-9]{4}$/);
    });
});
