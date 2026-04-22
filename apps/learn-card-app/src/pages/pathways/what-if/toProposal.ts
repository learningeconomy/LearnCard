/**
 * toProposal — bridge a What-If `Scenario` into a committable `Proposal`.
 *
 * What-If itself is a "look, don't touch" surface (see WhatIfMode
 * docstring). This module is the escape hatch that turns a scenario
 * the learner wants to try into a real proposal they can accept via
 * the existing `/pathways/proposals` pipeline.
 *
 * ## What converts, and what doesn't
 *
 * A scenario reduces to a pure `NodeSelector`. Two of the three
 * selector levers have schema-backed proposal diffs:
 *
 *   - `skipPolicyKinds` → node removals (elide whole nodes of a kind)
 *   - `skipNodeIds`     → node removals (elide specific nodes)
 *
 * The third lever, `effortMultiplierByKind`, doesn't map onto
 * `PathwayDiff`: our `Policy` schema is a discriminated union with
 * per-kind fields and `NodePatch`'s shallow `stage`-merge would
 * strip the other fields of the policy if we tried to patch
 * `estimatedMinutes` in place. Rather than silently lose data, we
 * refuse the conversion and surface that to the UI as "this
 * scenario is preview-only for now." Keeping the refusal honest
 * is better than shipping a proposal that mutates more than the
 * learner saw in the preview.
 *
 * Scenarios that mix skip + multiplier are also preview-only for
 * the same reason.
 *
 * ## Edge bridging
 *
 * When we remove a node mid-graph we bridge its incoming edges to
 * its outgoing edges so dependency chains stay connected. Without
 * that, removing an interior review node would orphan its
 * dependents from their ancestors and the destination could
 * silently become unreachable. Bridging is conservative — we only
 * add edges whose endpoints survive the removal (i.e. neither
 * endpoint is itself being skipped).
 *
 * The bridging edges are stamped with a `prerequisite` type; that's
 * the most honest default given the removed node was a prerequisite
 * of its dependents. A future revision could preserve the original
 * edge type when the remove-and-replace is 1-to-1, but it's not
 * necessary for correctness.
 */

import { v4 as uuid } from 'uuid';

import { buildAdjacency } from '../core/graphOps';
import type {
    Edge,
    Pathway,
    PathwayDiff,
    Proposal,
    Tradeoff,
} from '../types';

import type { Scenario } from './types';

// -----------------------------------------------------------------
// Conversion helpers
// -----------------------------------------------------------------

export interface ToProposalReason {
    kind: 'ok' | 'no-effect' | 'multiplier-unsupported' | 'empty-scenario';
    /** Human-readable one-liner the UI can show the learner. */
    message: string;
}

/**
 * Describe whether a scenario can be converted to a proposal and why.
 * Exposed as a standalone call so the UI can decide whether to show
 * an "Accept" button without constructing the full diff.
 */
export const classifyScenarioForProposal = (
    pathway: Pathway,
    scenario: Scenario,
): ToProposalReason => {
    const { selector } = scenario;

    const hasMultiplier =
        selector.effortMultiplierByKind !== undefined &&
        Object.keys(selector.effortMultiplierByKind).length > 0;

    const hasSkipKinds =
        selector.skipPolicyKinds !== undefined &&
        selector.skipPolicyKinds.length > 0;

    const hasSkipIds =
        selector.skipNodeIds !== undefined && selector.skipNodeIds.length > 0;

    if (!hasMultiplier && !hasSkipKinds && !hasSkipIds) {
        return {
            kind: 'empty-scenario',
            message: 'This scenario has no structural change to commit.',
        };
    }

    if (hasMultiplier) {
        return {
            kind: 'multiplier-unsupported',
            message:
                'Effort-scaling scenarios are preview-only right now; they can\u2019t be committed as a proposal yet.',
        };
    }

    // Pure-skip selector — compute the effective skip set against the
    // live pathway so we can say "no effect" honestly when the
    // targeted nodes don't exist here.
    const skipIds = resolveSkipIds(pathway, scenario);

    if (skipIds.size === 0) {
        return {
            kind: 'no-effect',
            message:
                'Nothing in this pathway matches the scenario\u2019s filters today.',
        };
    }

    return { kind: 'ok', message: 'Ready to convert.' };
};

// -----------------------------------------------------------------
// Skip set resolution
// -----------------------------------------------------------------

/**
 * Resolve the effective set of node ids a pure-skip scenario would
 * remove from the pathway. Completed nodes are never skipped — the
 * learner has already done that work, so even a "fast-track"
 * proposal leaves completed review nodes in the record.
 *
 * Exposed for tests and for the UI (so it can show "skips N steps"
 * before the learner commits).
 */
export const resolveSkipIds = (
    pathway: Pathway,
    scenario: Scenario,
): Set<string> => {
    const { selector } = scenario;
    const out = new Set<string>();

    const skipKinds = new Set(selector.skipPolicyKinds ?? []);
    const explicitIds = new Set(selector.skipNodeIds ?? []);

    for (const node of pathway.nodes) {
        if (node.progress.status === 'completed') continue;

        if (skipKinds.has(node.stage.policy.kind) || explicitIds.has(node.id)) {
            out.add(node.id);
        }
    }

    return out;
};

// -----------------------------------------------------------------
// Diff builder
// -----------------------------------------------------------------

