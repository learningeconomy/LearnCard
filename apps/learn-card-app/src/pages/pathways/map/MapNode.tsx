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
    documentTextOutline,
    gitBranchOutline,
    lockClosedOutline,
    openOutline,
    refreshOutline,
    repeatOutline,
    ribbonOutline,
} from 'ionicons/icons';
import { motion } from 'motion/react';

import { pathwayStore } from '../../../stores/pathways';
import { computePathwayProgress, resolveCompositeChild } from '../core/composition';
import { useListingForNode } from '../node/useListingForNode';
import type { PathwayNode, Policy } from '../types';

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
    /**
     * True when this node sits on the currently-computed suggested
     * route (focus → destination). Off-route nodes render at reduced
     * saturation so the route ribbon visually pops. See
     * `map/route.ts` for how the route is derived.
     */
    isOnRoute?: boolean;
    /**
     * True only for the *single* "you are here" node — the first
     * uncompleted node on the route. Drives the pulsing Maps-style
     * pin that sits above the card's top handle.
     */
    isYourPosition?: boolean;
    /**
     * Navigate-mode side-branch flag. True when the node is laid out
     * as a side-branch off the spine (i.e. off the chosenRoute) while
     * the Map is in Navigate layout. Drives aggressive dimming so the
     * spine reads as the hero and side-branches recede. Set only by
     * `MapMode` when `effectiveLayout === 'navigate'`; left undefined
     * (treated as false) in Explore layout so the existing dimming
     * story is unchanged.
     *
     * Note: with the route-only Navigate layout, off-route nodes
     * aren't rendered at all — this flag is retained for Explore
     * mode's partial uses and potential future overlays, but
     * MapMode no longer sets it to `true` in practice.
     */
    isSideBranch?: boolean;
    /**
     * Count of off-route neighbors (prereqs + dependents combined,
     * deduplicated) that exist in the pathway but aren't on the
     * committed walk. Rendered as a compact "N detours" chip on
     * spine nodes in Navigate mode so learners can see at-a-glance
     * that this step has alternative paths they're currently
     * skipping. Tap (via `onDetourTap`) peeks Explore mode.
     *
     * Only populated by `MapMode` in Navigate layout for on-route
     * nodes. Undefined in Explore layout — the full graph is already
     * visible there, so the chip would be redundant.
     */
    detourCount?: number;
    /**
     * Tap handler for the detour chip. Invoked when the learner taps
     * the "N detours" affordance on a spine node. MapMode wires this
     * to its layoutOverride setter so the tap flips the canvas into
     * Explore — the detours become visible without clearing the
     * committed route. "Resume navigation" in the chrome swings back.
     */
    onDetourTap?: () => void;
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

const STATUS_LABEL: Record<Status, string> = {
    'not-started': 'Up next',
    'in-progress': 'In progress',
    stalled: 'Needs attention',
    completed: 'Done',
    skipped: 'Skipped',
};

// ---------------------------------------------------------------------------
// M6.d — Kind color tokens for the node avatar.
//
// Each node carries a `policy.kind` discriminant. Before M6 the map
// used a single ribbon/sparkle for every node; at real-world density
// that reads as a wall of identical cards. Tinting the avatar by kind
// restores the "taxonomy you can scan" affordance from the Figma
// mobile designs (green course cap / orange trophy / blue briefcase)
// while staying inside the app's emerald + amber + grayscale palette
// per the LearnCard UI/UX guidelines.
//
// Mapping:
//   practice/artifact/composite → emerald  (earning, progress, nesting)
//   assessment                  → amber    (challenge, attention)
//   review                      → grayscale (revisit, not new ground)
//   external                    → grayscale (out-of-system action)
// ---------------------------------------------------------------------------

type PolicyKind = Policy['kind'];

