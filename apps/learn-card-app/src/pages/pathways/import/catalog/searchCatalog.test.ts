/**
 * Unit tests for the pure `searchCatalog` / `collectTags` helpers.
 *
 * Uses synthetic fixtures rather than the shipped `CATALOG` so the
 * tests stay stable across editorial changes to the real data. The
 * integrity of the real catalog (every entry has a valid-looking CTID,
 * non-empty name, etc.) is covered separately in `catalog.test.ts`.
 */

import { describe, expect, it } from 'vitest';

import { collectTags, searchCatalog } from './searchCatalog';
import type { CatalogEntry } from './types';

const make = (overrides: Partial<CatalogEntry>): CatalogEntry => ({
    ctid: 'ce-00000000-0000-0000-0000-000000000000',
    name: 'Unnamed',
    description: '',
    issuer: 'Unknown',
    credentialType: 'Certificate',
    tags: [],
    ...overrides,
});

const FIXTURES: CatalogEntry[] = [
    make({
        ctid: 'ce-aaa',
        name: 'AI in Finance Micro-credential',
        description: 'Four badges culminating in an AI certificate.',
        issuer: 'IMA',
        credentialType: 'Micro-credential',
        tags: ['AI', 'Finance'],
        featured: true,
    }),
    make({
        ctid: 'ce-bbb',
        name: 'Cybersecurity Fundamentals',
        description: 'Foundational cybersecurity skills for SOC analysts.',
        issuer: 'SANS',
        credentialType: 'Certificate',
        tags: ['Cybersecurity', 'Professional'],
    }),
    make({
        ctid: 'ce-ccc',
        name: 'Healthcare Data Analytics',
        description: 'Analyzing clinical datasets at scale.',
        issuer: 'University Hospital',
        credentialType: 'Badge',
        tags: ['Healthcare', 'Analytics'],
        featured: true,
    }),
    make({
        ctid: 'ce-ddd',
        name: 'Introduction to AI Ethics',
        description: 'Ethical considerations in AI system design.',
        issuer: 'Open University',
        credentialType: 'Badge',
        tags: ['AI', 'Ethics'],
    }),
];

describe('searchCatalog — empty query', () => {
    it('returns every entry when no filters are applied', () => {
        const results = searchCatalog(FIXTURES);

        expect(results).toHaveLength(4);
    });

    it('orders featured entries first, then alphabetical by name', () => {
        // The featured-first rule makes browsing predictable — a
        // learner landing on the view sees the "start here" picks at
        // the top without any query required.
        const results = searchCatalog(FIXTURES);

        expect(results.map(r => r.name)).toEqual([
            'AI in Finance Micro-credential', // featured, A first
            'Healthcare Data Analytics', // featured
            'Cybersecurity Fundamentals', // non-featured, alphabetical
            'Introduction to AI Ethics',
        ]);
    });

    it('does not mutate the input array', () => {
        const snapshot = [...FIXTURES];

        searchCatalog(FIXTURES);

        expect(FIXTURES).toEqual(snapshot);
    });
});

