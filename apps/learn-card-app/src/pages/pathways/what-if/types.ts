/**
 * What-If types — scenarios, their applied form, and simulation results.
 *
 * A **scenario** is a named, deterministic, purely-structural
 * transformation of a Pathway. It doesn't fabricate new credentials
 * or invent node content; it only reshapes the existing graph by
 * eliding nodes of certain kinds or scaling their effort estimates.
 * That matters because What-If is an *honesty* surface — if a
 * scenario claims "you can skip this external module", the skipped
 * work must correspond to a real node the learner can genuinely
 * decide to defer.
 *
 * A **ScenarioResult** is the fully-computed outcome of applying a
 * scenario to the learner's active pathway: the hypothetical route,
 * the ETA delta vs baseline, the step delta, and a small set of
 * `Tradeoff`s framed in the shared `{time | cost | effort |
 * difficulty | external-dependency}` vocabulary so every scenario's
 * claims sit on the same axes.
 *
 * See `apps/learn-card-app/src/pages/pathways/what-if/simulator.ts`
 * for the pure runner and `./generators.ts` for the heuristic
 * scenario generators that observe a pathway and pick the ones
 * whose transforms are non-trivial against it.
 */

import type { Policy, Tradeoff } from '../types';

// -----------------------------------------------------------------
// ScenarioKind
// -----------------------------------------------------------------

/**
 * Built-in scenario families. The set is intentionally small and
 * audit-able so the learner isn't drowning in hypotheticals — three
 * or four honest alternatives beat a dozen vague ones.
 *
 *   - `fast-track`       — elide `review` nodes to reduce ETA.
 *   - `deep-practice`    — scale `practice` effort up (2x) to buy
 *                          more reps at the cost of time.
 *   - `external-light`   — elide `external` nodes, reducing
 *                          outside-dependency exposure.
 *   - `destination-only` — work only on nodes on the shortest path
 *                          from focus → destination (breadth → depth).
 *
 * The `custom` kind is reserved for a future UI that lets authors
 * hand-tune a `NodeSelector` (e.g. "also skip this one review
 * node") without introducing a new discriminant.
 */
export type ScenarioKind =
    | 'fast-track'
    | 'deep-practice'
    | 'external-light'
    | 'destination-only'
    | 'custom';

// -----------------------------------------------------------------
// NodeSelector — the primitive every scenario reduces to
// -----------------------------------------------------------------

/**
 * Low-level selector describing how a scenario reshapes a pathway.
 *
 *   - `skipPolicyKinds`: node policies to elide entirely from the
 *     work set. The underlying edges survive — we connect prereqs
 *     through the skipped node so downstream structure stays sane —
 *     but the skipped node contributes nothing to ETA / step count.
 *   - `skipNodeIds`: explicit opt-out for individual nodes. Useful
 *     for the destination-only scenario, which keeps exactly the
 *     nodes on its chosen path.
 *   - `effortMultiplierByKind`: per-kind scalar applied to node
 *     effort minutes before aggregation. Missing kinds default to
 *     1.0.
 *
 * A scenario that leaves all three fields empty is the baseline —
 * its simulated route equals the real route. The simulator exploits
 * this property so `simulateBaseline` can share code with
 * `simulateScenario`.
 */
export interface NodeSelector {
    skipPolicyKinds?: readonly Policy['kind'][];
    skipNodeIds?: readonly string[];
    effortMultiplierByKind?: Partial<Record<Policy['kind'], number>>;
}

// -----------------------------------------------------------------
// Scenario
// -----------------------------------------------------------------

/**
 * A simulation scenario. Fully described by the pure selector plus
 * presentation copy (title, subtitle, pre-authored tradeoffs). The
 * simulator computes numeric deltas (etaMinutes, steps) and merges
 * them with the authored tradeoffs — nothing about the scenario's
 * *identity* depends on the simulation result, so Scenario values
 * are safe to serialize, test, and persist independently.
 */
export interface Scenario {
    id: string;
    kind: ScenarioKind;
    title: string;
    /** One-sentence honest description. Shown under the title. */
    subtitle: string;
    /**
     * Tradeoffs the scenario's *shape* implies, independent of the
     * numeric simulation (e.g. "less reinforcement" is true whenever
     * you skip reviews, regardless of ETA). The simulator may append
     * time-dimension tradeoffs computed from the actual ETA delta.
     */
    authoredTradeoffs: readonly Tradeoff[];
    selector: NodeSelector;
}

// -----------------------------------------------------------------
// SimulationSummary
// -----------------------------------------------------------------

/**
 * The numeric outcome of routing through a scenario-transformed
 * pathway. Mirrors the relevant parts of `SuggestedRoute` (ETA,
 * step count) plus flags the simulator uses to degrade gracefully.
 */
export interface SimulationSummary {
    /**
     * Uncompleted-node count on the simulated route. `null` when
     * the pathway has no destination / focus — the route couldn't
     * be computed and the simulator says so honestly.
     */
    remainingSteps: number | null;
    /** Sum of `effort * multiplier` across simulated remaining nodes. */
    etaMinutes: number | null;
    /**
     * Node ids that the scenario is eliding from the baseline.
     * Used by the UI to show "you'd skip 3 nodes" affordances.
     */
    skippedNodeIds: readonly string[];
}

// -----------------------------------------------------------------
// ScenarioResult
// -----------------------------------------------------------------

/**
 * Full what-if output for a single scenario, ready for rendering.
 *
 *   - `baseline` / `scenario` are two `SimulationSummary` values
 *     computed over the same focus node so their ETAs are directly
 *     comparable.
 *   - `deltas` encodes signed differences — negative is almost
 *     always better (less time, fewer steps), and the UI layer
 *     colorizes accordingly.
 *   - `tradeoffs` is the final list the UI renders: authored
 *     tradeoffs from the scenario, plus any simulation-derived
 *     tradeoffs (e.g. a computed time delta).
 */
export interface ScenarioResult {
    scenario: Scenario;
    baseline: SimulationSummary;
    simulation: SimulationSummary;
    deltas: {
        /** `simulation.etaMinutes - baseline.etaMinutes`, or null when incomparable. */
        etaMinutes: number | null;
        /** `simulation.remainingSteps - baseline.remainingSteps`, or null when incomparable. */
        steps: number | null;
    };
    tradeoffs: readonly Tradeoff[];
}
