import { describe, expect, it } from 'vitest';

import { PathwaySchema } from '../types';

import {
    extractCtidFromUri,
    extractRefIds,
    getLocalizedString,
    getPathwayMemberRefs,
    toArray,
} from './ctdlTypes';
import {
    fanInFixture,
    imaRealShapeFixture,
    linearFixture,
    makeDeterministicIds,
    selectionFixture,
} from './fixtures';
import { fromCtdlPathway } from './fromCtdlPathway';

const NOW = '2026-04-20T12:00:00.000Z';
const OWNER = 'did:key:z-test-owner';

// ---------------------------------------------------------------------------
// Helper-level tests
// ---------------------------------------------------------------------------

describe('ctdlTypes helpers', () => {
    describe('getLocalizedString', () => {
        it('returns plain strings as-is', () => {
            expect(getLocalizedString('Hello')).toBe('Hello');
        });

        it('prefers the exact preferred locale', () => {
            expect(
                getLocalizedString({ 'en-US': 'Hi', 'es': 'Hola' }, 'en-US'),
            ).toBe('Hi');
        });

        it('falls back to a prefix match when the exact locale is missing', () => {
            expect(
                getLocalizedString({ 'en-GB': 'Howdy', 'es': 'Hola' }, 'en-US'),
            ).toBe('Howdy');
        });

        it('falls back to the first available value when nothing matches', () => {
            expect(getLocalizedString({ 'es': 'Hola', 'de': 'Hallo' }, 'en')).toBe('Hola');
        });

        it('returns an empty string on undefined or empty input', () => {
            expect(getLocalizedString(undefined)).toBe('');
            expect(getLocalizedString({})).toBe('');
        });
    });

    describe('toArray', () => {
        it('wraps single values into arrays', () => {
            expect(toArray<number>(7)).toEqual([7]);
        });

        it('leaves arrays untouched', () => {
            expect(toArray<number>([1, 2])).toEqual([1, 2]);
        });

        it('normalizes undefined to []', () => {
            expect(toArray<number>(undefined)).toEqual([]);
        });
    });

    describe('extractCtidFromUri', () => {
        it('pulls the CTID out of a registry URL', () => {
            expect(
                extractCtidFromUri(
                    'https://credentialengineregistry.org/resources/ce-abc-123',
                ),
            ).toBe('ce-abc-123');
        });

        it('returns undefined when no CTID is present', () => {
            expect(extractCtidFromUri('https://example.com/foo')).toBeUndefined();
        });
    });

    describe('extractRefIds — real CTDL shapes', () => {
        it('extracts URIs from an array of bare strings', () => {
            expect(
                extractRefIds([
                    'https://x.test/ce-a',
                    'https://x.test/ce-b',
                ]),
            ).toEqual(['https://x.test/ce-a', 'https://x.test/ce-b']);
        });

        it('extracts URIs from an array of object refs', () => {
            expect(
                extractRefIds([
                    { '@id': 'https://x.test/ce-a' },
                    { '@id': 'https://x.test/ce-b' },
                ]),
            ).toEqual(['https://x.test/ce-a', 'https://x.test/ce-b']);
        });

        it('extracts URIs from a mixed-form array', () => {
            expect(
                extractRefIds([
                    'https://x.test/ce-a',
                    { '@id': 'https://x.test/ce-b' },
                ]),
            ).toEqual(['https://x.test/ce-a', 'https://x.test/ce-b']);
        });

        it('handles a single bare-string ref (not wrapped in an array)', () => {
            expect(extractRefIds('https://x.test/ce-solo')).toEqual([
                'https://x.test/ce-solo',
            ]);
        });
    });

    describe('getPathwayMemberRefs', () => {
        it('unions hasPart and hasChild, deduped', () => {
            const refs = getPathwayMemberRefs({
                '@id': 'https://x.test/ce-root',
                '@type': 'ceterms:Pathway',
                'ceterms:hasPart': [
                    'https://x.test/ce-a',
                    'https://x.test/ce-b',
                ],
                'ceterms:hasChild': [{ '@id': 'https://x.test/ce-b' }],
            });

            expect(refs).toEqual([
                'https://x.test/ce-a',
                'https://x.test/ce-b',
            ]);
        });

        it('returns [] when neither field is present', () => {
            expect(
                getPathwayMemberRefs({
                    '@id': 'https://x.test/ce-empty',
                    '@type': 'ceterms:Pathway',
                }),
            ).toEqual([]);
        });
    });
});

