/**
 * ReviewsPanel — FSRS grade surface for nodes whose policy is `review`.
 *
 * Architecture §17 Phase 1 called for an evidence path end-to-end; Phase 5
 * was scheduled to add "`scheduler/fsrsScheduler.ts` integration, review
 * queue in Today mode." In practice we need at least the *grading
 * primitive* earlier than that, because ranking already surfaces review
 * nodes to the top of Today via `fsrsDueNow` / `fsrsDueSoon` — a
 * learner tapping into such a node deserves somewhere to grade rather
 * than a blank evidence uploader that doesn't match what the node is
 * asking of them.
 *
 * Phase 1 scope (this file):
 *
 *   - Render the current due state (due now / due soon / not due yet)
 *   - Four grade buttons (Again / Hard / Good / Easy) with a preview of
 *     the next interval each grade would schedule
 *   - On grade: recompute FSRS params via `scheduleReview` and persist
 *     them through `pathwayStore.editNode`; bump the streak the same way
 *     `handleAttach` does in NodeDetail so a daily review habit reads as
 *     effort on the hero card
 *
 * Phase 5+ swaps the scheduler for a real FSRS implementation without
 * changing this component's surface.
 */

import React, { useMemo } from 'react';

import { IonIcon } from '@ionic/react';
import { timeOutline } from 'ionicons/icons';
import { motion } from 'motion/react';

import { pathwayStore } from '../../../stores/pathways';
import {
    type ReviewGrade,
    scheduleReview,
} from '../scheduler/fsrsScheduler';
import type { FsrsParams, PathwayNode } from '../types';

interface ReviewsPanelProps {
    pathwayId: string;
    node: PathwayNode & {
        stage: { policy: { kind: 'review'; fsrs: FsrsParams } };
    };
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface GradeOption {
    grade: ReviewGrade;
    label: string;
    subtitle: string;
    /** Tailwind classes that tint the button by "harshness" of the grade. */
    className: string;
}

/**
 * Compute a short "next review in X" preview for each grade so the
 * learner can see the cost/benefit of their self-assessment before they
 * tap. Mirrors what modern Anki does in its review UI.
 */
const formatInterval = (days: number): string => {
    if (days <= 0) return 'now';
    if (days < 1) return '<1d';
    if (days < 2) return '1d';

    const rounded = Math.round(days);

    if (rounded < 7) return `${rounded}d`;
    if (rounded < 30) return `${Math.round(rounded / 7)}w`;
    if (rounded < 365) return `${Math.round(rounded / 30)}mo`;

    return `${Math.round(rounded / 365)}y`;
};

const dueStateLabel = (dueAt: string | undefined, now: number): string => {
    if (!dueAt) return 'Not scheduled yet';

    const dueMs = new Date(dueAt).getTime();
    const diffMs = dueMs - now;

    if (diffMs <= 0) return 'Due now';
    if (diffMs <= MS_PER_DAY) return 'Due within a day';

    const days = Math.round(diffMs / MS_PER_DAY);

    return days === 1 ? 'Due tomorrow' : `Due in ${days}d`;
};

const ReviewsPanel: React.FC<ReviewsPanelProps> = ({ pathwayId, node }) => {
    const nowIso = useMemo(() => new Date().toISOString(), [node.updatedAt]);
    const nowMs = new Date(nowIso).getTime();

    const current = node.stage.policy.fsrs;

    // Build the four grade options with an honest preview of the next
    // interval. The `scheduleReview` helper is pure — we can call it
    // four times here without any state mutation.
    const options = useMemo<GradeOption[]>(() => {
        const preview = (grade: ReviewGrade) => {
            const { dueAt } = scheduleReview(current, grade, nowIso);
            const days = (new Date(dueAt).getTime() - nowMs) / MS_PER_DAY;

            return formatInterval(days);
        };

        return [
            {
                grade: 'again',
                label: 'Again',
                subtitle: preview('again'),
                className:
                    'bg-red-50 hover:bg-red-100 text-red-700 border-red-200',
            },
            {
                grade: 'hard',
                label: 'Hard',
                subtitle: preview('hard'),
                className:
                    'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200',
            },
            {
                grade: 'good',
                label: 'Good',
                subtitle: preview('good'),
                className:
                    'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200',
            },
            {
                grade: 'easy',
                label: 'Easy',
                subtitle: preview('easy'),
                className:
                    'bg-white hover:bg-grayscale-10 text-grayscale-800 border-grayscale-200',
            },
        ];
    }, [current, nowIso, nowMs]);

    const handleGrade = (grade: ReviewGrade) => {
        const outcome = scheduleReview(current, grade, nowIso);

        // Persist the new FSRS params onto the node. We intentionally do
        // NOT flip progress.status to `completed` — a graded review
        // schedules the next one rather than finishing the node. The
        // commit CTA below still decides "done".
        pathwayStore.set.editNode(pathwayId, node.id, {
            stage: {
                ...node.stage,
                policy: {
                    kind: 'review',
                    fsrs: outcome.fsrs,
                },
            },
            progress: {
                ...node.progress,
                status:
                    node.progress.status === 'not-started'
                        ? 'in-progress'
                        : node.progress.status,
                streak: {
                    ...node.progress.streak,
                    current: node.progress.streak.current + 1,
                    longest: Math.max(
                        node.progress.streak.longest,
                        node.progress.streak.current + 1,
                    ),
                    lastActiveAt: nowIso,
                },
            },
        });
    };

    return (
        <section className="space-y-3 p-4 rounded-2xl border border-grayscale-200 bg-white">
            <div className="flex items-center gap-2 text-xs text-grayscale-600">
                <IonIcon icon={timeOutline} className="text-base" aria-hidden />

                <span>{dueStateLabel(current.dueAt, nowMs)}</span>

                {current.lastReviewAt && (
                    <span className="ml-auto text-[11px] text-grayscale-400">
                        Last graded{' '}
                        {new Date(current.lastReviewAt).toLocaleDateString()}
                    </span>
                )}
            </div>

            <p className="text-[11px] text-grayscale-500 leading-relaxed">
                How did that feel? Your answer schedules the next review.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {options.map(o => (
                    <motion.button
                        key={o.grade}
                        type="button"
                        onClick={() => handleGrade(o.grade)}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className={`flex flex-col items-center justify-center py-2.5 px-2
                                   rounded-xl border font-medium transition-colors
                                   ${o.className}`}
                    >
                        <span className="text-sm">{o.label}</span>

                        <span className="text-[10px] opacity-70 tabular-nums">
                            {o.subtitle}
                        </span>
                    </motion.button>
                ))}
            </div>
        </section>
    );
};

export default ReviewsPanel;
