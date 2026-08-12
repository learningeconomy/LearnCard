import { describe, it, expect } from 'vitest';

import { maskEmail } from './maskEmail';

describe('maskEmail', () => {
    it('masks a typical email address', () => {
        expect(maskEmail('jackson@gmail.com')).toBe('j******@gmail.com');
    });

    it('masks a two-character local part', () => {
        expect(maskEmail('ab@example.org')).toBe('a*@example.org');
    });

    it('leaves a single-character local part unmasked', () => {
        expect(maskEmail('a@example.org')).toBe('a@example.org');
    });

    it('handles a long local part', () => {
        expect(maskEmail('verylongemail@test.com')).toBe('v************@test.com');
    });

    it('returns a placeholder for missing @ sign', () => {
        expect(maskEmail('noemail')).toBe('****@****');
    });

    it('returns a placeholder for empty string', () => {
        expect(maskEmail('')).toBe('****@****');
    });

    it('handles @ at position 0', () => {
        expect(maskEmail('@domain.com')).toBe('****@****');
    });
});
