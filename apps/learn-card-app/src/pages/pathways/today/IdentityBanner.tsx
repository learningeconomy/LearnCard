/**
 * IdentityBanner — "You are becoming __" framing at the top of Today.
 *
 * Architecture §10, plus the synthesis doc's habit-identity research:
 * the most durable lever for keeping a learner engaged is reminding
 * them who they are *becoming*, not what tasks are pending. This
 * component is the only place on Today where the pathway's *identity*
 * shows up in past-progressive tense. The hero card below still talks
 * about the next concrete action; this whisper above it holds the
 * "why".
 *
 * Visual language: a two-line typographic anchor — no frame, no pill,
 * just a small emerald kicker over the identity phrase itself. The
 * pathway title intentionally isn't repeated here (it already
 * appears in `PathwaysHeader` as the page H1); re-rendering it would
 * cause truncation on narrow screens for zero information gain.
 */

import React from 'react';

import { motion } from 'motion/react';

interface IdentityBannerProps {
    /** Already-transformed identity phrase. See `identityPhrase()`. */
    phrase: string;
}

const IdentityBanner: React.FC<IdentityBannerProps> = ({ phrase }) => {
    if (!phrase) return null;

    return (
        <motion.section
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
            className="px-1 space-y-0.5"
        >
            <div className="flex items-center gap-1.5">
                <span
                    aria-hidden
                    className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                />

                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-700">
                    You are becoming
                </p>
            </div>

            <p className="text-base text-grayscale-900 font-medium leading-snug">
                {phrase}
            </p>
        </motion.section>
    );
};

export default IdentityBanner;
