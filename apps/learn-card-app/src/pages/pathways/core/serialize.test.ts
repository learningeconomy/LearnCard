import { describe, expect, it } from 'vitest';

import {
    CURRENT_PATHWAY_SCHEMA_VERSION,
    PathwaySchema,
    type Pathway,
} from '../types';

import {
    PathwaySerializationError,
    deserializePathway,
    parsePathway,
    serializePathway,
    stringifyPathway,
} from './serialize';

const NOW = '2026-04-23T12:00:00.000Z';

/**
 * Canonical non-trivial pathway used throughout these tests. Exercises
 * every optional field the JSON-serializable property needs to survive:
 * nested stages, evidence arrays, outcomes with bindings, chosenRoute,
 * altitude, credentialProjection, and app-listing actions carrying
 * snapshots. If this survives round-trip unchanged, flatter pathways
 * will too.
 */
const makePathway = (overrides: Partial<Pathway> = {}): Pathway => ({
    id: '00000000-0000-4000-8000-0000000000a1',
    ownerDid: 'did:test:learner',
    revision: 7,
    schemaVersion: CURRENT_PATHWAY_SCHEMA_VERSION,
    title: 'Round-trip',
    goal: 'Survive a round-trip',
    nodes: [
        {
            id: '00000000-0000-4000-8000-0000000000b1',
            pathwayId: '00000000-0000-4000-8000-0000000000a1',
            title: 'Watch a course',
            description: 'Two-week Coursera run.',
            stage: {
                initiation: [],
                policy: {
                    kind: 'artifact',
                    prompt: 'Upload your completion cert',
                    expectedArtifact: 'image',
                },
                termination: {
                    kind: 'artifact-count',
                    count: 1,
                    artifactType: 'image',
                },
            },
            endorsements: [],
            progress: {
                status: 'not-started',
                artifacts: [],
                reviewsDue: 0,
                streak: { current: 0, longest: 0 },
            },
            action: {
                kind: 'app-listing',
                listingId: 'coursera-uuid',
                snapshot: {
                    displayName: 'Coursera — AWS Cloud Essentials',
                    category: 'Learning',
                    launchType: 'DIRECT_LINK',
                    tagline: 'Learn the fundamentals of AWS cloud.',
                    iconUrl: 'https://cdn.example/icon.png',
                    semanticTags: ['video-lecture', 'passive', 'aws'],
                    snapshottedAt: NOW,
                },
            },
            credentialProjection: {
                achievementType: 'Achievement',
                criteria: 'Complete the course',
            },
            createdBy: 'learner',
            createdAt: NOW,
            updatedAt: NOW,
        },
    ],
    edges: [],
    status: 'active',
    visibility: { self: true, mentors: false, guardians: false, publicProfile: false },
    source: 'authored',
    chosenRoute: ['00000000-0000-4000-8000-0000000000b1'],
    intentAltitude: 'aspiration',
    outcomes: [
        {
            id: '00000000-0000-4000-8000-0000000000c1',
            label: 'Got the cert',
            kind: 'credential-received',
            expectedCredentialType: 'AWSCertifiedCloudPractitioner',
            minTrustTier: 'trusted',
        },
    ],
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
});

// ---------------------------------------------------------------------------
// serializePathway — pure JSON projection
// ---------------------------------------------------------------------------

