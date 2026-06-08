/**
 * NestedPathwayContext — the Map's sub-pathway wayfinding chrome.
 *
 * When the active pathway is embedded inside another pathway as a
 * composite reference, the learner needs two pieces of context:
 *
 *   1. **Where they came from** — a one-tap breadcrumb back to the
 *      parent pathway. Without this the Map feels like a dead-end the
 *      learner fell into; with it, navigation is reversible.
 *   2. **Why they're here** — a pill explaining "finishing this
 *      unlocks `<parent node title>`". Motivates forward motion by
 *      naming the reward, not just the current scope.
 *
 * Both pieces are presentation-only. The detection lives in pure
 * helpers (`findParentPathway`, `findParentCompositeNode`) in
 * `core/composition`; this component just renders them.
 *
 * Design notes:
 *
 * - **Frosted glass**, matching the "On your way to" goal pill above,
 *   so the chrome reads as a family of floating chips rather than a
 *   one-off overlay.
 * - **Top-left** placement keeps the back affordance at the corner of
 *   the viewport where the eye naturally looks for navigation — doesn't
 *   fight the centered goal pill for attention.
 * - **Two separate pills** (breadcrumb + unlocks) instead of one
 *   multi-line chip. Two small pills are faster to parse; one dense
 *   chip reads as a paragraph. We pay the extra 8px of vertical space
 *   and prefer scannability.
 */

import React from 'react';

import { IonIcon } from '@ionic/react';
import { arrowBackOutline, sparklesOutline } from 'ionicons/icons';
import { motion } from 'framer-motion';

import type { Pathway, PathwayNode } from '../types';

interface NestedPathwayContextProps {
    parent: Pathway;
    parentNode: PathwayNode;
    onBack: () => void;
}

const NestedPathwayContext: React.FC<NestedPathwayContextProps> = ({
    parent,
    parentNode,
    onBack,
}) => (
    <motion.div
        /*
            Top-left corner. `pointer-events-none` on the wrapper so
            the viewport still gets pan/drag under the empty margin;
            the inner chips re-enable their own pointer events so
            clicks work as expected.

            Responsive width: on narrow phones the right-side
            Navigate controls (`max-w-[50vw]`) take half the top
            edge, so we cap this column at `45vw` to guarantee a
            small gap between the two columns. Desktop keeps the
            original 320 px absolute cap so long titles read fully
            when horizontal real-estate is cheap.
        */
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut', delay: 0.05 }}
        className="pointer-events-none absolute top-3 left-3 sm:top-4 sm:left-4 z-10 font-poppins flex flex-col items-start gap-1.5 max-w-[45vw] sm:max-w-[320px]"
    >
        {/*
            Breadcrumb. Mirrors the back-link at the top of the Build
            OutlinePane so "back to" reads identically across surfaces.
        */}
        <button
            type="button"
            onClick={onBack}
            className="
                pointer-events-auto
                inline-flex items-center gap-1.5 py-1.5 px-3
                rounded-full
                bg-white/70 backdrop-blur-md
                border border-white
                shadow-lg shadow-grayscale-900/5
                text-xs font-medium text-grayscale-700
                hover:text-grayscale-900 hover:bg-white/90
                transition-colors
                max-w-full
            "
            aria-label={`Back to ${parent.title}`}
        >
            <IonIcon
                icon={arrowBackOutline}
                aria-hidden
                className="shrink-0 text-sm text-grayscale-500"
            />

            <span className="truncate">
                <span className="text-grayscale-500">Back to</span>{' '}
                <span className="font-semibold text-grayscale-900">
                    {parent.title}
                </span>
            </span>
        </button>

        {/*
            "Unlocks X" context pill. Purely informational — no tap
            target — so we render a div, not a button. Emerald accent
            on the sparkles icon signals the reward framing without
            turning the whole chip into a shouty CTA.

            Hidden below `sm` because on a narrow phone the vertical
            budget is precious and the reward framing is already
            carried by (a) the breadcrumb above ("Back to <parent>"
            implies "you're here because of <parent>") and (b) the
            composite node's NodeDetail card on the parent pathway,
            which names the unlock explicitly when the learner lands
            there. On tablet+ we keep the pill because the extra
            motivation is free real-estate.
        */}
        <div
            className="
                hidden sm:inline-flex
                pointer-events-auto
                items-center gap-1.5 py-1.5 px-3
                rounded-full
                bg-white/60 backdrop-blur-md
                border border-white
                shadow-md shadow-grayscale-900/5
                text-[11px] text-grayscale-600
                max-w-full
            "
            title={`Finishing this pathway unlocks "${parentNode.title}" in "${parent.title}"`}
        >
            <IonIcon
                icon={sparklesOutline}
                aria-hidden
                className="shrink-0 text-sm text-emerald-600"
            />

            <span className="truncate">
                <span className="text-grayscale-500">Unlocks</span>{' '}
                <span className="font-semibold text-grayscale-800">
                    {parentNode.title}
                </span>
            </span>
        </div>
    </motion.div>
);

export default NestedPathwayContext;
