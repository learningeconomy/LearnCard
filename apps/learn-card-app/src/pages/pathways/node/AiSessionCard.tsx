/**
 * AiSessionCard — rich, inline "launch this tutor session" surface
 * for pathway nodes whose resolved action is `ai-session`.
 *
 * Counterpart to `AppListingCard`:
 *   - `AppListingCard` renders third-party apps (Coursera, Khan,
 *     someone else's AI tutor) resolved through the listing registry.
 *   - `AiSessionCard` renders the **first-party LearnCard tutor**
 *     on a specific Topic VC — no listing fetch, no consent flow,
 *     just a direct handle on a topic URI.
 *
 * Launch contract — trust the chat service:
 *   The card does NOT pre-flight a wallet claim check. `/chats` with
 *   `topicUri` (and optional `pathwayUri`) is the same trust-the-
 *   chatbot pattern used by `ExistingAiTopicItem` and the
 *   `GrowSkillsAiSessionItem` carousel — the chat service finds-or-
 *   creates the topic server-side. `useTopicAvailability` is used
 *   here purely for *enrichment* (flip "Start session" →
 *   "Continue session" when we happen to know the learner has
 *   prior work on this topic); it never blocks the CTA.
 *
 * Copy rules follow the app UI/UX guidelines:
 *   - `rounded-[20px]` pill buttons, `rounded-2xl` card frame
 *   - `font-poppins`, `grayscale-*` / `emerald-*` tokens only
 *   - No raw emoji — Ionicons for affordance glyphs
 */

import React from 'react';
import { motion } from 'motion/react';
import { IonIcon } from '@ionic/react';
import { playCircleOutline, refreshOutline, sparklesOutline } from 'ionicons/icons';

import type { ResolvedAiSession } from '../core/action';
import type { AiSessionSnapshot } from '../types';

import { useTopicAvailability } from './useTopicAvailability';
import { useAiSessionLaunch } from './useAiSessionLaunch';

// ---------------------------------------------------------------------------
// Motion + constants
// ---------------------------------------------------------------------------

const SECTION_MOTION = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const },
} as const;

// Max number of skill chips we render inline. More than this and the
// row wraps into a wall of pills that out-competes the title for
// visual weight — if the topic has more, the overflow is honest-to-
// learner implicit ("drill into the tutor to see the full scope").
const MAX_INLINE_SKILLS = 4;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface AiSessionCardProps {
    resolved: ResolvedAiSession;
    /**
     * Optional snapshot from the node's action. When present we
     * render topic title / description / skills / icon before the
     * live wallet query resolves, so the card is usable on first
     * paint even offline. Falls back to resolved-only rendering
     * when snapshot is absent.
     */
    snapshot?: AiSessionSnapshot;
}

