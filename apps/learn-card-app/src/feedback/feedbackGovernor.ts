import { createStore } from '@udecode/zustood';

import type { FeedbackSurface } from '@analytics';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const SURFACE_ANSWER_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;
const IGNORE_MUTE_MS = 90 * 24 * 60 * 60 * 1000;
const MAX_PROMPTS_PER_WEEK = 3;
const MAX_PROMPTS_PER_SESSION = 1;
const IGNORES_BEFORE_MUTE = 2;

export type FeedbackSurfaceState = {
    lastShownAt?: number;
    lastAnsweredAt?: number;
    ignoreCount: number;
    mutedUntil?: number;
};

let sessionPromptCount = 0;

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
    review: { lastRequestedAt?: number; requestCount: number };
}>(
    {
        surfaces: {},
        promptLog: [],
        review: { requestCount: 0 },
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

    recordAnswered: (surface: FeedbackSurface) => {
        set.state(state => {
            const existing = state.surfaces[surface] ?? { ignoreCount: 0 };
            state.surfaces[surface] = {
                ...existing,
                lastAnsweredAt: Date.now(),
                ignoreCount: 0,
                mutedUntil: undefined,
            };
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
