import { useHistory } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import { useGetCredentialList, useModal, useSyncConsentFlow } from 'learn-card-base';

import X from '../../svgs/X';
import TickSquareIcon from 'learn-card-base/svgs/TickSquareIcon';
import { AiInsightsIconMonochrome } from 'learn-card-base/svgs/wallet/AiInsightsIcon';

import {
    currentThreadId,
    threads,
    sessionEnded,
    finishSession,
    isEndingSession,
    closeInsightsSession,
    resetChatStores,
} from 'learn-card-base/stores/nanoStores/chatStore';
import { chatBotStore } from '../../../stores/chatBotStore';
import { AiSessionMode } from '../newAiSession.helpers';
import { ChatBotQuestionsEnum } from '../NewAiSessionChatBot/newAiSessionChatbot.helpers';

const FinishSessionButton: React.FC = () => {
    const history = useHistory();
    const { closeAllModals } = useModal();
    const $sessionEnded = useStore(sessionEnded);
    const $currentThreadId = useStore(currentThreadId);
    const $threads = useStore(threads);
    const $isEndingSession = useStore(isEndingSession);

    const mode = chatBotStore.useTracked.mode();
    const qa = chatBotStore.useTracked.chatBotQA();
    const promptTitle = qa.find(q => q.type === ChatBotQuestionsEnum.TopicSelection)?.answer;

    const { refetch: fetchNewContractCredentials } = useSyncConsentFlow();
    const { refetch: fetchTopics } = useGetCredentialList('AI Topic');

    // Check if session has ended - either via atom or by checking for summary credentials
    const thread = $threads.find(t => t.id === $currentThreadId);
    const hasSessionEnded = $sessionEnded || (thread?.summaries && thread.summaries.length > 0);

    if (hasSessionEnded || $isEndingSession) return <></>;

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
        finishSession(async () => {
            await fetchNewContractCredentials();
            await fetchTopics();
        });
    };

    if (mode === AiSessionMode.insights) {
        return (
            <div className="min-h-[75px] flex justify-between items-center gap-[15px] p-[15px] absolute top-[0px] left-[0px] w-full bg-white shadow-box-bottom z-[100000] safe-area-inset-top">
                <div className="flex items-center justify-center gap-1">
                    <AiInsightsIconMonochrome className="w-[24px] h-[24px] mb-1" />
                    <p className="text-sm flex items-center justify-center font-[600] leading-[24px] tracking-[0.25px] text-grayscale-600">
                        {promptTitle}
                    </p>
                </div>
                <button
                    onClick={handleFinish}
                    className="w-[24px] h-[24px] flex items-center justify-center text-grayscale-600"
                >
                    <X />
                </button>
            </div>
        );
    }

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
