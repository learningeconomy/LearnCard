/**
 * MapNode — custom React Flow node for pathway nodes.
 *
 * Visual language:
 *   - **Status tints the card itself** — completed cards are emerald-
 *     washed, in-progress are amber-washed, everything else stays a
 *     calm white. A tiny colored dot replaces the shouty "NOT STARTED"
 *     chip; the card's own hue does the talking.
 *   - **Focus node glows** — the node the learner would currently act on
 *     wears a soft emerald halo ring + a gentle scale bump, pulling the
 *     eye up the spine of the pathway.
 *   - **Progressive disclosure by depth** — cards > 2 hops from the
 *     focus dim to 40% and lose their shadow so the neighborhood in
 *     focus reads unambiguously (docs § 10).
 *   - **Gentle interactions** — hover lifts the card a hair; the whole
 *     thing animates in on first paint.
 */

import React from 'react';

import { Handle, Position } from '@xyflow/react';
import { motion } from 'motion/react';

import type { PathwayNode } from '../types';

export type MapNodeData = {
    node: PathwayNode;
    inFocus: boolean;
    isFocusNode: boolean;
} & Record<string, unknown>;

type Status = PathwayNode['progress']['status'];

// Per-status card and dot treatments. The card tint is pale enough that
// a row of mixed-status cards still reads as a single graph, not a
// rainbow.
const STATUS_CARD: Record<Status, string> = {
    'not-started': 'bg-white border-grayscale-200',
    'in-progress': 'bg-amber-50/60 border-amber-100',
    stalled: 'bg-red-50/60 border-red-100',
    completed: 'bg-emerald-50/70 border-emerald-100',
    skipped: 'bg-grayscale-50 border-grayscale-200 opacity-70',
};

const STATUS_DOT: Record<Status, string> = {
    'not-started': 'bg-grayscale-300',
    'in-progress': 'bg-amber-500',
    stalled: 'bg-red-500',
    completed: 'bg-emerald-600',
    skipped: 'bg-grayscale-300',
};

const STATUS_LABEL: Record<Status, string> = {
    'not-started': 'Up next',
    'in-progress': 'In progress',
    stalled: 'Needs attention',
    completed: 'Done',
    skipped: 'Skipped',
};

const MapNode: React.FC<{ data: MapNodeData }> = ({ data }) => {
    const { node, inFocus, isFocusNode } = data;
    const status = node.progress.status;

    return (
        <motion.div
            className="font-poppins"
            style={{ width: 200 }}
            // Entrance: fade + slight rise, staggered naturally by React Flow's
            // mount order. A 300ms duration keeps the whole graph appearing
            // calm rather than busy.
            initial={{ opacity: 0, y: 6 }}
            animate={{
                // Target opacity honors the depth-fade (out-of-focus = 0.4).
                opacity: inFocus ? 1 : 0.4,
                y: 0,
                // Spring the scale when the focus node shifts — feels springy
                // rather than flipped.
                scale: isFocusNode ? 1.06 : 1,
            }}
            transition={{
                opacity: { duration: 0.3, ease: 'easeOut' },
                y: { duration: 0.3, ease: 'easeOut' },
                scale: { type: 'spring', stiffness: 260, damping: 22, mass: 0.6 },
            }}
        >
            {/*
                Bottom-up layout: prerequisites sit below their dependents,
                so edges enter a node from the bottom and exit from the top.
            */}
            <Handle
                type="target"
                position={Position.Bottom}
                className="!bg-grayscale-300 !border-0 !w-1.5 !h-1.5 !opacity-60"
            />

            <div
                className={`
                    relative p-3 rounded-2xl border backdrop-blur-[1px]
                    transition-all duration-300 ease-out
                    hover:-translate-y-0.5 hover:shadow-lg
                    ${STATUS_CARD[status]}
                    ${
                        isFocusNode
                            ? 'ring-2 ring-emerald-400/70 ring-offset-2 ring-offset-grayscale-10 shadow-[0_0_24px_-4px_rgba(16,185,129,0.45)]'
                            : inFocus
                                ? 'shadow-sm'
                                : ''
                    }
                `}
            >
                {status === 'completed' && (
                    <span
                        aria-hidden
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] leading-[20px] text-center font-bold shadow-sm"
                    >
                        ✓
                    </span>
                )}

                <p className="text-sm font-semibold text-grayscale-900 leading-snug line-clamp-2 mb-1.5">
                    {node.title}
                </p>

                <div className="flex items-center gap-1.5">
                    <span
                        aria-hidden
                        className={`inline-block w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`}
                    />

                    <span className="text-[10px] font-medium uppercase tracking-wide text-grayscale-500">
                        {isFocusNode && status === 'not-started'
                            ? 'Your next step'
                            : STATUS_LABEL[status]}
                    </span>
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Top}
                className="!bg-grayscale-300 !border-0 !w-1.5 !h-1.5 !opacity-60"
            />
        </motion.div>
    );
};

export default MapNode;
