import { createStore } from '@udecode/zustood';

import type { FeedbackSentiment, FeedbackSurface } from '@analytics';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const YEAR_MS = 365 * DAY_MS;
const SURFACE_ANSWER_COOLDOWN_MS = 30 * DAY_MS;
const IGNORE_MUTE_MS = 90 * DAY_MS;
const MAX_PROMPTS_PER_WEEK = 3;
const MAX_PROMPTS_PER_SESSION = 1;
const IGNORES_BEFORE_MUTE = 2;

const ADVOCACY_COOLDOWN_MS = 90 * DAY_MS;
const ADVOCACY_NEGATIVE_QUARANTINE_MS = 30 * DAY_MS;
const ADVOCACY_SENTIMENT_SETTLE_MS = 7 * DAY_MS;
const ADVOCACY_MIN_SESSIONS = 3;
const SESSION_GAP_MS = 4 * 60 * 60 * 1000;
/**
 * Deliberately 2, not Apple's hard cap of 3 per 365 days. The OS gives us
 * no signal about whether a prompt was actually displayed, so we cannot
 * reconcile our count with theirs — leaving one ask of headroom keeps us
 * clear of the cap even if our bookkeeping drifts.
 */
const ADVOCACY_MAX_PER_YEAR = 2;

export type FeedbackSurfaceState = {
    lastShownAt?: number;
    lastAnsweredAt?: number;
    ignoreCount: number;
    mutedUntil?: number;
};

export type AdvocacyDecision =
    | 'eligible'
    | 'not_enough_sessions'
    | 'no_positive_sentiment'
    | 'sentiment_too_recent'
    | 'recent_negative'
    | 'cooldown'
    | 'yearly_cap';

let sessionPromptCount = 0;

/**
 * The persisted store predates `requestLog` (it previously held a bare
 * `requestCount`). Persistence merges shallowly, so a hydrated `review`
 * from an older build replaces the default object entirely and arrives
 * without `requestLog` — read it through here, never directly.
 */
export const readRequestLog = (review: { requestLog?: number[] }): number[] => {
    const now = Date.now();

    return (review.requestLog ?? []).filter(t => now - t < YEAR_MS);
};

/**
 * Frequency governor for in-app feedback prompts. Every prompt consults
 * `canPromptForFeedback` before rendering, so users are never over-asked:
 * max 1 prompt per app session, max 3 per rolling week, a 30-day
 * per-surface cooldown after an answer, and a 90-day per-surface mute
 * after 2 consecutive ignores. The `review` ledger is reserved for a
 * future native store-review prompt (per-platform cooldown bookkeeping).
 */