describe('searchCatalog — free-text query', () => {
    it('matches name (case-insensitive)', () => {
        const results = searchCatalog(FIXTURES, { query: 'FINANCE' });

        expect(results.map(r => r.ctid)).toEqual(['ce-aaa']);
    });

    it('matches description', () => {
        const results = searchCatalog(FIXTURES, { query: 'soc analyst' });

        expect(results.map(r => r.ctid)).toEqual(['ce-bbb']);
    });

    it('matches issuer', () => {
        const results = searchCatalog(FIXTURES, { query: 'ima' });

        expect(results.map(r => r.ctid)).toEqual(['ce-aaa']);
    });

    it('matches tag', () => {
        const results = searchCatalog(FIXTURES, { query: 'ethics' });

        expect(results.map(r => r.ctid)).toEqual(['ce-ddd']);
    });

    it('AND-joins multiple whitespace-separated terms', () => {
        // "ai finance" should match the IMA entry (AI + Finance tags
        // in combination), not the AI Ethics entry (no Finance term).
        const results = searchCatalog(FIXTURES, { query: 'ai finance' });

        expect(results.map(r => r.ctid)).toEqual(['ce-aaa']);
    });

    it('handles words appearing out of order across fields', () => {
        // "finance ai" (reversed) still matches since we AND each
        // term against the concatenated haystack.
        const results = searchCatalog(FIXTURES, { query: 'finance ai' });

        expect(results.map(r => r.ctid)).toEqual(['ce-aaa']);
    });

    it('treats extra whitespace as a single separator', () => {
        const results = searchCatalog(FIXTURES, { query: '  ai   finance  ' });

        expect(results.map(r => r.ctid)).toEqual(['ce-aaa']);
    });

    it('returns an empty array when no entry matches all terms', () => {
        const results = searchCatalog(FIXTURES, { query: 'quantum biology' });

        expect(results).toEqual([]);
    });
});

describe('searchCatalog — tag filter', () => {
    it('restricts to entries containing at least one of the tags (OR semantics)', () => {
        // OR semantics: picking more chips broadens the set, which
        // matches every faceted search UI the user has used.
        const results = searchCatalog(FIXTURES, {
            filters: { tags: ['AI'] },
        });

        expect(results.map(r => r.ctid).sort()).toEqual(['ce-aaa', 'ce-ddd']);
    });

    it('is case-insensitive on tag matches', () => {
        const results = searchCatalog(FIXTURES, {
            filters: { tags: ['healthcare'] },
        });

        expect(results.map(r => r.ctid)).toEqual(['ce-ccc']);
    });

    it('unions multiple tags', () => {
        const results = searchCatalog(FIXTURES, {
            filters: { tags: ['AI', 'Cybersecurity'] },
        });

        expect(results.map(r => r.ctid).sort()).toEqual([
            'ce-aaa',
            'ce-bbb',
            'ce-ddd',
        ]);
    });

    it('combines with the free-text query (AND between filter and query)', () => {
        // Tag narrows to AI-related entries (ce-aaa + ce-ddd),
        // query "ethics" then narrows to just ce-ddd.
        const results = searchCatalog(FIXTURES, {
            query: 'ethics',
            filters: { tags: ['AI'] },
        });

        expect(results.map(r => r.ctid)).toEqual(['ce-ddd']);
    });
});

describe('searchCatalog — featuredOnly filter', () => {
    it('drops non-featured entries', () => {
        const results = searchCatalog(FIXTURES, {
            filters: { featuredOnly: true },
        });

        expect(results.map(r => r.ctid).sort()).toEqual(['ce-aaa', 'ce-ccc']);
    });

    it('composes with the free-text query', () => {
        const results = searchCatalog(FIXTURES, {
            query: 'ai',
            filters: { featuredOnly: true },
        });

        expect(results.map(r => r.ctid)).toEqual(['ce-aaa']);
    });
});

describe('collectTags', () => {
    it('returns the alphabetical union of all tags', () => {
        // Preserves first-seen casing so downstream chip rendering
        // doesn't have to guess the publisher's intended presentation.
        expect(collectTags(FIXTURES)).toEqual([
            'AI',
            'Analytics',
            'Cybersecurity',
            'Ethics',
            'Finance',
            'Healthcare',
            'Professional',
        ]);
    });

    it('returns an empty array for an empty catalog', () => {
        expect(collectTags([])).toEqual([]);
    });

    it('deduplicates tags that differ only in casing', () => {
        const entries = [
            make({ tags: ['ai', 'Finance'] }),
            make({ tags: ['AI'] }),
            make({ tags: ['FINANCE'] }),
        ];

        // Keeps the first-seen form ("ai" over "AI" / "AI") — we
        // trust the first author's casing.
        expect(collectTags(entries)).toEqual(['ai', 'Finance']);
    });
});
