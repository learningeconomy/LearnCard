/**
 * TerminationProgress — small SVG ring that visualizes how close a
 * node is to "done".
 *
 * Lives in the NodeDetail overlay header so the termination rule and
 * the progress toward it stay in the same glance — no separate
 * "HOW THIS COMPLETES" section to scan for.
 *
 * Renders three states keyed off a `TerminationView`:
 *
 *   - count / unmet: hollow emerald ring filling clockwise as current
 *                    climbs toward total. Center shows "0/1".
 *   - count / done : filled emerald disk with a drawn-in check.
 *   - ready        : same filled disk + check (self-attest nodes).
 *   - unsupported  : muted ring with a "—" to signal "not yet".
 */

import React from 'react';

import { motion } from 'motion/react';

import type { TerminationView } from './termination';

interface TerminationProgressProps {
    view: TerminationView;
    /** Override the default 56px size if the surface wants it tighter. */
    size?: number;
}

// Arc geometry. Small radius keeps the ring compact enough to sit
// inline next to a 22px heading without feeling decorative.
const STROKE = 3;

const TerminationProgress: React.FC<TerminationProgressProps> = ({ view, size = 56 }) => {
    const radius = size / 2 - STROKE;
    const circumference = 2 * Math.PI * radius;

    // Share the "done" look between count/done, ready, and any future
    // always-satisfied termination kinds so the success feel is the same.
    const isDone =
        (view.kind === 'count' && view.done) || view.kind === 'ready';

    const ratio =
        view.kind === 'count' ? view.current / Math.max(view.total, 1) : isDone ? 1 : 0;

    // The foreground stroke draws clockwise from the top. We achieve
    // that by rotating the whole SVG -90° and animating strokeDashoffset.
    const dashOffset = circumference * (1 - ratio);

    const trackColor = isDone ? 'rgba(16, 185, 129, 0.15)' : 'rgba(210, 214, 222, 0.6)';
    const strokeColor = isDone ? '#059669' : '#10B981'; // emerald-600 / emerald-500
    const textColor = isDone ? 'text-emerald-700' : 'text-grayscale-700';

    return (
        <div
            className="relative shrink-0 flex items-center justify-center"
            style={{ width: size, height: size }}
            aria-label={
                view.kind === 'count'
                    ? `${view.current} of ${view.total} done`
                    : isDone
                        ? 'Ready to complete'
                        : 'Locked'
            }
            role="img"
        >
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="-rotate-90"
            >
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={trackColor}
                    strokeWidth={STROKE}
                />

                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={false}
                    animate={{ strokeDashoffset: dashOffset }}
                    transition={{ type: 'spring', stiffness: 140, damping: 20, mass: 0.8 }}
                />
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
                {isDone ? (
                    // Drawn-in check — same language as CompletionMoment for
                    // consistency across the proof-of-effort surfaces.
                    <svg width={size * 0.4} height={size * 0.4} viewBox="0 0 24 24" fill="none">
                        <motion.path
                            d="M5 12.5l4.5 4.5L19 7"
                            stroke="#059669"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
                        />
                    </svg>
                ) : view.kind === 'count' ? (
                    <span className={`text-[11px] font-semibold tabular-nums ${textColor}`}>
                        {view.current}
                        <span className="text-grayscale-400 font-medium">/{view.total}</span>
                    </span>
                ) : (
                    <span className="text-xs text-grayscale-400 font-medium">—</span>
                )}
            </div>
        </div>
    );
};

export default TerminationProgress;
