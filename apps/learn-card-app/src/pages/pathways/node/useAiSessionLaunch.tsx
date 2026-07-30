/**
 * useAiSessionLaunch — modal-launch dispatcher for `ai-session`
 * pathway actions.
 *
 * Why a modal (not a navigate):
 *   The GrowSkills carousel launches AI sessions via
 *   `history.push('/chats?topicUri=...&pathwayUri=...')`, which routes
 *   the learner *away* from wherever they were. That's fine for a
 *   home-screen carousel but wrong for a pathway node — the learner
 *   expects to return to the exact node on the Map after finishing
 *   the session. A modal launch over `/pathways/:id/node/:nodeId`
 *   preserves that context; the chatbot's own `FinishSessionButton`
 *   already calls `closeAllModals()` on exit, so the Map is right
 *   where they left it when the modal dismisses.
 *
 * Relationship to `useAppListingLaunch`:
 *   That hook handles three *third-party* tutor surfaces via the
 *   listing registry. This hook is for the **first-party** LearnCard
 *   tutor. The two tutors look similar from the learner's POV but
 *   have completely different backends (MCP-backed vs LearnCard's
 *   own `/chats` engine) and security gates (consent-flow contracts
 *   + age gating vs wallet topic-VC availability). Keeping the
 *   dispatch paths separate matches that separation.
 *
 * Topic availability is intentionally NOT pre-flighted. The chat
 * service resolves-or-creates topics server-side from a `topicUri`
 * (same contract the GrowSkills carousel and `ExistingAiTopicItem`
 * rely on), and `useTopicAvailability` is used upstream only for
 * advisory copy (e.g. "Continue session" when prior work exists).
 * This hook simply trusts its caller; if the websocket start_topic
 * call fails, the chatbot surfaces its own error modal — which is
 * the right place for that feedback, next to the session the learner
 * is trying to start.
 */

import React, { useCallback } from 'react';
import { useModal, ModalTypes } from 'learn-card-base';

import type { ResolvedAiSession } from '../core/action';

import PathwayAiSessionModal from './PathwayAiSessionModal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseAiSessionLaunchResult {
    /**
     * Fire the launch. Safe to call with `resolved === null` — the
     * hook no-ops in that case so callers can bind this to a button
     * handler without a nullish check.
     */
    launch: () => void;
}

export interface UseAiSessionLaunchOptions {
    /**
     * Display title to stamp on the modal's author-intent chip. When
     * omitted, the chip shows only the seed-prompt focus without a
     * topic-name kicker. Sourced from
     * `AiSessionAction.snapshot?.topicTitle` in practice.
     */
    topicTitle?: string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Bind a modal launcher to a `ResolvedAiSession`. The hook itself is
 * React-free aside from the `useModal` integration — no state, no
 * effects. Call `launch()` on click; the modal renders
 * `PathwayAiSessionModal` with the resolved topicUri / pathwayUri /
 * seedPrompt so the chatbot starts with pathway context without
 * needing URL rewrites.
 */
export const useAiSessionLaunch = (
    resolved: ResolvedAiSession | null,
    opts: UseAiSessionLaunchOptions = {},
): UseAiSessionLaunchResult => {
    const { newModal } = useModal();

    const { topicTitle } = opts;

    const launch = useCallback(() => {
        if (!resolved) return;

        // Right slide on desktop (the chat reads well in a narrow
        // column), FullScreen on mobile. Same contract as
        // `AiTutorConnectedView` and `EmbedIframeModal`: the modal
        // body renders its own IonPage so the full-height layout
        // behaves correctly inside Ionic's modal stack.
        //
        // `hideButton: true` because the chatbot's FinishSessionButton
        // is the canonical close affordance — stacking a second X
        // would confuse the exit path.
        newModal(
            <PathwayAiSessionModal
                topicUri={resolved.topicUri}
                pathwayUri={resolved.pathwayUri}
                seedPrompt={resolved.seedPrompt}
                topicTitle={topicTitle}
            />,
            { hideButton: true },
            { desktop: ModalTypes.Right, mobile: ModalTypes.FullScreen },
        );
    }, [resolved, topicTitle, newModal]);

    return { launch };
};
