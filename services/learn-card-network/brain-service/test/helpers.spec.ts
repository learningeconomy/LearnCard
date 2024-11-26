import { describe, it, expect } from 'vitest';

import { convertRegExpToNeo4j, convertObjectRegExpToNeo4j } from '@helpers/neo4j.helpers';

describe('convertRegExpToNeo4j', () => {
    it('converts basic RegExp without flags', () => {
        expect(convertRegExpToNeo4j(/test/)).toBe('.*test.*');
        expect(convertRegExpToNeo4j(/[a-z]+/)).toBe('.*[a-z]+.*');
        expect(convertRegExpToNeo4j(/\d{3}/)).toBe('.*\\d{3}.*');
    });

    it('handles case insensitive flag', () => {
        expect(convertRegExpToNeo4j(/test/i)).toBe('(?i).*test.*');
        expect(convertRegExpToNeo4j(/[A-Z]+/i)).toBe('(?i).*[A-Z]+.*');
    });

    it('avoids double wildcards', () => {
        expect(convertRegExpToNeo4j(/.*test/)).toBe('.*test.*');
        expect(convertRegExpToNeo4j(/test.*/)).toBe('.*test.*');
        expect(convertRegExpToNeo4j(/.*test.*/)).toBe('.*test.*');
    });

    it('handles RegExpValue objects', () => {
        expect(convertRegExpToNeo4j({ source: 'test', flags: '' })).toBe('.*test.*');
        expect(convertRegExpToNeo4j({ source: 'test', flags: 'i' })).toBe('(?i).*test.*');
        expect(convertRegExpToNeo4j({ source: '.*test.*', flags: 'i' })).toBe('(?i).*test.*');
    });

    it('preserves special regex characters', () => {
        expect(convertRegExpToNeo4j(/\b\w+\b/)).toBe('.*\\b\\w+\\b.*');
        expect(convertRegExpToNeo4j(/[^a-z]/i)).toBe('(?i).*[^a-z].*');
        expect(convertRegExpToNeo4j(/a{2,4}/)).toBe('.*a{2,4}.*');
    });

    it('handles empty patterns', () => {
        expect(convertRegExpToNeo4j(/(?:)/)).toBe('.*(?:).*');
        expect(convertRegExpToNeo4j({ source: '', flags: '' })).toBe('.*.*');
    });
});

describe('convertObjectRegExpToNeo4j', () => {
    it('converts top-level RegExp properties', () => {
        const input = {
            pattern1: /test/,
            pattern2: /test/i,
            normal: 'string',
        };
        expect(convertObjectRegExpToNeo4j(input)).toEqual({
            pattern1: '.*test.*',
            pattern2: '(?i).*test.*',
            normal: 'string',
        });
    });

    it('handles nested objects', () => {
        const input = {
            level1: {
                pattern: /test/i,
                level2: {
                    pattern: /nested/,
                    normal: 42,
                },
            },
            normal: true,
        };
        expect(convertObjectRegExpToNeo4j(input)).toEqual({
            level1: {
                pattern: '(?i).*test.*',
                level2: {
                    pattern: '.*nested.*',
                    normal: 42,
                },
            },
            normal: true,
        });
    });

    it('handles arrays of RegExp', () => {
        const input = {
            patterns: [/test/, /example/i],
            mixed: [/pattern/, 'string', 42],
        };
        expect(convertObjectRegExpToNeo4j(input)).toEqual({
            patterns: ['.*test.*', '(?i).*example.*'],
            mixed: ['.*pattern.*', 'string', 42],
        });
    });

    it('handles RegExpValue objects in nested structures', () => {
        const input = {
            pattern: { source: 'test', flags: 'i' },
            nested: {
                pattern: { source: '.*nested.*', flags: '' },
            },
        };
        expect(convertObjectRegExpToNeo4j(input)).toEqual({
            pattern: '(?i).*test.*',
            nested: {
                pattern: '.*nested.*',
            },
        });
    });

    it('preserves non-RegExp values', () => {
        const input = {
            string: 'normal string',
            number: 42,
            boolean: true,
            null: null,
            undefined: undefined,
            date: new Date('2024-01-01'),
        };
        expect(convertObjectRegExpToNeo4j(input)).toEqual(input);
    });

    it('handles edge cases', () => {
        const input = {
            empty: /(?:)/,
            onlyWildcards: /.*/,
            complexNested: {
                array: [
                    { source: '.*test.*', flags: 'i' },
                    /pattern/,
                    { nested: { source: 'deep', flags: '' } },
                ],
            },
        };
        expect(convertObjectRegExpToNeo4j(input)).toEqual({
            empty: '.*(?:).*',
            onlyWildcards: '.*',
            complexNested: {
                array: ['(?i).*test.*', '.*pattern.*', { nested: '.*deep.*' }],
            },
        });
    });
});
