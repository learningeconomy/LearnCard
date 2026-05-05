/**
 * PathwayCeremony — Tier 2 ceremony for "you finished the
 * journey." Full-screen takeover (no header, no tabs) so the
 * destination has its own gravity.
 *
 * Reads top to bottom as a vertical scroll-poem:
 *
 *   1. **Aurora hero** — slow-blooming radial gradients behind a
 *      single pulsing destination glyph. No confetti, no
 *      fireworks. The synthesis doc is explicit: a streak is a
 *      promise, not a quota; we apply the same ethic to the
 *      finish line.
 *   2. **The becoming** — pulled from `buildIdentityBanner`. The
 *      kicker ("You are someone…" / "You sat with…" / etc.)
 *      runs at small caps; the phrase is the page's H1. This is
 *      the emotional core; every pathway has been waiting for
 *      this moment to read its becoming back as a title.
 *   3. **Receipt strip** — a dignified summary of effort:
 *      `26 steps · 3 chapters · 8 vouches · 184 days`. No
 *      graphs, no bars. Just numbers we can stand behind.
 *   4. **Artifact** — when the destination node has a
 *      `credentialProjection`, render a quiet preview row + an
 *      "Add to Passport" affordance. Skipped entirely when the
 *      pathway has no projection rather than fabricating one.
 *   5. **Reflection** — one inline text field: "In a sentence —
 *      what did this become for you?" Persisted to
 *      `pathway.completionReflection`. The Headspace move:
 *      converts a finish-line into a memory.
 *   6. **Two paths forward** — Primary "Start a new chapter" →
 *      Journeys onboard. Secondary "Stay with this one" →
 *      completed Map.
 */

import React, { useState } from 'react';

import { IonIcon } from '@ionic/react';
import {
    arrowForwardOutline,
    closeOutline,
    sparklesOutline,
} from 'ionicons/icons';
import { motion } from 'motion/react';
import { useHistory } from 'react-router-dom';

import { pathwayStore } from '../../../stores/pathways';
import { canProject } from '../projection/toAchievementCredential';
import { buildIdentityBanner } from '../today/presentation';

import { buildCompletionReceipt } from './buildCompletionReceipt';
import type { Pathway, PathwayNode } from '../types';

interface PathwayCeremonyProps {
    pathway: Pathway;
    /** Sub-pathways embedded under this pathway (depth-1 children). */
    subPathways: readonly Pathway[];
    /** Timestamp from `recentCelebration.completedAt`. */
    completedAt: string;
}

/**
 * Pull the destination node when the pathway has one and it
 * carries a credential projection. Returns `null` when there's
 * nothing to render in the artifact slot — letting the caller
 * skip that whole section cleanly rather than fabricating one.
 */
const findDestinationProjection = (
    pathway: Pathway,
): { node: PathwayNode; achievementName: string } | null => {
    if (!pathway.destinationNodeId) return null;

    const dest = pathway.nodes.find(n => n.id === pathway.destinationNodeId);

    if (!dest) return null;
    if (!canProject(dest)) return null;

    // The projection schema doesn't carry a separate display name —
    // the achievement title is the node's title, which is what the
    // existing `CredentialPreview` reads in `node/CredentialPreview`.
    return { node: dest, achievementName: dest.title };
};

