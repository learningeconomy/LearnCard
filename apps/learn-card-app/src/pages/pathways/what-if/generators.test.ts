import { beforeEach, describe, expect, it } from 'vitest';

import type { Edge, Pathway, PathwayNode, Policy, Termination } from '../types';

import { generateScenarios } from './generators';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const NOW = '2026-04-21T00:00:00.000Z';

let seq = 0;
const id = () => `id-${++seq}`;

beforeEach(() => {
    seq = 0;
});

const practicePolicy = (): Policy => ({
    kind: 'practice',
    cadence: { frequency: 'daily', perPeriod: 1 },
    artifactTypes: ['text'],
});

const reviewPolicy = (): Policy => ({
    kind: 'review',
    fsrs: { stability: 0, difficulty: 0 },
});

const assessmentPolicy = (): Policy => ({
    kind: 'assessment',
    rubric: { criteria: [] },
});

const externalPolicy = (): Policy => ({
    kind: 'external',
    mcp: { serverId: 'srv', toolName: 'tool' },
});

const compositePolicy = (pathwayRef = 'ref-sub-pathway-id'): Policy => ({
    kind: 'composite',
    pathwayRef,
    renderStyle: 'inline-expandable',
});

const baseTermination = (): Termination => ({
    kind: 'self-attest',
    prompt: 'Done?',
});

/**
 * Composite nodes require the composite ⇔ pathway-completed pairing;
 * fixtures that want a composite node use this termination builder.
 */
const pathwayCompletedTermination = (pathwayRef: string): Termination => ({
    kind: 'pathway-completed',
    pathwayRef,
});

