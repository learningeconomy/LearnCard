import { useHistory } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '@nanostores/react';
import { useGetCredentialList, useModal, useSyncConsentFlow } from 'learn-card-base';

import X from '../../svgs/X';
import TickSquareIcon from 'learn-card-base/svgs/TickSquareIcon';
import { AiInsightsIconMonochrome } from 'learn-card-base/svgs/wallet/AiInsightsIcon';
import { AiSessionsIconMonochrome } from 'learn-card-base/svgs/wallet/AiSessionsIcon';

import {
    currentThreadId,
    threads,
    sessionEnded,
    finishSession,
    isEndingSession,
    closeInsightsSession,
    resetChatStores,
    isTyping,
    isLoading,
    messages,
    planReadyThread,
    currentTopicUri,
    currentAiPathwayUri,
    sessionStartedAt,
} from 'learn-card-base/stores/nanoStores/chatStore';
import { chatBotStore } from '../../../stores/chatBotStore';
import { publishWalletEvent } from '../../../pages/pathways/events/walletEventBus';
import { AiSessionMode } from '../newAiSession.helpers';
import { ChatBotQuestionsEnum } from '../NewAiSessionChatBot/newAiSessionChatbot.helpers';

const FinishSessionButton: React.FC = () => {
    const history = useHistory();
    const { closeAllModals } = useModal();
    const $sessionEnded = useStore(sessionEnded);
    const $currentThreadId = useStore(currentThreadId);
    const $threads = useStore(threads);
    const $isEndingSession = useStore(isEndingSession);
    const $isTyping = useStore(isTyping);
    const $isLoading = useStore(isLoading);
    const $planReadyThread = useStore(planReadyThread);
    const $messages = useStore(messages);

    const mode = chatBotStore.useTracked.mode();
    const qa = chatBotStore.useTracked.chatBotQA();
    const promptTitle = qa.find(q => q.type === ChatBotQuestionsEnum.TopicSelection)?.answer;

    const { refetch: fetchNewContractCredentials } = useSyncConsentFlow();
    const { refetch: fetchTopics } = useGetCredentialList('AI Topic');

    // Check if session has ended - either via atom or by checking for summary credentials
    const thread = $threads.find(t => t.id === $currentThreadId);
    const hasSessionEnded = $sessionEnded || (thread?.summaries && thread.summaries.length > 0);
    const isSessionTyping = $isTyping;

    if (hasSessionEnded || $isEndingSession) return <></>;

    /**
     * Publish an `AiSessionCompleted` event to the pathway-progress
     * bus. Best-effort — failures must not block the finish flow.
     * Only fires when we actually have a topicUri (tutor sessions
     * started via `startTopicWithUri` / `startLearningPathway`);
     * onboarding / skill-profile sessions that never set a topic
     * produce no event, which is the right behavior — there's no
     * pathway node to advance.
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
                '[FinishSessionButton] failed to publish ai-session-completed:',
                err,
            );
        }
    };

    const handleFinish = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        if (mode === AiSessionMode.insights) {
            closeAllModals();
            await closeInsightsSession();
            chatBotStore.set.resetStore();
            resetChatStores();
            history.push('/ai/insights');
            return;
        }

        // if there are no messages, allow immediate exit regardless of loading state
        if ($messages.length === 0) {
            resetChatStores();
            chatBotStore.set.resetStore();
            closeAllModals();
            return;
        }

        // Publish BEFORE resetting — `finishSession` callback runs
        // after the service-side end-session response lands, at which
        // point the chat store may have been partially reset by other
        // flows. Publishing here guarantees threadId/topicUri are
        // still populated. The reactor idempotency prevents double-
        // processing if a pathway-integration flow eventually
        // publishes on the callback side too.
        publishAiSessionCompleted('user-finish');

        finishSession(async () => {
            await fetchNewContractCredentials();
            await fetchTopics();
        });
    };

    if (mode === AiSessionMode.insights) {
        return (
            <div className="min-h-[75px] flex justify-between items-center gap-[15px] p-[15px] absolute top-[0px] left-[0px] w-full bg-white shadow-box-bottom z-[100000] safe-area-top-margin">
                <div className="flex items-center justify-center gap-1">
                    <AiInsightsIconMonochrome className="w-[24px] h-[24px] mb-1" />
                    <p className="text-sm flex items-center justify-center font-[600] leading-[24px] tracking-[0.25px] text-grayscale-600">
                        {promptTitle}
                    </p>
                </div>
                {!isSessionTyping && (
                    <button
                        onClick={handleFinish}
                        className="w-[24px] h-[24px] flex items-center justify-center text-grayscale-600"
                    >
                        <X className="text-grayscale-800 w-[24px] h-[24px]" />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-[75px] flex justify-between items-center gap-[15px] p-[15px] absolute top-[0px] left-[0px] w-full bg-white shadow-box-bottom z-[100000] safe-area-top-margin">
            <div className="flex items-center justify-center gap-1 text-grayscale-900 font-semibold">
                <AiSessionsIconMonochrome className="w-[24px] h-[24px] mr-2" />
                AI Session
                {/* <p className="text-sm flex items-center justify-center font-[600] leading-[24px] tracking-[0.25px] text-grayscale-600">
                        {promptTitle}
                    </p> */}
            </div>

            <button
                onClick={handleFinish}
                className="w-[24px] h-[24px] flex items-center justify-center text-grayscale-600"
            >
                <X className="text-grayscale-800 w-[24px] h-[24px]" />
            </button>
        </div>
    );

    return (
        <div className="flex justify-center items-center p-[15px] absolute top-[0px] left-[0px] w-full bg-white shadow-box-bottom z-[100000] safe-area-inset-top">
            <button
                onClick={handleFinish}
                className="max-w-[750px] w-full flex justify-center items-center px-[15px] py-[10px] rounded-[15px] bg-white border-solid border-[1px] border-grayscale-200 text-grayscale-900 font-poppins text-[18px] font-[600] leading-[24px] tracking-[0.25px]"
            >
                Finish Session
                <TickSquareIcon version="2" className="ml-1" />
            </button>
        </div>
    );
};

export default FinishSessionButton;
