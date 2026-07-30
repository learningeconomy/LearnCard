import { describe, expect, it } from 'vitest';

import type { Edge, Pathway, PathwayNode, Policy, Termination } from '../types';

import {
    buildRouteFromChosen,
    buildRouteIndex,
    computeSuggestedRoute,
    formatEta,
    getPathwayRoute,
    nodeEffortMinutes,
} from './route';

// ---------------------------------------------------------------------------
// Fixtures — same shape/idiom as collectionDetection.test.ts so the two
// suites read as a family.
// ---------------------------------------------------------------------------

const NOW = '2026-04-21T00:00:00.000Z';

let seq = 0;
const id = () => `id-${++seq}`;
const resetIds = () => {
    seq = 0;
};

const basePolicy = (): Policy => ({
    kind: 'practice',
    cadence: { frequency: 'daily', perPeriod: 1 },
    artifactTypes: ['text'],
});

const baseTermination = (): Termination => ({
    kind: 'self-attest',
    prompt: 'Done?',
});

const makeNode = (
    overrides: Partial<PathwayNode> & { id?: string; title?: string } = {},
): PathwayNode => ({
    id: overrides.id ?? id(),
    pathwayId: 'p1',
    title: overrides.title ?? 'Node',
    stage: {
        initiation: [],
        policy: overrides.stage?.policy ?? basePolicy(),
        termination: overrides.stage?.termination ?? baseTermination(),
    },
    endorsements: [],
    progress: overrides.progress ?? {
        status: 'not-started',
        artifacts: [],
        reviewsDue: 0,
        streak: { current: 0, longest: 0 },
    },
    createdBy: 'learner',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
});

const edge = (from: string, to: string): Edge => ({
    id: id(),
    from,
    to,
    type: 'prerequisite',
});

const makePathway = (
    nodes: PathwayNode[],
    edges: Edge[],
    destinationNodeId?: string,
): Pathway => ({
    id: 'p1',
    ownerDid: 'did:example:1',
    revision: 0,
    schemaVersion: 1,
    title: 'P',
    goal: 'G',
    nodes,
    edges,
    status: 'active',
    visibility: { self: true, mentors: false, guardians: false, publicProfile: false },
    source: 'authored',
    destinationNodeId,
    createdAt: NOW,
    updatedAt: NOW,
});

// ---------------------------------------------------------------------------
// nodeEffortMinutes
// ---------------------------------------------------------------------------

describe('nodeEffortMinutes', () => {
    it('returns the default for each policy kind', () => {
        const practice = makeNode();
        expect(nodeEffortMinutes(practice)).toBe(30);

        const review = makeNode({
            stage: {
                initiation: [],
                policy: { kind: 'review', fsrs: { stability: 0, difficulty: 0 } },
                termination: baseTermination(),
            },
        });
        expect(nodeEffortMinutes(review)).toBe(15);

        const assessment = makeNode({
            stage: {
                initiation: [],
                policy: { kind: 'assessment', rubric: { criteria: [] } },
                termination: baseTermination(),
            },
        });
        expect(nodeEffortMinutes(assessment)).toBe(60);
    });

    it('honors an authored `estimatedMinutes` override on the policy', () => {
        const customPolicy = {
            kind: 'practice',
            cadence: { frequency: 'daily', perPeriod: 1 },
            artifactTypes: ['text'],
            estimatedMinutes: 90,
        } as Policy & { estimatedMinutes: number };

        const node = makeNode({
            stage: {
                initiation: [],
                policy: customPolicy,
                termination: baseTermination(),
            },
        });

        expect(nodeEffortMinutes(node)).toBe(90);
    });
});

// ---------------------------------------------------------------------------
// formatEta
// ---------------------------------------------------------------------------

