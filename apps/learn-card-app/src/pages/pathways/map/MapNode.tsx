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

import { IonIcon } from '@ionic/react';
import { Handle, Position } from '@xyflow/react';
import {
    chevronForwardOutline,
    gitBranchOutline,
    lockClosedOutline,
    openOutline,
    ribbonOutline,
} from 'ionicons/icons';
import { motion } from 'motion/react';

import { pathwayStore } from '../../../stores/pathways';
import { computePathwayProgress, resolveCompositeChild } from '../core/composition';
import type { PathwayNode } from '../types';

/**
 * Per-node prerequisite fold. Produced once in `MapMode` and handed to
 * every card so gating (Locked · 2/6) renders without any card having
 * to walk adjacency itself.
 */
export interface MapNodePrereq {
    met: number;
    total: number;
    gated: boolean;
}

export type MapNodeData = {
    node: PathwayNode;
    inFocus: boolean;
    isFocusNode: boolean;
    prereq: MapNodePrereq;
} & Record<string, unknown>;

/**
 * Short display label for a CTDL-style `achievementType`. Narrows the
 * long registry forms (`"DigitalBadge"`, `"Certification"`, etc.) to
 * the handful of nouns that fit in a 60-ish-px chip. Unknown values
 * fall through to `"Credential"` so we never print raw CTDL strings.
 */
