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

    it('emits all three scenarios in order when every kind is present', () => {
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

        expect(scenarios.map(s => s.kind)).toEqual([
            'fast-track',
            'deep-practice',
            'external-light',
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
        expect(a[0]!.id).toBe('whatif-fast-track');
        expect(a[1]!.id).toBe('whatif-deep-practice');
        expect(a[2]!.id).toBe('whatif-external-light');
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
});