describe('formatEta', () => {
    it('returns "Done" when no effort remains', () => {
        expect(formatEta(0)).toBe('Done');
        expect(formatEta(-5)).toBe('Done');
    });

    it('uses minutes when under an hour', () => {
        expect(formatEta(30)).toBe('~30m');
        expect(formatEta(59)).toBe('~59m');
    });

    it('uses hours when under a study-day of effort', () => {
        expect(formatEta(60)).toBe('~1h');
        expect(formatEta(180)).toBe('~3h');
        expect(formatEta(239)).toBe('~4h');
    });

    it('uses weeks at 5 hrs/week beyond a study-day', () => {
        // 5 hrs = 300 min = 1 week of study.
        expect(formatEta(300)).toBe('~1 week');
        // 20 hrs = ~4 weeks at 5 hrs/week.
        expect(formatEta(20 * 60)).toBe('~4 weeks');
    });
});

// ---------------------------------------------------------------------------
// computeSuggestedRoute
// ---------------------------------------------------------------------------

describe('computeSuggestedRoute', () => {
    it('returns null when the pathway has no destination', () => {
        resetIds();
        const a = makeNode();
        const b = makeNode();
        const p = makePathway([a, b], [edge(a.id, b.id)], undefined);

        expect(computeSuggestedRoute(p, a.id)).toBeNull();
    });

    it('returns null when the focus id is unknown', () => {
        resetIds();
        const a = makeNode();
        const b = makeNode();
        const p = makePathway([a, b], [edge(a.id, b.id)], b.id);

        expect(computeSuggestedRoute(p, 'nope')).toBeNull();
    });

    it('handles the trivial focus=destination case', () => {
        resetIds();
        const dest = makeNode();
        const p = makePathway([dest], [], dest.id);

        const route = computeSuggestedRoute(p, dest.id)!;

        expect(route.nodeIds).toEqual([dest.id]);
        expect(route.edgeIds).toEqual([]);
        expect(route.remainingSteps).toBe(1);
        expect(route.etaMinutes).toBeGreaterThan(0);
    });

    it('walks a linear chain from focus to destination', () => {
        resetIds();
        const a = makeNode({ title: 'A' });
        const b = makeNode({ title: 'B' });
        const c = makeNode({ title: 'C' });

        const p = makePathway(
            [a, b, c],
            [edge(a.id, b.id), edge(b.id, c.id)],
            c.id,
        );

        const route = computeSuggestedRoute(p, a.id)!;

        expect(route.nodeIds).toEqual([a.id, b.id, c.id]);
        expect(route.edgeIds).toHaveLength(2);
        expect(route.remainingSteps).toBe(3);
        // 3 practice nodes × 30 min default = 90 min.
        expect(route.etaMinutes).toBe(90);
    });

    // -----------------------------------------------------------------
    // AND-prereq semantics. A destination with multiple prereqs can't
    // be unlocked until every prereq is met, so the route must enumerate
    // every uncompleted sibling — not just the one the focus is on.
    // -----------------------------------------------------------------
    it('includes every uncompleted sibling in a fan-in to the destination', () => {
        resetIds();
        const s1 = makeNode({ title: 'sibling 1' });
        const s2 = makeNode({ title: 'sibling 2 (focus)' });
        const s3 = makeNode({ title: 'sibling 3' });
        const dest = makeNode({ title: 'dest' });

        const p = makePathway(
            [s1, s2, s3, dest],
            [
                edge(s1.id, dest.id),
                edge(s2.id, dest.id),
                edge(s3.id, dest.id),
            ],
            dest.id,
        );

        const route = computeSuggestedRoute(p, s2.id)!;

        // Focus first, then siblings in pathway.nodes order, then dest.
        expect(route.nodeIds).toEqual([s2.id, s1.id, s3.id, dest.id]);
        expect(route.remainingSteps).toBe(4);
        // Every fan-in arrow (3 of them) on the ribbon — not just
        // the focus→dest edge.
        expect(route.edgeIds).toHaveLength(3);
    });

    it('elides completed siblings from nodeIds but keeps their edges in the ribbon', () => {
        resetIds();
        const s1Done = makeNode({
            title: 's1 (done)',
            progress: {
                status: 'completed',
                artifacts: [],
                reviewsDue: 0,
                streak: { current: 0, longest: 0 },
                completedAt: NOW,
            },
        });
        const s2 = makeNode({ title: 's2 (focus)' });
        const s3 = makeNode({ title: 's3' });
        const dest = makeNode({ title: 'dest' });

        const p = makePathway(
            [s1Done, s2, s3, dest],
            [
                edge(s1Done.id, dest.id),
                edge(s2.id, dest.id),
                edge(s3.id, dest.id),
            ],
            dest.id,
        );

        const route = computeSuggestedRoute(p, s2.id)!;

        // s1 is completed → not a "step" anymore, elided from nodeIds.
        expect(route.nodeIds).toEqual([s2.id, s3.id, dest.id]);
        expect(route.remainingSteps).toBe(3);

        // But its edge into the destination is part of the journey
        // zone, so the ribbon shows all three fan-in arrows (the
        // four-bucket styler will render the completed one as trail).
        expect(route.edgeIds).toHaveLength(3);
    });

    it('keeps the focus at position 0 even when siblings come before it in pathway order', () => {
        resetIds();
        const s1 = makeNode({ title: 's1' });
        const s2 = makeNode({ title: 's2' });
        const focus = makeNode({ title: 'focus (declared last)' });
        const dest = makeNode({ title: 'dest' });

        const p = makePathway(
            [s1, s2, focus, dest],
            [
                edge(s1.id, dest.id),
                edge(s2.id, dest.id),
                edge(focus.id, dest.id),
            ],
            dest.id,
        );

        const route = computeSuggestedRoute(p, focus.id)!;

        expect(route.nodeIds[0]).toBe(focus.id);
        expect(route.nodeIds[route.nodeIds.length - 1]).toBe(dest.id);
    });

    it('returns all three hops of a linear chain when siblings exist off the chain', () => {
        resetIds();
        const a = makeNode({ title: 'A (focus)' });
        const b = makeNode({ title: 'B' });
        const direct = makeNode({ title: 'direct' });
        const dest = makeNode({ title: 'dest' });

        // Two paths both feed dest:
        //   A → B → dest
        //   direct → dest
        // From A, the route must include BOTH branches because dest
        // can't open until both prereqs (B and direct) are met.
        const p = makePathway(
            [a, b, direct, dest],
            [
                edge(a.id, b.id),
                edge(b.id, dest.id),
                edge(direct.id, dest.id),
            ],
            dest.id,
        );

        const route = computeSuggestedRoute(p, a.id)!;

        expect(route.nodeIds).toContain(a.id);
        expect(route.nodeIds).toContain(b.id);
        expect(route.nodeIds).toContain(direct.id);
        expect(route.nodeIds).toContain(dest.id);
        expect(route.nodeIds).toHaveLength(4);
        // `b` depends on `a`, so a must come before b in the order.
        expect(route.nodeIds.indexOf(a.id)).toBeLessThan(route.nodeIds.indexOf(b.id));
        // Destination always last.
        expect(route.nodeIds[route.nodeIds.length - 1]).toBe(dest.id);
    });

    it('excludes completed nodes from the remaining count and ETA', () => {
        resetIds();
        const a = makeNode({
            progress: {
                status: 'completed',
                artifacts: [],
                reviewsDue: 0,
                streak: { current: 0, longest: 0 },
                completedAt: NOW,
            },
        });
        const b = makeNode();
        const c = makeNode();

        const p = makePathway(
            [a, b, c],
            [edge(a.id, b.id), edge(b.id, c.id)],
            c.id,
        );

        const route = computeSuggestedRoute(p, a.id)!;

        // a is completed but is the focus → included in nodeIds as
        // the anchor; b and c uncompleted → included too. Focus at
        // position 0 per the pin contract.
        expect(route.nodeIds).toEqual([a.id, b.id, c.id]);

        // But only uncompleted nodes count toward remaining work.
        expect(route.remainingSteps).toBe(2);
        expect(route.etaMinutes).toBe(60);
    });

    it('returns null when the destination is unreachable from the focus', () => {
        resetIds();
        const focus = makeNode();
        const other = makeNode();
        const dest = makeNode();

        // focus and other are siblings; only `other → dest`.
        const p = makePathway([focus, other, dest], [edge(other.id, dest.id)], dest.id);

        expect(computeSuggestedRoute(p, focus.id)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// buildRouteIndex
// ---------------------------------------------------------------------------

describe('buildRouteIndex', () => {
    it('indexes node positions and route edges', () => {
        resetIds();
        const a = makeNode();
        const b = makeNode();
        const c = makeNode();

        const p = makePathway(
            [a, b, c],
            [edge(a.id, b.id), edge(b.id, c.id)],
            c.id,
        );

        const route = computeSuggestedRoute(p, a.id)!;
        const idx = buildRouteIndex(route, p);

        expect(idx.nodeIndex.get(a.id)).toBe(0);
        expect(idx.nodeIndex.get(b.id)).toBe(1);
        expect(idx.nodeIndex.get(c.id)).toBe(2);
        expect(idx.edgeOnRoute.size).toBe(2);
    });

    it('sets yourIndex to the first uncompleted node', () => {
        resetIds();
        const a = makeNode({
            progress: {
                status: 'completed',
                artifacts: [],
                reviewsDue: 0,
                streak: { current: 0, longest: 0 },
                completedAt: NOW,
            },
        });
        const b = makeNode();
        const c = makeNode();

        const p = makePathway(
            [a, b, c],
            [edge(a.id, b.id), edge(b.id, c.id)],
            c.id,
        );

        const route = computeSuggestedRoute(p, a.id)!;
        const idx = buildRouteIndex(route, p);

        expect(idx.yourIndex).toBe(1); // `a` done, `b` is where you are
    });

    it('sets yourIndex to null when every route node is complete', () => {
        resetIds();
        const completedProgress = {
            status: 'completed' as const,
            artifacts: [],
            reviewsDue: 0,
            streak: { current: 0, longest: 0 },
            completedAt: NOW,
        };
        const a = makeNode({ progress: completedProgress });
        const b = makeNode({ progress: completedProgress });

        const p = makePathway([a, b], [edge(a.id, b.id)], b.id);

        const route = computeSuggestedRoute(p, a.id)!;
        const idx = buildRouteIndex(route, p);

        expect(idx.yourIndex).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// buildRouteFromChosen
// ---------------------------------------------------------------------------

describe('buildRouteFromChosen', () => {
    it('returns null when the pathway has no chosenRoute', () => {
        resetIds();
        const a = makeNode();
        const b = makeNode();
        const p = makePathway([a, b], [edge(a.id, b.id)], b.id);

        expect(buildRouteFromChosen(p)).toBeNull();
    });

    it('returns null when chosenRoute is empty', () => {
        resetIds();
        const a = makeNode();
        const p: Pathway = {
            ...makePathway([a], [], a.id),
            chosenRoute: [],
        };

        expect(buildRouteFromChosen(p)).toBeNull();
    });

    it('drops stale ids and returns null when fewer than two survive', () => {
        resetIds();
        const a = makeNode();
        const p: Pathway = {
            ...makePathway([a], [], a.id),
            chosenRoute: [a.id, 'ghost-id'],
        };

        expect(buildRouteFromChosen(p)).toBeNull();
    });

    it('builds a SuggestedRoute shape from a valid chosenRoute', () => {
        resetIds();
        const a = makeNode({ title: 'A' });
        const b = makeNode({ title: 'B' });
        const c = makeNode({ title: 'C' });

        const e1 = edge(a.id, b.id);
        const e2 = edge(b.id, c.id);

        const p: Pathway = {
            ...makePathway([a, b, c], [e1, e2], c.id),
            chosenRoute: [a.id, b.id, c.id],
        };

        const route = buildRouteFromChosen(p)!;

        expect(route).not.toBeNull();
        expect(route.nodeIds).toEqual([a.id, b.id, c.id]);
        expect(route.edgeIds).toEqual([e1.id, e2.id]);
        expect(route.destinationId).toBe(c.id);
        // All three uncompleted → three remaining steps.
        expect(route.remainingSteps).toBe(3);
        // Practice default = 30 min/node.
        expect(route.etaMinutes).toBe(90);
    });

    it('excludes completed nodes from etaMinutes and remainingSteps', () => {
        resetIds();
        const completed = {
            status: 'completed' as const,
            artifacts: [],
            reviewsDue: 0,
            streak: { current: 0, longest: 0 },
            completedAt: NOW,
        };

        const a = makeNode({ title: 'A', progress: completed });
        const b = makeNode({ title: 'B' });
        const c = makeNode({ title: 'C' });

        const p: Pathway = {
            ...makePathway([a, b, c], [edge(a.id, b.id), edge(b.id, c.id)], c.id),
            chosenRoute: [a.id, b.id, c.id],
        };

        const route = buildRouteFromChosen(p)!;

        // a is completed; b and c still uncompleted.
        expect(route.remainingSteps).toBe(2);
        expect(route.etaMinutes).toBe(60);
        // nodeIds still carries every route position so "Step N of M"
        // math stays honest.
        expect(route.nodeIds).toEqual([a.id, b.id, c.id]);
    });

    it('falls back to the last chosenRoute id for destinationId when pathway.destinationNodeId is absent', () => {
        // Edge case: a chosenRoute exists but the pathway lost its
        // destination somehow. Rare but defensive — we prefer "route
        // ends at the final id" to "crash the Map."
        resetIds();
        const a = makeNode();
        const b = makeNode();
        const p: Pathway = {
            ...makePathway([a, b], [edge(a.id, b.id)], undefined),
            chosenRoute: [a.id, b.id],
        };

        const route = buildRouteFromChosen(p)!;
        expect(route.destinationId).toBe(b.id);
    });
});

// ---------------------------------------------------------------------------
// getPathwayRoute
// ---------------------------------------------------------------------------

describe('getPathwayRoute', () => {
    it('prefers chosenRoute when the pathway has one', () => {
        resetIds();
        const a = makeNode();
        const b = makeNode();
        const c = makeNode();

        const p: Pathway = {
            ...makePathway([a, b, c], [edge(a.id, b.id), edge(b.id, c.id)], c.id),
            chosenRoute: [a.id, b.id, c.id],
        };

        // Focus on `b`, but chosenRoute should still win.
        const route = getPathwayRoute(p, b.id)!;

        expect(route.nodeIds).toEqual([a.id, b.id, c.id]);
    });

    it('falls back to focus-derived computeSuggestedRoute when chosenRoute is absent', () => {
        resetIds();
        const a = makeNode();
        const b = makeNode();
        const p = makePathway([a, b], [edge(a.id, b.id)], b.id);

        // No chosenRoute on p; should delegate to computeSuggestedRoute.
        const route = getPathwayRoute(p, a.id)!;

        expect(route).not.toBeNull();
        expect(route.nodeIds).toEqual([a.id, b.id]);
    });

    it('returns null when both chosenRoute is absent and focus is off-subtree', () => {
        resetIds();
        const focus = makeNode();
        const other = makeNode();
        const dest = makeNode();

        const p = makePathway(
            [focus, other, dest],
            [edge(other.id, dest.id)],
            dest.id,
        );

        expect(getPathwayRoute(p, focus.id)).toBeNull();
    });
});
