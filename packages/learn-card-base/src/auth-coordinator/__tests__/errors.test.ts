import { describe, expect, it } from 'vitest';

import { isSameEscrowPinError, SameEscrowPinError } from '../errors';

describe('isSameEscrowPinError', () => {
    it('matches the class and, by name, a copy from another bundle', () => {
        expect(isSameEscrowPinError(new SameEscrowPinError())).toBe(true);
        const copy = new Error('Choose a different PIN from the one you just used.');
        copy.name = 'SameEscrowPinError';
        expect(isSameEscrowPinError(copy)).toBe(true);
    });

    it('rejects other errors and non-errors', () => {
        expect(isSameEscrowPinError(new Error('PIN must contain 6–12 digits.'))).toBe(false);
        expect(isSameEscrowPinError({ name: 'SameEscrowPinError' })).toBe(false);
        expect(isSameEscrowPinError(undefined)).toBe(false);
    });
});
