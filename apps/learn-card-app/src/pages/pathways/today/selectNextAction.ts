/**
 * selectNextAction — Today's top-level picker.
 *
 * Bridges two different ways of answering "what should the learner
 * do next?":
 *
 *   1. **`chosenRoute`** — the learner's committed linear walk. When
 *      present, Today is turn-by-turn: it surfaces the first
 *      uncompleted, graph-available id on the route.
 *   2. **Ranking** — `getNextAction` scores every available candidate
 *      by FSRS reviews, streak grace, stall recovery, endorsements,
 *      and agent signals. Used when no route is set.
 *
 * The selector is the *honest degradation* layer: when the committed
 * route can't produce an answer (route absent, route exhausted, every
 * route node blocked by off-route prereqs), we fall back to ranking
 * rather than show the learner "nothing to do." Callers never have
 * to branch on "do we have a route?" — this function hides that.
 *
 * The return shape carries a `source` discriminant so the UI can
 * subtly style the "why" text differently (e.g. "Step 3 of 7 on your
 * route" vs. "A review is due now") and so telemetry can compare
 * route-based vs ranking-based picks at the aggregate level.
 *
 * Pure: no clocks, no store access. All inputs are explicit.
 */

import type { NodeRef, Pathway, RankingContext, RankingWeights, ScoredCandidate } from '../types';

import { pickNextOnRoute } from '../core/chosenRoute';
import { buildAdjacency } from '../core/graphOps';
import { getNextAction } from './ranking';

// -----------------------------------------------------------------
// Return shape
// -----------------------------------------------------------------

/**
 * Unified "what Today should show" payload. Wraps the existing
 * `ScoredCandidate` shape so the NextActionCard keeps rendering
 * from a single data type regardless of how the pick was made.
 *
 * The `source` discriminant lets callers tell the three modes apart
 * without re-inspecting fields:
 *
 *   - `route`   — picked via `chosenRoute`; `routeStep` is defined.
 *                 The learner's next action is literally on their
 *                 committed walk.
 *   - `detour`  — picked via ranking, and that pick happens to be a
 *                 prerequisite of a blocked route step. Framed as
 *                 "a detour required to resume your route" so the
 *                 learner sees the connection instead of a mystery
 *                 node appearing. `detour` is populated.
 *   - `ranking` — picked via `getNextAction`; no route or the pick
 *                 doesn't unblock any route step. Plain next action.
 *
 * The `scored` field carries the same `ScoredCandidate` the
 * existing ranking pipeline produced — synthesized when the pick
 * came from the route (score 0, reasons = the route reason) so the
 * downstream card doesn't need to branch.
 */
export interface NextActionPick {
    source: 'route' | 'detour' | 'ranking';
    scored: ScoredCandidate;
    routeStep?: {
        position: number;
        total: number;
    };
    /**
     * When `source === 'detour'`, describes which blocked route
     * step the off-route pick unblocks. Lets the UI render
     * "Detour — needed before Step 3 of 7: <title>" and lets the
     * Map surface the detour node beside its blocked spine step.
     */
    detour?: {
        /**
         * The route node id this detour unblocks — the first
         * blocked route step whose prereq closure includes the
         * pick.
         */
        unblocksNodeId: string;
        /** 1-indexed position on the route of the unblocked step. */
        unblocksRoutePosition: number;
        /** Total number of steps on the route. */
        unblocksTotal: number;
    };
}

// -----------------------------------------------------------------
// Selector
// -----------------------------------------------------------------

export interface SelectNextActionInput {
    pathway: Pathway;
    /** The candidate pool feeding the ranking fallback (typically `availableNodes` → `NodeRef`s). */
    candidates: readonly NodeRef[];
    context: RankingContext;
    weights?: RankingWeights;
}

/**
 * Pick the next action for Today.
 *
 * Preference order:
 *   1. A `chosenRoute` step (uncompleted + graph-available).
 *   2. Top-ranked candidate from the scoring function.
 *   3. `null` — the "nothing to do" empty state.
 *
 * Route-based picks still honor graph availability: we never show
 * "step 5" when an off-route prerequisite of step 5 is still
 * blocking it. See `pickNextOnRoute` for the full semantics.
 */
