/**
 * SubPathwayCeremony — Tier 1 ceremony for "a chapter just
 * finished." Mounts as a slide-up overlay when
 * `recentCelebration.kind === 'sub-pathway'`.
 *
 * The shape of this beat answers three learner questions in one
 * card, top to bottom:
 *
 *   1. *What did I finish?* → Eyebrow + sub-pathway title +
 *      becoming-line (when authored).
 *   2. *What changed in the bigger picture?* → Chain-effect line
 *      naming the now-unlocked next step on the parent. This is
 *      the load-bearing connective beat — without it, the
 *      ceremony reads as a disjoint achievement notification
 *      instead of progress on a journey.
 *   3. *What's next?* → Primary CTA returns the learner to the
 *      parent's Map focused on the just-unlocked node; secondary
 *      keeps them on the completed sub-pathway's Map for
 *      reflection.
 *
 * No aurora, no confetti. Tier 2 is the full-screen ceremony;
 * Tier 1 is closer to a Headspace-style mid-session reflection
 * card.
 */

import React from 'react';

import { IonIcon } from '@ionic/react';
import { arrowForwardOutline, closeOutline } from 'ionicons/icons';
import { motion } from 'motion/react';
import { useHistory } from 'react-router-dom';

import { pathwayStore } from '../../../stores/pathways';
import { buildIdentityBanner } from '../today/presentation';

import { buildCompletionReceipt } from './buildCompletionReceipt';
import type { Pathway } from '../types';

interface SubPathwayCeremonyProps {
    /** The just-completed sub-pathway. */
    subPathway: Pathway;
    /** The parent pathway that embeds it as a composite ref. */
    parent: Pathway;
    /** Timestamp from `recentCelebration.completedAt`. */
    completedAt: string;
}

/**
 * Find the parent's "next available" node — the first node in
 * the parent's `chosenRoute` (when authored) that isn't yet
 * `completed`, or the first non-completed node in author order
 * as a fallback. Returns `null` when every node in the parent
 * is already complete (which means the sub-pathway *was* the
 * parent's last step — coalescing rule in `rollupInDraft`
 * should have prevented us getting here, but defensive).
 */
const findParentNextStep = (parent: Pathway): { title: string } | null => {
    const isDone = (id: string) =>
        parent.nodes.find(n => n.id === id)?.progress.status === 'completed';

    if (parent.chosenRoute && parent.chosenRoute.length > 0) {
        for (const id of parent.chosenRoute) {
            if (!isDone(id)) {
                const node = parent.nodes.find(n => n.id === id);

                if (node) return { title: node.title };
            }
        }
    }

    for (const node of parent.nodes) {
        if (node.progress.status !== 'completed') return { title: node.title };
    }

    return null;
};

