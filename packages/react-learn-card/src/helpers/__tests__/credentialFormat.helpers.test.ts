import { humanizeClaimLabel, formatClaimValue } from '../credentialFormat.helpers';

describe('credentialFormat.helpers', () => {
    describe('humanizeClaimLabel', () => {
        it('handles snake_case', () => {
            expect(humanizeClaimLabel('given_name')).toBe('Given Name');
            expect(humanizeClaimLabel('date_of_birth')).toBe('Date Of Birth');
        });

        it('handles camelCase', () => {
            expect(humanizeClaimLabel('givenName')).toBe('Given Name');
            expect(humanizeClaimLabel('dateOfBirth')).toBe('Date Of Birth');
        });

        it('handles kebab-case', () => {
            expect(humanizeClaimLabel('given-name')).toBe('Given Name');
            expect(humanizeClaimLabel('date-of-birth')).toBe('Date Of Birth');
        });

        it('preserves all-caps acronyms', () => {
            expect(humanizeClaimLabel('SSN')).toBe('SSN');
            expect(humanizeClaimLabel('ID')).toBe('ID');
        });

        it('handles empty string', () => {
            expect(humanizeClaimLabel('')).toBe('');
        });
    });

    describe('formatClaimValue', () => {
        it('handles null and undefined', () => {
            expect(formatClaimValue(null)).toBe('');
            expect(formatClaimValue(undefined)).toBe('');
        });

        it('handles booleans', () => {
            expect(formatClaimValue(true)).toBe('Yes');
            expect(formatClaimValue(false)).toBe('No');
        });

        it('handles strings', () => {
            expect(formatClaimValue('hello')).toBe('hello');
        });

        it('handles full ISO date-time in long form', () => {
            const dateStr = '2023-10-25T12:00:00Z';
            const expected = new Date(dateStr).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
            expect(formatClaimValue(dateStr)).toBe(expected);
        });

        it('handles date-only strings without timezone drift', () => {
            const expected = new Date(Date.UTC(1990, 0, 1)).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'UTC',
            });
            expect(formatClaimValue('1990-01-01')).toBe(expected);
        });

        it('handles ancient date-only strings (no TZ rollback)', () => {
            const expected = new Date(Date.UTC(1815, 11, 10)).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'UTC',
            });
            expect(formatClaimValue('1815-12-10')).toBe(expected);
        });

        it('handles numbers', () => {
            expect(formatClaimValue(42)).toBe('42');
            expect(formatClaimValue(3.14)).toBe('3.14');
        });

        it('handles arrays of primitives as comma-separated list', () => {
            expect(formatClaimValue([1, 2, 3])).toBe('1, 2, 3');
            expect(formatClaimValue(['a', 'b'])).toBe('a, b');
        });

        it('handles arrays of objects with friendly count', () => {
            expect(formatClaimValue([{ a: 1 }, { b: 2 }])).toBe('2 items');
            expect(formatClaimValue([{ a: 1 }])).toBe('1 item');
        });

        it('handles nested objects with humanized inline labels', () => {
            expect(formatClaimValue({ given_name: 'Ada', family_name: 'Lovelace' })).toBe(
                'Given Name: Ada; Family Name: Lovelace'
            );
        });

        it('handles empty object', () => {
            expect(formatClaimValue({})).toBe('');
        });
    });
});
