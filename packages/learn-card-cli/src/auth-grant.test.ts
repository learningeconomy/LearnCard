import { describe, expect, it } from 'vitest';
import { describeActAs, getGrantActAs, type AuthGrantWithActAs } from './auth-grant';

describe('getGrantActAs', () => {
    it('reads actAs off a grant', () => {
        const grant: AuthGrantWithActAs = { id: 'g1', actAs: 'sc-greenville,sc-north' };
        expect(getGrantActAs(grant)).toBe('sc-greenville,sc-north');
    });

    it('is undefined when the grant has no actAs', () => {
        expect(getGrantActAs({ id: 'g1' })).toBeUndefined();
    });
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
