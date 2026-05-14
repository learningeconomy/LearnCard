/**
 * NavigateMode — the "Waze driving view" for a pathway.
 *
 * ## Why a dedicated mode
 *
 * Google Maps has two modes: **Browse** and **Navigate**. Browse is a
 * spatial picture of the whole world; Navigate is a heads-up,
 * step-by-step guide to the one turn you need to make right now.
 * Switching modes is the core product gesture.
 *
 * Pathways deserves the same split. `MapMode` is Browse — you see
 * the graph, pan around, plan. `NavigateMode` is Navigate — you
 * don't see the graph at all, you see *the next thing to do*, at
 * eye level, in one card, with a big green "do it" button and a
 * peek at the step after that. Every other piece of chrome is
 * stripped away so there's no ambiguity about what to do next.
 *
 * ## What's in the view
 *
 *   - **Destination header** — echoes the Browse-mode goal pill
 *     with an ETA, so the distance-to-goal signal persists across
 *     both modes.
 *   - **Trail strip** — a horizontal sequence of dots/bars, one per
 *     node on the route. Completed ones are emerald and the "you
 *     are here" dot pulses. Matches Maps' mini-route indicator.
 *   - **Current-step card** — big, centered, with the credential
 *     avatar, full title, kind chip, effort estimate, and the
 *     primary "Open this step" CTA.
 *   - **Next-up peek** — smaller card below, shows the next
 *     uncompleted step on the route. Faded back so the hierarchy
 *     is obvious.
 *   - **Exit** — a "Back to map" chip that returns to Browse.
 *
 * ## What NavigateMode doesn't own
 *
 *   - **State.** `MapMode` owns `focusId`, the active pathway, and
 *     the Browse/Navigate toggle. NavigateMode is a pure
 *     presentation of those props.
 *   - **Completion.** Tapping "Open this step" navigates to
 *     `NodeDetail`, where the learner actually logs
 *     completion. When they come back, `MapMode.defaultFocusId`
 *     has already advanced to the next available node (since
 *     `availableNodes` now returns a different list), and
 *     `NavigateMode` auto-re-renders with the new focus. No
 *     special completion-listening here.
 */

import React, { useEffect } from 'react';

import { IonIcon } from '@ionic/react';
import {
    arrowBackOutline,
    arrowForwardOutline,
    checkmarkCircle,
    flagOutline,
    hourglassOutline,
    openOutline,
} from 'ionicons/icons';
import { AnimatePresence, motion } from 'motion/react';

import { mcpRegistryStore } from '../../../stores/pathways';
import {
    getNodeEarnLink,
    policyLabel,
    resolveNodeCallToAction,
} from '../today/presentation';
import type { Pathway, PathwayNode } from '../types';

import type { SuggestedRoute } from './route';
import { formatEta, nodeEffortMinutes } from './route';

export interface NavigateModeProps {
    pathway: Pathway;

    /** The suggested route (focus → destination). */
    route: SuggestedRoute;

    /**
     * Index of the learner's "you are here" node on the route. `null`
     * if the whole route is completed (we render a success state).
     */
    yourIndex: number | null;

    /** The focus/your-position node (null → success state). */
    currentNode: PathwayNode | null;

    /** Next uncompleted node on the route, or null if at the end. */
    nextNode: PathwayNode | null;

    /** Open the detail page for a given node id. */
    onOpen: (nodeId: string) => void;

    /** Return to Browse mode. */
    onExit: () => void;
}

