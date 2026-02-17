import { useStore } from '@nanostores/react';
import { useGetCredentialList, useSyncConsentFlow } from 'learn-card-base';

import TickSquareIcon from 'learn-card-base/svgs/TickSquareIcon';
import X from '../../svgs/X';
import { AiSessionsIconMonochrome } from 'learn-card-base/svgs/wallet/AiSessionsIcon';

import {
    currentThreadId,
    threads,
    sessionEnded,
    finishSession,
    isEndingSession,
    isTyping,
    isLoading,
    resetChatStores,
    messages,
    planReadyThread,
} from 'learn-card-base/stores/nanoStores/chatStore';
import { chatBotStore } from '../../../stores/chatBotStore';
import { useModal } from 'learn-card-base';

const FinishSessionButton: React.FC = () => {
    const { closeAllModals } = useModal();
    const $sessionEnded = useStore(sessionEnded);
    const $currentThreadId = useStore(currentThreadId);
    const $threads = useStore(threads);
    const $isEndingSession = useStore(isEndingSession);
    const $isTyping = useStore(isTyping);
    const $isLoading = useStore(isLoading);
    const $planReadyThread = useStore(planReadyThread);
    const $messages = useStore(messages);

    const { refetch: fetchNewContractCredentials } = useSyncConsentFlow();
    const { refetch: fetchTopics } = useGetCredentialList('AI Topic');

    // Check if session has ended - either via atom or by checking for summary credentials
    const thread = $threads.find(t => t.id === $currentThreadId);
    const hasSessionEnded = $sessionEnded || (thread?.summaries && thread.summaries.length > 0);

    if (hasSessionEnded || $isEndingSession) return <></>;

    const handleFinish = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        // if the plan is ready and we are no longer loading, reset the chat stores
        if ($planReadyThread && !$isLoading && $messages.length === 0) {
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

    return (
        <div className="min-h-[75px] flex justify-between items-center gap-[15px] p-[15px] absolute top-[0px] left-[0px] w-full bg-white shadow-box-bottom z-[100000] safe-area-inset-top">
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
                <X />
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
