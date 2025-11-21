import { useStore } from '@nanostores/react';
import { useGetCredentialList, useSyncConsentFlow } from 'learn-card-base';

import TickSquareIcon from 'learn-card-base/svgs/TickSquareIcon';

import {
    currentThreadId,
    threads,
    sessionEnded,
    finishSession,
    isEndingSession,
} from 'learn-card-base/stores/nanoStores/chatStore';

const FinishSessionButton: React.FC = () => {
    const $sessionEnded = useStore(sessionEnded);
    const $currentThreadId = useStore(currentThreadId);
    const $threads = useStore(threads);
    const $isEndingSession = useStore(isEndingSession);

    const { refetch: fetchNewContractCredentials } = useSyncConsentFlow();
    const { refetch: fetchTopics } = useGetCredentialList('AI Topic');

    // Check if session has ended - either via atom or by checking for summary credentials
    const thread = $threads.find(t => t.id === $currentThreadId);
    const hasSessionEnded = $sessionEnded || (thread?.summaries && thread.summaries.length > 0);

    if (hasSessionEnded || $isEndingSession) return <></>;

    const handleFinish = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        finishSession(async () => {
            await fetchNewContractCredentials();
            await fetchTopics();
        });
    };

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