const NavigateMode: React.FC<NavigateModeProps> = ({
    pathway,
    route,
    yourIndex,
    currentNode,
    nextNode,
    onOpen,
    onExit,
}) => {
    // ESC → exit. Standard keyboard escape hatch, same pattern
    // Google Maps uses to leave navigation.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onExit();
        };

        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onExit]);

    const mcpServers = mcpRegistryStore.use.servers();

    // The whole route is complete? Render a small celebratory finish
    // line. The learner can exit or tap the destination to review it.
    const allComplete = yourIndex === null;

    const nodeById = React.useMemo(
        () => new Map(pathway.nodes.map(n => [n.id, n])),
        [pathway],
    );

    return (
        <AnimatePresence>
            <motion.div
                key="navigate-mode"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="absolute inset-0 z-20 font-poppins
                           bg-gradient-to-b from-emerald-50/90 via-white/95 to-white/95
                           backdrop-blur-xl overflow-y-auto"
                role="dialog"
                aria-label="Pathway navigation"
            >
                <div className="min-h-full flex flex-col items-center px-4 py-6">
                    {/*
                        Top row: back-to-map + destination + ETA. Same
                        visual rhythm as the MapMode goal pill — the
                        two modes echo each other so switching feels
                        seamless.
                    */}
                    <div className="w-full max-w-md flex items-center justify-between gap-3 mb-8">
                        <button
                            type="button"
                            onClick={onExit}
                            className="flex items-center gap-1.5 py-2 px-3 rounded-full
                                       bg-white/70 backdrop-blur-md border border-white
                                       shadow-sm hover:bg-white transition-colors
                                       text-xs font-medium text-grayscale-700"
                            aria-label="Exit navigation"
                        >
                            <IonIcon icon={arrowBackOutline} className="text-sm" />
                            <span>Map</span>
                        </button>

                        <div className="flex-1 min-w-0 flex flex-col items-end">
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-grayscale-500">
                                <IonIcon icon={flagOutline} className="text-sm" />
                                <span>Destination</span>
                            </div>

                            <span
                                title={pathway.goal}
                                className="text-sm font-semibold text-grayscale-900 truncate max-w-full"
                            >
                                {pathway.goal}
                            </span>
                        </div>
                    </div>

                    {/*
                        Trail strip — one micro-bar per route node.
                        Completed = solid emerald, your position =
                        pulsing emerald with a ring, upcoming = soft
                        grayscale. Clickable so the learner can peek
                        at any step without leaving Navigate mode.
                    */}
                    <div className="w-full max-w-md mb-6">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-grayscale-500 mb-2">
                            <IonIcon icon={hourglassOutline} className="text-sm" />
                            <span>
                                {allComplete
                                    ? 'Route complete'
                                    : yourIndex !== null
                                        ? `Step ${yourIndex + 1} of ${route.nodeIds.length}`
                                        : ''}
                            </span>

                            {!allComplete && (
                                <span
                                    aria-hidden
                                    className="text-grayscale-300"
                                >
                                    ·
                                </span>
                            )}

                            {!allComplete && (
                                <span className="text-grayscale-500">
                                    {route.etaMinutes > 0
                                        ? `${formatEta(route.etaMinutes)} to go`
                                        : 'Arrived'}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-1">
                            {route.nodeIds.map((nid, i) => {
                                const n = nodeById.get(nid);
                                const isDone = n?.progress.status === 'completed';
                                const isYou = yourIndex === i;

                                return (
                                    <button
                                        key={nid}
                                        type="button"
                                        onClick={() => onOpen(nid)}
                                        title={n?.title ?? nid}
                                        className="group relative flex-1 h-1.5 rounded-full overflow-visible
                                                   focus:outline-none"
                                        aria-label={`${n?.title ?? 'Step'} (${
                                            isDone ? 'complete' : isYou ? 'current' : 'upcoming'
                                        })`}
                                    >
                                        <span
                                            className={`block h-full w-full rounded-full transition-colors ${
                                                isDone
                                                    ? 'bg-emerald-500'
                                                    : isYou
                                                        ? 'bg-emerald-300'
                                                        : 'bg-grayscale-200'
                                            } group-hover:opacity-80`}
                                        />

                                        {isYou && (
                                            <span
                                                aria-hidden
                                                className="absolute -top-1 left-1/2 -translate-x-1/2 flex items-center justify-center"
                                                style={{ width: 14, height: 14 }}
                                            >
                                                <span className="absolute inset-0 rounded-full bg-emerald-400/50 animate-ping" />
                                                <span className="relative w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {allComplete ? (
                        <RouteCompleteCard
                            destinationTitle={
                                nodeById.get(route.destinationId)?.title ?? pathway.goal
                            }
                            onReviewDestination={() => onOpen(route.destinationId)}
                        />
                    ) : (
                        currentNode && (
                            <CurrentStepCard
                                node={currentNode}
                                mcpLabel={
                                    currentNode.stage.policy.kind === 'external'
                                        ? mcpServers[currentNode.stage.policy.mcp.serverId]
                                              ?.label ?? null
                                        : null
                                }
                                onOpen={onOpen}
                            />
                        )
                    )}

                    {/*
                        Next-up peek. Cheaper card below the hero:
                        shows what comes after `currentNode` so the
                        learner commits with full knowledge of the
                        next turn. Only rendered when there is a
                        next step on the route.
                    */}
                    {nextNode && (
                        <motion.button
                            type="button"
                            onClick={() => onOpen(nextNode.id)}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.3 }}
                            className="mt-4 w-full max-w-md p-3 rounded-2xl
                                       bg-white/60 backdrop-blur-md border border-white
                                       text-left hover:bg-white/80 transition-colors
                                       shadow-sm"
                            aria-label={`Preview: ${nextNode.title}`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-grayscale-400">
                                    Then
                                </span>
                                <span
                                    aria-hidden
                                    className="text-grayscale-300 text-[10px]"
                                >
                                    ·
                                </span>
                                <span className="text-[10px] font-medium uppercase tracking-wide text-grayscale-500">
                                    {policyLabel(nextNode.stage.policy.kind)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                                <span
                                    title={nextNode.title}
                                    className="text-sm font-semibold text-grayscale-900 line-clamp-1"
                                >
                                    {nextNode.title}
                                </span>

                                <span className="shrink-0 text-xs font-medium text-grayscale-500">
                                    {formatEta(nodeEffortMinutes(nextNode))}
                                </span>
                            </div>
                        </motion.button>
                    )}

                    <div className="flex-1" />

                    {/*
                        Ambient "tap Escape to exit" hint — quiet,
                        only visible on devices with keyboards.
                        Matches Headspace's whisper-level affordances.
                    */}
                    <div className="hidden sm:block mt-6 text-[10px] font-medium text-grayscale-400 tracking-wide">
                        Press <kbd className="px-1.5 py-0.5 rounded bg-white/70 border border-grayscale-200 text-grayscale-600">Esc</kbd> to return to the map
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

/**
 * Big centered card for the current step. Mirrors the MapNode card
 * language (kind-tinted avatar, status chip, title) but blown up to
 * hero size — the only card on screen in Navigate mode.
 */
const CurrentStepCard: React.FC<{
    node: PathwayNode;
    mcpLabel: string | null;
    onOpen: (nodeId: string) => void;
}> = ({ node, mcpLabel, onOpen }) => {
    const effort = nodeEffortMinutes(node);
    const status = node.progress.status;

    const ctaLabel =
        status === 'in-progress' || status === 'stalled'
            ? 'Keep going'
            : resolveNodeCallToAction(node, mcpLabel);

    const earnLink = status === 'not-started' ? getNodeEarnLink(node) : null;

    const ctaInner = (
        <>
            <span>{ctaLabel}</span>
            <IonIcon
                icon={earnLink ? openOutline : arrowForwardOutline}
                className="text-lg transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden
            />
        </>
    );

    const ctaClass =
        `group mt-5 w-full py-3.5 px-5 rounded-full
         bg-emerald-600 text-white text-base font-semibold
         shadow-lg shadow-emerald-600/30
         hover:bg-emerald-700 transition-colors
         flex items-center justify-center gap-2`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
            className="w-full max-w-md p-6 rounded-[28px]
                       bg-white shadow-xl shadow-grayscale-900/10 border border-white"
        >
            <div className="flex items-center gap-3 mb-3">
                <NavigateAvatar node={node} />

                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-grayscale-500">
                        {policyLabel(node.stage.policy.kind)}
                    </span>

                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-grayscale-500">
                        <span>Est. {formatEta(effort)}</span>
                    </div>
                </div>
            </div>

            <h2 className="text-xl font-semibold text-grayscale-900 leading-snug">
                {node.title}
            </h2>

            {earnLink ? (
                <motion.a
                    href={earnLink.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onOpen(node.id)}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={ctaClass}
                    aria-label={`${ctaLabel} (opens in a new tab)`}
                >
                    {ctaInner}
                </motion.a>
            ) : (
                <motion.button
                    type="button"
                    onClick={() => onOpen(node.id)}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={ctaClass}
                >
                    {ctaInner}
                </motion.button>
            )}
        </motion.div>
    );
};

/**
 * Finish-line card — the whole route is complete. Echoes Apple
 * Fitness' "Workout complete" celebration but at product-language
 * intensity (no confetti, no dopamine casino).
 */
const RouteCompleteCard: React.FC<{
    destinationTitle: string;
    onReviewDestination: () => void;
}> = ({ destinationTitle, onReviewDestination }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
        className="w-full max-w-md p-6 rounded-[28px] text-center
                   bg-white shadow-xl shadow-grayscale-900/10 border border-white"
    >
        <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <IonIcon
                icon={checkmarkCircle}
                className="text-emerald-600 text-4xl"
                aria-hidden
            />
        </div>

        <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
            You made it.
        </h2>

        <p className="text-sm text-grayscale-600 leading-relaxed mb-5">
            Every step on this route is complete. Take a look at the destination to review what you earned.
        </p>

        <button
            type="button"
            onClick={onReviewDestination}
            className="w-full py-3 px-4 rounded-full bg-grayscale-900 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
            Review {destinationTitle}
        </button>
    </motion.div>
);

/**
 * Navigate-mode-sized avatar. Duplicates NodeAvatar's fallback
 * ladder but bigger (56px), higher contrast, and rendered as a
 * simple colored circle with an icon fallback when no credential
 * image exists.
 */
const NavigateAvatar: React.FC<{ node: PathwayNode }> = ({ node }) => {
    const image = node.credentialProjection?.image;

    if (image) {
        return (
            <span className="shrink-0 w-14 h-14 rounded-full overflow-hidden bg-white ring-2 ring-emerald-100 shadow-md">
                <img
                    src={image}
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
            className="shrink-0 w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center ring-2 ring-emerald-200"
        >
            <IonIcon icon={flagOutline} className="text-2xl" />
        </span>
    );
};

export default NavigateMode;
