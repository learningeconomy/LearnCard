/**
 * IdentityBanner — altitude-aware identity framing at the top of Today.
 *
 * Architecture §10, plus the synthesis doc's habit-identity research:
 * the most durable lever for keeping a learner engaged is reminding
 * them who they are *becoming*, not what tasks are pending. But
 * "becoming" only reads honestly when the learner arrived with an
 * aspiration. Learners who arrived with a question, an immediate
 * action, or exploratory curiosity deserve phrasing that matches
 * their altitude — see `buildIdentityBanner()` in `./presentation.ts`.
 *
 * This component is now purely a presenter: the caller (TodayMode)
 * resolves the altitude-appropriate kicker + phrase and hands them in.
 * That keeps the rendering code free of altitude branching.
 *
 * Visual language: a two-line typographic anchor — no frame, no pill,
 * just a small emerald kicker over the phrase itself. The pathway
 * title intentionally isn't repeated here (it already appears in
 * `PathwaysHeader` as the page H1); re-rendering it would cause
 * truncation on narrow screens for zero information gain.
 */

import React from 'react';

import { motion } from 'motion/react';

interface IdentityBannerProps {
    /**
     * Short uppercase label above the phrase, e.g. "You are becoming",
     * "You are sitting with", "You are exploring". See `buildIdentityBanner`.
     */
    kicker: string;
    /**
     * The phrase rendered under the kicker — either an identity-tense
     * transformation of the goal (aspiration) or the learner's input
     * verbatim (question / action / exploration).
     */
    phrase: string;
}

const IdentityBanner: React.FC<IdentityBannerProps> = ({ kicker, phrase }) => {
    // Both must be present — `buildIdentityBanner` returns empty strings
    // for empty goals, in which case we render nothing rather than an
    // orphan kicker or a floating phrase.
    if (!phrase || !kicker) return null;

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
                    {kicker}
                </p>
            </div>

            <p className="text-base text-grayscale-900 font-medium leading-snug">
                {phrase}
            </p>
        </motion.section>
    );
};

export default IdentityBanner;
