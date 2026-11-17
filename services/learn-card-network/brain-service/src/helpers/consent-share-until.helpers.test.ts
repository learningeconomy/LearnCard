import { describe, expect, it } from 'vitest';

import {
    computeNextShareUntil,
    computeNextShareUntilFromProperties,
    shareUntilEntriesOfProperties,
} from './consent-share-until.helpers';

const NOW = Date.parse('2030-01-01T00:00:00.000Z');

const termsWith = (
    categories: Record<string, { sharing?: boolean; shareUntil?: unknown }>,
    sharing?: boolean
) => ({ read: { credentials: { ...(sharing === undefined ? {} : { sharing }), categories } } });

describe('computeNextShareUntil', () => {
    it('picks the earliest future date among shared categories', () => {
        const terms = termsWith({
            A: { sharing: true, shareUntil: '2030-03-01T00:00:00.000Z' },
            B: { sharing: true, shareUntil: '2030-02-01T00:00:00.000Z' },
            C: { sharing: true },
        });

        expect(computeNextShareUntil(terms, NOW)).toBe('2030-02-01T00:00:00.000Z');
    });

    it('ignores categories that are not being shared', () => {
        const terms = termsWith({
            A: { sharing: false, shareUntil: '2030-02-01T00:00:00.000Z' },
            B: { shareUntil: '2030-02-02T00:00:00.000Z' },
            C: { sharing: true, shareUntil: '2030-04-01T00:00:00.000Z' },
        });

        expect(computeNextShareUntil(terms, NOW)).toBe('2030-04-01T00:00:00.000Z');
    });

    it('ignores everything when credential sharing is switched off', () => {
        const terms = termsWith(
            { A: { sharing: true, shareUntil: '2030-02-01T00:00:00.000Z' } },
            false
        );

        expect(computeNextShareUntil(terms, NOW)).toBeNull();
    });

    it('ignores dates that have passed, including exactly now', () => {
        const terms = termsWith({
            A: { sharing: true, shareUntil: '2029-12-31T00:00:00.000Z' },
            B: { sharing: true, shareUntil: '2030-01-01T00:00:00.000Z' },
        });

        expect(computeNextShareUntil(terms, NOW)).toBeNull();
    });

    it('ignores empty and invalid dates', () => {
        const terms = termsWith({
            A: { sharing: true, shareUntil: '' },
            B: { sharing: true, shareUntil: 'not a date' },
            C: { sharing: true, shareUntil: 42 },
            D: { sharing: true, shareUntil: '2030-06-01T00:00:00Z' },
        });

        expect(computeNextShareUntil(terms, NOW)).toBe('2030-06-01T00:00:00.000Z');
    });

    it('normalizes offsets to UTC', () => {
        const terms = termsWith({ A: { sharing: true, shareUntil: '2030-06-01T02:00:00+02:00' } });

        expect(computeNextShareUntil(terms, NOW)).toBe('2030-06-01T00:00:00.000Z');
    });

    it('returns null without dates or for malformed terms', () => {
        expect(computeNextShareUntil(termsWith({ A: { sharing: true } }), NOW)).toBeNull();
        expect(computeNextShareUntil({}, NOW)).toBeNull();
        expect(computeNextShareUntil(undefined, NOW)).toBeNull();
        expect(
            computeNextShareUntil({ read: { credentials: { categories: [] } } }, NOW)
        ).toBeNull();
    });
});

describe('flattened properties', () => {
    const properties = {
        'terms.read.credentials.categories.A.sharing': true,
        'terms.read.credentials.categories.A.shareUntil': '2030-02-01T00:00:00.000Z',
        'terms.read.credentials.categories.B.sharing': true,
        'terms.read.credentials.categories.B.shareUntil': '2029-02-01T00:00:00.000Z',
        'terms.read.credentials.categories.C.sharing': false,
        'terms.read.credentials.categories.C.shareUntil': '2030-01-15T00:00:00.000Z',
        'terms.read.credentials.categories.D.shareUntil': '2030-01-16T00:00:00.000Z',
    };

    it('reads the same entries as the nested form', () => {
        expect(shareUntilEntriesOfProperties(properties).map(entry => entry.category)).toEqual([
            'A',
            'B',
        ]);
        expect(computeNextShareUntilFromProperties(properties, NOW)).toBe(
            '2030-02-01T00:00:00.000Z'
        );
    });

    it('handles category names that contain dots', () => {
        const dotted = {
            'terms.read.credentials.categories.Skills.v2.sharing': true,
            'terms.read.credentials.categories.Skills.v2.shareUntil': '2030-05-01T00:00:00.000Z',
        };

        expect(shareUntilEntriesOfProperties(dotted)[0]?.category).toBe('Skills.v2');
    });

    it('returns nothing when credential sharing is switched off', () => {
        expect(
            computeNextShareUntilFromProperties(
                { ...properties, 'terms.read.credentials.sharing': false },
                NOW
            )
        ).toBeNull();
    });
});
