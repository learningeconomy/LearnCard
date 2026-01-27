import React from 'react';
import { useHistory } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { useGetCredentialList, useModal, useSyncConsentFlow } from 'learn-card-base';

import SendIcon from 'learn-card-base/svgs/SendIcon';
import TickSquareIcon from 'learn-card-base/svgs/TickSquareIcon';

import {
    currentThreadId,
    threads,
    isTyping,
    sendMessage,
    planReady,
    continuePlan,
    sessionEnded,
    finishSession,
    startLearningPathway,
    fetchLearningPathways,
    isEndingSession,
} from 'learn-card-base/stores/nanoStores/chatStore';

import type { LearningPathway } from 'learn-card-base/types/ai-chat';
import { IonSpinner } from '@ionic/react';
import CustomSpinner from '../../svgs/CustomSpinner';
import AiSessionLoader from '../AiSessionLoader';
import {
    AiPassportAppContractUri,
    aiPassportApps,
    AiPassportAppsEnum,
} from '../../ai-passport-apps/aiPassport-apps.helpers';
import { AiSessionMode, NewAiSessionStepEnum, sessionWrapUpText } from '../newAiSession.helpers';
import FinishSessionButton from './FinishSessionButton';

import { chatBotStore } from '../../../stores/chatBotStore';

import useTheme from '../../../theme/hooks/useTheme';

