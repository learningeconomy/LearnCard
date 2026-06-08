/**
 * Pathway suggestions — keyword/tag scoring over curated templates.
 *
 * Phase 1 is deliberately **vector-first, LLM-maybe** (docs § 6). We do
 * not call any LLM. The "vector" here is simple keyword overlap with a
 * light bonus for wallet-credential tag hits. Real embedding-based
 * retrieval is a Phase 3+ upgrade that swaps this module without
 * reshaping any caller.
 *
 * The architectural commitment is the **shape** of the output (scored
 * templates with a reasons array) and the invariant that cold-start
 * always returns at least one suggestion in < 10s without network.
 */

import type { Altitude } from '../types';

import { CURATED_TEMPLATES, type PathwayTemplate } from './templates';

// -----------------------------------------------------------------
// Wallet abstraction
// -----------------------------------------------------------------
//
// We don't want this module to depend on the full wallet credential
// shape. A tag extractor is injected by the caller. Callers that have
// richer info can project anything they want into tags; we just score.

export interface WalletSignal {
    /** Coarse tags distilled from the learner's existing credentials. */
    tags: readonly string[];
}

// -----------------------------------------------------------------
// Suggestion
// -----------------------------------------------------------------

export interface PathwaySuggestion {
    template: PathwayTemplate;
    score: number;
    reasons: string[];
}

// -----------------------------------------------------------------
// Scoring
// -----------------------------------------------------------------

const GOAL_KEYWORD_HIT = 4;
const GOAL_KEYWORD_PARTIAL = 1;
const WALLET_TAG_HIT = 2;
const BASELINE = 1;

/**
 * Altitude match bonus — large enough to dominate keyword ties so a
 * question-altitude learner lands on a question-shaped template first,
 * but not so large that it can override a strong direct keyword match
 * against a different-altitude template (that's almost always the
 * learner's explicit intent winning over a classifier heuristic).
 *
 * Concretely: baseline (1) + strong keyword hit (4) + wallet hit (2)
 * = 7; a pure altitude match without any keyword signal adds 6, so
 * an explicit keyword match still wins. An altitude match *plus* any
 * keyword overlap wins decisively.
 */
const ALTITUDE_MATCH_BONUS = 6;

/**
 * Penalty applied to aspiration-default templates when the classifier
 * detected a non-aspiration altitude. Prevents the existing
 * career-transition templates from pattern-matching on verbs in a
 * learner's question ("How do I *ship* my essay?" shouldn't dredge
 * up the Ship-a-public-artifact aspiration template first).
 *
 * Small on purpose — doesn't hide the aspiration templates from the
 * grid entirely, just pushes them below the altitude-shaped ones.
 */
const ALTITUDE_MISMATCH_PENALTY = 3;

const tokenize = (s: string): string[] =>
    s
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .filter(Boolean);

const scoreGoal = (
    template: PathwayTemplate,
    goalTokens: Set<string>,
    goalRaw: string,
    reasons: string[],
): number => {
    if (goalTokens.size === 0) return 0;

    let score = 0;
    const goalLower = goalRaw.toLowerCase();
    const matched = new Set<string>();

    for (const keyword of template.keywords) {
        const keywordLower = keyword.toLowerCase();

        // Full phrase match — strongest signal.
        if (goalLower.includes(keywordLower)) {
            score += GOAL_KEYWORD_HIT;
            matched.add(keyword);
            continue;
        }

        // Any token of the keyword matched by any goal token.
        const keywordTokens = tokenize(keyword);
        const anyHit = keywordTokens.some(t => goalTokens.has(t));

        if (anyHit) {
            score += GOAL_KEYWORD_PARTIAL;
            matched.add(keyword);
        }
    }

    if (matched.size > 0) {
        reasons.push(
            `Matches what you wrote: ${Array.from(matched).slice(0, 3).join(', ')}`,
        );
    }

    return score;
};

const scoreWallet = (
    template: PathwayTemplate,
    walletTags: Set<string>,
    reasons: string[],
): number => {
    if (walletTags.size === 0) return 0;

    const overlap = template.tags.filter(t => walletTags.has(t));

    if (overlap.length === 0) return 0;

    reasons.push(
        `Builds on credentials you already have (${overlap.slice(0, 2).join(', ')})`,
    );

    return overlap.length * WALLET_TAG_HIT;
};

/**
 * Friendly, altitude-aware blurb used when a template's altitude matches
 * the learner's detected intent. Kept short and non-jargony — the grid
 * shows at most three reasons per card and we want them to read like
 * encouragement, not classifier output.
 */
const ALTITUDE_REASON: Record<Altitude, string> = {
    aspiration: 'Shaped for learners working toward something bigger',
    question: 'Shaped for following a question wherever it leads',
    action: 'Shaped for capturing the work you\u2019re already doing',
    exploration: 'Shaped for wandering and noticing what pulls you',
};

const scoreAltitude = (
    template: PathwayTemplate,
    altitude: Altitude | undefined,
    reasons: string[],
): number => {
    if (!altitude) return 0;

    // Templates without an explicit altitude default to aspiration — that
    // matches how the curated set was originally authored and keeps the
    // legacy ranking honest when the classifier lands on 'aspiration'.
    const templateAltitude: Altitude = template.altitude ?? 'aspiration';

    if (templateAltitude === altitude) {
        reasons.push(ALTITUDE_REASON[altitude]);
        return ALTITUDE_MATCH_BONUS;
    }

    // Only penalize the legacy aspiration defaults when the learner's
    // altitude is something else. Cross-altitude pairs that aren't
    // aspiration-vs-other stay neutral — the match bonus alone is enough
    // to sort them correctly.
    if (templateAltitude === 'aspiration' && altitude !== 'aspiration') {
        return -ALTITUDE_MISMATCH_PENALTY;
    }

    return 0;
};

// -----------------------------------------------------------------
// Public API
// -----------------------------------------------------------------

export interface SuggestOptions {
    /** Free-text goal the learner typed, or empty string if skipped. */
    goalText: string;
    /** Pre-extracted wallet signal. Empty tags is fine. */
    wallet?: WalletSignal;
    /**
     * Classifier-detected altitude for the learner's intent. When
     * provided, matching-altitude templates are boosted and legacy
     * aspiration defaults are mildly penalized. Omitted → legacy
     * keyword-only ranking (pure backwards compat for older callers
     * and tests).
     */
    altitude?: Altitude;
    /** Max number of suggestions to return. Defaults to 3. */
    limit?: number;
    /** Inject a template set for testing. Defaults to the curated list. */
    templates?: readonly PathwayTemplate[];
}

/**
 * Produce ranked pathway suggestions. Pure, synchronous, no I/O.
 *
 * Never returns an empty list when at least one template exists — the
 * onboarding flow relies on always having something to show (the
 * "cold-start always renders" invariant from docs § 6).
 */
export const suggestPathways = ({
    goalText,
    wallet,
    altitude,
    limit = 3,
    templates = CURATED_TEMPLATES,
}: SuggestOptions): PathwaySuggestion[] => {
    const goalTokens = new Set(tokenize(goalText));
    const walletTags = new Set(wallet?.tags ?? []);

    const scored = templates.map<PathwaySuggestion>(template => {
        const reasons: string[] = [];

        let score = BASELINE;

        score += scoreGoal(template, goalTokens, goalText, reasons);
        score += scoreWallet(template, walletTags, reasons);
        score += scoreAltitude(template, altitude, reasons);

        if (reasons.length === 0) {
            reasons.push('A good first pathway for people in transition');
        }

        return { template, score, reasons };
    });

    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
};