const SubPathwayCeremony: React.FC<SubPathwayCeremonyProps> = ({
    subPathway,
    parent,
    completedAt,
}) => {
    const history = useHistory();

    // Identity banner — re-uses Today's altitude-aware kicker so
    // the becoming line on the ceremony reads in the same voice
    // as the rest of the surface. For a question-altitude
    // pathway the kicker reads "You sat with"; for an
    // exploration-altitude pathway it reads "You explored", etc.
    // Empty `goal` collapses the whole sub-line cleanly.
    const banner = buildIdentityBanner(subPathway.goal, subPathway.intentAltitude);

    const receipt = buildCompletionReceipt({
        completedPathway: subPathway,
        subPathways: [],
        completedAt,
    });

    const nextStep = findParentNextStep(parent);

    const handleContinue = () => {
        // Set the parent as the active pathway and land on Map.
        // Map will pick its default focus (next-uncompleted node)
        // which is the same node we just named in the chain
        // effect, so the visual continuity holds.
        pathwayStore.set.dismissCelebration();
        pathwayStore.set.setActivePathway(parent.id);
        history.push('/pathways/map');
    };

    const handleStayHere = () => {
        // Stay on the sub-pathway's Map. The learner can re-open
        // the ceremony later via the switcher's "View ceremony"
        // affordance.
        pathwayStore.set.dismissCelebration();
        pathwayStore.set.setActivePathway(subPathway.id);
        history.push('/pathways/map');
    };

    return (
        <motion.div
            // Fixed overlay covering the shell. backdrop dims the
            // page underneath; the card slides up from the bottom
            // and self-centers on viewport so the touch target is
            // reachable on tall mobile screens.
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 font-poppins
                       bg-grayscale-900/40 backdrop-blur-sm
                       flex items-end sm:items-center justify-center
                       p-3 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="subpathway-ceremony-title"
        >
            <motion.div
                initial={{ y: 24, opacity: 0, scale: 0.98 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 16, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 280, damping: 26, mass: 0.8 }}
                className="relative w-full max-w-[480px]
                           bg-white rounded-[28px]
                           shadow-2xl shadow-grayscale-900/10
                           border border-grayscale-200
                           overflow-hidden"
            >
                {/* Top emerald hairline glow — quiet "this was a win" cue. */}
                <div
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-1
                               bg-gradient-to-r from-emerald-300 via-emerald-500 to-emerald-300"
                />

                <button
                    type="button"
                    aria-label="Dismiss"
                    onClick={() => pathwayStore.set.dismissCelebration()}
                    className="absolute top-3.5 right-3.5
                               w-8 h-8 rounded-full
                               flex items-center justify-center
                               text-grayscale-500 hover:text-grayscale-900
                               hover:bg-grayscale-10 transition-colors"
                >
                    <IonIcon icon={closeOutline} className="text-xl" />
                </button>

                <div className="p-6 pt-7 space-y-5">
                    {/* Eyebrow */}
                    <p className="text-[11px] font-semibold tracking-[0.12em]
                                  uppercase text-emerald-700">
                        Chapter Complete
                    </p>

                    {/* Title + becoming */}
                    <div className="space-y-1.5">
                        <h2
                            id="subpathway-ceremony-title"
                            className="text-xl font-semibold text-grayscale-900 leading-snug"
                        >
                            {subPathway.title}
                        </h2>

                        {banner.kicker && banner.phrase && (
                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                <span className="text-grayscale-500">
                                    {banner.kicker.toLowerCase()}
                                </span>{' '}
                                {banner.phrase}.
                            </p>
                        )}
                    </div>

                    {/* Chain effect — the load-bearing line */}
                    <div className="flex items-start gap-2.5
                                    p-3.5 rounded-2xl
                                    bg-emerald-50/70 border border-emerald-100">
                        <IonIcon
                            icon={arrowForwardOutline}
                            className="shrink-0 mt-0.5 text-emerald-700 text-base"
                            aria-hidden
                        />

                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-semibold tracking-[0.1em]
                                          uppercase text-emerald-700/80">
                                In {parent.title}
                            </p>

                            <p className="text-sm font-medium text-emerald-900 mt-0.5 truncate">
                                {nextStep
                                    ? `Unlocked: ${nextStep.title}`
                                    : `${parent.title} is now complete!`}
                            </p>
                        </div>
                    </div>

                    {/* Receipt strip */}
                    <div className="flex items-center gap-3 text-xs text-grayscale-500
                                    border-t border-grayscale-100 pt-4">
                        <span className="tabular-nums">
                            <span className="text-grayscale-800 font-medium">
                                {receipt.steps}
                            </span>{' '}
                            steps
                        </span>

                        <span aria-hidden className="text-grayscale-300">·</span>

                        <span className="tabular-nums">
                            <span className="text-grayscale-800 font-medium">
                                {receipt.days}
                            </span>{' '}
                            {receipt.days === 1 ? 'day' : 'days'}
                        </span>

                        {receipt.vouches > 0 && (
                            <>
                                <span aria-hidden className="text-grayscale-300">·</span>

                                <span className="tabular-nums">
                                    <span className="text-grayscale-800 font-medium">
                                        {receipt.vouches}
                                    </span>{' '}
                                    {receipt.vouches === 1 ? 'vouch' : 'vouches'}
                                </span>
                            </>
                        )}
                    </div>

                    {/* CTAs */}
                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={handleContinue}
                            className="flex-1 py-3 px-4 rounded-[20px]
                                       bg-grayscale-900 text-white
                                       font-medium text-sm
                                       hover:opacity-90 transition-opacity"
                        >
                            Continue {parent.title}
                        </button>

                        <button
                            type="button"
                            onClick={handleStayHere}
                            className="py-3 px-4 rounded-[20px]
                                       border border-grayscale-300
                                       text-grayscale-700 font-medium text-sm
                                       hover:bg-grayscale-10 transition-colors"
                        >
                            Stay here
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default SubPathwayCeremony;
