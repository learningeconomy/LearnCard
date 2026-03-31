import { describe, it, expect, beforeAll } from 'vitest';
import { UnsignedVCValidator } from '@learncard/types';

import {
    getAllFixtures,
    getFixture,
    findFixture,
    getFixtures,
    getUnsignedFixtures,
    getValidFixtures,
    getInvalidFixtures,
    getStats,
    resetRegistry,
    registerFixtures,
    prepareFixture,
    prepareFixtureById,
} from '../index';

import { ALL_FIXTURES } from '../fixtures';

import type { CredentialFixture } from '../types';

// ---------------------------------------------------------------------------
// Ensure fixtures are loaded
// ---------------------------------------------------------------------------

let fixtures: readonly CredentialFixture[];

beforeAll(() => {
    fixtures = getAllFixtures();
});

// ---------------------------------------------------------------------------
// Registry integrity
// ---------------------------------------------------------------------------

describe('Registry integrity', () => {
    it('has at least 15 fixtures registered', () => {
        expect(fixtures.length).toBeGreaterThanOrEqual(15);
    });

    it('has no duplicate IDs', () => {
        const ids = fixtures.map(f => f.id);
        const uniqueIds = new Set(ids);

        expect(uniqueIds.size).toBe(ids.length);
    });

    it('every fixture has required metadata fields', () => {
        for (const f of fixtures) {
            expect(f.id).toBeTruthy();
            expect(f.name).toBeTruthy();
            expect(f.description).toBeTruthy();
            expect(f.spec).toBeTruthy();
            expect(f.profile).toBeTruthy();
            expect(f.source).toBeTruthy();
            expect(typeof f.signed).toBe('boolean');
            expect(f.validity).toBeTruthy();
            expect(f.credential).toBeTruthy();
        }
    });
});

// ---------------------------------------------------------------------------
// Per-fixture validation
// ---------------------------------------------------------------------------

describe('Fixture validation', () => {
    describe('Valid fixtures pass their declared validator', () => {
        const validFixtures = () => getAllFixtures().filter(f => f.validity === 'valid');

        it.each(
            validFixtures().map(f => [f.id, f] as const)
        )('%s', (_id, fixture) => {
            if (!fixture.validator) return;

            const result = fixture.validator.safeParse(fixture.credential);

            expect(result.success).toBe(true);
        });
    });

    describe('Valid fixtures also pass base UnsignedVC validator', () => {
        const validFixtures = () => getAllFixtures().filter(f => f.validity === 'valid');

        it.each(
            validFixtures().map(f => [f.id, f] as const)
        )('%s', (_id, fixture) => {
            const result = UnsignedVCValidator.safeParse(fixture.credential);

            expect(result.success).toBe(true);
        });
    });

    describe('Invalid fixtures fail their declared validator', () => {
        const invalidFixtures = () =>
            getAllFixtures().filter(f => f.validity === 'invalid' || f.validity === 'tampered');

        it.each(
            invalidFixtures().map(f => [f.id, f] as const)
        )('%s', (_id, fixture) => {
            if (!fixture.validator) return;

            const result = fixture.validator.safeParse(fixture.credential);

            expect(result.success).toBe(false);
        });
    });
});

// ---------------------------------------------------------------------------
// Query API
// ---------------------------------------------------------------------------

