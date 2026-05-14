/**
 * Today-mode ranking — a pure scoring function over candidate NodeRefs.
 *
 * This is deliberately not a conditional tree. Docs § 8.1:
 *
 * > "The inputs getNextAction has to balance — FSRS reviews due, streak
 * >  preservation, stalled nodes flagged by the Router, newly accepted
 * >  proposals, time-of-day, a fresh endorsement arriving — do not reduce
 * >  to a single conditional tree without becoming a god function no one
 * >  wants to touch. Instead, model it as a pure scoring function over a
 * >  set of candidate NodeRefs with explicit, testable, tunable weights."
 *
 * Every scored factor contributes a `reason` string that doubles as UI
 * copy (hint line under the NextActionCard) and as a debug trail
 * ("why am I seeing this?").
 *
 * Agent-origin signals live under `context.agentSignals`, which is
 * `null` when the agent layer is unreachable. A `null` value is not an
 * error; it just contributes zero to the score. This is the
 * graceful-degradation contract from docs § 14.
 */

import type { NodeRef, RankingContext, RankingWeights, ScoredCandidate } from '../types';

import { DEFAULT_RANKING_WEIGHTS } from './rankingWeights';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const STALL_SATURATION_DAYS = 7;

/**
 * Score a single candidate. Pure; returns `{ node, score, reasons }`.
 */
export const scoreCandidate = (
    candidate: NodeRef,
    context: RankingContext,
    weights: RankingWeights,
): ScoredCandidate => {
    let score = 0;
    const reasons: string[] = [];

    const nowMs = new Date(context.now).getTime();

    // -- FSRS reviews ------------------------------------------------------

    const fsrsEntry = context.fsrsDue.find(f => f.nodeId === candidate.nodeId);

    if (fsrsEntry) {
        const dueMs = new Date(fsrsEntry.dueAt).getTime();

        if (dueMs <= nowMs) {
            score += weights.fsrsDueNow;
            reasons.push('A review is due now');
        } else if (dueMs - nowMs <= MS_PER_DAY) {
            score += weights.fsrsDueSoon;
            reasons.push('A review is coming up soon');
        }
    }

    // -- Stall recovery ----------------------------------------------------
    //
    // Older stalls matter more, but only up to the saturation window.
    // We don't want a node stalled for six months to dominate the whole
    // ranking and drown out fresher signals.

    const stall = context.stalls.find(s => s.nodeId === candidate.nodeId);

    if (stall) {
        const multiplier = Math.min(1, stall.stalledSinceDays / STALL_SATURATION_DAYS);

        score += weights.stallRecovery * multiplier;
        reasons.push(
            stall.stalledSinceDays === 1
                ? 'You started this yesterday — a small step gets it moving'
                : `You started this ${stall.stalledSinceDays} days ago — a small step gets it moving`,
        );
    }

    // -- Streak grace window ----------------------------------------------
    //
    // Any available node can preserve a streak during grace. The product
    // stance is "a streak is a promise to yourself, not a quota", so the
    // grace signal is broad on purpose.

    if (context.streakState?.inGraceWindow) {
        score += weights.streakGrace;
        reasons.push(
            context.streakState.current > 0
                ? `Keep your ${context.streakState.current}-day streak alive`
                : 'A small step today keeps your streak going',
        );
    }

    // -- Recent endorsement -----------------------------------------------

    const endorsement = context.recentEndorsements.find(
        e => e.nodeId === candidate.nodeId,
    );

    if (endorsement) {
        score += weights.recentEndorsement;
        reasons.push('Someone just endorsed work here');
    }

    // -- Agent-origin signals (optional) ----------------------------------

    if (context.agentSignals) {
        const routerSuggestion = context.agentSignals.routerSuggestions.find(
            r => r.nodeId === candidate.nodeId,
        );

        if (routerSuggestion) {
            score += weights.routerSuggestion;
            reasons.push(routerSuggestion.reason);
        }

        const matcherSuggestion = context.agentSignals.matcherSuggestions.find(
            m => m.nodeId === candidate.nodeId,
        );

        if (matcherSuggestion) {
            score += weights.matcherSuggestion;
            reasons.push(matcherSuggestion.reason);
        }
    }

    // -- Fallback ---------------------------------------------------------
    //
    // Availability itself is a signal — if you can work on this today, we
    // should be willing to show it. This is what keeps Today from ever
    // being empty when there's work to do.

    if (score === 0) {
        score += weights.fallback;
        reasons.push('Pick up where you left off');
    }

    return { node: candidate, score, reasons };
};

/**
 * Rank an entire candidate set. Stable sort by score descending; ties are
 * broken by keeping the input order (from `availableNodes`, which itself
 * reflects pathway authoring order).
 */
export const rankCandidates = (
    candidates: readonly NodeRef[],
    context: RankingContext,
    weights: RankingWeights = DEFAULT_RANKING_WEIGHTS,
): ScoredCandidate[] =>
    candidates
        .map((c, i) => ({ scored: scoreCandidate(c, context, weights), i }))
        .sort((a, b) => b.scored.score - a.scored.score || a.i - b.i)
        .map(x => x.scored);

/**
 * The top candidate, or `null` when there is nothing available.
 *
 * Today mode renders `null` as the empty-state "Nothing to do just yet"
 * card, not as an error.
 */
export const getNextAction = (
    candidates: readonly NodeRef[],
    context: RankingContext,
    weights: RankingWeights = DEFAULT_RANKING_WEIGHTS,
): ScoredCandidate | null => {
    if (candidates.length === 0) return null;

    const [top] = rankCandidates(candidates, context, weights);

    return top ?? null;
};