/**
 * Build the `PathwayDiff` that implements a pure-skip scenario.
 *
 * Returns `null` when the scenario isn't convertible — mirrors the
 * same check `classifyScenarioForProposal` performs so callers can
 * use either entry point interchangeably.
 *
 * The returned diff is expressed purely in terms of node/edge
 * add/remove operations so `applyProposal` consumes it without
 * needing any What-If specific code.
 */
export const buildScenarioDiff = (
    pathway: Pathway,
    scenario: Scenario,
    makeId: () => string = uuid,
): PathwayDiff | null => {
    const classification = classifyScenarioForProposal(pathway, scenario);
    if (classification.kind !== 'ok') return null;

    const skipIds = resolveSkipIds(pathway, scenario);
    if (skipIds.size === 0) return null;

    // ---- Edge plumbing ------------------------------------------------
    //
    // 1. Every edge touching a skipped node is removed (applyProposal
    //    would drop it anyway; being explicit keeps the diff
    //    auditable).
    // 2. For each skipped node S, add bridging edges from each of
    //    its prereqs that *survives* to each of its dependents that
    //    *survives*. This keeps dependency chains intact.
    // 3. Bridging edges are deduped so a diamond-shaped skip doesn't
    //    produce multiple parallel edges between the same endpoints.

    const { prereqs, dependents } = buildAdjacency(pathway);

    const removeEdgeIds: string[] = [];
    for (const edge of pathway.edges) {
        if (skipIds.has(edge.from) || skipIds.has(edge.to)) {
            removeEdgeIds.push(edge.id);
        }
    }

    const bridgeKey = (from: string, to: string) => `${from}->${to}`;
    const bridgeSet = new Set<string>();

    // Seed with existing edges so a bridging edge that already exists
    // (because a prereq → dependent link is present directly) isn't
    // re-added. Skipped-touching edges aren't in the surviving set,
    // so they don't poison this seed.
    for (const edge of pathway.edges) {
        if (skipIds.has(edge.from) || skipIds.has(edge.to)) continue;
        bridgeSet.add(bridgeKey(edge.from, edge.to));
    }

    const addEdges: Edge[] = [];

    for (const id of skipIds) {
        const upstreams = prereqs.get(id) ?? [];
        const downstreams = dependents.get(id) ?? [];

        for (const from of upstreams) {
            if (skipIds.has(from)) continue;

            for (const to of downstreams) {
                if (skipIds.has(to)) continue;
                if (from === to) continue;

                const key = bridgeKey(from, to);
                if (bridgeSet.has(key)) continue;
                bridgeSet.add(key);

                addEdges.push({
                    id: makeId(),
                    from,
                    to,
                    type: 'prerequisite',
                });
            }
        }
    }

    return {
        addNodes: [],
        updateNodes: [],
        removeNodeIds: [...skipIds],
        addEdges,
        removeEdgeIds,
    };
};

// -----------------------------------------------------------------
// Proposal builder
// -----------------------------------------------------------------

export interface BuildProposalOptions {
    ownerDid: string;
    /** ISO timestamp; defaults to now. Stamps `createdAt` / `expiresAt`. */
    now?: string;
    /**
     * TTL for the proposal — how long after `now` it should
     * auto-expire. Defaults to 7 days, matching the router/planner
     * proposals in the mock agent.
     */
    ttlDays?: number;
    /** Id factory; defaults to `uuid`. Tests inject a deterministic one. */
    makeId?: () => string;
}

/**
 * Convert a convertible scenario into an open `Proposal`. The
 * resulting proposal carries the scenario's tradeoffs verbatim (so
 * the ProposalCard renders the same honesty table the learner saw
 * in What-If) and is attributed to the `router` agent — that's the
 * capability responsible for "alt path" proposals in the proposal
 * vocabulary.
 *
 * Returns `null` when the scenario isn't convertible; callers
 * should hide the Accept affordance in that case.
 */
export const buildProposalFromScenario = (
    pathway: Pathway,
    scenario: Scenario,
    extraTradeoffs: readonly Tradeoff[],
    options: BuildProposalOptions,
): Proposal | null => {
    const makeId = options.makeId ?? uuid;
    const now = options.now ?? new Date().toISOString();
    const ttlDays = options.ttlDays ?? 7;

    const diff = buildScenarioDiff(pathway, scenario, makeId);
    if (!diff) return null;

    const expiresAt = new Date(
        new Date(now).getTime() + ttlDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    // Merge the scenario's authored tradeoffs with any extras the
    // caller is piping through (typically the simulator-derived
    // time tradeoff computed against the live pathway). Dedupe by
    // dimension so a caller sending both authored and derived time
    // tradeoffs doesn't produce a duplicate row — the caller-passed
    // extras win because they reflect the live numeric delta.
    const seenDimensions = new Set<Tradeoff['dimension']>();
    const tradeoffs: Tradeoff[] = [];

    for (const t of extraTradeoffs) {
        if (seenDimensions.has(t.dimension)) continue;
        seenDimensions.add(t.dimension);
        tradeoffs.push(t);
    }

    for (const t of scenario.authoredTradeoffs) {
        if (seenDimensions.has(t.dimension)) continue;
        seenDimensions.add(t.dimension);
        tradeoffs.push(t);
    }

    return {
        id: makeId(),
        pathwayId: pathway.id,
        ownerDid: options.ownerDid,
        agent: 'router',
        capability: 'routing',
        reason: `What-If: ${scenario.title}. ${scenario.subtitle}`,
        diff,
        tradeoffs,
        status: 'open',
        createdAt: now,
        expiresAt,
    };
};