describe('Query API', () => {
    it('getFixture returns the correct fixture by ID', () => {
        const fixture = getFixture('vc-v2/basic');

        expect(fixture.id).toBe('vc-v2/basic');
        expect(fixture.spec).toBe('vc-v2');
    });

    it('getFixture throws for unknown ID', () => {
        expect(() => getFixture('nonexistent/fixture')).toThrow('not found');
    });

    it('findFixture returns undefined for unknown ID', () => {
        expect(findFixture('nonexistent/fixture')).toBeUndefined();
    });

    it('filters by spec', () => {
        const obv3 = getFixtures({ spec: 'obv3' });

        expect(obv3.length).toBeGreaterThan(0);
        expect(obv3.every(f => f.spec === 'obv3')).toBe(true);
    });

    it('filters by multiple specs', () => {
        const results = getFixtures({ spec: ['vc-v1', 'vc-v2'] });

        expect(results.length).toBeGreaterThan(0);
        expect(results.every(f => f.spec === 'vc-v1' || f.spec === 'vc-v2')).toBe(true);
    });

    it('filters by profile', () => {
        const badges = getFixtures({ profile: 'badge' });

        expect(badges.length).toBeGreaterThan(0);
        expect(badges.every(f => f.profile === 'badge')).toBe(true);
    });

    it('filters by features (AND logic)', () => {
        const results = getFixtures({ features: ['evidence', 'alignment'] });

        expect(results.length).toBeGreaterThan(0);

        for (const f of results) {
            expect(f.features).toContain('evidence');
            expect(f.features).toContain('alignment');
        }
    });

    it('filters by featuresAny (OR logic)', () => {
        const results = getFixtures({ featuresAny: ['endorsement', 'results'] });

        expect(results.length).toBeGreaterThan(0);

        for (const f of results) {
            const hasAny =
                f.features.includes('endorsement') || f.features.includes('results');

            expect(hasAny).toBe(true);
        }
    });

    it('filters by validity', () => {
        const valid = getValidFixtures();
        const invalid = getInvalidFixtures();

        expect(valid.length).toBeGreaterThan(0);
        expect(invalid.length).toBeGreaterThan(0);
        expect(valid.every(f => f.validity === 'valid')).toBe(true);
        expect(
            invalid.every(f => f.validity === 'invalid' || f.validity === 'tampered')
        ).toBe(true);
    });

    it('filters by tags', () => {
        const plugfest = getFixtures({ tags: ['plugfest'] });

        expect(plugfest.length).toBeGreaterThan(0);

        for (const f of plugfest) {
            expect(f.tags).toContain('plugfest');
        }
    });

    it('getUnsignedFixtures returns only unsigned', () => {
        const unsigned = getUnsignedFixtures();

        expect(unsigned.length).toBeGreaterThan(0);
        expect(unsigned.every(f => f.signed === false)).toBe(true);
    });

    it('combined filters work together', () => {
        const results = getFixtures({
            spec: 'obv3',
            profile: 'badge',
            validity: 'valid',
        });

        expect(results.length).toBeGreaterThan(0);

        for (const f of results) {
            expect(f.spec).toBe('obv3');
            expect(f.profile).toBe('badge');
            expect(f.validity).toBe('valid');
        }
    });
});

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

describe('Stats', () => {
    it('reports correct totals', () => {
        const stats = getStats();

        expect(stats.total).toBe(fixtures.length);
        expect(stats.signed + stats.unsigned).toBe(stats.total);

        const specTotal = Object.values(stats.bySpec).reduce((sum, n) => sum + n, 0);

        expect(specTotal).toBe(stats.total);
    });
});

// ---------------------------------------------------------------------------
// Coverage — ensure we have at least one fixture per spec category
// ---------------------------------------------------------------------------

describe('Spec coverage', () => {
    const requiredSpecs = ['vc-v1', 'vc-v2', 'obv3', 'clr-v2'] as const;

    it.each(requiredSpecs)('has at least one fixture for %s', spec => {
        const results = getFixtures({ spec });

        expect(results.length).toBeGreaterThan(0);
    });

    it('has at least one invalid fixture', () => {
        const invalid = getInvalidFixtures();

        expect(invalid.length).toBeGreaterThan(0);
    });

    it('has at least one boost fixture', () => {
        const boosts = getFixtures({ profile: 'boost' });

        expect(boosts.length).toBeGreaterThan(0);
    });
});

// ---------------------------------------------------------------------------
// prepareFixture — bridge to wallet issuance
// ---------------------------------------------------------------------------