// ---------------------------------------------------------------------------
// IMA real-shape regression — the bug that motivated all the changes above
// ---------------------------------------------------------------------------

describe('fromCtdlPathway — IMA AI in Finance (real registry shape)', () => {
    const runImport = () =>
        fromCtdlPathway({
            graph: imaRealShapeFixture,
            ownerDid: OWNER,
            now: NOW,
            generateId: makeDeterministicIds(),
        });

    it('imports all 7 components (not 0!) despite hasPart + bare-string refs', () => {
        const { pathway } = runImport();

        expect(pathway.nodes).toHaveLength(7);
    });

    it('resolves the destination via bare-string hasDestinationComponent', () => {
        const { pathway } = runImport();

        const dest = pathway.nodes.find(n => n.id === pathway.destinationNodeId);

        expect(dest?.title).toBe('AI in Finance Micro-credential Certificate');
        expect(dest?.sourceCtid).toBe('ce-e3a3a6a4-5c3b-4139-902d-7904227ee8c5');
    });

    it('does NOT create a self-loop edge for the destination listed in both hasPart and hasDestinationComponent', () => {
        const { pathway } = runImport();

        const selfLoops = pathway.edges.filter(e => e.from === e.to);

        expect(selfLoops).toHaveLength(0);
    });

    it('fans the six non-destination members into the destination as prerequisite edges', () => {
        const { pathway } = runImport();

        const destId = pathway.destinationNodeId!;
        const intoDest = pathway.edges.filter(e => e.to === destId);

        expect(intoDest).toHaveLength(6);
        expect(intoDest.every(e => e.type === 'prerequisite')).toBe(true);
    });

    it('preserves the IMA pathway CTID + source URI', () => {
        const { pathway } = runImport();

        expect(pathway.sourceCtid).toBe('ce-3f9295b8-9c7d-4314-a06d-235ab8d0bfaf');
        expect(pathway.sourceUri).toBe(
            'https://credentialengineregistry.org/resources/ce-3f9295b8-9c7d-4314-a06d-235ab8d0bfaf',
        );
    });

    it('passes PathwaySchema validation', () => {
        const { pathway } = runImport();
        const result = PathwaySchema.safeParse(pathway);

        expect(result.success).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// Linear pathway: ordering preserved via hasChild chain
// ---------------------------------------------------------------------------

describe('fromCtdlPathway — linear pathway', () => {
    const runImport = () =>
        fromCtdlPathway({
            graph: linearFixture,
            ownerDid: OWNER,
            now: NOW,
            generateId: makeDeterministicIds(),
        });

    it('produces a Pathway that passes Zod validation', () => {
        const { pathway } = runImport();
        const result = PathwaySchema.safeParse(pathway);

        expect(result.success).toBe(true);
    });

    it('imports every reachable component as a node', () => {
        const { pathway } = runImport();

        expect(pathway.nodes).toHaveLength(4);
        expect(pathway.nodes.map(n => n.title)).toEqual([
            'Intro to Scope Management',
            'Scope Management Quiz',
            'Demonstrate Scope Planning',
            'Project Delivery Certificate',
        ]);
    });

    it('preserves provenance on both the pathway and each node', () => {
        const { pathway } = runImport();

        expect(pathway.source).toBe('ctdl-imported');
        expect(pathway.sourceCtid).toBe('ce-linear-0000-0000-0000-000000000000');
        expect(pathway.sourceUri).toMatch(/ce-linear-/);
        expect(pathway.nodes.every(n => !!n.sourceUri && !!n.sourceCtid)).toBe(true);
    });

    it('builds prerequisite edges following hasChild ordering', () => {
        const { pathway } = runImport();
        const titleOf = (id: string) =>
            pathway.nodes.find(n => n.id === id)?.title ?? '(missing)';
        const edgePairs = pathway.edges.map(e => `${titleOf(e.from)} → ${titleOf(e.to)}`);

        expect(edgePairs).toEqual([
            'Intro to Scope Management → Scope Management Quiz',
            'Scope Management Quiz → Demonstrate Scope Planning',
            'Demonstrate Scope Planning → Project Delivery Certificate',
        ]);
        expect(pathway.edges.every(e => e.type === 'prerequisite')).toBe(true);
    });

    it('points `destinationNodeId` at the destination component', () => {
        const { pathway } = runImport();
        const destination = pathway.nodes.find(n => n.id === pathway.destinationNodeId);

        expect(destination?.title).toBe('Project Delivery Certificate');
        expect(destination?.sourceCtid).toBe('ce-step-destination');
    });

    it('does NOT create a redundant fan-in edge when hasChild chain already connects top-child to destination', () => {
        const { pathway } = runImport();

        // Only 3 edges, not 4 — no redundant "Step A → Destination"
        // edge because the hasChild chain already leads there.
        expect(pathway.edges).toHaveLength(3);
    });

    it('sets `goal` to the destination component\'s name, not the pathway title', () => {
        const { pathway } = runImport();

        expect(pathway.title).toBe('Foundations of Project Delivery');
        expect(pathway.goal).toBe('Project Delivery Certificate');
    });
});

// ---------------------------------------------------------------------------
// Fan-in pathway: IMA-style topology
// ---------------------------------------------------------------------------

describe('fromCtdlPathway — fan-in pathway (IMA-style)', () => {
    const runImport = () =>
        fromCtdlPathway({
            graph: fanInFixture,
            ownerDid: OWNER,
            now: NOW,
            generateId: makeDeterministicIds(),
        });

    it('imports all four children plus the destination', () => {
        const { pathway } = runImport();

        expect(pathway.nodes).toHaveLength(5);
    });

    it('creates implicit fan-in edges from every top-level child to the destination', () => {
        const { pathway } = runImport();

        // Every non-destination node is a prerequisite of the destination.
        const destId = pathway.destinationNodeId!;
        const edgesIntoDest = pathway.edges.filter(e => e.to === destId);

        expect(edgesIntoDest).toHaveLength(4);
        expect(edgesIntoDest.every(e => e.type === 'prerequisite')).toBe(true);
    });

    it('gives every CredentialComponent a credentialProjection', () => {
        const { pathway } = runImport();

        expect(pathway.nodes.every(n => !!n.credentialProjection)).toBe(true);
        // Badge credential-types flow through to the achievement type.
        const fundAi = pathway.nodes.find(n => n.title === 'Fundamentals of AI Pathway');

        expect(fundAi?.credentialProjection?.achievementType).toBe('Badge');
    });

    it('picks `endorsement` termination for CredentialComponents by default', () => {
        const { pathway } = runImport();

        const fundAi = pathway.nodes.find(n => n.title === 'Fundamentals of AI Pathway');

        expect(fundAi?.stage.termination.kind).toBe('endorsement');
        expect(fundAi?.stage.policy.kind).toBe('artifact');
    });

    it('moves the pathway description onto the destination node if not set', () => {
        const { pathway } = runImport();
        const dest = pathway.nodes.find(n => n.id === pathway.destinationNodeId);

        expect(dest?.description).toMatch(/Earn four topic-specific badges/);
    });
});

// ---------------------------------------------------------------------------
// Stage defaults for each CTDL component type
// ---------------------------------------------------------------------------

describe('fromCtdlPathway — stage defaults', () => {
    it('picks an assessment policy + assessment-score termination for AssessmentComponent', () => {
        const { pathway } = fromCtdlPathway({
            graph: linearFixture,
            ownerDid: OWNER,
            now: NOW,
            generateId: makeDeterministicIds(),
        });
        const quiz = pathway.nodes.find(n => n.title === 'Scope Management Quiz')!;

        expect(quiz.stage.policy.kind).toBe('assessment');
        expect(quiz.stage.termination.kind).toBe('assessment-score');
    });

    it('picks an artifact policy + artifact-count termination for CourseComponent', () => {
        const { pathway } = fromCtdlPathway({
            graph: linearFixture,
            ownerDid: OWNER,
            now: NOW,
            generateId: makeDeterministicIds(),
        });
        const course = pathway.nodes.find(n => n.title === 'Intro to Scope Management')!;

        expect(course.stage.policy.kind).toBe('artifact');
        expect(course.stage.termination.kind).toBe('artifact-count');
    });

    it('picks a practice policy + self-attest termination for CompetencyComponent', () => {
        const { pathway } = fromCtdlPathway({
            graph: linearFixture,
            ownerDid: OWNER,
            now: NOW,
            generateId: makeDeterministicIds(),
        });
        const competency = pathway.nodes.find(
            n => n.title === 'Demonstrate Scope Planning',
        )!;

        expect(competency.stage.policy.kind).toBe('practice');
        expect(competency.stage.termination.kind).toBe('self-attest');
    });
});

// ---------------------------------------------------------------------------
// Warnings — the honest simplification log
// ---------------------------------------------------------------------------

describe('fromCtdlPathway — warnings', () => {
    it('warns when a SelectionComponent is encountered', () => {
        const { warnings } = fromCtdlPathway({
            graph: selectionFixture,
            ownerDid: OWNER,
            now: NOW,
            generateId: makeDeterministicIds(),
        });

        expect(warnings.some(w => /SelectionComponent/.test(w))).toBe(true);
    });

    it('warns when a component has unsupported conditions', () => {
        const { warnings } = fromCtdlPathway({
            graph: selectionFixture,
            ownerDid: OWNER,
            now: NOW,
            generateId: makeDeterministicIds(),
        });

        expect(warnings.some(w => /condition/.test(w))).toBe(true);
    });

    it('warns when the pathway has no destination component', () => {
        const graph = {
            pathway: {
                '@id': 'https://x.test/ce-nodest',
                '@type': 'ceterms:Pathway',
                'ceterms:ctid': 'ce-nodest',
                'ceterms:name': 'No Destination',
                'ceterms:hasChild': [{ '@id': 'https://x.test/ce-child' }],
            },
            components: {
                'https://x.test/ce-child': {
                    '@id': 'https://x.test/ce-child',
                    '@type': 'ceterms:BasicComponent',
                    'ceterms:ctid': 'ce-child',
                    'ceterms:name': 'Lonely child',
                },
            },
        };

        const { warnings, pathway } = fromCtdlPathway({
            graph,
            ownerDid: OWNER,
            now: NOW,
            generateId: makeDeterministicIds(),
        });

        expect(warnings.some(w => /destination/i.test(w))).toBe(true);
        expect(pathway.destinationNodeId).toBeUndefined();
    });

    it('warns and skips when a referenced component is missing from the graph', () => {
        const graph = {
            pathway: {
                '@id': 'https://x.test/ce-broken',
                '@type': 'ceterms:Pathway',
                'ceterms:ctid': 'ce-broken',
                'ceterms:name': 'Broken refs',
                'ceterms:hasChild': [{ '@id': 'https://x.test/ce-missing' }],
                'ceterms:hasDestinationComponent': [{ '@id': 'https://x.test/ce-dest' }],
            },
            components: {
                'https://x.test/ce-dest': {
                    '@id': 'https://x.test/ce-dest',
                    '@type': 'ceterms:CredentialComponent',
                    'ceterms:ctid': 'ce-dest',
                    'ceterms:name': 'Destination',
                },
            },
        };

        const { warnings, pathway } = fromCtdlPathway({
            graph,
            ownerDid: OWNER,
            now: NOW,
            generateId: makeDeterministicIds(),
        });

        expect(warnings.some(w => /ce-missing/.test(w))).toBe(true);
        // Only the one reachable+present component becomes a node.
        expect(pathway.nodes).toHaveLength(1);
    });
});

// ---------------------------------------------------------------------------
// Determinism — same input should produce the same output (modulo UUIDs)
// ---------------------------------------------------------------------------

describe('fromCtdlPathway — determinism', () => {
    it('produces identical output for identical input + generateId seed', () => {
        const first = fromCtdlPathway({
            graph: fanInFixture,
            ownerDid: OWNER,
            now: NOW,
            generateId: makeDeterministicIds(),
        });

        const second = fromCtdlPathway({
            graph: fanInFixture,
            ownerDid: OWNER,
            now: NOW,
            generateId: makeDeterministicIds(),
        });

        expect(JSON.stringify(first.pathway)).toBe(JSON.stringify(second.pathway));
    });
});