const ChatInput: React.FC = () => {
    const { closeAllModals } = useModal();
    const history = useHistory();
    const $planReady = useStore(planReady);
    const $isTyping = useStore(isTyping);
    const $sessionEnded = useStore(sessionEnded);
    const $currentThreadId = useStore(currentThreadId);
    const $threads = useStore(threads);
    const $isEndingSession = useStore(isEndingSession);
    const [input, setInput] = useState('');
    const [showPathwaySelection, setShowPathwaySelection] = useState(false);
    const [pathways, setPathways] = useState<LearningPathway[]>([]);
    const [loadingPathways, setLoadingPathways] = useState(false);
    const mode = chatBotStore.useTracked.mode();

    const { refetch: fetchNewContractCredentials } = useSyncConsentFlow();
    const { refetch: fetchTopics } = useGetCredentialList('AI Topic');

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const handleKeepGoing = async () => {
        if ($currentThreadId) {
            setLoadingPathways(true);
            try {
                const pathwaysList = await fetchLearningPathways($currentThreadId);
                setPathways(pathwaysList);
                setShowPathwaySelection(true);
            } catch (error) {
                console.error('Error loading pathways:', error);
                setPathways([]);
            } finally {
                setLoadingPathways(false);
            }
        }
    };

    const handlePathwaySelect = async (pathway: LearningPathway) => {
        const thread = $threads.find(t => t.id === $currentThreadId);
        const topicUri = thread?.topicCredentialUri;

        if (topicUri && pathway.id) {
            setShowPathwaySelection(false);
            currentThreadId.set(null);
            await startLearningPathway(topicUri, pathway.id);
        }
    };

    const showContinue = $planReady;

    if (showContinue && mode === AiSessionMode.tutor) {
        return (
            <div className="flex justify-center p-5">
                <button
                    onClick={continuePlan}
                    className={`bg-${primaryColor} text-xl text-white flex items-center justify-center font-semibold py-[12px] rounded-full w-full shadow-soft-bottom max-w-[375px] mr-2`}
                >
                    Start Session
                </button>
            </div>
        );
    }

    // Check if session has ended - either via atom or by checking for summary credentials
    const thread = $threads.find(t => t.id === $currentThreadId);
    const hasSessionEnded = $sessionEnded || (thread?.summaries && thread.summaries.length > 0);

    if (hasSessionEnded) {
        return (
            <>
                <div className="flex flex-col items-center p-5 bg-gray-100 rounded-lg">
                    {$isEndingSession ? (
                        <div className="w-full flex items-center justify-center mb-2">
                            <CustomSpinner className="text-grayscale-600" />
                        </div>
                    ) : (
                        <p className="text-grayscale-600 mb-4 text-center font-semibold text-[17px]">
                            Nice work! Now what?
                        </p>
                    )}

                    <div className="flex gap-3">
                        {thread?.topicCredentialUri && !thread?.summaries?.[0] && (
                            <>
                                <button
                                    onClick={() => history.push('/')}
                                    className="bg-emerald-700 text-white font-semibold text-[17px] px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Return Home
                                </button>
                            </>
                        )}

                        {thread?.topicCredentialUri && thread?.summaries?.[0] && (
                            <button
                                onClick={async () => {
                                    closeAllModals();
                                    await fetchNewContractCredentials();
                                    chatBotStore.set.resetStore();

                                    setTimeout(() => {
                                        history.push(
                                            `/ai/sessions?topicBoostUri=${thread?.topicCredentialUri}&summaryUri=${thread?.summaries?.[0]?.credential_uri}`
                                        );
                                    }, 500);
                                }}
                                className={`bg-${primaryColor} text-white font-semibold text-[17px] px-4 py-2 rounded-lg hover:bg-${primaryColor} transition-colors`}
                            >
                                Session Summary
                            </button>
                        )}

                        {thread?.summaries?.[0] && (
                            <button
                                onClick={handleKeepGoing}
                                className="bg-emerald-700 text-white font-semibold text-[17px] px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Keep Going
                            </button>
                        )}
                    </div>
                </div>

                {/* Pathway Selection Modal */}
                {showPathwaySelection &&
                    createPortal(
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[50000]">
                            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-y-auto max-h-[80vh] relative">
                                {/* Close button */}
                                <button
                                    onClick={() => setShowPathwaySelection(false)}
                                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                                    aria-label="Close"
                                >
                                    ×
                                </button>

                                {/* Header */}
                                <div className="px-6 pt-6 text-center">
                                    <h2 className="text-2xl font-semibold text-gray-800">
                                        Continue Your Learning Journey
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Select a pathway to keep exploring this topic
                                    </p>
                                </div>

                                {loadingPathways ? (
                                    <div className="flex justify-center py-10 px-6">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : pathways.length > 0 ? (
                                    <div className="grid gap-4 px-6 py-6">
                                        {pathways.map((pathway, index) => (
                                            <button
                                                key={pathway.id || index}
                                                onClick={() => handlePathwaySelect(pathway)}
                                                className="w-full text-left p-4 border border-gray-200 border-l-4 border-l-blue-600 rounded-lg shadow-sm hover:shadow-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            >
                                                <h4 className="font-medium text-gray-900 mb-2">
                                                    {pathway.learningPathway?.step?.title ||
                                                        `Learning Pathway ${index + 1}`}
                                                </h4>
                                                <p className="text-gray-600 text-sm">
                                                    {pathway.learningPathway?.step?.description ||
                                                        'Continue your learning journey with this pathway.'}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-gray-500 px-6">
                                        No learning pathways available for this session.
                                    </div>
                                )}
                            </div>
                        </div>,
                        document.body
                    )}
            </>
        );
    }

    const handleSend = () => {
        if (!input.trim()) return;
        sendMessage(input);
        setInput('');
    };

    const handleFinish = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        finishSession(async () => {
            await fetchNewContractCredentials();
            await fetchTopics();
        });
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.altKey && !e.ctrlKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const disableSend = !input.trim() || $isTyping;
    const showFinishButton = !showContinue && !$isTyping;

    return (
        <>
            {showFinishButton && <FinishSessionButton />}
            <div className="flex flex-col gap-[10px] p-[15px] sm:p-0">
                <div className="flex rounded-[15px] overflow-hidden w-full sm:shadow-[0px_4px_10px_0px_rgba(0,0,0,0.2)] items-center">
                    <form
                        className="flex-1 flex items-center bg-white sm:py-[15px] sm:px-[20px] sm:gap-[15px] sm:border-r border-grayscale-200"
                        // className="flex items-end gap-3 w-full p-5 bg-white rounded-2xl shadow-[0px_4px_10px_0px_rgba(0,0,0,0.2)]"
                        onSubmit={e => {
                            e.preventDefault();
                            handleSend();
                        }}
                        autoComplete="off"
                    >
                        <textarea
                            rows={1}
                            className="flex-1 bg-white text-grayscale-900 placeholder-grayscale-600 text-[17px] font-poppins px-[5px] py-[15px] focus:outline-none disabled:opacity-60 resize-none overflow-y-auto"
                            value={input}
                            onChange={e => {
                                setInput(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = `${Math.min(
                                    e.target.scrollHeight,
                                    15 * 24
                                )}px`;
                            }}
                            onKeyDown={handleKeyPress}
                            // disabled={$isTyping}
                            placeholder={'Type a message...'}
                            style={{ resize: 'none' }}
                            ref={el => {
                                if (el) {
                                    el.style.height = 'auto';
                                    el.style.height = `${Math.min(el.scrollHeight, 15 * 24)}px`;
                                }
                            }}
                        ></textarea>
                        <button
                            type="submit"
                            className={`bg-${primaryColor} hover:bg-${primaryColor} disabled:bg-white p-[7px] sm:p-[10px] disabled:opacity-50 hover:cursor-pointer disabled:hover:cursor-not-allowed rounded-[15px]`}
                            disabled={disableSend}
                        >
                            {$isTyping ? (
                                <CustomSpinner className="text-gray-700 h-[30px] w-[30px]" />
                            ) : (
                                <SendIcon
                                    className={disableSend ? 'text-grayscale-400' : 'text-white'}
                                />
                            )}
                        </button>
                    </form>
                    {/* <div className="h-full px-[15px] hidden sm:block">
                        <button
                            onClick={handleFinish}
                            className="flex gap-[5px] items-center px-[15px] py-[10px] rounded-[15px] bg-grayscale-900 text-white font-poppins text-[18px] font-[600] leading-[24px] tracking-[0.25px]"
                        >
                            Finish
                            <TickSquareIcon />
                        </button>
                    </div> */}
                </div>

                {/* <button
                onClick={handleFinish}
                className="sm:hidden flex gap-[5px] justify-center items-center px-[15px] py-[10px] rounded-[15px] bg-grayscale-900 text-white font-poppins text-[18px] font-[600] leading-[24px] tracking-[0.25px]"
            >
                Finish Session
                <TickSquareIcon />
            </button> */}
            </div>
        </>
    );
};

export default ChatInput;
