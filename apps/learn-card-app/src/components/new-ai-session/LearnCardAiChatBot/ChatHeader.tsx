import React from 'react';
import { useHistory } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import { useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';

import {
    LaunchPadAppListItem,
    useGetCredentialList,
    useModal,
    useSyncConsentFlow,
} from 'learn-card-base';
import { AiInsightsIconWithShape } from 'learn-card-base/svgs/wallet/AiInsightsIcon';
import { AiSessionsIconWithShape } from 'learn-card-base/svgs/wallet/AiSessionsIcon';

import {
    currentThreadId,
    threads,
    messages,
    sessionEnded,
    finishSession,
    closeInsightsSession,
    resetChatStores,
    disconnectWebSocket,
    currentTopicUri,
    currentAiPathwayUri,
    sessionStartedAt,
} from 'learn-card-base/stores/nanoStores/chatStore';

import X from '../../svgs/X';
import { AiSessionMode } from '../newAiSession.helpers';
import { chatBotStore } from '../../../stores/chatBotStore';
import { publishWalletEvent } from '../../../pages/pathways/events/walletEventBus';

interface ChatHeaderProps {
    mode: AiSessionMode;
    aiApp?: LaunchPadAppListItem;
    initialTopic?: string;
    /** Override the default finish-session behavior of the X button. */
    onClose?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
    mode,
    aiApp,
    initialTopic,
    onClose,
}) => {
    const history = useHistory();
    const { closeAllModals } = useModal();
    const $currentThreadId = useStore(currentThreadId);
    const $threads = useStore(threads);
    const $messages = useStore(messages);
    const $sessionEnded = useStore(sessionEnded);

    const { refetch: fetchNewContractCredentials } = useSyncConsentFlow();
    const { refetch: fetchTopics } = useGetCredentialList('AI Topic');
    const queryClient = useQueryClient();

    const currentThread = $threads.find(t => t.id === $currentThreadId);
    const isInsights = mode === AiSessionMode.insights;

    // Sessions → topic title (fallback to initialTopic).
    // Insights → first user question (fallback to initialTopic).
    // When undefined we render a skeleton instead of a generic fallback string,
    // since "AI Session" / "AI Insights" reads as an actual title rather than a
    // loading state.
    const derivedTitle = isInsights
        ? $messages.find(m => m.role === 'user')?.content ?? initialTopic
        : currentThread?.title ?? initialTopic;
    const isTitleLoading = !derivedTitle;

    /**
     * Publish an `AiSessionCompleted` event to the pathway-progress
     * bus. Best-effort \u2014 failures must not block the finish flow.
     * Only fires when we actually have a topicUri (tutor sessions
     * started via `startTopicWithUri` / `startLearningPathway`);
     * onboarding / skill-profile sessions that never set a topic
     * produce no event, which is the right behavior \u2014 there's no
     * pathway node to advance.
     *
     * Originally lived in `FinishSessionButton.tsx`. That component
     * was deleted upstream when the chat UI was refactored to put the
     * close button in `ChatHeader`; we ported the publish call here
     * so `session-completed` terminations still tick over from a
     * tutor session ending.
     */
    const publishAiSessionCompleted = (source: 'user-finish' | 'auto-end'): void => {
        const threadId = currentThreadId.get();
        const topicUri = currentTopicUri.get();

        if (!threadId || !topicUri) return;

        const startedAt = sessionStartedAt.get();
        const endedAt = new Date().toISOString();

        const durationSec = startedAt
            ? Math.max(
                  0,
                  Math.round(
                      (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000,
                  ),
              )
            : undefined;

        try {
            publishWalletEvent({
                kind: 'ai-session-completed',
                eventId: uuidv4(),
                threadId,
                topicUri,
                ...(currentAiPathwayUri.get()
                    ? { aiPathwayUri: currentAiPathwayUri.get()! }
                    : {}),
                endedAt,
                ...(durationSec !== undefined ? { durationSec } : {}),
                source,
            });
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error(
                '[ChatHeader] failed to publish ai-session-completed:',
                err,
            );
        }
    };

    const handleFinishSession = async () => {
        if (onClose) {
            onClose();
            return;
        }

        if (isInsights) {
            closeAllModals();
            await closeInsightsSession();
            chatBotStore.set.resetStore();
            resetChatStores();
            history.push('/ai/insights');
            return;
        }

        // Already-finished session (Session Summary / Keep Going state) →
        // exit cleanly to topics. Without this, X retriggers finishSession
        // which just rebuilds the same end state.
        const hasEndedAlready =
            $sessionEnded ||
            (currentThread?.summaries && currentThread.summaries.length > 0);
        if (hasEndedAlready) {
            disconnectWebSocket();
            resetChatStores();
            chatBotStore.set.resetStore();
            closeAllModals();
            history.push('/ai/topics');
            return;
        }

        // Empty thread (or still loading the first AI response) → tear down
        // the WebSocket so the in-flight reply can't repopulate `messages`
        // after we reset, then navigate back to the topics list. closeAllModals
        // alone is insufficient because /chats can be reached as a route, not
        // just a modal.
        if ($messages.length === 0) {
            disconnectWebSocket();
            resetChatStores();
            chatBotStore.set.resetStore();
            closeAllModals();
            history.push('/ai/topics');
            return;
        }

        // Publish BEFORE `finishSession` runs \u2014 the callback fires after
        // the service-side end-session response, by which time the chat
        // store may have been partially reset by other flows. Publishing
        // here guarantees threadId/topicUri are still populated. The
        // pathway reactor's idempotency keeps a duplicate publish on the
        // callback side from double-counting.
        publishAiSessionCompleted('user-finish');

        finishSession(async () => {
            await fetchNewContractCredentials();
            await fetchTopics();
            // The topic-detail page reads its sessions from
            // useGetEnrichedSession; invalidate so the new session shows up
            // immediately when the user closes the modal.
            await queryClient.invalidateQueries({ queryKey: ['useGetEnrichedSession'] });
            await queryClient.invalidateQueries({ queryKey: ['useGetEnrichedTopicsList'] });
            await queryClient.invalidateQueries({ queryKey: ['useGetSummaryInfo'] });
        });
    };

    // Show a subtitle hint only for real sessions (not insights, not empty).
    const showEndSessionHint = !isInsights && !!currentThread;

    return (
        <div className="sticky top-0 z-[100] w-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] pt-[calc(12px+env(safe-area-inset-top))] sm:pt-3 pb-3 px-4">
            <div className="w-full max-w-[829px] mx-auto flex items-start gap-3">
                <div className="flex-shrink-0 mt-[2px]">
                    {isInsights ? (
                        <AiInsightsIconWithShape className="h-[28px] w-[28px] text-grayscale-900" />
                    ) : aiApp?.img ? (
                        <img
                            src={aiApp.img}
                            alt={`${aiApp.name ?? 'AI'} logo`}
                            className="h-[28px] w-[28px] rounded-full object-cover bg-white border-[1px] border-solid border-grayscale-200"
                        />
                    ) : (
                        <AiSessionsIconWithShape className="h-[28px] w-[28px] text-grayscale-900" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    {isTitleLoading ? (
                        <div
                            className="h-[20px] w-[60%] max-w-[280px] rounded-[6px] bg-grayscale-100 animate-pulse"
                            aria-label="Loading title"
                            role="status"
                        />
                    ) : (
                        <h2 className="text-[17px] font-poppins font-[600] text-grayscale-900 leading-tight line-clamp-2 m-0">
                            {derivedTitle}
                        </h2>
                    )}
                    {showEndSessionHint && !isTitleLoading && (
                        <p className="text-[13px] font-poppins text-grayscale-600 mt-[2px] leading-tight">
                            Close to End Session
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={handleFinishSession}
                    className="flex-shrink-0 p-1 -mr-1 text-grayscale-600"
                    aria-label="Close"
                >
                    <X className="text-grayscale-800 w-[24px] h-[24px]" strokeWidth="3" />
                </button>
            </div>
        </div>
    );
};

export default ChatHeader;