const makeNode = (
    overrides: Partial<PathwayNode> & { id?: string; title?: string } = {},
): PathwayNode => ({
    id: overrides.id ?? id(),
    pathwayId: 'p1',
    title: overrides.title ?? 'Node',
    stage: {
        initiation: [],
        policy: overrides.stage?.policy ?? practicePolicy(),
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
// generateScenarios
// ---------------------------------------------------------------------------

describe('generateScenarios', () => {
    it('emits no scenarios on an empty pathway', () => {
        const pathway = makePathway([], []);

        expect(generateScenarios(pathway)).toEqual([]);
    });

    it('emits no scenarios when every node is completed', () => {
        const completed: PathwayNode['progress'] = {
            status: 'completed',
            artifacts: [],
            reviewsDue: 0,
            streak: { current: 0, longest: 0 },
        };

        const nodes = [
            makeNode({
                progress: completed,
                stage: {
                    initiation: [],
                    policy: reviewPolicy(),
                    termination: baseTermination(),
                },
            }),
            makeNode({ progress: completed }),
            makeNode({
                progress: completed,
                stage: {
                    initiation: [],
                    policy: externalPolicy(),
                    termination: baseTermination(),
                },
            }),
        ];

        const pathway = makePathway(nodes, []);

        expect(generateScenarios(pathway)).toEqual([]);
    });

    it('emits only fast-track when the pathway has reviews but no practice or externals', () => {
        const review = makeNode({
            stage: {
                initiation: [],
                policy: reviewPolicy(),
                termination: baseTermination(),
            },
        });

        const assessment = makeNode({
            stage: {
                initiation: [],
                policy: assessmentPolicy(),
                termination: baseTermination(),
            },
        });

        const pathway = makePathway([review, assessment], []);

        const scenarios = generateScenarios(pathway);

        expect(scenarios.map(s => s.kind)).toEqual(['fast-track']);
    });

    it('emits only deep-practice when the pathway has practice but no reviews or externals', () => {
        const practice = makeNode();
        const assessment = makeNode({
            stage: {
                initiation: [],
                policy: assessmentPolicy(),
                termination: baseTermination(),
            },
        });

        const pathway = makePathway([practice, assessment], []);

        const scenarios = generateScenarios(pathway);

        expect(scenarios.map(s => s.kind)).toEqual(['deep-practice']);
    });

    it('emits only external-light when the pathway has externals but no reviews or practice', () => {
        const external = makeNode({
            stage: {
                initiation: [],
                policy: externalPolicy(),
                termination: baseTermination(),
            },
        });
        const artifact = makeNode({
            stage: {
                initiation: [],
                policy: {
                    kind: 'artifact',
                    prompt: 'Write',
                    expectedArtifact: 'text',
                },
                termination: baseTermination(),
            },
        });

        const pathway = makePathway([external, artifact], []);

        const scenarios = generateScenarios(pathway);

        expect(scenarios.map(s => s.kind)).toEqual(['external-light']);
    });

    it('emits the non-trivial scenarios in curated order when practice/review/external are all present', () => {
        const practice = makeNode();
        const review = makeNode({
            stage: {
                initiation: [],
                policy: reviewPolicy(),
                termination: baseTermination(),
            },
        });
        const external = makeNode({
            stage: {
                initiation: [],
                policy: externalPolicy(),
                termination: baseTermination(),
            },
        });

        const pathway = makePathway([practice, review, external], []);

        const scenarios = generateScenarios(pathway);

        // No destination → destination-only skipped; no composite → composite-bypass
        // skipped. Order follows the curated GENERATORS order (fast reductions
        // before effort-deepening).
        expect(scenarios.map(s => s.kind)).toEqual([
            'fast-track',
            'external-light',
            'deep-practice',
        ]);
    });

    it('uses stable scenario ids so the UI can animate them deterministically', () => {
        const pathway = makePathway(
            [
                makeNode(),
                makeNode({
                    stage: {
                        initiation: [],
                        policy: reviewPolicy(),
                        termination: baseTermination(),
                    },
                }),
                makeNode({
                    stage: {
                        initiation: [],
                        policy: externalPolicy(),
                        termination: baseTermination(),
                    },
                }),
            ],
            [],
        );

        const a = generateScenarios(pathway);
        const b = generateScenarios(pathway);

        expect(a.map(s => s.id)).toEqual(b.map(s => s.id));
        expect(a.map(s => s.id)).toEqual([
            'whatif-fast-track',
            'whatif-external-light',
            'whatif-deep-practice',
        ]);
    });

    it('authors a difficulty:worse tradeoff on fast-track', () => {
        const review = makeNode({
            stage: {
                initiation: [],
                policy: reviewPolicy(),
                termination: baseTermination(),
            },
        });

        const pathway = makePathway([review], []);

        const [fast] = generateScenarios(pathway);

        expect(fast).toBeDefined();

        const hit = fast!.authoredTradeoffs.find(
            t => t.dimension === 'difficulty',
        );

        expect(hit).toBeDefined();
        expect(hit!.direction).toBe('worse');
    });

    it('authors a difficulty:better tradeoff on deep-practice', () => {
        const practice = makeNode();

        const pathway = makePathway([practice], []);

        const [deep] = generateScenarios(pathway);

        expect(deep).toBeDefined();

        const hit = deep!.authoredTradeoffs.find(
            t => t.dimension === 'difficulty',
        );

        expect(hit).toBeDefined();
        expect(hit!.direction).toBe('better');
    });

    it('authors an external-dependency:better tradeoff on external-light', () => {
        const external = makeNode({
            stage: {
                initiation: [],
                policy: externalPolicy(),
                termination: baseTermination(),
            },
        });

        const pathway = makePathway([external], []);

        const [light] = generateScenarios(pathway);

        expect(light).toBeDefined();

        const hit = light!.authoredTradeoffs.find(
            t => t.dimension === 'external-dependency',
        );

        expect(hit).toBeDefined();
        expect(hit!.direction).toBe('better');
    });

    it('mentions the exact skip count in the subtitle so the learner sees the magnitude', () => {
        const r1 = makeNode({
            stage: {
                initiation: [],
                policy: reviewPolicy(),
                termination: baseTermination(),
            },
        });
        const r2 = makeNode({
            stage: {
                initiation: [],
                policy: reviewPolicy(),
                termination: baseTermination(),
            },
        });
        const r3 = makeNode({
            stage: {
                initiation: [],
                policy: reviewPolicy(),
                termination: baseTermination(),
            },
        });

        const pathway = makePathway([r1, r2, r3], []);

        const [fast] = generateScenarios(pathway);

        expect(fast!.subtitle).toMatch(/3 review steps/);
    });

    it('uses the singular form when exactly one node would be skipped', () => {
        const external = makeNode({
            stage: {
                initiation: [],
                policy: externalPolicy(),
                termination: baseTermination(),
            },
        });

        const pathway = makePathway([external], []);

        const [light] = generateScenarios(pathway);

        expect(light!.subtitle).toMatch(/1 external module\b/);
    });

    // -----------------------------------------------------------------
    // composite-bypass
    // -----------------------------------------------------------------

    describe('composite-bypass', () => {
        it('emits when the pathway has an uncompleted composite node', () => {
            const composite = makeNode({
                stage: {
                    initiation: [],
                    policy: compositePolicy('ref-1'),
                    termination: pathwayCompletedTermination('ref-1'),
                },
            });

            const pathway = makePathway([composite], []);

            const scenarios = generateScenarios(pathway);

            expect(scenarios.map(s => s.kind)).toContain('composite-bypass');
        });

        it('does not emit when every composite is completed', () => {
            const composite = makeNode({
                progress: {
                    status: 'completed',
                    artifacts: [],
                    reviewsDue: 0,
                    streak: { current: 0, longest: 0 },
                },
                stage: {
                    initiation: [],
                    policy: compositePolicy('ref-1'),
                    termination: pathwayCompletedTermination('ref-1'),
                },
            });

            const pathway = makePathway([composite], []);

            expect(generateScenarios(pathway)).toEqual([]);
        });

        it('authors difficulty:worse + external-dependency:better tradeoffs', () => {
            const composite = makeNode({
                stage: {
                    initiation: [],
                    policy: compositePolicy('ref-1'),
                    termination: pathwayCompletedTermination('ref-1'),
                },
            });

            const pathway = makePathway([composite], []);

            const found = generateScenarios(pathway).find(
                s => s.kind === 'composite-bypass',
            );

            expect(found).toBeDefined();

            const difficulty = found!.authoredTradeoffs.find(
                t => t.dimension === 'difficulty',
            );
            const extdep = found!.authoredTradeoffs.find(
                t => t.dimension === 'external-dependency',
            );

            expect(difficulty?.direction).toBe('worse');
            expect(extdep?.direction).toBe('better');
        });

        it('mentions the exact bypass count in the subtitle', () => {
            const c1 = makeNode({
                stage: {
                    initiation: [],
                    policy: compositePolicy('ref-1'),
                    termination: pathwayCompletedTermination('ref-1'),
                },
            });
            const c2 = makeNode({
                stage: {
                    initiation: [],
                    policy: compositePolicy('ref-2'),
                    termination: pathwayCompletedTermination('ref-2'),
                },
            });

            const pathway = makePathway([c1, c2], []);

            const found = generateScenarios(pathway).find(
                s => s.kind === 'composite-bypass',
            );

            expect(found!.subtitle).toMatch(/2 nested sub-pathways/);
        });
    });

    // -----------------------------------------------------------------
    // destination-only
    // -----------------------------------------------------------------

    describe('destination-only', () => {
        // Graph: practiceA ─► assessment (dest)
        //        practiceB ─►
        //        practiceC ─►
        // Shortest path: [practiceA, assessment]; practiceB & practiceC are
        // siblings that the scenario should skip.
        const makeFanIn = (): Pathway => {
            const a = makeNode({ title: 'A' });
            const b = makeNode({ title: 'B' });
            const c = makeNode({ title: 'C' });
            const dest = makeNode({
                title: 'Dest',
                stage: {
                    initiation: [],
                    policy: assessmentPolicy(),
                    termination: baseTermination(),
                },
            });

            return makePathway(
                [a, b, c, dest],
                [
                    { id: id(), from: a.id, to: dest.id, type: 'prerequisite' },
                    { id: id(), from: b.id, to: dest.id, type: 'prerequisite' },
                    { id: id(), from: c.id, to: dest.id, type: 'prerequisite' },
                ],
                dest.id,
            );
        };

        it('emits when siblings exist off the shortest path', () => {
            const pathway = makeFanIn();

            const found = generateScenarios(pathway).find(
                s => s.kind === 'destination-only',
            );

            expect(found).toBeDefined();
            // Two siblings (b, c) should be in the skip list.
            expect(found!.selector.skipNodeIds).toHaveLength(2);
        });

        it('does not emit when the graph has no siblings to skip', () => {
            // Linear chain: a → b → dest. Only one path, nothing to trim.
            const a = makeNode({ title: 'A' });
            const b = makeNode({ title: 'B' });
            const dest = makeNode({
                title: 'Dest',
                stage: {
                    initiation: [],
                    policy: assessmentPolicy(),
                    termination: baseTermination(),
                },
            });

            const pathway = makePathway(
                [a, b, dest],
                [
                    { id: id(), from: a.id, to: b.id, type: 'prerequisite' },
                    { id: id(), from: b.id, to: dest.id, type: 'prerequisite' },
                ],
                dest.id,
            );

            const found = generateScenarios(pathway).find(
                s => s.kind === 'destination-only',
            );

            expect(found).toBeUndefined();
        });

        it('does not emit when the pathway has no destination', () => {
            const pathway = makeFanIn();
            const noDest: Pathway = { ...pathway, destinationNodeId: undefined };

            const found = generateScenarios(noDest).find(
                s => s.kind === 'destination-only',
            );

            expect(found).toBeUndefined();
        });

        it('mentions the exact sibling count in the subtitle', () => {
            const pathway = makeFanIn();

            const found = generateScenarios(pathway).find(
                s => s.kind === 'destination-only',
            );

            expect(found!.subtitle).toMatch(/2 sibling steps/);
        });

        it('authors effort:better + difficulty:worse tradeoffs', () => {
            const pathway = makeFanIn();

            const found = generateScenarios(pathway).find(
                s => s.kind === 'destination-only',
            );

            expect(found).toBeDefined();

            const effort = found!.authoredTradeoffs.find(
                t => t.dimension === 'effort',
            );
            const difficulty = found!.authoredTradeoffs.find(
                t => t.dimension === 'difficulty',
            );

            expect(effort?.direction).toBe('better');
            expect(difficulty?.direction).toBe('worse');
        });
    });
});