const credentialTypeChip = (achievementType: string | undefined): string => {
    if (!achievementType) return 'Credential';

    const t = achievementType.toLowerCase();

    if (t.includes('badge')) return 'Badge';
    if (t.includes('certificate') || t.includes('certification')) return 'Certificate';
    if (t.includes('diploma')) return 'Diploma';
    if (t.includes('degree')) return 'Degree';
    if (t.includes('license') || t.includes('licence')) return 'License';
    if (t.includes('microcredential') || t.includes('micro-credential')) {
        return 'Micro-credential';
    }

    return 'Credential';
};

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

    // Composite-node affordance: if this node references another
    // pathway, we show a tiny "chunk" pill in the top-left corner so
    // the map reads as "these three nodes are steps of X pathway".
    // The pill distinguishes the two render styles — inline (part of
    // this pathway) vs. link-out (a separate, linked pathway) — using
    // the same icon/copy language as NodeDetail's CompositeNodeBody so
    // the map and detail feel like the same object.
    const isComposite = node.stage.policy.kind === 'composite';

    // We subscribe narrowly: the composite badge only needs the
    // referenced pathway and progress. Subscribing to the whole
    // `pathways` record is cheap here (Zustand is shallow-compare per
    // selector and this component is already remounted by React Flow
    // on graph changes).
    const allPathways = pathwayStore.use.pathways();

    const childInfo = (() => {
        if (!isComposite) return null;

        const child = resolveCompositeChild(allPathways, node);
        if (!child) return { missing: true as const };

        const progress = computePathwayProgress(child);

        return {
            missing: false as const,
            child,
            progress,
            renderStyle:
                node.stage.policy.kind === 'composite'
                    ? node.stage.policy.renderStyle
                    : 'inline-expandable',
        };
    })();

    return (
        <motion.div
            className="relative font-poppins"
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

                {/*
                    Composite pill — top-left. Two render styles:
                      - inline-expandable → shows a progress count
                        (3/5) so the learner can see depth at a glance.
                      - link-out → shows the open-out icon to telegraph
                        that tapping this jumps to another pathway.
                    Missing child (ref exists but pathway not loaded)
                    degrades gracefully to a neutral "Linked pathway"
                    pill rather than crashing or hiding.
                */}
                {childInfo && (
                    <span
                        aria-hidden
                        title={
                            childInfo.missing
                                ? 'Linked pathway (not loaded)'
                                : childInfo.renderStyle === 'link-out'
                                    ? `Links to ${childInfo.child.title}`
                                    : `${childInfo.progress.completed}/${childInfo.progress.total} · ${childInfo.child.title}`
                        }
                        className={`absolute -top-1.5 -left-1.5 h-5 px-1.5
                                    inline-flex items-center gap-1
                                    rounded-full border
                                    text-[10px] font-medium
                                    shadow-sm
                                    ${childInfo.missing
                                        ? 'bg-grayscale-100 border-grayscale-200 text-grayscale-500'
                                        : 'bg-white border-emerald-200 text-emerald-700'
                                    }
                                  `}
                    >
                        <IonIcon
                            icon={
                                childInfo.missing || childInfo.renderStyle === 'inline-expandable'
                                    ? gitBranchOutline
                                    : openOutline
                            }
                            className="text-[11px]"
                        />

                        {!childInfo.missing && childInfo.renderStyle === 'inline-expandable' && (
                            <span>
                                {childInfo.progress.completed}/{childInfo.progress.total}
                            </span>
                        )}
                    </span>
                )}

                {/*
                    Corner chevron on the focus card — communicates "this
                    card is tappable to open" without growing the card's
                    height (the actual action lives in FocusActionBar at
                    the bottom of the map, so edges never get blocked).
                */}
                {isFocusNode && status !== 'completed' && status !== 'skipped' && (
                    <span
                        aria-hidden
                        className="absolute top-2 right-2 w-5 h-5 rounded-full
                                   bg-emerald-600 text-white
                                   flex items-center justify-center
                                   shadow-sm shadow-emerald-600/40"
                    >
                        <IonIcon
                            icon={chevronForwardOutline}
                            className="text-[10px]"
                        />
                    </span>
                )}

                <p className={`text-sm font-semibold text-grayscale-900 leading-snug line-clamp-2 mb-1.5 ${
                    isFocusNode && status !== 'completed' && status !== 'skipped' ? 'pr-6' : ''
                }`}>
                    {node.title}
                </p>

                {/*
                    Bottom meta row. Three concerns packed into one line:

                      1. **Credential affordance** (optional) — when the
                         node carries a `credentialProjection` (every
                         CredentialComponent from a CTDL import does),
                         lead with a ribbon icon + credential type
                         chip ("Badge" / "Certificate" / …). This
                         flips the card from "generic task" to
                         "something you earn" without eating the title.

                      2. **Gated state** — if the node has unmet
                         prerequisites, the row swaps its status
                         label to `Locked · {met}/{total}` with a lock
                         glyph. This is the honest counter-signal to
                         "Up next" on gated destinations: the IMA
                         Certificate node now reads "Certificate ·
                         Locked · 0/6" instead of the misleading
                         "Up next".

                      3. **Status label** — the existing `STATUS_LABEL`
                         copy still drives the tail of the row when
                         nothing gates the node. `"Your next step"`
                         still wins on the focus-node + not-started
                         case for tight coupling with the focus halo.
                */}
                {(() => {
                    const projection = node.credentialProjection;
                    const typeLabel = projection
                        ? credentialTypeChip(projection.achievementType)
                        : null;

                    // Gated wins over any status label — "Up next" is
                    // false when you can't start yet.
                    const isGated = data.prereq.gated;

                    const tailLabel = isGated
                        ? `Locked · ${data.prereq.met}/${data.prereq.total}`
                        : isFocusNode && status === 'not-started'
                            ? 'Your next step'
                            : STATUS_LABEL[status];

                    // Gated reads as grayscale; otherwise keep the
                    // emerald accent on the credential ribbon so the
                    // card visually separates "earnable" from "locked".
                    const ribbonTone = isGated
                        ? 'text-grayscale-400'
                        : status === 'completed'
                            ? 'text-emerald-600'
                            : 'text-emerald-500';

                    return (
                        <div className="flex items-center gap-1.5 min-w-0">
                            {projection && (
                                <>
                                    <IonIcon
                                        aria-hidden
                                        icon={ribbonOutline}
                                        className={`shrink-0 text-[11px] ${ribbonTone}`}
                                    />

                                    <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-grayscale-500">
                                        {typeLabel}
                                    </span>

                                    <span
                                        aria-hidden
                                        className="shrink-0 text-grayscale-300 text-[10px]"
                                    >
                                        ·
                                    </span>
                                </>
                            )}

                            {!projection && (
                                <span
                                    aria-hidden
                                    className={`shrink-0 inline-block w-1.5 h-1.5 rounded-full ${
                                        isGated ? 'bg-grayscale-300' : STATUS_DOT[status]
                                    }`}
                                />
                            )}

                            {isGated && (
                                <IonIcon
                                    aria-hidden
                                    icon={lockClosedOutline}
                                    className="shrink-0 text-[10px] text-grayscale-400"
                                />
                            )}

                            <span className="text-[10px] font-medium uppercase tracking-wide text-grayscale-500 truncate">
                                {tailLabel}
                            </span>
                        </div>
                    );
                })()}
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
