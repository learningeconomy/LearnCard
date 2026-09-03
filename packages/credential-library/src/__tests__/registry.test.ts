import { describe, it, expect, expectTypeOf, beforeAll } from 'vitest';
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
    isCredentialFixture,
    isSdJwtVcFixture,
    resetRegistry,
    registerFixture,
    registerFixtures,
    prepareFixture,
    prepareFixtureById,
    buildFinalTranscriptVariant,
} from '../index';

import { ALL_FIXTURES } from '../fixtures';

import type { CredentialFixture, LibraryFixture, SdJwtVcFixture } from '../types';

const sdJwtFixture: SdJwtVcFixture = {
    kind: 'sd-jwt-vc',
    id: 'sd-jwt-vc/test-course',
    name: 'Test Course',
    description: 'Registry-only SD-JWT VC fixture',
    spec: 'sd-jwt-vc',
    profile: 'course',
    features: ['selective-disclosure', 'holder-binding'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    template: {
        format: 'dc+sd-jwt',
        vct: 'https://example.com/vct/test-course',
        claims: { course_name: 'Test Course' },
        selectivelyDisclosable: ['course_name'],
    },
};

// ---------------------------------------------------------------------------
// Ensure fixtures are loaded
// ---------------------------------------------------------------------------

let fixtures: readonly LibraryFixture[];

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
            if (isCredentialFixture(f)) {
                expect(f.credential).toBeTruthy();
            } else {
                expect(f.template).toBeTruthy();
            }
        }
    });
});

// ---------------------------------------------------------------------------
// Per-fixture validation
// ---------------------------------------------------------------------------

