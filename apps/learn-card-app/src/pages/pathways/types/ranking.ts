/**
 * Ranking types — `getNextAction` is a pure scoring function, not a god
 * selector. See docs § 8.1.
 *
 * The `reasons` array doubles as UI copy (hint line under the
 * NextActionCard) and debug trail (answers "why am I seeing this?").
 */

import { z } from 'zod';

import { NodeRefSchema } from './pathway';

export const ScoredCandidateSchema = z.object({
    node: NodeRefSchema,
    score: z.number(),
    reasons: z.array(z.string()),
});
export type ScoredCandidate = z.infer<typeof ScoredCandidateSchema>;

/**
 * Everything `scoreCandidate` needs to compute a score. Pure data so tests
 * can fixture a context and assert the ranked output.
 */
export interface RankingContext {
    now: string; // ISO timestamp — injected, never `new Date()` inside the scorer.

    /** FSRS review items due now or soon. */
    fsrsDue: Array<{ nodeId: string; dueAt: string }>;

    /** Nodes a Router-style signal has flagged as stalled. */
    stalls: Array<{ nodeId: string; stalledSinceDays: number }>;

    /** Current streak state for the active pathway, if any. */
    streakState: {
        current: number;
        longest: number;
        lastActiveAt?: string;
        /** True if the learner is inside the grace window and a token action preserves the streak. */
        inGraceWindow: boolean;
    } | null;

    /** Endorsements received recently, used as a gentle nudge signal. */
    recentEndorsements: Array<{ nodeId: string; receivedAt: string }>;

    /**
     * Optional agent-origin signals. When null, Today mode degrades gracefully
     * and still produces a next action (docs § 14).
     */
    agentSignals: {
        routerSuggestions: Array<{ nodeId: string; reason: string }>;
        matcherSuggestions: Array<{ nodeId: string; reason: string }>;
    } | null;
}

/**
 * Weights are versioned — tuning them is a product change, not an
 * implementation detail. Lives in `today/rankingWeights.ts`.
 */
export interface RankingWeights {
    fsrsDueNow: number;
    fsrsDueSoon: number;
    streakGrace: number;
    stallRecovery: number;
    recentEndorsement: number;
    routerSuggestion: number;
    matcherSuggestion: number;
    fallback: number;
}

export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
    fsrsDueNow: 100,
    fsrsDueSoon: 40,
    streakGrace: 80,
    stallRecovery: 60,
    recentEndorsement: 20,
    routerSuggestion: 50,
    matcherSuggestion: 15,
    fallback: 1,
};