const PathwayCeremony: React.FC<PathwayCeremonyProps> = ({
    pathway,
    subPathways,
    completedAt,
}) => {
    const history = useHistory();

    const [reflectionDraft, setReflectionDraft] = useState(
        pathway.completionReflection ?? '',
    );
    const [reflectionSaved, setReflectionSaved] = useState(
        !!pathway.completionReflection,
    );

    const banner = buildIdentityBanner(pathway.goal, pathway.intentAltitude);

    const receipt = buildCompletionReceipt({
        completedPathway: pathway,
        subPathways,
        completedAt,
    });

    const projection = findDestinationProjection(pathway);

    const handleSaveReflection = () => {
        const trimmed = reflectionDraft.trim();

        if (trimmed.length === 0) return;

        pathwayStore.set.recordReflection(pathway.id, trimmed);
        setReflectionSaved(true);
    };

    const handleEditReflection = () => {
        setReflectionSaved(false);
    };

    const handleStartNewChapter = () => {
        pathwayStore.set.dismissCelebration();
        history.push('/pathways/onboard');
    };

    const handleStayHere = () => {
        pathwayStore.set.dismissCelebration();
        pathwayStore.set.setActivePathway(pathway.id);
        history.push('/pathways/map');
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32 }}
            className="fixed inset-0 z-50 font-poppins
                       bg-white overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pathway-ceremony-title"
        >
            {/*
                Aurora backdrop — three radial gradients positioned
                off-center, each blurred and cross-fading on a slow
                loop. Reads as a calm "something good just
                happened" glow rather than a dance-party.
            */}
            <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    initial={{ opacity: 0.4 }}
                    animate={{ opacity: [0.4, 0.65, 0.4] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-40 -left-32 w-[520px] h-[520px] rounded-full
                               bg-emerald-300/40 blur-[100px]"
                />

                <motion.div
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: [0.3, 0.55, 0.3] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                    className="absolute -top-20 right-[-120px] w-[460px] h-[460px] rounded-full
                               bg-amber-200/50 blur-[110px]"
                />

                <motion.div
                    initial={{ opacity: 0.25 }}
                    animate={{ opacity: [0.25, 0.5, 0.25] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                    className="absolute top-[280px] left-1/2 -translate-x-1/2
                               w-[520px] h-[520px] rounded-full
                               bg-sky-200/40 blur-[120px]"
                />
            </div>

            {/* Dismiss / close — small, top-right, never the dominant CTA. */}
            <button
                type="button"
                aria-label="Dismiss ceremony"
                onClick={() => pathwayStore.set.dismissCelebration()}
                className="absolute top-4 right-4 z-10
                           w-10 h-10 rounded-full
                           flex items-center justify-center
                           text-grayscale-500 hover:text-grayscale-900
                           hover:bg-white/60 backdrop-blur-sm
                           transition-colors"
            >
                <IonIcon icon={closeOutline} className="text-2xl" />
            </button>

            <div className="relative max-w-2xl mx-auto px-6 sm:px-8
                            pt-16 sm:pt-24 pb-12 space-y-12">
                {/* HERO ============================================= */}
                <motion.section
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                    className="text-center space-y-6"
                >
                    {/*
                        Destination glyph — pulses gently once on
                        mount, then settles. Single sparkle icon on
                        an emerald disc keeps the visual budget
                        light but unmistakably celebratory.
                    */}
                    <motion.div
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                            type: 'spring',
                            stiffness: 220,
                            damping: 18,
                            delay: 0.25,
                        }}
                        className="inline-flex items-center justify-center
                                   w-20 h-20 rounded-full
                                   bg-gradient-to-br from-emerald-400 to-emerald-600
                                   shadow-xl shadow-emerald-500/30"
                    >
                        <IonIcon
                            icon={sparklesOutline}
                            className="text-white text-4xl"
                            aria-hidden
                        />
                    </motion.div>

                    {/* Eyebrow */}
                    <p className="text-[11px] font-semibold tracking-[0.18em]
                                  uppercase text-emerald-700">
                        You arrived
                    </p>

                    {/* The becoming — H1 */}
                    {banner.kicker && banner.phrase ? (
                        <div className="space-y-2">
                            <p className="text-sm font-medium tracking-wide
                                          text-grayscale-500 uppercase">
                                {banner.kicker}
                            </p>

                            <h1
                                id="pathway-ceremony-title"
                                className="text-3xl sm:text-4xl font-semibold
                                           text-grayscale-900 leading-tight
                                           max-w-xl mx-auto"
                            >
                                {banner.phrase}.
                            </h1>
                        </div>
                    ) : (
                        <h1
                            id="pathway-ceremony-title"
                            className="text-3xl sm:text-4xl font-semibold
                                       text-grayscale-900 leading-tight"
                        >
                            {pathway.title}
                        </h1>
                    )}
                </motion.section>

                {/* RECEIPT ========================================== */}
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5, ease: 'easeOut' }}
                    className="flex flex-wrap items-center justify-center
                               gap-x-5 gap-y-2 text-sm text-grayscale-500"
                >
                    <span className="tabular-nums">
                        <span className="text-grayscale-900 font-semibold">
                            {receipt.steps}
                        </span>{' '}
                        steps
                    </span>

                    {receipt.subPathwayCount > 0 && (
                        <>
                            <span aria-hidden className="text-grayscale-300">·</span>

                            <span className="tabular-nums">
                                <span className="text-grayscale-900 font-semibold">
                                    {receipt.subPathwayCount}
                                </span>{' '}
                                {receipt.subPathwayCount === 1
                                    ? 'chapter'
                                    : 'chapters'}
                            </span>
                        </>
                    )}

                    {receipt.vouches > 0 && (
                        <>
                            <span aria-hidden className="text-grayscale-300">·</span>

                            <span className="tabular-nums">
                                <span className="text-grayscale-900 font-semibold">
                                    {receipt.vouches}
                                </span>{' '}
                                {receipt.vouches === 1 ? 'vouch' : 'vouches'}
                            </span>
                        </>
                    )}

                    <span aria-hidden className="text-grayscale-300">·</span>

                    <span className="tabular-nums">
                        <span className="text-grayscale-900 font-semibold">
                            {receipt.days}
                        </span>{' '}
                        {receipt.days === 1 ? 'day' : 'days'}
                    </span>
                </motion.section>

                {/* ARTIFACT (optional) ============================== */}
                {projection && (
                    <motion.section
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.7, ease: 'easeOut' }}
                        className="max-w-md mx-auto"
                    >
                        <div className="p-5 rounded-[24px]
                                        bg-white/80 backdrop-blur-sm
                                        border border-grayscale-200
                                        shadow-lg shadow-grayscale-900/5
                                        space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="shrink-0 w-12 h-12 rounded-2xl
                                                bg-gradient-to-br from-emerald-50 to-emerald-100
                                                border border-emerald-200
                                                flex items-center justify-center">
                                    <IonIcon
                                        icon={sparklesOutline}
                                        className="text-emerald-700 text-xl"
                                        aria-hidden
                                    />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-semibold tracking-[0.1em]
                                                  uppercase text-grayscale-500">
                                        Earned credential
                                    </p>

                                    <h3 className="text-base font-semibold
                                                   text-grayscale-900 mt-0.5 leading-snug">
                                        {projection.achievementName}
                                    </h3>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    pathwayStore.set.dismissCelebration();
                                    history.push(
                                        `/pathways/node/${pathway.id}/${projection.node.id}`,
                                    );
                                }}
                                className="w-full py-2.5 px-4 rounded-[20px]
                                           bg-emerald-600 text-white
                                           font-medium text-sm
                                           hover:bg-emerald-700 transition-colors"
                            >
                                Add to Passport
                            </button>
                        </div>
                    </motion.section>
                )}

                {/* REFLECTION ======================================= */}
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.85, ease: 'easeOut' }}
                    className="max-w-md mx-auto space-y-3"
                >
                    <label
                        htmlFor="pathway-completion-reflection"
                        className="block text-center text-sm text-grayscale-700"
                    >
                        In a sentence — what did this become for you?
                    </label>

                    {reflectionSaved ? (
                        // Saved state: render the quote inline so it
                        // reads back as theirs, with a subtle Edit
                        // affordance to revise.
                        <figure className="p-4 rounded-2xl
                                           bg-white/70 backdrop-blur-sm
                                           border border-grayscale-200
                                           text-center space-y-2">
                            <blockquote className="text-sm
                                                   text-grayscale-800 leading-relaxed
                                                   italic">
                                &ldquo;{reflectionDraft.trim()}&rdquo;
                            </blockquote>

                            <button
                                type="button"
                                onClick={handleEditReflection}
                                className="text-xs text-grayscale-500
                                           hover:text-grayscale-900
                                           transition-colors"
                            >
                                Edit
                            </button>
                        </figure>
                    ) : (
                        <div className="space-y-2">
                            <textarea
                                id="pathway-completion-reflection"
                                rows={3}
                                value={reflectionDraft}
                                onChange={e =>
                                    setReflectionDraft(e.target.value)
                                }
                                placeholder="It taught me…"
                                className="w-full py-3 px-4
                                           border border-grayscale-300 rounded-2xl
                                           text-sm text-grayscale-900 bg-white
                                           placeholder:text-grayscale-400
                                           focus:outline-none focus:ring-2
                                           focus:ring-emerald-500
                                           focus:border-transparent
                                           resize-none font-poppins"
                            />

                            <button
                                type="button"
                                onClick={handleSaveReflection}
                                disabled={reflectionDraft.trim().length === 0}
                                className="w-full py-2.5 px-4 rounded-[20px]
                                           bg-grayscale-900 text-white
                                           font-medium text-sm
                                           hover:opacity-90 transition-opacity
                                           disabled:opacity-40
                                           disabled:cursor-not-allowed"
                            >
                                Save reflection
                            </button>
                        </div>
                    )}
                </motion.section>

                {/* CTAs ============================================= */}
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 1.0, ease: 'easeOut' }}
                    className="max-w-md mx-auto space-y-3 pt-2"
                >
                    <button
                        type="button"
                        onClick={handleStartNewChapter}
                        className="w-full py-3.5 px-5 rounded-[22px]
                                   bg-grayscale-900 text-white
                                   font-medium text-base
                                   hover:opacity-90 transition-opacity
                                   inline-flex items-center justify-center gap-2"
                    >
                        Start a new chapter
                        <IonIcon icon={arrowForwardOutline} className="text-base" aria-hidden />
                    </button>

                    <button
                        type="button"
                        onClick={handleStayHere}
                        className="w-full py-3 px-4 rounded-[20px]
                                   text-sm text-grayscale-600
                                   hover:text-grayscale-900
                                   hover:bg-white/60
                                   transition-colors"
                    >
                        Stay with this one
                    </button>
                </motion.section>
            </div>
        </motion.div>
    );
};

export default PathwayCeremony;
