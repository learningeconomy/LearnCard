/**
 * PathwayAiSessionModal — modal host for the built-in LearnCard AI
 * Tutor when launched *from* a pathway node.
 *
 * Why this exists as a distinct component (rather than just passing
 * `LearnCardAiChatBot` directly to `newModal`):
 *
 *   1. **IonPage wrapper.** The chatbot's root is a plain `<div>`;
 *      mounting that straight into a `useModal` slot lands it inside
 *      a Center (600px × 75vh) container which clips the chat surface
 *      and breaks scrolling. Wrapping in `<IonPage className="h-full
 *      w-full">` gives the chatbot the full-height context it needs
 *      — same fix `EmbedIframeModal` and `AiTutorConnectedView` apply.
 *
 *   2. **Pathway context hint.** Authors can attach a `seedPrompt`
 *      to `ai-session` actions (e.g. "drill IAM cross-account
 *      assume-role"). The modal surfaces it as a visible chip in the
 *      header so the learner sees the author's focus before the
 *      tutor's plan loads.
 *
 *   3. **Exit path.** The chatbot's `FinishSessionButton` already
 *      calls `closeAllModals()` on finish, so the learner returns to
 *      the pathway map / node detail automatically once the session
 *      ends. No extra close wiring needed here.
 *
 * **Seed-prompt delivery (deferred).** `seedPrompt` is displayed and
 * stored but not auto-sent to the chat turn. Automatic delivery
 * requires coordinating with the chatbot's plan-ready state and a
 * prefill of `chatInputText` at the right moment, which is a
 * follow-up. The field is already useful today for (a) agent
 * reasoning about node character and (b) giving the learner visible
 * context for what the author wants them to focus on.
 */

import React from 'react';
import { IonPage } from '@ionic/react';

import { LearnCardAiChatBot } from '../../../components/new-ai-session/LearnCardAiChatBot/LearnCardAiChatBot';

export interface PathwayAiSessionModalProps {
    /** Topic boost URI — the tutor seeds its initial plan from this. */
    topicUri: string;
    /** Optional AI Learning Pathway URI (tutor curriculum spine). */
    pathwayUri?: string;
    /** Optional author/agent focus chip displayed above the chat. */
    seedPrompt?: string;
    /**
     * Optional display title for the header chip area. Sourced from
     * the node's `AiSessionSnapshot.topicTitle` when available so the
     * modal header reads "Cloud Coach — IAM Deep Dive" instead of
     * the topic URI while the chatbot's own fetch warms up.
     */
    topicTitle?: string;
}

const PathwayAiSessionModal: React.FC<PathwayAiSessionModalProps> = ({
    topicUri,
    pathwayUri,
    seedPrompt,
    topicTitle,
}) => {
    // Only show the author-intent banner when there's something
    // useful to convey — an empty seedPrompt should not produce an
    // empty chip.
    const showAuthorChip = !!seedPrompt && seedPrompt.trim().length > 0;

    return (
        <IonPage className="h-full w-full bg-white">
            {showAuthorChip && (
                // Small, unobtrusive chip above the chat surface so
                // the learner sees author intent before the plan
                // loads. `pt-[100px]` mirrors the chatbot's own
                // desktop offset so we don't collide with its floating
                // FinishSessionButton header.
                <div
                    className="
                        absolute top-0 left-0 right-0 z-[40000]
                        flex justify-center px-4 pt-[80px] sm:pt-4
                        pointer-events-none
                    "
                    aria-hidden={false}
                >
                    <div
                        className="
                            pointer-events-auto
                            max-w-[560px] w-full
                            rounded-2xl border border-emerald-100
                            bg-emerald-50 px-4 py-2.5
                            flex items-start gap-2
                            shadow-sm
                            font-poppins
                        "
                    >
                        <div className="flex-1 min-w-0">
                            {topicTitle && (
                                <p className="text-[11px] font-medium text-emerald-700 uppercase tracking-[0.08em]">
                                    {topicTitle}
                                </p>
                            )}
                            <p className="text-sm text-emerald-900 leading-relaxed">
                                <span className="font-medium">Focus:</span>{' '}
                                {seedPrompt}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <LearnCardAiChatBot
                initialMessages={[]}
                initialTopicUri={topicUri}
                initialPathwayUri={pathwayUri}
            />
        </IonPage>
    );
};

export default PathwayAiSessionModal;
