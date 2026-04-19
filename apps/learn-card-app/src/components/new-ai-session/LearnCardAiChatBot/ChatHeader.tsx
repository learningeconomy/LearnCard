import React from 'react';
import { useHistory } from 'react-router-dom';
import { useStore } from '@nanostores/react';

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
    isEndingSession,
    isTyping,
    finishSession,
    closeInsightsSession,
    resetChatStores,
} from 'learn-card-base/stores/nanoStores/chatStore';

import X from '../../svgs/X';
import { AiSessionMode } from '../newAiSession.helpers';
import { chatBotStore } from '../../../stores/chatBotStore';

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
    const $isEndingSession = useStore(isEndingSession);
    const $isTyping = useStore(isTyping);

    const { refetch: fetchNewContractCredentials } = useSyncConsentFlow();
    const { refetch: fetchTopics } = useGetCredentialList('AI Topic');

    const currentThread = $threads.find(t => t.id === $currentThreadId);
    const isInsights = mode === AiSessionMode.insights;

    // Sessions → topic title (fallback to initialTopic, else generic label).
    // Insights → first user question (fallback to initialTopic, else generic label).
    const derivedTitle = isInsights
        ? $messages.find(m => m.role === 'user')?.content ?? initialTopic
        : currentThread?.title ?? initialTopic;
    const fallbackTitle = isInsights ? 'AI Insights' : 'AI Session';
    const title = derivedTitle || fallbackTitle;

    // Hide X during completion flows so the user can't bail mid-finish.
    const hasSessionEnded =
        $sessionEnded || (currentThread?.summaries && currentThread.summaries.length > 0);
    const hideClose = hasSessionEnded || $isEndingSession || $isTyping;

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

        // Empty thread → just dismiss, no summary flow.
        if ($messages.length === 0) {
            resetChatStores();
            chatBotStore.set.resetStore();
            closeAllModals();
            return;
        }

        finishSession(async () => {
            await fetchNewContractCredentials();
            await fetchTopics();
        });
    };

    // Show a subtitle hint only for real sessions (not insights, not empty).
    const showEndSessionHint = !isInsights && !!currentThread;

    return (
        <div className="sticky top-0 z-[100] bg-white flex items-start gap-3 px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)] pt-[calc(12px+env(safe-area-inset-top))] sm:pt-3">
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
                <h2 className="text-[17px] font-poppins font-[600] text-grayscale-900 leading-tight line-clamp-2 m-0">
                    {title}
                </h2>
                {showEndSessionHint && (
                    <p className="text-[13px] font-poppins text-grayscale-600 mt-[2px] leading-tight">
                        Close to End Session
                    </p>
                )}
            </div>
            {!hideClose && (
                <button
                    type="button"
                    onClick={handleFinishSession}
                    className="flex-shrink-0 p-1 -mr-1 text-grayscale-600"
                    aria-label="Close"
                >
                    <X className="text-grayscale-800 w-[24px] h-[24px]" strokeWidth="3" />
                </button>
            )}
        </div>
    );
};

export default ChatHeader;
