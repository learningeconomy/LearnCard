/**
 * toProposal — bridge a What-If `Scenario` into a committable `Proposal`.
 *
 * What-If itself is a "look, don't touch" surface (see WhatIfMode
 * docstring). This module is the escape hatch that turns a scenario
 * the learner wants to try into a real proposal they can accept via
 * the existing `/pathways/proposals` pipeline.
 *
 * ## Route swaps, not graph surgery
 *
 * Every accepted scenario ships as a **route swap**: the proposal's
 * `diff.setChosenRoute` overwrites the pathway's committed walk so
 * the learner now traverses the alternative the scenario described.
 * The underlying graph stays intact — review nodes, external nodes,
 * composite sub-pathways remain available in the Map's depth-2
 * surface; they've simply dropped off the committed route.
 *
 * This is deliberately more honest than destructive removal:
 *
 *   - **Non-destructive.** The learner's record still includes every
 *     node the pathway was authored with. A fast-track decision
 *     today doesn't erase the deep-practice option tomorrow.
 *   - **Reversible.** Swap back to the original walk with another
 *     route-swap proposal; no structural re-creation required.
 *   - **Map analogy holds.** The Map renders the chosen route
 *     emerald-solid and the alternates in grayscale — exactly like
 *     Google Maps offering "2 alternate routes" that you can toggle
 *     between without rebuilding the map.
 *
 * ## What converts, and what doesn't
 *
 * A scenario reduces to a pure `NodeSelector`. Two of the three
 * selector levers produce meaningful route swaps:
 *
 *   - `skipPolicyKinds` → drop every uncompleted route node whose
 *                         policy matches from the committed walk.
 *   - `skipNodeIds`     → drop specific ids from the committed walk.
 *
 * The third lever, `effortMultiplierByKind`, doesn't map onto a
 * route swap: changing *how long* a node takes is a node-level
 * policy edit, not a walk selection. For the MVP it stays
 * preview-only, and `classifyScenarioForProposal` says so
 * explicitly — better to refuse honestly than ship a proposal that
 * can't deliver what the preview promised.
 *
 * Scenarios that mix skip + multiplier are preview-only for the
 * same reason.
 *
 * ## Baseline route
 *
 * The scenario operates against the pathway's `chosenRoute`. When
 * the pathway already has one, we filter. When it doesn't (pathways
 * created before chosenRoute existed, or pathways without a
 * destination), we derive a baseline via `seedChosenRoute` — the
 * same helper `instantiateTemplate` / `assembleBundle` use — and
 * filter *that*. If no baseline can be derived (no destination, no
 * reachable entry), the scenario is reported as `no-effect`.
 */

import { v4 as uuid } from 'uuid';

import { seedChosenRoute } from '../core/chosenRoute';
import type { Pathway, PathwayDiff, Proposal, Tradeoff } from '../types';

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

    // Pure-skip selector — the honest "will accepting this change
    // anything?" check uses the committed walk, not the whole graph.
    // Computing the target route also doubles as a dry-run of the
    // diff builder; any mismatch would be a bug.
    const targetRoute = computeTargetRoute(pathway, scenario);

    if (!targetRoute) {
        return {
            kind: 'no-effect',
            message:
                'Nothing on your route matches the scenario\u2019s filters today.',
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
// Target route computation
// -----------------------------------------------------------------

/**
 * Compute the route the scenario *proposes the learner walk* after
 * accepting. Returns `null` when the scenario would produce no
 * change (filters don't overlap the committed walk, or the
 * remainder can't form a valid walk of two-plus nodes).
 *
 * The baseline is the pathway's `chosenRoute` when set; otherwise
 * we derive one via `seedChosenRoute` so What-If works against
 * pathways that haven't committed to a route yet (legacy pathways,
 * pathways where the route was pruned away). Filtering then drops
 * every skipped id in place, preserving order.
 *
 * Exposed for tests and for the UI's "skips N route steps" preview.
 */
export const computeTargetRoute = (
    pathway: Pathway,
    scenario: Scenario,
): string[] | null => {
    const baseline = pathway.chosenRoute ?? seedChosenRoute(pathway);
    if (baseline.length < 2) return null;

    const skipIds = resolveSkipIds(pathway, scenario);
    if (skipIds.size === 0) return null;

    const target = baseline.filter(id => !skipIds.has(id));

    // No overlap → nothing to swap.
    if (target.length === baseline.length) return null;

    // Swapping to a one-node walk is degenerate; treat it as
    // "no meaningful swap" and let the UI fall back to preview-only.
    if (target.length < 2) return null;

    return target;
};

// -----------------------------------------------------------------
// Diff builder
// -----------------------------------------------------------------

/**
 * Build the `PathwayDiff` that implements a scenario acceptance.
 *
 * The diff is **non-structural**: no nodes are added or removed,
 * no edges are touched. The entire change is expressed as a
 * `setChosenRoute` route swap — `applyProposal` overwrites the
 * pathway's committed walk with the new route while leaving every
 * node and edge in place.
 *
 * Returns `null` when the scenario isn't convertible (same semantics
 * as `classifyScenarioForProposal`).
 */
export const buildScenarioDiff = (
    pathway: Pathway,
    scenario: Scenario,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _makeId: () => string = uuid,
): PathwayDiff | null => {
    const classification = classifyScenarioForProposal(pathway, scenario);
    if (classification.kind !== 'ok') return null;

    const target = computeTargetRoute(pathway, scenario);
    if (!target) return null;

    return {
        addNodes: [],
        updateNodes: [],
        removeNodeIds: [],
        addEdges: [],
        removeEdgeIds: [],
        setChosenRoute: target,
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