export const selectNextAction = (
    input: SelectNextActionInput,
): NextActionPick | null => {
    const { pathway, candidates, context, weights } = input;

    const routeStep = pickNextOnRoute(pathway, pathway.chosenRoute);

    if (routeStep) {
        return {
            source: 'route',
            scored: {
                node: {
                    pathwayId: pathway.id,
                    nodeId: routeStep.nodeId,
                },
                // Routes don't participate in the weighted scoring
                // pipeline — they represent a prior decision, not a
                // freshly-scored candidate. Zero is the honest number
                // here; telemetry can still tell the two sources apart
                // via the `source` discriminant.
                score: 0,
                reasons: [routeStep.reason],
            },
            routeStep: {
                position: routeStep.position,
                total: routeStep.total,
            },
        };
    }

    const ranked = getNextAction(candidates, context, weights);

    if (!ranked) return null;

    // -------------------------------------------------------------
    // Detour detection.
    //
    // When no route step is available but ranking picked something,
    // check whether that pick is an ancestor (transitive prereq)
    // of a blocked route step. If so, it's a *detour* — the learner
    // needs to do this off-route node to unblock their walk.
    //
    // Why transitive, not immediate-only? A route step's immediate
    // prereqs may themselves be blocked by even-earlier off-route
    // nodes. The BFS below walks backward from each route step
    // through `prereqs` until we hit the pick (or exhaust the set);
    // either way the relationship "this unblocks that" is honest.
    //
    // We pick the *earliest* blocked route step the pick unblocks
    // because the earlier the step, the sooner the learner gets
    // back on their committed walk. If the pick unblocks two
    // consecutive route steps, naming the earlier one is more
    // informative ("before Step 3" is a stronger cue than "before
    // Step 5").
    // -------------------------------------------------------------
    // Detour detection runs whenever the pathway has *any* committed
    // route — even a length-1 route ("my walk is just the
    // destination") can have blocked steps whose prereqs the
    // ranking fallback just surfaced.
    const chosen = pathway.chosenRoute;
    if (chosen && chosen.length >= 1) {
        const { prereqs } = buildAdjacency(pathway);
        const pickId = ranked.node.nodeId;

        // Complete-node set for the "prereq is satisfied" check —
        // a blocked route step is one whose prereq closure contains
        // at least one uncompleted node.
        const completed = new Set(
            pathway.nodes
                .filter(n => n.progress.status === 'completed')
                .map(n => n.id),
        );

        for (let i = 0; i < chosen.length; i++) {
            const routeId = chosen[i]!;
            const routeNode = pathway.nodes.find(n => n.id === routeId);
            if (!routeNode) continue;
            if (routeNode.progress.status === 'completed') continue;

            // BFS backward through prereqs starting from the route
            // step. If we find `pickId` in the ancestor set, this
            // step is the one the detour unblocks.
            const visited = new Set<string>();
            const queue: string[] = [routeId];
            let found = false;

            while (queue.length > 0) {
                const cur = queue.shift()!;
                const curPrereqs = prereqs.get(cur) ?? new Set<string>();

                for (const p of curPrereqs) {
                    if (p === pickId) {
                        found = true;
                        break;
                    }
                    // Only continue through uncompleted prereqs —
                    // a completed prereq isn't blocking anyone, so
                    // walking further up its chain would falsely
                    // attribute an unrelated pick.
                    if (completed.has(p)) continue;
                    if (!visited.has(p)) {
                        visited.add(p);
                        queue.push(p);
                    }
                }

                if (found) break;
            }

            if (found) {
                return {
                    source: 'detour',
                    scored: ranked,
                    detour: {
                        unblocksNodeId: routeId,
                        unblocksRoutePosition: i + 1,
                        unblocksTotal: chosen.length,
                    },
                };
            }
        }
    }

    return {
        source: 'ranking',
        scored: ranked,
    };
};
