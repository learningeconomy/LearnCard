/**
 * RouteSwapBanner — bottom-floating undo affordance for direct
 * route swaps committed from What-If.
 *
 * The What-If surface commits route swaps directly (no proposals
 * queue trip — see `pathwayStore.applyRouteSwap`) and routes the
 * learner to Map so the alternate walk renders immediately. This
 * banner is the safety net: a single tap restores the previous
 * walk, which is essential for "look, decide, commit" UX where
 * the commit step is one click away from preview.
 *
 * ## Design
 *
 *   - **Bottom-center floating pill** above `FocusActionBar`
 *     so it's reachable on mobile without competing with the
 *     top-right mode chrome or the centered goal pill.
 *   - **Auto-dismisses** after 8s. Long enough to read +
 *     react, short enough that we don't litter the canvas
 *     with stale chrome from an old swap.
 *   - **Single primary action** (Undo) + a subtle close X.
 *     No secondary verbs — this is a transient confirmation,
 *     not a settings panel.
 *
 * ## Why bottom-center, not top
 *
 * Map's top edge is busy: the goal pill, mode chrome, and
 * NestedPathwayContext breadcrumb all compete for attention up
 * there. The bottom edge is otherwise quiet — only the FocusActionBar
 * lives there and only when a node is focused. Anchoring the banner
 * above the action bar keeps the route legible and the undo
 * affordance a thumb-reach away.
 */

import React, { useEffect } from 'react';

import { IonIcon } from '@ionic/react';
import { closeOutline, swapHorizontalOutline } from 'ionicons/icons';

import { pathwayStore } from '../../../stores/pathways';

const AUTO_DISMISS_MS = 8000;

const RouteSwapBanner: React.FC = () => {
    const swap = pathwayStore.use.recentRouteSwap();
    const activeId = pathwayStore.use.activePathwayId();

    // Only show the banner for the *active* pathway. If the
    // learner switched pathways after the swap (rare but possible
    // — e.g. swap on pathway A, then jump to pathway B from the
    // switcher), the undo wouldn't apply to what they're looking
    // at, so we hide rather than risk a confusing affordance.
    const visible = swap !== null && swap.pathwayId === activeId;

    useEffect(() => {
        if (!visible) return;

        const timer = setTimeout(() => {
            pathwayStore.set.dismissRouteSwap();
        }, AUTO_DISMISS_MS);

        return () => clearTimeout(timer);
        // Re-arm the timer when a new swap arrives (different
        // swappedAt) so back-to-back swaps each get their own
        // 8-second dismissal window.
    }, [visible, swap?.swappedAt]);

    if (!visible || !swap) return null;

    return (
        <div
            className="absolute left-1/2 -translate-x-1/2 bottom-4 sm:bottom-6 z-30 pointer-events-auto
                       w-[min(calc(100%-2rem),28rem)]"
            role="status"
            aria-live="polite"
        >
            {/*
                Pill shape was rounded-full, which deforms when the
                inner text gets long enough to wrap (the shape pinches
                the lines into a tall narrow column — see screenshot).
                rounded-2xl keeps the friendly soft-corner feel while
                tolerating multi-word scenario titles. The label is
                also constrained with `truncate` + `min-w-0` so even
                a verbose title (e.g. "Skip the nested pathway") sits
                on a single line and shows an ellipsis if it exceeds
                the banner width — Undo and dismiss never get pushed
                off the edge.
            */}
            <div
                className="flex items-center gap-2 rounded-2xl bg-grayscale-900 text-white shadow-2xl pl-3.5 pr-1.5 py-1.5 font-poppins animate-fade-in-up"
            >
                <IonIcon
                    icon={swapHorizontalOutline}
                    className="text-base text-emerald-300 shrink-0"
                />

                <span className="text-sm font-medium leading-snug min-w-0 flex-1 truncate">
                    Switched to{' '}
                    <span className="font-semibold">{swap.scenarioTitle}</span>
                </span>

                <button
                    type="button"
                    onClick={() => pathwayStore.set.undoRouteSwap()}
                    className="ml-1 py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-medium text-white transition-colors shrink-0"
                >
                    Undo
                </button>

                <button
                    type="button"
                    onClick={() => pathwayStore.set.dismissRouteSwap()}
                    aria-label="Dismiss"
                    className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-grayscale-300 hover:text-white transition-colors shrink-0"
                >
                    <IonIcon icon={closeOutline} className="text-base" />
                </button>
            </div>
        </div>
    );
};

export default RouteSwapBanner;
