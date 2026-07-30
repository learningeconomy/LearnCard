/**
 * Integrity tests for the *shipped* `CATALOG`.
 *
 * These guard against accidental regressions in the seed data — an
 * invalid CTID, a missing name, a broken image URL shape, etc. —
 * which would surface to users as a broken card or an import that
 * 404s at fetch time.
 *
 * We deliberately don't assert the *content* of entries (name text,
 * specific tags) so editorial changes don't require test updates.
 * Structural checks only.
 */

import { describe, expect, it } from 'vitest';

import { CATALOG } from './catalog';
import { createStaticCatalogSource } from './staticCatalogSource';

const CTID_RE = /^ce-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

describe('catalog — integrity', () => {
    it('has at least one entry (so the browse view isn\'t empty)', () => {
        expect(CATALOG.length).toBeGreaterThan(0);
    });

    it('every entry has a well-formed CTID', () => {
        for (const entry of CATALOG) {
            expect(entry.ctid, `bad CTID on "${entry.name}"`).toMatch(CTID_RE);
        }
    });

    it('CTIDs are unique (no accidental duplicates)', () => {
        const ctids = CATALOG.map(e => e.ctid);
        const unique = new Set(ctids);

        expect(unique.size).toBe(ctids.length);
    });

    it('every entry has required fields populated', () => {
        for (const entry of CATALOG) {
            expect(entry.name.trim()).not.toBe('');
            expect(entry.description.trim()).not.toBe('');
            expect(entry.issuer.trim()).not.toBe('');
            expect(entry.credentialType.trim()).not.toBe('');
            expect(entry.tags.length).toBeGreaterThan(0);
        }
    });

    it('every tag is non-empty and not just whitespace', () => {
        for (const entry of CATALOG) {
            for (const tag of entry.tags) {
                expect(tag.trim()).not.toBe('');
            }
        }
    });

    it('image URLs (when present) are http(s)', () => {
        for (const entry of CATALOG) {
            if (entry.image === undefined) continue;
            expect(entry.image).toMatch(/^https?:\/\//i);
        }
    });

    it('issuerUrl (when present) is http(s)', () => {
        for (const entry of CATALOG) {
            if (entry.issuerUrl === undefined) continue;
            expect(entry.issuerUrl).toMatch(/^https?:\/\//i);
        }
    });
});

describe('createStaticCatalogSource — wraps the real catalog', () => {
    const source = createStaticCatalogSource(CATALOG);

    it('search() with empty query returns every entry', async () => {
        const results = await source.search('');

        expect(results.length).toBe(CATALOG.length);
    });

    it('featured() only returns entries marked featured', async () => {
        const results = await source.featured();

        for (const entry of results) {
            expect(entry.featured).toBe(true);
        }
    });

    it('allTags() matches the union of tags in the catalog', async () => {
        const tags = await source.allTags();

        const expected = new Set<string>();

        for (const entry of CATALOG) {
            for (const tag of entry.tags) expected.add(tag.toLowerCase());
        }

        expect(new Set(tags.map(t => t.toLowerCase()))).toEqual(expected);
    });

    it('search() filtering by one of the catalog\'s own tags returns a non-empty set', async () => {
        // Smoke: pick any tag from the real catalog and confirm at
        // least one entry surfaces — guards against a refactor where
        // the tag normalization silently stops matching anything.
        const tags = await source.allTags();

        if (tags.length === 0) return; // catalog is empty (won't happen once seeded)

        const results = await source.search('', { tags: [tags[0]] });

        expect(results.length).toBeGreaterThan(0);
    });
});
