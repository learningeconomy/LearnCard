/**
 * CompletionMoment — transient banner shown on Today right after a
 * node flips to `completed` (docs § 5: proof-of-effort feeling).
 *
 * The banner is cosmetic only. The actual state change happens
 * elsewhere (NodeDetail → pathwayStore); this component just reads the
 * "something just finished" signal and renders for a few seconds.
 *
 * Visual language:
 *   - Frosted emerald glass pill that slides up into view with a soft
 *     spring — feels like the finish tape is being tapped, not stamped.
 *   - The checkmark draws itself in (SVG stroke-dashoffset trick) so
 *     there's a tiny moment of proof: "yes, this actually happened".
 *   - No confetti, no fireworks. docs § 5 is explicit: a streak is a
 *     promise, not a quota. Same ethic here.
 */

import React from 'react';

import { IonIcon } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { motion } from 'motion/react';

interface CompletionMomentProps {
    title: string;
    /** User tapped the dismiss affordance early. */
    onDismiss?: () => void;
}

const CompletionMoment: React.FC<CompletionMomentProps> = ({ title, onDismiss }) => (
    <motion.section
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22, mass: 0.7 }}
        role="status"
        aria-live="polite"
        className="flex items-start gap-3 p-4 rounded-[22px]
                   bg-emerald-50/80 backdrop-blur-xl
                   border border-emerald-100 shadow-lg shadow-emerald-900/5"
    >
        <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
                type: 'spring',
                stiffness: 500,
                damping: 18,
                mass: 0.5,
                delay: 0.12,
            }}
            className="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-emerald-600
                       flex items-center justify-center
                       shadow-sm shadow-emerald-600/30"
            aria-hidden
        >
            {/*
                Hand-rolled SVG checkmark so we can animate the stroke
                drawing in — gives the "just happened" feeling. Total
                path length is ~20, a dasharray of 24 fully covers it.
            */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <motion.path
                    d="M5 12.5l4.5 4.5L19 7"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.35, ease: 'easeOut', delay: 0.28 }}
                />
            </svg>
        </motion.span>

        <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-800 leading-snug truncate">
                {title}
            </p>

            <p className="text-xs text-emerald-700/90 mt-0.5">
                Done. Next up below.
            </p>
        </div>

        {onDismiss && (
            <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss"
                className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center
                           text-emerald-700/80 hover:text-emerald-900 hover:bg-emerald-100/60
                           transition-colors"
            >
                <IonIcon icon={closeOutline} className="text-base" />
            </button>
        )}
    </motion.section>
);

export default CompletionMoment;