const AiSessionCard: React.FC<AiSessionCardProps> = ({ resolved, snapshot }) => {
    // Enrichment only — does NOT gate the CTA. See the hook's module
    // docstring for the rationale. `hasPriorSessions` is the signal
    // we actually render against; `hasExistingTopic` is kept in
    // scope for future copy variants (claimed-but-never-used, etc.).
    const { hasExistingTopic, hasPriorSessions, topic } = useTopicAvailability(
        resolved.topicUri,
    );

    const { launch } = useAiSessionLaunch(resolved, {
        topicTitle: snapshot?.topicTitle,
    });

    // Prefer snapshot for display (it's what the author bound at
    // pathway-author time); fall back to the live wallet topic when
    // no snapshot exists. If neither is available, the card still
    // renders — we just show placeholder copy and let the launch CTA
    // speak for itself.
    const topicTitle =
        snapshot?.topicTitle
        ?? (topic?.topicVc as any)?.boostCredential?.topicInfo?.title
        ?? 'AI Tutor Session';

    const topicDescription =
        snapshot?.topicDescription
        ?? (topic?.topicVc as any)?.boostCredential?.topicInfo?.description
        ?? null;

    const skills = snapshot?.skills ?? [];
    const iconUrl = snapshot?.iconUrl;

    return (
        <motion.section
            {...SECTION_MOTION}
            className="
                rounded-2xl overflow-hidden
                bg-white border border-grayscale-200
                shadow-[0_1px_0_0_rgba(0,0,0,0.02)]
            "
            aria-label={`AI tutor session: ${topicTitle}`}
        >
            {/* Kicker — "AI TUTOR SESSION · <status>". The status half
                is rendered only when we have a positive enrichment
                signal (prior sessions on this topic). No status means
                "first time here" which is the default; we don't clutter
                the kicker with a redundant "new" badge. */}
            <div
                className="
                    px-4 pt-3 pb-1
                    flex items-center gap-1.5
                    text-[10px] font-semibold uppercase tracking-[0.08em]
                    text-grayscale-500
                "
            >
                <span>AI Tutor Session</span>

                {hasPriorSessions && (
                    <>
                        <span aria-hidden className="text-grayscale-300">·</span>
                        <span className="text-emerald-600">Resumable</span>
                    </>
                )}

                {hasExistingTopic && !hasPriorSessions && (
                    <>
                        <span aria-hidden className="text-grayscale-300">·</span>
                        <span className="text-grayscale-600">In your wallet</span>
                    </>
                )}
            </div>

            <div className="px-4 pt-1 pb-4">
                {/* Row 1: icon + identity */}
                <div className="flex items-start gap-3">
                    <span
                        aria-hidden
                        className="
                            shrink-0 w-14 h-14 rounded-xl overflow-hidden
                            bg-emerald-50 border border-emerald-100
                            flex items-center justify-center
                        "
                    >
                        {iconUrl ? (
                            <img
                                src={iconUrl}
                                alt=""
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={e => {
                                    // Broken topic icon — swap to the
                                    // sparkles glyph rather than a
                                    // broken-image fragment. Keeps
                                    // visual identity of "this is an
                                    // AI session."
                                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        ) : (
                            <IonIcon
                                icon={sparklesOutline}
                                className="text-[28px] text-emerald-600"
                                aria-hidden
                            />
                        )}
                    </span>

                    <div className="min-w-0 flex-1">
                        <h3
                            className="text-sm font-semibold text-grayscale-900 leading-snug line-clamp-2"
                            title={topicTitle}
                        >
                            {topicTitle}
                        </h3>

                        {topicDescription && (
                            <p className="mt-0.5 text-xs text-grayscale-600 leading-relaxed line-clamp-2">
                                {topicDescription}
                            </p>
                        )}

                        {/* Seed-prompt preview — author/agent focus the
                            learner will see in the modal header too.
                            Surfaced here because it's *intent*, not
                            decoration; learner should know what the
                            session is steering toward before they
                            start. */}
                        {resolved.seedPrompt && (
                            <p className="mt-1 text-[11px] text-emerald-700 leading-relaxed italic line-clamp-2">
                                Focus: {resolved.seedPrompt}
                            </p>
                        )}

                        {/* Skill chips (capped) — first-class agent
                            signal that also helps the learner
                            decide whether the session is worth
                            their time. Any overflow is elided with a
                            "+N more" chip rather than a wall of pills. */}
                        {skills.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                                {skills.slice(0, MAX_INLINE_SKILLS).map(skill => (
                                    <span
                                        key={skill}
                                        className="
                                            inline-block px-2 py-0.5
                                            rounded-full
                                            bg-grayscale-100 text-grayscale-700
                                            text-[10px] font-medium
                                        "
                                    >
                                        {skill}
                                    </span>
                                ))}
                                {skills.length > MAX_INLINE_SKILLS && (
                                    <span
                                        className="
                                            inline-block px-2 py-0.5
                                            rounded-full
                                            bg-grayscale-100 text-grayscale-500
                                            text-[10px] font-medium
                                        "
                                    >
                                        +{skills.length - MAX_INLINE_SKILLS}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Row 2: launch CTA — always rendered, never gated
                    on wallet state. The chat service is the source
                    of truth for topic resolution (see the hook's
                    module docstring for why). Copy flips to
                    "Continue session" when we know prior sessions
                    exist on this topic, matching the click-to-resume
                    behavior of `ExistingAiTopicItem`. */}
                <div className="mt-3">
                    <button
                        type="button"
                        onClick={launch}
                        className="
                            w-full py-3 px-4
                            rounded-[20px]
                            bg-emerald-600 hover:bg-emerald-700
                            text-white font-medium text-sm
                            flex items-center justify-center gap-2
                            transition-colors
                        "
                        aria-label={
                            hasPriorSessions
                                ? `Continue AI tutor session: ${topicTitle}`
                                : `Start AI tutor session: ${topicTitle}`
                        }
                    >
                        <IonIcon
                            icon={hasPriorSessions ? refreshOutline : playCircleOutline}
                            className="text-base"
                            aria-hidden
                        />
                        <span>
                            {hasPriorSessions ? 'Continue session' : 'Start session'}
                        </span>
                    </button>
                </div>
            </div>
        </motion.section>
    );
};

export default AiSessionCard;
