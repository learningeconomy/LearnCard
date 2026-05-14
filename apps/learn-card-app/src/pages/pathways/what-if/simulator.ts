/**
 * What-If simulator — pure runner that turns a Scenario into a
 * `ScenarioResult`.
 *
 * ## Why a parallel runner (and not reuse `map/route.ts`)
 *
 * `computeSuggestedRoute` already does topology-aware work over a
 * pathway, but it bundles three concerns together (ordered node list
 * for rendering, edge set for the ribbon, ETA aggregate) that the
 * What-If surface doesn't need. All we want here is "how much
 * uncompleted-work-effort sits between focus and destination under
 * this selector?" — a narrow aggregation over the destination's
 * ancestor closure.
 *
 * Keeping the runner local also means the Map can evolve its
 * render-ordering heuristics without shifting numeric What-If
 * output, and vice versa.
 *
 * ## Purity contract
 *
 * No I/O, no wall-clock reads, no store access. Inputs → outputs
 * only, so the UI layer can memoize and tests can stamp inputs in
 * and assert on deltas with no fixtures beyond `Pathway` values.
 */

import { buildAdjacency } from '../core/graphOps';
import type { Pathway, PathwayNode, Policy, Tradeoff } from '../types';

import { nodeEffortMinutes } from '../map/route';

import type {
    NodeSelector,
    Scenario,
    ScenarioResult,
    SimulationSummary,
} from './types';

// -----------------------------------------------------------------
// Focus inference
// -----------------------------------------------------------------

/**
 * Pick the node the simulation should anchor on. What-If doesn't have
 * the interactive "focus pin" the Map has, so we derive it from the
 * learner's real progress:
 *
 *   1. The first `in-progress` node in pathway insertion order.
 *   2. Otherwise, the first `not-started` node.
 *   3. Otherwise, the first node at all (handles "just created,
 *      nothing started" pathways without returning null prematurely).
 *
 * Returns `null` only when the pathway has zero nodes.
 */
export const inferSimulationFocus = (pathway: Pathway): string | null => {
    const inProgress = pathway.nodes.find(n => n.progress.status === 'in-progress');
    if (inProgress) return inProgress.id;

    const notStarted = pathway.nodes.find(n => n.progress.status === 'not-started');
    if (notStarted) return notStarted.id;

    return pathway.nodes[0]?.id ?? null;
};

// -----------------------------------------------------------------
// Ancestor closure of the destination
// -----------------------------------------------------------------

/**
 * Every node that reaches `destinationId` via forward edges, plus
 * the destination itself. Mirrors the "journey zone" concept from
 * `map/route.ts` but exposed as a standalone helper here so the
 * simulator can aggregate work without depending on a full
 * `SuggestedRoute`.
 */
const journeyZone = (pathway: Pathway, destinationId: string): Set<string> => {
    const { prereqs } = buildAdjacency(pathway);

    const zone = new Set<string>([destinationId]);
    const queue: string[] = [destinationId];

    while (queue.length > 0) {
        const at = queue.shift()!;

        for (const p of prereqs.get(at) ?? []) {
            if (zone.has(p)) continue;
            zone.add(p);
            queue.push(p);
        }
    }

    return zone;
};

// -----------------------------------------------------------------
// Selector predicates
// -----------------------------------------------------------------

/**
 * True when the selector wants this node elided from the
 * simulated work set. Completed nodes never show up regardless of
 * selector — the baseline has already done that work.
 */
const isSkipped = (node: PathwayNode, selector: NodeSelector): boolean => {
    if (selector.skipNodeIds?.includes(node.id)) return true;

    if (selector.skipPolicyKinds?.includes(node.stage.policy.kind)) return true;

    return false;
};

/**
 * Effort multiplier for a node under a selector. Defaults to 1.0 —
 * i.e. honors the pathway's authored (or per-kind default) minutes.
 */
const effortMultiplier = (
    policyKind: Policy['kind'],
    selector: NodeSelector,
): number => {
    const raw = selector.effortMultiplierByKind?.[policyKind];

    if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 0) return 1.0;

    return raw;
};

// -----------------------------------------------------------------
// Core simulate
// -----------------------------------------------------------------

/**
 * Walk the destination's ancestor closure and aggregate work for
 * the given selector. Produces a `SimulationSummary` directly —
 * no per-step rendering concerns, no topo sort.
 *
 * Returns a `null`-populated summary (but still a valid object
 * the UI can degrade against) when:
 *   - the pathway has no `destinationNodeId`
 *   - the focus doesn't exist
 *   - the focus can't reach the destination
 *
 * A present-but-completed destination is a valid state: all remaining
 * steps → 0, ETA → 0, summarizing "you're done" honestly.
 */