const KIND_TONE: Record<PolicyKind, { bg: string; fg: string }> = {
    practice: { bg: 'bg-emerald-100', fg: 'text-emerald-700' },
    artifact: { bg: 'bg-emerald-100', fg: 'text-emerald-700' },
    composite: { bg: 'bg-emerald-100', fg: 'text-emerald-700' },
    assessment: { bg: 'bg-amber-100', fg: 'text-amber-800' },
    review: { bg: 'bg-grayscale-100', fg: 'text-grayscale-600' },
    external: { bg: 'bg-grayscale-100', fg: 'text-grayscale-600' },
};

const KIND_ICON: Record<PolicyKind, string> = {
    practice: repeatOutline,
    artifact: documentTextOutline,
    composite: gitBranchOutline,
    assessment: ribbonOutline,
    review: refreshOutline,
    external: openOutline,
};

/**
 * M6.b + v0.5 — Node avatar.
 *
 * Four-tier visual fallback, picked in order:
 *
 *   1. `appListingIconUrl` — when the node's resolved action is an
 *      app-listing, use the app's square icon rendered in a
 *      `rounded-xl` frame (not a circle). The squircle-vs-circle
 *      distinction is doing work here: badges read as "thing you
 *      earn" (circle, ring, completion aura); apps read as "thing you
 *      open to work" (square, like any phone app icon). Two shapes,
 *      two meanings — learners scan once and know which card is which.
 *   2. `credentialProjection.image` — the badge/certificate art from
 *      the CTDL import. Seeing the actual badge you'll earn makes
 *      the card feel like a real reward, not a todo list row.
 *   3. Otherwise, a kind-tinted bubble with a `KIND_ICON` glyph (see
 *      the KIND_TONE / KIND_ICON maps above). Every card still has a
 *      recognizable anchor point even when no art exists.
 *
 * Locked/gated nodes render the avatar desaturated + slightly
 * transparent. Completed nodes render at full saturation regardless
 * of gating (you can't un-complete a step).
 */
