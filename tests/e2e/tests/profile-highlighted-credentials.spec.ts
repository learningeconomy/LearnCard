import { describe, test, expect } from 'vitest';
import { LCNProfileValidator } from '@learncard/types';
import { ZodError } from 'zod';

const baseProfile = (overrides: Record<string, any> = {}) => ({
    profileId: 'john-doe',
    did: 'did:example:123',
    ...overrides,
});

describe('LCNProfile.highlightedCredentials', () => {
    test('defaults to empty array when omitted', () => {
        const parsed = LCNProfileValidator.parse(baseProfile());
        expect(parsed.highlightedCredentials).toEqual([]);
    });

    test('allows up to 5 unique URIs', () => {
        const uris = ['boost:1', 'boost:2', 'boost:3', 'boost:4', 'boost:5'];
        const parsed = LCNProfileValidator.parse(baseProfile({ highlightedCredentials: uris }));
        expect(parsed.highlightedCredentials).toEqual(uris);
        expect(parsed.highlightedCredentials.length).toBe(5);
    });

    test('rejects more than 5 URIs', () => {
        const uris = ['boost:1', 'boost:2', 'boost:3', 'boost:4', 'boost:5', 'boost:6'];
        let err: unknown;
        try {
            LCNProfileValidator.parse(baseProfile({ highlightedCredentials: uris }));
        } catch (e) {
            err = e;
        }

        expect(err).toBeInstanceOf(ZodError);
        const issues = (err as ZodError).issues;
        expect(issues.some(i => i.code === 'too_big' && (i as any).maximum === 5)).toBe(true);
    });

    test('rejects duplicate URIs', () => {
        const uris = ['boost:1', 'boost:2', 'boost:1'];
        let err: unknown;
        try {
            LCNProfileValidator.parse(baseProfile({ highlightedCredentials: uris }));
        } catch (e) {
            err = e;
        }

        expect(err).toBeInstanceOf(ZodError);
        const issues = (err as ZodError).issues;
        expect(issues.some(i => i.message.includes('Duplicate URIs'))).toBe(true);
    });
});