describe('Fixture validation', () => {
    describe('Valid fixtures pass their declared validator', () => {
        const validFixtures = () =>
            getAllFixtures().filter(
                (fixture): fixture is CredentialFixture =>
                    fixture.validity === 'valid' && isCredentialFixture(fixture)
            );

        it.each(validFixtures().map(f => [f.id, f] as const))('%s', (_id, fixture) => {
            if (!fixture.validator) return;

            const result = fixture.validator.safeParse(fixture.credential);

            expect(result.success).toBe(true);
        });
    });

    describe('Valid fixtures also pass base UnsignedVC validator', () => {
        const validFixtures = () =>
            getAllFixtures().filter(
                (fixture): fixture is CredentialFixture =>
                    fixture.validity === 'valid' && isCredentialFixture(fixture)
            );

        it.each(validFixtures().map(f => [f.id, f] as const))('%s', (_id, fixture) => {
            const result = UnsignedVCValidator.safeParse(fixture.credential);

            expect(result.success).toBe(true);
        });
    });

    describe('Invalid fixtures fail their declared validator', () => {
        const invalidFixtures = () =>
            getAllFixtures().filter(
                (fixture): fixture is CredentialFixture =>
                    (fixture.validity === 'invalid' || fixture.validity === 'tampered') &&
                    isCredentialFixture(fixture)
            );

        it.each(invalidFixtures().map(f => [f.id, f] as const))('%s', (_id, fixture) => {
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

    it('registers the production Course Completion SD-JWT VC fixture', () => {
        const fixture = getFixture('sd-jwt-vc/course-completion');

        expect(isSdJwtVcFixture(fixture)).toBe(true);
        if (!isSdJwtVcFixture(fixture)) throw new Error('Expected SD-JWT VC fixture');

        expect(fixture.template.format).toBe('dc+sd-jwt');
        expect(fixture.template.vct).toBe(
            'https://credentials.learncard.com/vct/course-completion'
        );
        expect(getFixtures({ spec: 'sd-jwt-vc' }).map(item => item.id)).toContain(fixture.id);
        expect(getFixtures({ kind: 'sd-jwt-vc' }).map(item => item.id)).toContain(fixture.id);
        expect(getUnsignedFixtures().map(item => item.id)).not.toContain(fixture.id);
    });

    it('getFixture throws for unknown ID', () => {
        expect(() => getFixture('nonexistent/fixture')).toThrow('not found');
    });

    // -----------------------------------------------------------------------
    // Provisional transcript fixture (LC-2117 / LC-2135 / LC-2136)
    // -----------------------------------------------------------------------

    describe('clr/provisional-transcript', () => {
        it('is discoverable as a valid CLR 2.0 fixture with a 1EdTech refresh service', () => {
            const fixture = getFixture('clr/provisional-transcript');

            expect(isCredentialFixture(fixture)).toBe(true);
            expect(fixture.spec).toBe('clr-v2');
            expect(fixture.profile).toBe('learner-record');
            expect(fixture.validity).toBe('valid');
            expect(fixture.features).toContain('refresh-service');

            if (!isCredentialFixture(fixture)) throw new Error('Expected W3C VC fixture');

            const refreshService = (fixture.credential as Record<string, any>).refreshService;

            expect(refreshService?.type).toBe('1EdTechCredentialRefresh');
            expect(typeof refreshService?.id).toBe('string');
        });

        it('prepares provisional and final variants sharing one credential ID, issuer, and subject', () => {
            const provisional = prepareFixtureById('clr/provisional-transcript', {
                issuerDid: 'did:example:test-issuer',
                subjectDid: 'did:example:test-holder',
            });

            expect(typeof provisional.id).toBe('string');
            expect(provisional.name).toContain('Provisional');

            const final = buildFinalTranscriptVariant(provisional, {
                validFrom: '2026-06-01T00:00:00Z',
            });
            const provisionalIssuer =
                typeof provisional.issuer === 'string' ? provisional.issuer : provisional.issuer.id;
            const finalIssuer = typeof final.issuer === 'string' ? final.issuer : final.issuer.id;
            const provisionalSubject = Array.isArray(provisional.credentialSubject)
                ? provisional.credentialSubject[0]
                : provisional.credentialSubject;
            const finalSubject = Array.isArray(final.credentialSubject)
                ? final.credentialSubject[0]
                : final.credentialSubject;

            // Identity stability: the final version shares the credential ID, issuer,
            // and subject with the provisional version.
            expect(final.id).toBe(provisional.id);
            expect(finalIssuer).toBe(provisionalIssuer);
            expect(finalSubject?.id).toBe(provisionalSubject?.id);

            // The final variant is materially different and marked final.
            expect(final.name).toContain('Final');
            expect(final.validFrom).toBe('2026-06-01T00:00:00Z');
            expect(final.refreshService).toEqual(provisional.refreshService);
        });
    });

    it('findFixture returns undefined for unknown ID', () => {
        expect(findFixture('nonexistent/fixture')).toBeUndefined();
    });

    it('types runtime string fixture lookups as the heterogeneous library union', () => {
        const runtimeId: string = 'sd-jwt-vc/course-completion';

        expectTypeOf(getFixture(runtimeId)).toEqualTypeOf<LibraryFixture>();
        expectTypeOf(findFixture(runtimeId)).toEqualTypeOf<LibraryFixture | undefined>();
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
            const hasAny = f.features.includes('endorsement') || f.features.includes('results');

            expect(hasAny).toBe(true);
        }
    });

    it('filters by validity', () => {
        const valid = getValidFixtures();
        const invalid = getInvalidFixtures();

        expect(valid.length).toBeGreaterThan(0);
        expect(invalid.length).toBeGreaterThan(0);
        expect(valid.every(f => f.validity === 'valid')).toBe(true);
        expect(invalid.every(f => f.validity === 'invalid' || f.validity === 'tampered')).toBe(
            true
        );
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

    it('narrows SD-JWT fixtures and keeps W3C helpers narrow', () => {
        expect(isSdJwtVcFixture(sdJwtFixture)).toBe(true);
        expect(isCredentialFixture(getFixture('vc-v2/basic'))).toBe(true);
        expect(getUnsignedFixtures().every(isCredentialFixture)).toBe(true);
        expect(() =>
            prepareFixture(sdJwtFixture, { issuerDid: 'did:key:z6MkTestIssuer123' })
        ).toThrow('materializeSdJwtVcFixture');
    });

    it('stores SD-JWT fixtures separately from W3C fixtures', () => {
        resetRegistry();

        try {
            registerFixtures([...ALL_FIXTURES, sdJwtFixture]);

            const sdJwtFixtures = getFixtures({ kind: 'sd-jwt-vc' });
            expect(sdJwtFixtures).toContainEqual(sdJwtFixture);
            expect(sdJwtFixtures.map(fixture => fixture.id)).toContain(
                'sd-jwt-vc/course-completion'
            );
            const w3cFixtures = getFixtures({ kind: 'w3c-vc' });
            expect(w3cFixtures).toHaveLength(ALL_FIXTURES.filter(isCredentialFixture).length);
            expect(w3cFixtures.every(isCredentialFixture)).toBe(true);
            expect(getFixture('sd-jwt-vc/test-course').template).toEqual(sdJwtFixture.template);
            expect(getUnsignedFixtures().every(isCredentialFixture)).toBe(true);
            expect(getUnsignedFixtures().some(fixture => fixture.id === sdJwtFixture.id)).toBe(
                false
            );
        } finally {
            resetRegistry();
            getAllFixtures();
        }
    });

    it('rejects SD-JWT fixtures outside the required ID prefix', () => {
        resetRegistry();

        try {
            expect(() =>
                registerFixture({
                    ...sdJwtFixture,
                    id: 'custom/course',
                } as unknown as LibraryFixture)
            ).toThrow('must start with "sd-jwt-vc/"');
        } finally {
            resetRegistry();
            getAllFixtures();
        }
    });

    it('rejects W3C fixtures inside the reserved SD-JWT ID prefix', () => {
        const w3cFixture = ALL_FIXTURES.find(isCredentialFixture);
        if (!w3cFixture) throw new Error('Expected at least one W3C fixture');

        resetRegistry();

        try {
            expect(() =>
                registerFixture({
                    ...w3cFixture,
                    id: 'sd-jwt-vc/not-an-sd-jwt-template',
                } as LibraryFixture)
            ).toThrow('reserved for SD-JWT VC fixtures');
        } finally {
            resetRegistry();
            getAllFixtures();
        }
    });

    it('rejects SD-JWT fixtures whose kind and spec disagree', () => {
        resetRegistry();

        try {
            expect(() =>
                registerFixture({
                    ...sdJwtFixture,
                    spec: 'vc-v2',
                } as unknown as LibraryFixture)
            ).toThrow('must use spec "sd-jwt-vc"');
        } finally {
            resetRegistry();
            getAllFixtures();
        }
    });

    it('rejects unrecognized fixture kinds at registration', () => {
        const w3cFixture = ALL_FIXTURES.find(isCredentialFixture);
        if (!w3cFixture) throw new Error('Expected at least one W3C fixture');

        resetRegistry();

        try {
            expect(() =>
                registerFixture({
                    ...w3cFixture,
                    kind: 'unknown-fixture-kind',
                } as unknown as LibraryFixture)
            ).toThrow('Unsupported fixture kind "unknown-fixture-kind"');
        } finally {
            resetRegistry();
            getAllFixtures();
        }
    });

    it.each([undefined, 'w3c-vc'] as const)(
        'rejects W3C fixtures with kind %s and the SD-JWT spec',
        kind => {
            const w3cFixture = ALL_FIXTURES.find(isCredentialFixture);
            if (!w3cFixture) throw new Error('Expected at least one W3C fixture');

            resetRegistry();

            try {
                expect(() =>
                    registerFixture({
                        ...w3cFixture,
                        kind,
                        id: 'custom/not-an-sd-jwt-template',
                        spec: 'sd-jwt-vc',
                    } as unknown as LibraryFixture)
                ).toThrow('W3C VC fixtures cannot use spec "sd-jwt-vc"');
            } finally {
                resetRegistry();
                getAllFixtures();
            }
        }
    );

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

    type UnknownRecord = Record<string, unknown>;
    type UnknownArrayRecord = Record<string, unknown> & {
        [key: string]: unknown;
    };

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

    it('keeps internal CLR references aligned when fresh IDs are generated', () => {
        const fixture = getFixture('clr/westbridge-full');
        const prepared = prepareFixture(fixture, { issuerDid });

        const ids = new Set<string>();
        const collectIds = (value: unknown): void => {
            if (Array.isArray(value)) {
                value.forEach(collectIds);
                return;
            }

            if (!value || typeof value !== 'object') return;

            const record = value as Record<string, unknown>;
            if (typeof record.id === 'string') {
                ids.add(record.id);
            }

            Object.values(record).forEach(collectIds);
        };

        collectIds(prepared);

        const subject = prepared.credentialSubject as UnknownRecord;
        const nested = subject.verifiableCredential as UnknownRecord[];

        const programVc = nested.find(vc => {
            const vcSubject = vc.credentialSubject as UnknownRecord | undefined;
            const achievement = vcSubject?.achievement as UnknownRecord | undefined;
            return achievement?.achievementType === 'BachelorDegree';
        }) as UnknownRecord | undefined;

        const programSubject = programVc?.credentialSubject as UnknownRecord | undefined;
        const programAchievement = programSubject?.achievement as UnknownRecord | undefined;
        const programResults = Array.isArray(programSubject?.result)
            ? (programSubject?.result as UnknownArrayRecord[])
            : [];
        const programResultDescriptions = Array.isArray(programAchievement?.resultDescription)
            ? (programAchievement?.resultDescription as UnknownArrayRecord[])
            : [];
        const programResultDescriptionId = programResults[0]?.resultDescription as
            | string
            | undefined;
        const programResultDescription = programResultDescriptions[0]?.id as string | undefined;

        expect(programResultDescriptionId).toBe(programResultDescription);
        expect(programResultDescriptionId && ids.has(programResultDescriptionId)).toBe(true);

        const nestedAssociations = subject.association as UnknownRecord[];
        for (const assoc of nestedAssociations) {
            const sourceId = assoc.sourceId as string | undefined;
            const targetId = assoc.targetId as string | undefined;

            expect(sourceId && ids.has(sourceId)).toBe(true);
            expect(targetId && ids.has(targetId)).toBe(true);
        }

        const gpaRecord = nested.find(vc => {
            const vcSubject = vc.credentialSubject as UnknownRecord | undefined;
            const achievement = vcSubject?.achievement as UnknownRecord | undefined;
            return achievement?.achievementType === 'BachelorDegree';
        }) as UnknownRecord | undefined;
        const gpaSubject = gpaRecord?.credentialSubject as UnknownRecord | undefined;
        const gpaResults = Array.isArray(gpaSubject?.result)
            ? (gpaSubject?.result as UnknownArrayRecord[])
            : [];
        const gpaResultDescriptionId = gpaResults[0]?.resultDescription as string | undefined;

        expect(gpaResultDescriptionId && ids.has(gpaResultDescriptionId)).toBe(true);
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
    it('clears and lazily re-populates the registry', () => {
        const countBefore = getAllFixtures().length;

        expect(countBefore).toBeGreaterThan(0);

        resetRegistry();

        // After reset, getAllFixtures() lazily re-initializes from ALL_FIXTURES
        expect(getAllFixtures().length).toBe(countBefore);
    });
});