describe('serializePathway', () => {
    it('produces a value that JSON.stringify accepts without throwing', () => {
        const pathway = makePathway();
        const serialized = serializePathway(pathway);

        expect(() => JSON.stringify(serialized)).not.toThrow();
    });

    it('round-trips through JSON.stringify / JSON.parse deep-equal', () => {
        // Property: the serialized shape must be pure JSON — no Date
        // instances, no Map/Set, no functions, no prototype chains that
        // `JSON.stringify` would silently drop. A stringify→parse
        // round-trip is the cheapest way to assert this; if any of
        // those types sneak in, the output won't be deep-equal.
        const pathway = makePathway();
        const serialized = serializePathway(pathway);
        const roundTripped = JSON.parse(JSON.stringify(serialized));

        expect(roundTripped).toEqual(serialized);
    });

    it('stamps the current schemaVersion even when the input has a different one', () => {
        // Serialization always upgrades to current — we never persist
        // a document at an older version just because the in-memory
        // object happened to carry one.
        const pathway = makePathway({ schemaVersion: 999 as number });
        const serialized = serializePathway(pathway);

        expect(serialized.schemaVersion).toBe(CURRENT_PATHWAY_SCHEMA_VERSION);
    });

    it('does not mutate the input pathway', () => {
        const pathway = makePathway();
        const before = JSON.stringify(pathway);

        serializePathway(pathway);

        expect(JSON.stringify(pathway)).toBe(before);
    });

    it('preserves every field on the original pathway', () => {
        const pathway = makePathway();
        const serialized = serializePathway(pathway);

        // Every key present on the source must survive the projection.
        // Reverse check — we validate via Zod below — but this tests
        // the positive direction so the serialized doc isn't silently
        // dropping anything.
        for (const key of Object.keys(pathway)) {
            expect(serialized).toHaveProperty(key);
        }
    });

    it('the serialized output still validates as a Pathway under the Zod schema', () => {
        const pathway = makePathway();
        const serialized = serializePathway(pathway);

        const parsed = PathwaySchema.safeParse(serialized);

        expect(parsed.success).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// deserializePathway — version-aware parsing
// ---------------------------------------------------------------------------

describe('deserializePathway', () => {
    it('round-trips a pathway through serialize + deserialize unchanged', () => {
        const pathway = makePathway();
        const restored = deserializePathway(serializePathway(pathway));

        expect(restored).toEqual(pathway);
    });

    it('accepts a document that pre-dates the schemaVersion field (treats as v1)', () => {
        const pathway = makePathway();
        const { schemaVersion: _discard, ...legacy } = serializePathway(pathway) as Record<
            string,
            unknown
        >;

        // Implicit v1. Since CURRENT_PATHWAY_SCHEMA_VERSION is 1 and
        // no migrators are registered, parsing succeeds and the
        // returned doc carries the current version stamp.
        const restored = deserializePathway(legacy);

        expect(restored.schemaVersion).toBe(CURRENT_PATHWAY_SCHEMA_VERSION);
        // Everything else identical.
        expect({ ...restored, schemaVersion: undefined }).toEqual({
            ...pathway,
            schemaVersion: undefined,
        });
    });

    it('rejects a document stamped at a future schemaVersion', () => {
        const futureDoc = {
            ...serializePathway(makePathway()),
            schemaVersion: CURRENT_PATHWAY_SCHEMA_VERSION + 1,
        };

        expect(() => deserializePathway(futureDoc)).toThrow(PathwaySerializationError);
    });

    it('rejects documents whose schemaVersion is not a positive integer', () => {
        const bad = [
            { schemaVersion: 0 },
            { schemaVersion: -1 },
            { schemaVersion: 1.5 },
            { schemaVersion: 'one' },
        ];

        for (const shape of bad) {
            expect(() =>
                deserializePathway({ ...serializePathway(makePathway()), ...shape }),
            ).toThrow(PathwaySerializationError);
        }
    });

    it('rejects non-object inputs honestly', () => {
        expect(() => deserializePathway(null)).toThrow(PathwaySerializationError);
        expect(() => deserializePathway('{}')).toThrow(PathwaySerializationError);
        expect(() => deserializePathway(42)).toThrow(PathwaySerializationError);
    });

    it('reports the underlying Zod error as `cause` when schema validation fails', () => {
        // Missing `ownerDid` — structurally invalid. The resulting
        // error should carry the Zod issue so callers can inspect if
        // they want to, without us having to re-emit every subfield.
        const invalid = {
            ...serializePathway(makePathway()),
            ownerDid: undefined,
        };

        try {
            deserializePathway(invalid);
            throw new Error('expected deserializePathway to throw');
        } catch (err) {
            expect(err).toBeInstanceOf(PathwaySerializationError);
            expect((err as PathwaySerializationError).cause).toBeDefined();
        }
    });

    it('does not mutate the input document', () => {
        const serialized = serializePathway(makePathway());
        const snapshotBefore = JSON.stringify(serialized);

        deserializePathway(serialized);

        expect(JSON.stringify(serialized)).toBe(snapshotBefore);
    });
});

// ---------------------------------------------------------------------------
// stringify / parse — the convenience wrappers
// ---------------------------------------------------------------------------

describe('stringifyPathway / parsePathway', () => {
    it('survives a full string round-trip deep-equal', () => {
        const pathway = makePathway();

        expect(parsePathway(stringifyPathway(pathway))).toEqual(pathway);
    });

    it('surfaces a PathwaySerializationError on malformed JSON', () => {
        expect(() => parsePathway('{ not valid json')).toThrow(PathwaySerializationError);
    });

    it('surfaces a PathwaySerializationError on a schema violation', () => {
        // Intentionally break the shape by re-serializing a tampered doc.
        const pathway = makePathway();
        const bad = {
            ...serializePathway(pathway),
            nodes: 'not-an-array',
        };

        expect(() => parsePathway(JSON.stringify(bad))).toThrow(PathwaySerializationError);
    });
});

// ---------------------------------------------------------------------------
// Property-level assertions — the "pathway is JSON-safe" contract
// ---------------------------------------------------------------------------

describe('Pathway is JSON-safe (property-level contract)', () => {
    it('contains no Date objects in the tree', () => {
        const pathway = makePathway();

        const hasDate = (value: unknown): boolean => {
            if (value instanceof Date) return true;

            if (Array.isArray(value)) return value.some(hasDate);

            if (value && typeof value === 'object') {
                return Object.values(value as Record<string, unknown>).some(hasDate);
            }

            return false;
        };

        expect(hasDate(pathway)).toBe(false);
    });

    it('contains no functions, Maps, or Sets in the tree', () => {
        const pathway = makePathway();

        const hasDisallowed = (value: unknown): boolean => {
            if (typeof value === 'function') return true;
            if (value instanceof Map || value instanceof Set) return true;

            if (Array.isArray(value)) return value.some(hasDisallowed);

            if (value && typeof value === 'object') {
                return Object.values(value as Record<string, unknown>).some(hasDisallowed);
            }

            return false;
        };

        expect(hasDisallowed(pathway)).toBe(false);
    });

    it('has no cycles (JSON.stringify succeeds on the raw pathway, not just the serialized form)', () => {
        // A Pathway is supposed to be acyclic *as constructed*, not
        // merely *after* serializePathway's defensive clone. If the
        // raw object couldn't be stringified, we'd be papering over a
        // real structural bug. Assert on the raw object here.
        const pathway = makePathway();

        expect(() => JSON.stringify(pathway)).not.toThrow();
    });
});