describe('prepareFixture', () => {
    const issuerDid = 'did:key:z6MkTestIssuer123';
    const subjectDid = 'did:key:z6MkTestSubject456';

    it('replaces string issuer with provided DID', () => {
        const fixture = getFixture('vc-v2/basic');
        const prepared = prepareFixture(fixture, { issuerDid });

        expect(prepared.issuer).toBe(issuerDid);
    });

    it('replaces object issuer.id with provided DID', () => {
        const fixture = getFixture('obv3/full-badge');
        const prepared = prepareFixture(fixture, { issuerDid });

        expect((prepared.issuer as Record<string, unknown>).id).toBe(issuerDid);
        expect((prepared.issuer as Record<string, unknown>).name).toBeTruthy();
    });

    it('replaces credentialSubject.id with subjectDid', () => {
        const fixture = getFixture('obv3/minimal-badge');
        const prepared = prepareFixture(fixture, { issuerDid, subjectDid });
        const subject = prepared.credentialSubject as Record<string, unknown>;

        expect(subject.id).toBe(subjectDid);
    });

    it('generates fresh UUIDs for id fields by default', () => {
        const fixture = getFixture('obv3/minimal-badge');
        const prepared = prepareFixture(fixture, { issuerDid });

        expect(prepared.id).toMatch(/^urn:uuid:/);
        expect(prepared.id).not.toBe(fixture.credential.id);
    });

    it('preserves original UUIDs when freshIds is false', () => {
        const fixture = getFixture('obv3/minimal-badge');
        const prepared = prepareFixture(fixture, { issuerDid, freshIds: false });

        expect(prepared.id).toBe(fixture.credential.id);
    });

    it('sets validFrom to now when not specified', () => {
        const before = new Date().toISOString();
        const fixture = getFixture('vc-v2/basic');
        const prepared = prepareFixture(fixture, { issuerDid });
        const after = new Date().toISOString();

        expect(prepared.validFrom).toBeDefined();
        expect(prepared.validFrom! >= before).toBe(true);
        expect(prepared.validFrom! <= after).toBe(true);
    });

    it('uses provided validFrom date', () => {
        const fixture = getFixture('vc-v2/basic');
        const customDate = '2030-01-01T00:00:00Z';
        const prepared = prepareFixture(fixture, { issuerDid, validFrom: customDate });

        expect(prepared.validFrom).toBe(customDate);
    });

    it('does not mutate the original fixture', () => {
        const fixture = getFixture('vc-v2/basic');
        const originalId = fixture.credential.id;

        prepareFixture(fixture, { issuerDid });

        expect(fixture.credential.id).toBe(originalId);
    });

    it('prepared credential still passes base validator', () => {
        const fixture = getFixture('obv3/full-badge');
        const prepared = prepareFixture(fixture, { issuerDid, subjectDid });
        const result = UnsignedVCValidator.safeParse(prepared);

        expect(result.success).toBe(true);
    });

    it('handles multiple credentialSubjects', () => {
        const fixture = getFixture('vc-v2/multiple-subjects');
        const prepared = prepareFixture(fixture, { issuerDid, subjectDid });
        const subjects = prepared.credentialSubject as Record<string, unknown>[];

        expect(Array.isArray(subjects)).toBe(true);
        expect(subjects.every(s => s.id === subjectDid)).toBe(true);
    });
});

describe('prepareFixtureById', () => {
    it('works as a shorthand for getFixture + prepareFixture', () => {
        const issuerDid = 'did:key:z6MkShorthand';
        const prepared = prepareFixtureById('vc-v2/basic', { issuerDid });

        expect(prepared.issuer).toBe(issuerDid);
        expect(prepared.type).toContain('VerifiableCredential');
    });

    it('throws for unknown fixture ID', () => {
        expect(() =>
            prepareFixtureById('nonexistent/fixture', { issuerDid: 'did:key:z6MkTest' })
        ).toThrow('not found');
    });
});

// ---------------------------------------------------------------------------
// resetRegistry
// ---------------------------------------------------------------------------

describe('resetRegistry', () => {
    it('clears and re-populates the registry', () => {
        const countBefore = getAllFixtures().length;

        expect(countBefore).toBeGreaterThan(0);

        resetRegistry();

        expect(getAllFixtures().length).toBe(0);

        // Re-register so subsequent tests still work
        registerFixtures(ALL_FIXTURES);

        expect(getAllFixtures().length).toBe(countBefore);
    });
});
