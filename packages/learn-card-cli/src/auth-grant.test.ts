import { describe, expect, it } from 'vitest';
import {
    describeActAs,
    getGrantActAs,
    normalizeActAs,
    type AuthGrantWithActAs,
} from './auth-grant';

describe('getGrantActAs', () => {
    it('reads actAs off a grant', () => {
        const grant: AuthGrantWithActAs = { id: 'g1', actAs: 'sc-greenville,sc-north' };
        expect(getGrantActAs(grant)).toBe('sc-greenville,sc-north');
    });

    it('is undefined when the grant has no actAs', () => {
        expect(getGrantActAs({ id: 'g1' })).toBeUndefined();
    });

    it.each([null, ''])(
        'coerces %j from the wire to undefined so it matches an absent spec value',
        value => {
            expect(getGrantActAs({ id: 'g1', actAs: value as unknown as string })).toBeUndefined();
        }
    );
});

describe('describeActAs', () => {
    it('renders a comma-separated list with spaces', () => {
        expect(describeActAs('sc-greenville,sc-north')).toBe('sc-greenville, sc-north');
    });

    it('renders "*" as any managed profile', () => {
        expect(describeActAs('*')).toBe('any managed profile');
    });

    it('renders undefined as no delegation', () => {
        expect(describeActAs(undefined)).toBe('no delegation');
    });
});

describe('normalizeActAs', () => {
    it('sorts, trims, and de-duplicates profile IDs', () => {
        expect(normalizeActAs(' sc-north , sc-greenville,sc-north ')).toBe(
            'sc-greenville,sc-north'
        );
    });

    it('keeps "*" and treats empty values as no delegation', () => {
        expect(normalizeActAs(' * ')).toBe('*');
        expect(normalizeActAs('')).toBeUndefined();
        expect(normalizeActAs(' , ')).toBeUndefined();
        expect(normalizeActAs(undefined)).toBeUndefined();
    });
});
