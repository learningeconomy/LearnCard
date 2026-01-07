import { describe, it, expect } from 'vitest';

import { convertRegExpToNeo4j, convertObjectRegExpToNeo4j, buildWhereClause } from '@helpers/neo4j.helpers';

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

describe('buildWhereClause', () => {
    it('builds simple equality conditions', () => {
        const result = buildWhereClause('boost', { name: 'Test' });
        expect(result.whereClause).toBe('boost.name = $param_0');
        expect(result.params).toEqual({ param_0: 'Test' });
    });

    it('builds multiple AND conditions', () => {
        const result = buildWhereClause('boost', { name: 'Test', category: 'achievement' });
        expect(result.whereClause).toBe('boost.name = $param_0 AND boost.category = $param_1');
        expect(result.params).toEqual({ param_0: 'Test', param_1: 'achievement' });
    });

    it('handles $in operator', () => {
        const result = buildWhereClause('boost', { status: { $in: ['LIVE', 'DRAFT'] } });
        expect(result.whereClause).toBe('boost.status IN $param_0');
        expect(result.params).toEqual({ param_0: ['LIVE', 'DRAFT'] });
    });

    it('handles $regex operator', () => {
        const result = buildWhereClause('boost', { name: { $regex: '.*test.*' } });
        expect(result.whereClause).toBe('boost.name =~ $param_0');
        expect(result.params).toEqual({ param_0: '.*test.*' });
    });

    it('handles $or at document level', () => {
        const result = buildWhereClause('boost', { 
            $or: [
                { name: 'Test1' }, 
                { name: 'Test2' }
            ] 
        });
        expect(result.whereClause).toBe('(boost.name = $param_0 OR boost.name = $param_1)');
        expect(result.params).toEqual({ param_0: 'Test1', param_1: 'Test2' });
    });

    it('handles $or at field level', () => {
        const result = buildWhereClause('boost', { 
            name: { $or: ['Test1', 'Test2'] } 
        });
        expect(result.whereClause).toBe('(boost.name = $param_0 OR boost.name = $param_1)');
        expect(result.params).toEqual({ param_0: 'Test1', param_1: 'Test2' });
    });

    it('handles nested objects with dot notation (backtick-escaped for Neo4j)', () => {
        const result = buildWhereClause('boost', { 
            meta: { appListingId: 'listing-123' } 
        });
        expect(result.whereClause).toBe('boost.`meta.appListingId` = $param_0');
        expect(result.params).toEqual({ param_0: 'listing-123' });
    });

    it('handles multiple nested object fields', () => {
        const result = buildWhereClause('boost', { 
            meta: { appListingId: 'listing-123', integrationId: 'int-456' } 
        });
        expect(result.whereClause).toBe('(boost.`meta.appListingId` = $param_0 AND boost.`meta.integrationId` = $param_1)');
        expect(result.params).toEqual({ param_0: 'listing-123', param_1: 'int-456' });
    });

    it('handles deeply nested objects', () => {
        const result = buildWhereClause('boost', { 
            meta: { 
                config: { 
                    setting: 'value' 
                } 
            } 
        });
        expect(result.whereClause).toBe('boost.`meta.config.setting` = $param_0');
        expect(result.params).toEqual({ param_0: 'value' });
    });

    it('handles nested objects with operators', () => {
        const result = buildWhereClause('boost', { 
            meta: { 
                type: { $in: ['A', 'B'] } 
            } 
        });
        expect(result.whereClause).toBe('boost.`meta.type` IN $param_0');
        expect(result.params).toEqual({ param_0: ['A', 'B'] });
    });

    it('handles mixed top-level and nested conditions', () => {
        const result = buildWhereClause('boost', { 
            name: 'Test',
            meta: { appListingId: 'listing-123' } 
        });
        expect(result.whereClause).toBe('boost.name = $param_0 AND boost.`meta.appListingId` = $param_1');
        expect(result.params).toEqual({ param_0: 'Test', param_1: 'listing-123' });
    });

    it('returns true for empty query', () => {
        const result = buildWhereClause('boost', {});
        expect(result.whereClause).toBe('true');
        expect(result.params).toEqual({});
    });

    it('handles boolean values', () => {
        const result = buildWhereClause('boost', { autoConnectRecipients: true });
        expect(result.whereClause).toBe('boost.autoConnectRecipients = $param_0');
        expect(result.params).toEqual({ param_0: true });
    });

    it('handles numeric values', () => {
        const result = buildWhereClause('boost', { count: 42 });
        expect(result.whereClause).toBe('boost.count = $param_0');
        expect(result.params).toEqual({ param_0: 42 });
    });
});