export const simulate = (
    pathway: Pathway,
    focusId: string | null,
    selector: NodeSelector,
): SimulationSummary => {
    const destinationId = pathway.destinationNodeId;
    const nodeById = new Map(pathway.nodes.map(n => [n.id, n]));

    const unroutable: SimulationSummary = {
        remainingSteps: null,
        etaMinutes: null,
        skippedNodeIds: [],
    };

    if (!destinationId) return unroutable;
    if (!focusId || !nodeById.has(focusId)) return unroutable;
    if (!nodeById.has(destinationId)) return unroutable;

    const zone = journeyZone(pathway, destinationId);

    // Focus must be in the ancestor closure of destination (or be the
    // destination itself). If it isn't, the simulator can't honestly
    // say what "finishing from here" costs.
    if (focusId !== destinationId && !zone.has(focusId)) return unroutable;

    let etaMinutes = 0;
    let remainingSteps = 0;
    const skippedNodeIds: string[] = [];

    for (const id of zone) {
        const node = nodeById.get(id);
        if (!node) continue;

        // Already-done work never contributes and never gets a "skipped"
        // label; there's nothing to skip.
        if (node.progress.status === 'completed') continue;

        if (isSkipped(node, selector)) {
            skippedNodeIds.push(id);
            continue;
        }

        const mins = nodeEffortMinutes(node) *
            effortMultiplier(node.stage.policy.kind, selector);

        etaMinutes += mins;
        remainingSteps += 1;
    }

    return {
        remainingSteps,
        etaMinutes: Math.round(etaMinutes),
        // Sort so two runs over the same input produce byte-identical
        // output — helpful for snapshot tests and memoization.
        skippedNodeIds: skippedNodeIds.slice().sort(),
    };
};

// -----------------------------------------------------------------
// Scenario → ScenarioResult
// -----------------------------------------------------------------

/**
 * The baseline scenario selector — "change nothing". Exposed so
 * callers can share the same code path for the baseline row and
 * the scenario rows, and so tests can assert "baseline + empty
 * scenario === baseline" deterministically.
 */
export const BASELINE_SELECTOR: NodeSelector = Object.freeze({});

/**
 * The shared authored-tradeoff augmenter. When the simulation
 * produces a non-trivial ETA delta, we surface it as a `time`
 * tradeoff so the UI's tradeoff table always has a numerically-
 * grounded row. Authored tradeoffs are preserved verbatim.
 */
const timeTradeoffFromDelta = (
    etaDelta: number | null,
): Tradeoff | null => {
    if (etaDelta === null) return null;
    // Treat a < 5-minute change as "same time" — beneath the noise
    // floor of our per-kind defaults. Prevents noisy tradeoff rows
    // like "about 1m less" on big pathways.
    if (Math.abs(etaDelta) < 5) return null;

    const absMin = Math.abs(etaDelta);
    const absText =
        absMin < 60
            ? `${Math.round(absMin)} min`
            : `${Math.round((absMin / 60) * 10) / 10} hr`;

    return {
        dimension: 'time',
        deltaDescription:
            etaDelta < 0
                ? `About ${absText} less of work`
                : `About ${absText} more of work`,
        direction: etaDelta < 0 ? 'better' : 'worse',
    };
};

/**
 * Apply a single scenario to a pathway and produce the full result
 * (baseline + simulation + deltas + tradeoffs). Pure.
 *
 * When the pathway is unroutable (no destination, no focus, etc.),
 * returns a result whose summaries have `null` metrics. Tradeoffs
 * in that case are the authored ones only — the time dimension gets
 * dropped rather than fabricated.
 */
export const simulateScenario = (
    pathway: Pathway,
    scenario: Scenario,
): ScenarioResult => {
    const focusId = inferSimulationFocus(pathway);

    const baseline = simulate(pathway, focusId, BASELINE_SELECTOR);
    const simulation = simulate(pathway, focusId, scenario.selector);

    const etaDelta =
        baseline.etaMinutes === null || simulation.etaMinutes === null
            ? null
            : simulation.etaMinutes - baseline.etaMinutes;

    const stepsDelta =
        baseline.remainingSteps === null || simulation.remainingSteps === null
            ? null
            : simulation.remainingSteps - baseline.remainingSteps;

    const timeTradeoff = timeTradeoffFromDelta(etaDelta);

    const tradeoffs: Tradeoff[] = [
        ...scenario.authoredTradeoffs,
        ...(timeTradeoff ? [timeTradeoff] : []),
    ];

    return {
        scenario,
        baseline,
        simulation,
        deltas: { etaMinutes: etaDelta, steps: stepsDelta },
        tradeoffs,
    };
};

/**
 * Convenience: run many scenarios in one pass. Preserves input order.
 * Pure (wraps `simulateScenario` deterministically).
 */
export const simulateAll = (
    pathway: Pathway,
    scenarios: readonly Scenario[],
): ScenarioResult[] => scenarios.map(s => simulateScenario(pathway, s));

/**
 * Baseline summary for the pathway, independent of any scenario.
 * Returned separately so the UI can render a "your path today"
 * header without having to pick a distinguished scenario result.
 */
export const simulateBaseline = (pathway: Pathway): SimulationSummary =>
    simulate(pathway, inferSimulationFocus(pathway), BASELINE_SELECTOR);
