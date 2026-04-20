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

// -----------------------------------------------------------------
// Public API
// -----------------------------------------------------------------

export interface SuggestOptions {
    /** Free-text goal the learner typed, or empty string if skipped. */
    goalText: string;
    /** Pre-extracted wallet signal. Empty tags is fine. */
    wallet?: WalletSignal;
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

        if (reasons.length === 0) {
            reasons.push('A good first pathway for people in transition');
        }

        return { template, score, reasons };
    });

    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
};
