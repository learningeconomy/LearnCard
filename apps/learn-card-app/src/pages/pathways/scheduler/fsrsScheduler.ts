/**
 * FSRS scheduler — minimal Phase 1 skeleton.
 *
 * The real Free Spaced Repetition Scheduler integration lands in Phase 5
 * (docs § 17). For Phase 1 we only need two things:
 *
 *   1. `collectFsrsDue` — extract the FSRS-due candidate list that Today
 *      mode's ranking function consumes via `RankingContext.fsrsDue`.
 *
 *   2. A typed stub of `scheduleReview` so callers can wire against the
 *      eventual scheduler surface without reshaping their code when the
 *      real thing arrives.
 *
 * The scheduler is deliberately pure — no I/O, no persistence — so it can
 * be swapped for the real FSRS library later without touching callers.
 */

import type { FsrsParams, Pathway, PathwayNode } from '../types';

// -----------------------------------------------------------------
// Due extraction
// -----------------------------------------------------------------

export interface FsrsDueEntry {
    nodeId: string;
    dueAt: string;
}

const hasReviewPolicy = (node: PathwayNode): node is PathwayNode & {
    stage: { policy: { kind: 'review'; fsrs: FsrsParams } };
} => node.stage.policy.kind === 'review';

/**
 * Every node whose policy is `review` and which has a scheduled `dueAt`.
 * The ranking function will further classify them as due-now vs due-soon.
 *
 * Nodes that are completed or skipped are excluded — a review shouldn't
 * resurface work the learner intentionally closed out.
 */
export const collectFsrsDue = (pathway: Pathway): FsrsDueEntry[] => {
    const out: FsrsDueEntry[] = [];

    for (const node of pathway.nodes) {
        if (!hasReviewPolicy(node)) continue;
        if (node.progress.status === 'completed') continue;
        if (node.progress.status === 'skipped') continue;

        const dueAt = node.stage.policy.fsrs.dueAt;

        if (!dueAt) continue;

        out.push({ nodeId: node.id, dueAt });
    }

    return out;
};

// -----------------------------------------------------------------
// Review grading (stub)
// -----------------------------------------------------------------

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy';

export interface ReviewOutcome {
    fsrs: FsrsParams;
    dueAt: string;
}

/**
 * Compute updated FSRS params after a review. Phase 1 uses a crude
 * multiplier-based skeleton purely to exercise the surface — it is NOT
 * the real FSRS algorithm. Phase 5 swaps in a real implementation
 * (e.g. `ts-fsrs`) without changing this signature.
 */
export const scheduleReview = (
    current: FsrsParams,
    grade: ReviewGrade,
    now: string,
): ReviewOutcome => {
    const nowMs = new Date(now).getTime();

    const stability = current.stability ?? 0;
    const difficulty = current.difficulty ?? 0;

    const intervalDays = (() => {
        switch (grade) {
            case 'again':
                return 0; // relearn today
            case 'hard':
                return Math.max(1, stability * 1.2);
            case 'good':
                return Math.max(1, stability * 2.5);
            case 'easy':
                return Math.max(1, stability * 4);
        }
    })();

    const nextStability = grade === 'again' ? 0 : Math.max(1, stability + 1);
    const nextDifficulty =
        grade === 'easy'
            ? Math.max(0, difficulty - 1)
            : grade === 'again'
                ? difficulty + 1
                : difficulty;

    const dueAt = new Date(nowMs + intervalDays * 24 * 60 * 60 * 1000).toISOString();

    return {
        fsrs: {
            stability: nextStability,
            difficulty: nextDifficulty,
            lastReviewAt: now,
            dueAt,
        },
        dueAt,
    };
};
