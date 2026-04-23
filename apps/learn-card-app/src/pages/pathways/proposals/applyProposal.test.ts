import { describe, expect, it } from 'vitest';

import type {
    Edge,
    OutcomeBinding,
    OutcomeSignal,
    Pathway,
    PathwayDiff,
    PathwayNode,
    Proposal,
} from '../types';

import {
    ProposalApplyError,
    applyProposal,
    materializeNewPathway,
} from './applyProposal';

const NOW = '2026-04-20T12:00:00.000Z';
const LATER = '2026-04-21T12:00:00.000Z';

const node = (id: string, overrides: Partial<PathwayNode> = {}): PathwayNode => ({
    id,
    pathwayId: 'p1',
    title: id,
    stage: {
        initiation: [],
        policy: { kind: 'artifact', prompt: 'x', expectedArtifact: 'text' },
        termination: { kind: 'self-attest', prompt: 'done' },
    },
    endorsements: [],
    progress: {
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

const edge = (id: string, from: string, to: string): Edge => ({
    id,
    from,
    to,
    type: 'prerequisite',
});

const pathway = (
    nodes: PathwayNode[] = [],
    edges: Edge[] = [],
    overrides: Partial<Pathway> = {},
): Pathway => ({
    id: 'p1',
    ownerDid: 'did:test:learner',
    revision: 0,
    schemaVersion: 1,
    title: 'Test',
    goal: 'Test',
    nodes,
    edges,
    status: 'active',
    visibility: { self: true, mentors: false, guardians: false, publicProfile: false },
    source: 'authored',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
});

const emptyDiff = (overrides: Partial<PathwayDiff> = {}): PathwayDiff => ({
    addNodes: [],
    updateNodes: [],
    removeNodeIds: [],
    addEdges: [],
    removeEdgeIds: [],
    ...overrides,
});

const proposal = (
    diff: PathwayDiff,
    overrides: Partial<Proposal> = {},
): Proposal => ({
    id: 'prop-1',
    pathwayId: 'p1',
    ownerDid: 'did:test:learner',
    agent: 'planner',
    capability: 'planning',
    reason: 'test',
    diff,
    status: 'open',
    createdAt: NOW,
    ...overrides,
});

describe('applyProposal — in-pathway diffs', () => {
    it('adds new nodes and stamps pathwayId on them', () => {
        const before = pathway([node('a')]);
        const addition = node('b', { pathwayId: 'stale' });
        const after = applyProposal(
            before,
            proposal(emptyDiff({ addNodes: [addition] })),
            LATER,
        );

        expect(after.nodes.map(n => n.id)).toEqual(['a', 'b']);
        expect(after.nodes[1].pathwayId).toBe('p1');
        expect(after.updatedAt).toBe(LATER);
    });

    it('patches titles/descriptions without rewriting identity or progress', () => {
        const a = node('a', {
            progress: {
                status: 'in-progress',
                artifacts: [{ id: 'ev-1', artifactType: 'text', submittedAt: NOW }],
                reviewsDue: 0,
                streak: { current: 2, longest: 2, lastActiveAt: NOW },
            },
        });

        const before = pathway([a]);
        const after = applyProposal(
            before,
            proposal(
                emptyDiff({
                    updateNodes: [{ id: 'a', title: 'A (renamed)' }],
                }),
            ),
            LATER,
        );

        expect(after.nodes[0].title).toBe('A (renamed)');
        expect(after.nodes[0].pathwayId).toBe('p1');
        expect(after.nodes[0].createdBy).toBe('learner');
        expect(after.nodes[0].progress.status).toBe('in-progress');
        expect(after.nodes[0].progress.artifacts).toHaveLength(1);
    });

    it('removes nodes and prunes any edge referencing them', () => {
        const before = pathway(
            [node('a'), node('b'), node('c')],
            [edge('e1', 'a', 'b'), edge('e2', 'b', 'c')],
        );

        const after = applyProposal(
            before,
            proposal(emptyDiff({ removeNodeIds: ['b'] })),
            LATER,
        );

        expect(after.nodes.map(n => n.id)).toEqual(['a', 'c']);
        expect(after.edges).toEqual([]);
    });

    it('adds new edges when both endpoints exist in the result', () => {
        const before = pathway([node('a'), node('b')]);

        const after = applyProposal(
            before,
            proposal(emptyDiff({ addEdges: [edge('e1', 'a', 'b')] })),
            LATER,
        );

        expect(after.edges).toHaveLength(1);
        expect(after.edges[0].from).toBe('a');
    });

    it('deduplicates edges by id on reapply', () => {
        const before = pathway([node('a'), node('b')], [edge('e1', 'a', 'b')]);

        const after = applyProposal(
            before,
            proposal(emptyDiff({ addEdges: [edge('e1', 'a', 'b')] })),
            LATER,
        );

        expect(after.edges).toHaveLength(1);
    });

    it('rejects updates against unknown node ids', () => {
        const before = pathway([node('a')]);

        expect(() =>
            applyProposal(
                before,
                proposal(
                    emptyDiff({
                        updateNodes: [{ id: 'ghost', title: 'nope' }],
                    }),
                ),
            ),
        ).toThrow(ProposalApplyError);
    });

    it('rejects additions whose id collides with an existing node', () => {
        const before = pathway([node('a')]);

        expect(() =>
            applyProposal(
                before,
                proposal(emptyDiff({ addNodes: [node('a')] })),
            ),
        ).toThrow(ProposalApplyError);
    });

    it('rejects new edges whose endpoints do not exist in the result', () => {
        const before = pathway([node('a')]);

        expect(() =>
            applyProposal(
                before,
                proposal(emptyDiff({ addEdges: [edge('e1', 'a', 'ghost')] })),
            ),
        ).toThrow(ProposalApplyError);
    });

    it('refuses to apply a proposal that targets a different pathway', () => {
        const before = pathway([node('a')]);

        expect(() =>
            applyProposal(
                before,
                proposal(emptyDiff(), { pathwayId: 'other-pathway' }),
            ),
        ).toThrow(ProposalApplyError);
    });

    it('accepts a cross-pathway proposal when applied to a concrete pathway (edge-add surface only)', () => {
        const before = pathway([node('a'), node('b')]);

        const after = applyProposal(
            before,
            proposal(emptyDiff({ addEdges: [edge('e1', 'a', 'b')] }), {
                pathwayId: null,
            }),
            LATER,
        );

        expect(after.edges).toHaveLength(1);
    });

    it('is pure — original pathway is not mutated', () => {
        const before = pathway([node('a')]);
        const snapshot = JSON.parse(JSON.stringify(before));

        applyProposal(
            before,
            proposal(emptyDiff({ addNodes: [node('b')] })),
            LATER,
        );

        expect(before).toEqual(snapshot);
    });

    // -----------------------------------------------------------------
    // chosenRoute pruning
    //
    // `applyProposal` is the only commit seam, so it's the right place
    // to keep chosenRoute honest when a diff removes nodes. Re-seeding
    // is intentionally *not* done here — callers who want that layer it
    // on top.
    // -----------------------------------------------------------------

    it('prunes chosenRoute ids that reference removed nodes', () => {
        const before = pathway(
            [node('a'), node('b'), node('c'), node('d')],
            [],
            { chosenRoute: ['a', 'b', 'c', 'd'] },
        );

        const after = applyProposal(
            before,
            proposal(emptyDiff({ removeNodeIds: ['b'] })),
            LATER,
        );

        expect(after.chosenRoute).toEqual(['a', 'c', 'd']);
    });

    it('preserves chosenRoute when the diff removes nothing on it', () => {
        const before = pathway(
            [node('a'), node('b'), node('c')],
            [],
            { chosenRoute: ['a', 'b', 'c'] },
        );

        const after = applyProposal(
            before,
            proposal(emptyDiff({ addNodes: [node('d')] })),
            LATER,
        );

        expect(after.chosenRoute).toEqual(['a', 'b', 'c']);
    });

    it('drops chosenRoute entirely when pruning leaves fewer than two ids', () => {
        // Route = [a, b]; remove b → route would degenerate to [a].
        // pruneChosenRoute returns undefined in that case so Today
        // falls back to ranking rather than committing to a one-node
        // "route."
        const before = pathway(
            [node('a'), node('b')],
            [],
            { chosenRoute: ['a', 'b'] },
        );

        const after = applyProposal(
            before,
            proposal(emptyDiff({ removeNodeIds: ['b'] })),
            LATER,
        );

        expect(after.chosenRoute).toBeUndefined();
    });

    it('leaves chosenRoute absent when it was absent to begin with', () => {
        const before = pathway([node('a'), node('b')]);

        const after = applyProposal(
            before,
            proposal(emptyDiff({ addNodes: [node('c')] })),
            LATER,
        );

        expect(after.chosenRoute).toBeUndefined();
    });

    // -----------------------------------------------------------------
    // setChosenRoute (route-swap diffs)
    //
    // `diff.setChosenRoute` is the What-If / Router route-swap
    // channel: a proposal that changes *which walk* the learner
    // commits to, without touching the graph. It also wins over the
    // prune-from-existing-route path below when both are applicable.
    // -----------------------------------------------------------------

    it('applies setChosenRoute onto a pathway that had no prior route', () => {
        const before = pathway([node('a'), node('b'), node('c')]);

        const after = applyProposal(
            before,
            proposal(emptyDiff({ setChosenRoute: ['a', 'b', 'c'] })),
            LATER,
        );

        expect(after.chosenRoute).toEqual(['a', 'b', 'c']);
        // Graph intact.
        expect(after.nodes).toHaveLength(3);
    });

    it('setChosenRoute overwrites an existing chosenRoute', () => {
        const before = pathway(
            [node('a'), node('b'), node('c')],
            [],
            { chosenRoute: ['a', 'b', 'c'] },
        );

        const after = applyProposal(
            before,
            proposal(emptyDiff({ setChosenRoute: ['a', 'c'] })),
            LATER,
        );

        expect(after.chosenRoute).toEqual(['a', 'c']);
    });

    it('setChosenRoute wins over prune-of-existing-route when both apply', () => {
        // Proposal removes node `b` AND supplies a brand-new route.
        // The setChosenRoute wins — we use the proposal's explicit
        // route as the source-of-truth, not pathway.chosenRoute minus
        // removed ids. Both paths then filter against the survivor
        // set, so the explicit route is still pruned for safety.
        const before = pathway(
            [node('a'), node('b'), node('c'), node('d')],
            [],
            { chosenRoute: ['a', 'b', 'c', 'd'] },
        );

        const after = applyProposal(
            before,
            proposal(
                emptyDiff({
                    removeNodeIds: ['b'],
                    setChosenRoute: ['a', 'd'],
                }),
            ),
            LATER,
        );

        expect(after.chosenRoute).toEqual(['a', 'd']);
    });

    it('setChosenRoute is filtered against survivor ids so stale entries are dropped', () => {
        // Pathological case: the proposal names a route id that the
        // same proposal also removes. Filter through the same pruning
        // pipeline so the route can't reference a vanished node.
        const before = pathway([node('a'), node('b'), node('c')]);

        const after = applyProposal(
            before,
            proposal(
                emptyDiff({
                    removeNodeIds: ['b'],
                    // b is removed; a, c survive.
                    setChosenRoute: ['a', 'b', 'c'],
                }),
            ),
            LATER,
        );

        expect(after.chosenRoute).toEqual(['a', 'c']);
    });

    it('an empty setChosenRoute clears the field (honors the learner intent)', () => {
        const before = pathway(
            [node('a'), node('b')],
            [],
            { chosenRoute: ['a', 'b'] },
        );

        const after = applyProposal(
            before,
            proposal(emptyDiff({ setChosenRoute: [] })),
            LATER,
        );

        expect(after.chosenRoute).toBeUndefined();
    });
});

describe('materializeNewPathway — cross-pathway proposals', () => {
    const OWNER = 'did:test:learner';

    it('creates a fresh pathway from the newPathway hint', () => {
        let i = 0;
        const makeId = () => `mk-${++i}`;

        const result = materializeNewPathway(
            proposal(
                emptyDiff({
                    addNodes: [node('n1', { pathwayId: 'stale' })],
                    newPathway: { title: 'Ship an essay', goal: 'Write 1 essay' },
                }),
                { pathwayId: null, agent: 'matcher', capability: 'matching' },
            ),
            { ownerDid: OWNER, now: LATER, makeId },
        );

        expect(result.title).toBe('Ship an essay');
        expect(result.source).toBe('generated');
        expect(result.ownerDid).toBe(OWNER);
        expect(result.createdAt).toBe(LATER);
        expect(result.nodes[0].pathwayId).toBe(result.id);
    });

    it('throws when called on an in-pathway proposal', () => {
        expect(() =>
            materializeNewPathway(proposal(emptyDiff()), {
                ownerDid: OWNER,
                now: LATER,
            }),
        ).toThrow(ProposalApplyError);
    });

    it('throws when the proposal is cross-pathway but lacks a newPathway hint', () => {
        expect(() =>
            materializeNewPathway(
                proposal(emptyDiff(), { pathwayId: null }),
                { ownerDid: OWNER, now: LATER },
            ),
        ).toThrow(ProposalApplyError);
    });
});

// ---------------------------------------------------------------------------
// Composite invariant + cycle guard
// ---------------------------------------------------------------------------

describe('applyProposal — composite guard', () => {
    // Compose-ready ids that satisfy the uuid shape used by the Zod
    // schema. Keeping them as constants makes the intent obvious.
    const REF_A = '00000000-0000-4000-8000-00000000000a';
    const REF_B = '00000000-0000-4000-8000-00000000000b';

    const compositeNode = (id: string, ref: string): PathwayNode =>
        node(id, {
            stage: {
                initiation: [],
                policy: {
                    kind: 'composite',
                    pathwayRef: ref,
                    renderStyle: 'inline-expandable',
                },
                termination: { kind: 'pathway-completed', pathwayRef: ref },
            },
        });

    it('accepts a well-formed composite node add', () => {
        const before = pathway();

        const after = applyProposal(
            before,
            proposal(emptyDiff({ addNodes: [compositeNode('c1', REF_B)] })),
            LATER,
        );

        expect(after.nodes[0].stage.policy.kind).toBe('composite');
    });

    it('rejects a composite policy without paired pathway-completed termination', () => {
        const broken = node('c1', {
            stage: {
                initiation: [],
                policy: {
                    kind: 'composite',
                    pathwayRef: REF_B,
                    renderStyle: 'inline-expandable',
                },
                termination: { kind: 'self-attest', prompt: 'x' },
            },
        });

        expect(() =>
            applyProposal(pathway(), proposal(emptyDiff({ addNodes: [broken] })), LATER),
        ).toThrow(/composite policy must be paired/);
    });

    it('rejects a pathway-completed termination without composite policy', () => {
        const broken = node('c1', {
            stage: {
                initiation: [],
                policy: { kind: 'artifact', prompt: 'x', expectedArtifact: 'text' },
                termination: { kind: 'pathway-completed', pathwayRef: REF_B },
            },
        });

        expect(() =>
            applyProposal(pathway(), proposal(emptyDiff({ addNodes: [broken] })), LATER),
        ).toThrow(/composite policy must be paired/);
    });

    it('rejects a composite whose policy ref mismatches its termination ref', () => {
        const broken = node('c1', {
            stage: {
                initiation: [],
                policy: {
                    kind: 'composite',
                    pathwayRef: REF_A,
                    renderStyle: 'inline-expandable',
                },
                // Mismatch: termination points at a different pathway.
                termination: { kind: 'pathway-completed', pathwayRef: REF_B },
            },
        });

        expect(() =>
            applyProposal(pathway(), proposal(emptyDiff({ addNodes: [broken] })), LATER),
        ).toThrow(/reference different pathways/);
    });

    it('rejects self-reference (composite pointing at its own pathway)', () => {
        const selfRefParent = pathway([], [], { id: REF_A });
        const selfRef = node('c1', {
            pathwayId: REF_A,
            stage: {
                initiation: [],
                policy: {
                    kind: 'composite',
                    pathwayRef: REF_A,
                    renderStyle: 'inline-expandable',
                },
                termination: { kind: 'pathway-completed', pathwayRef: REF_A },
            },
        });

        expect(() =>
            applyProposal(
                selfRefParent,
                proposal(emptyDiff({ addNodes: [selfRef] }), { pathwayId: REF_A }),
                LATER,
            ),
        ).toThrow(/self-reference/);
    });

    it('rejects a composite ref that closes a cross-pathway cycle', () => {
        // B already composites A. Proposing that A composites B would
        // close A→B→A. We feed the current map so wouldCreateCycle can
        // see B's existing composite edge.
        const b = pathway([compositeNode('n-b', REF_A)], [], { id: REF_B });
        const a = pathway([], [], { id: REF_A });

        expect(() =>
            applyProposal(
                a,
                proposal(
                    emptyDiff({ addNodes: [compositeNode('n-a', REF_B)] }),
                    { pathwayId: REF_A },
                ),
                LATER,
                { allPathways: { [REF_A]: a, [REF_B]: b } },
            ),
        ).toThrow(/composition cycle/);
    });

    it('accepts a composite ref that does NOT create a cycle', () => {
        const b = pathway([], [], { id: REF_B });
        const a = pathway([], [], { id: REF_A });

        const after = applyProposal(
            a,
            proposal(
                emptyDiff({ addNodes: [compositeNode('n-a', REF_B)] }),
                { pathwayId: REF_A },
            ),
            LATER,
            { allPathways: { [REF_A]: a, [REF_B]: b } },
        );

        expect(after.nodes[0].stage.policy.kind).toBe('composite');
    });
});

// ---------------------------------------------------------------------------
// Outcome bindings — learner-visible outcomes satisfied via proposal.
// ---------------------------------------------------------------------------

describe('applyProposal — outcome bindings', () => {
    const OUTCOME_ID = '00000000-0000-4000-8000-00000000abcd';

    const satOutcome = (overrides: Partial<OutcomeSignal> = {}): OutcomeSignal =>
        ({
            id: OUTCOME_ID,
            label: 'SAT ≥ 1400',
            kind: 'score-threshold',
            expectedCredentialType: 'CollegeBoardSATScore',
            field: 'score.total',
            op: '>=',
            value: 1400,
            minTrustTier: 'institution',
            ...overrides,
        }) as OutcomeSignal;

    const binding = (overrides: Partial<OutcomeBinding> = {}): OutcomeBinding => ({
        credentialUri: 'urn:uuid:vc-1',
        boundAt: NOW,
        boundVia: 'auto',
        issuerTrustTier: 'institution',
        observedValue: 1450,
        outOfWindow: false,
        ...overrides,
    });

    it('records a binding on the targeted outcome', () => {
        const before = pathway([], [], { outcomes: [satOutcome()] });

        const after = applyProposal(
            before,
            proposal(
                emptyDiff({
                    setOutcomeBindings: [{ outcomeId: OUTCOME_ID, binding: binding() }],
                }),
            ),
            LATER,
        );

        const [outcome] = after.outcomes ?? [];

        expect(outcome).toBeDefined();
        expect(outcome.binding).toEqual(binding());
    });

    it('clears a prior binding when the patch is null', () => {
        const before = pathway([], [], {
            outcomes: [satOutcome({ binding: binding({ credentialUri: 'urn:uuid:old' }) })],
        });

        const after = applyProposal(
            before,
            proposal(
                emptyDiff({
                    setOutcomeBindings: [{ outcomeId: OUTCOME_ID, binding: null }],
                }),
            ),
            LATER,
        );

        const [outcome] = after.outcomes ?? [];

        expect(outcome.binding).toBeUndefined();
    });

    it('silently drops patches for unknown outcome ids', () => {
        const before = pathway([], [], { outcomes: [satOutcome()] });

        const after = applyProposal(
            before,
            proposal(
                emptyDiff({
                    setOutcomeBindings: [
                        {
                            outcomeId: '00000000-0000-4000-8000-00000000ffff',
                            binding: binding(),
                        },
                    ],
                }),
            ),
            LATER,
        );

        // Outcome list survives unchanged; no crash.
        expect(after.outcomes).toHaveLength(1);
        expect(after.outcomes?.[0].binding).toBeUndefined();
    });

    it('leaves outcomes reference-equal when no binding patches are supplied', () => {
        const outcomes = [satOutcome()];
        const before = pathway([], [], { outcomes });

        const after = applyProposal(before, proposal(emptyDiff({})), LATER);

        expect(after.outcomes).toBe(outcomes);
    });

    it('applies multiple binding patches in one proposal', () => {
        const OUTCOME_ID_B = '00000000-0000-4000-8000-00000000ef00';

        const before = pathway([], [], {
            outcomes: [
                satOutcome(),
                satOutcome({ id: OUTCOME_ID_B, label: 'Other' }),
            ],
        });

        const after = applyProposal(
            before,
            proposal(
                emptyDiff({
                    setOutcomeBindings: [
                        { outcomeId: OUTCOME_ID, binding: binding() },
                        {
                            outcomeId: OUTCOME_ID_B,
                            binding: binding({ credentialUri: 'urn:uuid:vc-b', observedValue: 1500 }),
                        },
                    ],
                }),
            ),
            LATER,
        );

        expect(after.outcomes?.[0].binding?.credentialUri).toBe('urn:uuid:vc-1');
        expect(after.outcomes?.[1].binding?.credentialUri).toBe('urn:uuid:vc-b');
    });
});

// ---------------------------------------------------------------------------
// Owner invariants + revision bumping — the CAS hinge proposals must
// participate in alongside learner-origin mutations.
// ---------------------------------------------------------------------------

describe('applyProposal — owner invariants', () => {
    it('refuses a proposal whose ownerDid does not match the target pathway', () => {
        // A cross-owner apply is the client-side check that becomes the
        // server-side authorization check at wire-up. Catches a mentor
        // proposal routed into the wrong learner's store, or a replay
        // bug that re-targets a proposal at someone else's pathway.
        const target = pathway([node('a')]);
        const misrouted = proposal(emptyDiff({ addNodes: [node('b')] }), {
            ownerDid: 'did:test:someone-else',
        });

        expect(() => applyProposal(target, misrouted, LATER)).toThrow(ProposalApplyError);
        // Sanity-check the error message mentions both DIDs so
        // debugging has something actionable.
        try {
            applyProposal(target, misrouted, LATER);
        } catch (err) {
            const message = (err as Error).message;
            expect(message).toContain('did:test:learner');
            expect(message).toContain('did:test:someone-else');
        }
    });

    it('accepts a proposal whose ownerDid matches', () => {
        const target = pathway([node('a')]);
        const matching = proposal(emptyDiff({ addNodes: [node('b')] }));

        expect(() => applyProposal(target, matching, LATER)).not.toThrow();
    });
});

describe('applyProposal — revision bumping', () => {
    it('bumps the target pathway revision by exactly one on a structural apply', () => {
        // Proposals are structural edits — they must participate in
        // the same CAS hinge as learner-origin mutations, so
        // server-side optimistic-concurrency writes see a monotonic
        // sequence regardless of who authored the change.
        const target = pathway([node('a')], [], { revision: 7 });
        const p = proposal(emptyDiff({ addNodes: [node('b')] }));

        const after = applyProposal(target, p, LATER);

        expect(after.revision).toBe(8);
    });

    it('bumps revision even on a no-op diff (a proposal acceptance is itself an event)', () => {
        // Honest contract: "the learner accepted a proposal" is
        // something we want to be able to tell happened by looking at
        // the revision sequence, even if the diff ultimately didn't
        // mutate content (e.g. an endorse-only proposal).
        const target = pathway([node('a')], [], { revision: 3 });
        const p = proposal(emptyDiff());

        const after = applyProposal(target, p, LATER);

        expect(after.revision).toBe(4);
    });

    it('tolerates legacy pathways that pre-date the revision field', () => {
        // `?? 0` fallback exists precisely for this: a pre-field
        // document should upgrade to revision 1 on first post-field
        // write rather than blowing up with NaN.
        const target = {
            ...pathway([node('a')]),
        } as Partial<Pathway> as Pathway;
        delete (target as Partial<Pathway>).revision;

        const p = proposal(emptyDiff({ addNodes: [node('b')] }));
        const after = applyProposal(target, p, LATER);

        expect(after.revision).toBe(1);
    });
});

describe('materializeNewPathway — versioning', () => {
    const OWNER = 'did:test:learner';

    it('stamps revision 0 and current schemaVersion on cross-pathway materialization', () => {
        // A brand-new pathway produced from a Matcher proposal should
        // start at revision 0 — the same baseline as a freshly-authored
        // pathway — so the first subsequent mutation produces a
        // discernible bump.
        const hintDiff = emptyDiff({
            addNodes: [node('a')],
            newPathway: { title: 'Fresh', goal: 'test' },
        });

        const fresh = materializeNewPathway(
            proposal(hintDiff, { pathwayId: null, agent: 'matcher', capability: 'matching' }),
            { ownerDid: OWNER, now: LATER },
        );

        expect(fresh.revision).toBe(0);
        expect(fresh.schemaVersion).toBe(1);
    });
});