export const feedbackGovernorStore = createStore('feedbackGovernor')<{
    surfaces: Record<string, FeedbackSurfaceState>;
    promptLog: number[];
    sentiment: { lastPositiveAt?: number; lastNegativeAt?: number; positiveCount: number };
    sessionCount: number;
    lastSessionAt: number;
    review: { lastRequestedAt?: number; requestLog: number[] };
}>(
    {
        surfaces: {},
        promptLog: [],
        sentiment: { positiveCount: 0 },
        sessionCount: 0,
        lastSessionAt: 0,
        review: { requestLog: [] },
    },
    { persist: { name: 'feedbackGovernor', enabled: true } }
).extendActions(set => ({
    recordShown: (surface: FeedbackSurface) => {
        sessionPromptCount += 1;

        set.state(state => {
            const now = Date.now();
            state.promptLog = [...state.promptLog.filter(t => now - t < WEEK_MS), now];

            const existing = state.surfaces[surface] ?? { ignoreCount: 0 };
            state.surfaces[surface] = { ...existing, lastShownAt: now };
        });
    },

    recordAnswered: (surface: FeedbackSurface, sentiment: FeedbackSentiment) => {
        set.state(state => {
            const now = Date.now();
            const existing = state.surfaces[surface] ?? { ignoreCount: 0 };

            state.surfaces[surface] = {
                ...existing,
                lastAnsweredAt: now,
                ignoreCount: 0,
                mutedUntil: undefined,
            };

            if (sentiment === 'positive') {
                state.sentiment.lastPositiveAt = now;
                state.sentiment.positiveCount += 1;
            } else {
                state.sentiment.lastNegativeAt = now;
            }
        });
    },

    /**
     * Counts a *visit*, not a JS runtime. The Capacitor webview survives
     * backgrounding, so on native a daily user could otherwise sit at
     * `sessionCount: 1` forever and never reach `ADVOCACY_MIN_SESSIONS`;
     * on web every hard reload would inflate it. Gating on elapsed time
     * since the last counted visit makes both platforms behave the same.
     */
    recordSession: () => {
        set.state(state => {
            const now = Date.now();

            if (now - state.lastSessionAt < SESSION_GAP_MS) return;

            state.lastSessionAt = now;
            state.sessionCount += 1;
        });
    },

    consumeSessionPrompt: () => {
        sessionPromptCount += 1;
    },

    recordAdvocacyRequested: () => {
        set.state(state => {
            const now = Date.now();

            state.review.lastRequestedAt = now;
            state.review.requestLog = [...readRequestLog(state.review), now];
        });
    },

    recordIgnored: (surface: FeedbackSurface) => {
        set.state(state => {
            const existing = state.surfaces[surface] ?? { ignoreCount: 0 };
            const ignoreCount = existing.ignoreCount + 1;

            state.surfaces[surface] = {
                ...existing,
                ignoreCount,
                mutedUntil:
                    ignoreCount >= IGNORES_BEFORE_MUTE
                        ? Date.now() + IGNORE_MUTE_MS
                        : existing.mutedUntil,
            };
        });
    },
}));

export const canPromptForFeedback = (surface: FeedbackSurface): boolean => {
    const now = Date.now();

    if (sessionPromptCount >= MAX_PROMPTS_PER_SESSION) return false;

    const recentPrompts = feedbackGovernorStore.get
        .promptLog()
        .filter(t => now - t < WEEK_MS).length;
    if (recentPrompts >= MAX_PROMPTS_PER_WEEK) return false;

    const surfaceState = feedbackGovernorStore.get.surfaces()[surface];
    if (!surfaceState) return true;

    if (surfaceState.mutedUntil && surfaceState.mutedUntil > now) return false;

    if (
        surfaceState.lastAnsweredAt &&
        now - surfaceState.lastAnsweredAt < SURFACE_ANSWER_COOLDOWN_MS
    ) {
        return false;
    }

    return true;
};

/**
 * Decides whether the user has earned an advocacy ask (native OS review
 * prompt, or the GitHub star card on web).
 *
 * Compliance-critical: `ADVOCACY_SENTIMENT_SETTLE_MS` enforces a gap
 * between the sentiment answer and the ask. Google forbids asking any
 * question before or while the review UI is presented, so chaining the
 * prompt onto a positive tap in the same session would violate policy.
 * Recorded sentiment may only act as silent, time-detached eligibility.
 */
export const resolveAdvocacyDecision = (): AdvocacyDecision => {
    const now = Date.now();
    const { sentiment, sessionCount, review } = {
        sentiment: feedbackGovernorStore.get.sentiment(),
        sessionCount: feedbackGovernorStore.get.sessionCount(),
        review: feedbackGovernorStore.get.review(),
    };

    if (sessionCount < ADVOCACY_MIN_SESSIONS) return 'not_enough_sessions';

    if (!sentiment.lastPositiveAt || sentiment.positiveCount < 1) return 'no_positive_sentiment';

    if (now - sentiment.lastPositiveAt < ADVOCACY_SENTIMENT_SETTLE_MS)
        return 'sentiment_too_recent';

    if (
        sentiment.lastNegativeAt &&
        now - sentiment.lastNegativeAt < ADVOCACY_NEGATIVE_QUARANTINE_MS
    ) {
        return 'recent_negative';
    }

    if (review.lastRequestedAt && now - review.lastRequestedAt < ADVOCACY_COOLDOWN_MS) {
        return 'cooldown';
    }

    if (readRequestLog(review).length >= ADVOCACY_MAX_PER_YEAR) return 'yearly_cap';

    return 'eligible';
};
