/**
 * Ranking weights — tuned constants, exported as their own module so
 * product changes don't force edits to the algorithm.
 *
 * Docs § 8.1: "explicit weights in `today/rankingWeights.ts`, tunable from
 * one file."
 *
 * Tuning is a product decision. Don't quietly raise `matcherSuggestion` to
 * boost a number you care about — change it deliberately, in a PR, with a
 * justification in the commit message.
 */

import type { RankingWeights } from '../types';

export { DEFAULT_RANKING_WEIGHTS } from '../types';

/**
 * A variant tuned for learners who are early in their first pathway —
 * stronger preference for streak preservation, softer preference for
 * Matcher/Router suggestions (not yet trusted signals). Not wired in v1;
 * kept here to show the tuning surface is a first-class concept.
 */
export const EARLY_LEARNER_WEIGHTS: RankingWeights = {
    fsrsDueNow: 100,
    fsrsDueSoon: 30,
    streakGrace: 110,
    stallRecovery: 40,
    recentEndorsement: 25,
    routerSuggestion: 30,
    matcherSuggestion: 5,
    fallback: 1,
};