const NodeAvatar: React.FC<{
    node: PathwayNode;
    status: Status;
    isGated: boolean;
    /**
     * App-listing icon URL when the node's action is `app-listing`
     * and the listing has resolved. Undefined for every other node,
     * and while the listing is still loading — we'd rather show the
     * kind-glyph fallback than briefly flash a generic circle before
     * the app icon pops in. React Query caches per listingId so the
     * flash is sub-frame in practice.
     */
    appListingIconUrl?: string | null;
}> = ({ node, status, isGated, appListingIconUrl }) => {
    const badgeImage = node.credentialProjection?.image;
    const kind = node.stage.policy.kind;
    const tone = KIND_TONE[kind];
    const glyph = KIND_ICON[kind];

    const isCompleted = status === 'completed';
    // Gated avatars desaturate + dim — "this is a thing you'll earn,
    // but it isn't available yet." Completed wins over gating.
    const dimClass = isGated && !isCompleted ? 'opacity-60 grayscale' : '';

    // App-listing wins — the node exists to send the learner into that
    // app, so the app's own identity is the most honest anchor.
    if (appListingIconUrl) {
        return (
            <span
                aria-hidden
                className={`shrink-0 w-8 h-8 rounded-[8px] overflow-hidden bg-white ring-1 ring-grayscale-200 shadow-sm ${dimClass}`}
            >
                <img
                    src={appListingIconUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                    draggable={false}
                    onError={e => {
                        // Broken CDN → fall through visually by
                        // clearing the src. Parent's ring + bg-white
                        // keep the slot occupied so layout is stable
                        // and the other fallbacks aren't retriggered.
                        (e.currentTarget as HTMLImageElement).src = '';
                    }}
                />
            </span>
        );
    }

    if (badgeImage) {
        return (
            <span
                aria-hidden
                className={`shrink-0 w-8 h-8 rounded-full overflow-hidden bg-white ring-1 ring-grayscale-200 shadow-sm ${dimClass}`}
            >
                <img
                    src={badgeImage}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                    draggable={false}
                />
            </span>
        );
    }

    return (
        <span
            aria-hidden
            className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${tone.bg} ${tone.fg} ${dimClass}`}
        >
            <IonIcon icon={glyph} className="text-base" />
        </span>
    );
};

const MapNode: React.FC<{ data: MapNodeData }> = ({ data }) => {
    const { node, inFocus, isFocusNode } = data;
    const status = node.progress.status;

    // App-listing resolution. `useListingForNode` is gated internally —
    // for nodes without an `app-listing` action the hook short-circuits
    // and issues no queries, so we pay nothing on badge / credential /
    // review nodes. React Query de-dupes per listingId, so 10 map cards
    // pointing at the same listing still issue exactly one request.
    // When the fetch resolves we pass the icon URL to NodeAvatar, which
    // swaps its circular badge frame for a rounded-xl app frame — the
    // one-look visual signal this is an embedded-app step.
    const listingForNode = useListingForNode(node);
    const appListingIconUrl =
        listingForNode.listing?.icon_url ?? null;

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
                // Target opacity honors two layers of emphasis:
                //   - **Depth fade** (Explore): out-of-focus nodes drop
                //     to 0.4 so the neighborhood in focus reads.
                //   - **Side-branch fade** (Navigate): nodes that aren't
                //     on the committed route recede to 0.35 so the
                //     spine carries the eye. Overrides depth fade
                //     because Navigate mode's hierarchy is "route vs
                //     not," not "near vs far from focus."
                opacity: data.isSideBranch
                    ? 0.35
                    : inFocus
                        ? 1
                        : 0.4,
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
                    ${data.isOnRoute === false ? 'opacity-80' : ''}
                `}
            >
                {/*
                    "You are here" pin — the Waze/Maps-style dot that
                    tells the learner their current *position on the
                    route*, not just which card has the focus halo.
                    Renders above the card's top edge (which is the
                    source handle's side; the handle itself is a small
                    gray dot, so the pin reads as sitting *on* the
                    road that leaves this node).

                    Two stacked layers: a pulsing halo ring that
                    breathes outward, and a solid emerald dot in the
                    center. The halo never scales the card itself
                    because `pointer-events-none` keeps it out of the
                    hit test — learners click the card, not the pin.
                */}
                {data.isYourPosition && (
                    <span
                        aria-hidden
                        className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-3.5 flex items-center justify-center"
                        style={{ width: 20, height: 20 }}
                    >
                        <span className="absolute inset-0 rounded-full bg-emerald-400/40 animate-ping" />
                        <span className="relative w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white shadow-[0_2px_6px_rgba(16,185,129,0.55)]" />
                    </span>
                )}

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
                    Detour chip (Navigate mode only).
                    ─────────────────────────────────
                    Bottom-right of the card — a small pill showing
                    "N detours" when this spine node has off-route
                    neighbors. Google-Maps-style signal that the
                    graph has more to offer here without rendering
                    the off-route cards on the Navigate canvas
                    (which would clutter the spine).

                    Tapping the chip invokes `onDetourTap`, which
                    MapMode wires to a layoutOverride='explore'
                    flip. The route stays committed; the canvas
                    just swings to Explore so the learner can see
                    the alternatives. "Resume navigation" in the
                    top-right chrome swings back.

                    Bottom-right placement avoids clashing with the
                    top-left composite pill, top-right completed
                    check / focus chevron, and the top-center
                    "you are here" pin. On the focus card the
                    bottom edge is otherwise empty.
                */}
                {data.detourCount !== undefined && data.detourCount > 0 && (
                    <button
                        type="button"
                        onClick={e => {
                            e.stopPropagation();
                            data.onDetourTap?.();
                        }}
                        aria-label={`View ${data.detourCount} ${
                            data.detourCount === 1 ? 'detour' : 'detours'
                        } from this step`}
                        className="absolute -bottom-2 -right-2 h-5 px-1.5
                                   inline-flex items-center gap-1
                                   rounded-full border border-grayscale-200
                                   bg-white/90 backdrop-blur-sm
                                   text-[10px] font-medium text-grayscale-600
                                   shadow-sm
                                   hover:bg-white hover:text-grayscale-900
                                   hover:border-grayscale-300
                                   transition-colors"
                    >
                        <IonIcon icon={gitBranchOutline} className="text-[11px]" />
                        <span>
                            {data.detourCount}{' '}
                            {data.detourCount === 1 ? 'detour' : 'detours'}
                        </span>
                    </button>
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

                {/*
                    M6.b + M6.d — avatar + content layout.

                    Avatar on the left anchors the card visually the
                    way the Figma mobile designs do (a colored glyph
                    or the actual badge image you can recognize from
                    across the canvas). Content column to the right
                    packs the title, an optional progress bar for
                    composite nodes, and the meta row.

                    Card width stays at 200px; the avatar is 32px +
                    10px gap, leaving ~134px for the title — still
                    comfortable for two lines at text-sm.
                */}
                <div className="flex items-start gap-2.5">
                    <NodeAvatar
                        node={node}
                        status={status}
                        isGated={data.prereq.gated}
                        appListingIconUrl={appListingIconUrl}
                    />

                    <div className="min-w-0 flex-1">
                        <p
                            title={node.title}
                            className={`text-sm font-semibold text-grayscale-900 leading-snug line-clamp-2 ${
                                isFocusNode &&
                                status !== 'completed' &&
                                status !== 'skipped'
                                    ? 'pr-5'
                                    : ''
                            }`}
                        >
                            {node.title}
                        </p>

                        {/*
                            M6.d — Composite progress bar.

                            Only rendered when the node references a
                            loaded nested pathway. The bar reflects
                            the nested pathway's completion fraction
                            so a learner sees "halfway through this
                            chunk" at a glance without drilling in.
                            For link-out composites (not loaded) and
                            non-composite nodes this is skipped so the
                            card height doesn't shift.
                        */}
                        {childInfo && !childInfo.missing && (
                            <div
                                className="mt-1.5 h-1 w-full rounded-full bg-grayscale-100 overflow-hidden"
                                role="progressbar"
                                aria-label={`${childInfo.progress.completed} of ${childInfo.progress.total} steps complete`}
                                aria-valuenow={childInfo.progress.completed}
                                aria-valuemin={0}
                                aria-valuemax={childInfo.progress.total}
                            >
                                <div
                                    className={`h-full rounded-full transition-[width] duration-500 ease-out ${
                                        data.prereq.gated
                                            ? 'bg-grayscale-300'
                                            : 'bg-emerald-500'
                                    }`}
                                    style={{
                                        width: `${Math.round(
                                            childInfo.progress.fraction * 100,
                                        )}%`,
                                    }}
                                />
                            </div>
                        )}

                        {/*
                            Bottom meta row:
                              - Credential type chip ("Badge" /
                                "Certificate" / …) when the node has a
                                `credentialProjection`.
                              - "Locked · met/total" with a lock glyph
                                when the node has unmet prerequisites
                                (wins over the status label — "Up
                                next" is false when you can't start).
                              - Status label otherwise. "Your next
                                step" wins on the focus-node +
                                not-started case so the halo and copy
                                agree.

                            The pre-M6 standalone status dot is gone:
                            the avatar + card tint + completion
                            checkmark already encode status; the dot
                            was redundant.
                        */}
                        {(() => {
                            const projection = node.credentialProjection;
                            const typeLabel = projection
                                ? credentialTypeChip(projection.achievementType)
                                : null;
                            const isGated = data.prereq.gated;

                            const tailLabel = isGated
                                ? `Locked · ${data.prereq.met}/${data.prereq.total}`
                                : isFocusNode && status === 'not-started'
                                    ? 'Your next step'
                                    : STATUS_LABEL[status];

                            return (
                                <div className="mt-1 flex items-center gap-1.5 min-w-0">
                                    {typeLabel && (
                                        <>
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
