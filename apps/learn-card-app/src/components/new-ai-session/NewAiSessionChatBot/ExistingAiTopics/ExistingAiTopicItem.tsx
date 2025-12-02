import React from 'react';

import {
    AiPassportAppsEnum,
    getAiPassportAppByContractUri,
} from '../../../ai-passport-apps/aiPassport-apps.helpers';
import SlimCaretRight from '../../../svgs/SlimCaretRight';
import { ChatBotQuestionsEnum } from '../newAiSessionChatbot.helpers';
import { Boost, VC } from '@learncard/types';
import { getAiTopicTitle } from '../../newAiSession.helpers';
import { useHistory } from 'react-router-dom';
import { useGetCurrentLCNUser, useModal } from 'learn-card-base';

export const ExistingAiTopicItem: React.FC<{
    topicVc?: VC;
    topicBoost?: Boost;
    sessions?: Boost[];
    index: number;
    handleChatBotAnswer: (
        question: ChatBotQuestionsEnum,
        answer?: string,
        currentIndex?: number
    ) => void;
    currentQuestionIndex: number;
    contractUri?: string;
}> = ({
    topicVc,
    topicBoost,
    sessions,
    handleChatBotAnswer,
    index,
    currentQuestionIndex,
    contractUri,
}) => {
    const history = useHistory();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const app = getAiPassportAppByContractUri(contractUri);
    const topicTitle = getAiTopicTitle(topicVc) ?? '';
    const { closeAllModals } = useModal();

    const delay = `${index * 100}ms`;

    return (
        <div
            onClick={() => {
                // If this topic has no sessions, route directly to chats with topicUri
                if (!sessions || sessions.length === 0) {
                    if (topicBoost?.uri) {
                        if (app?.type === AiPassportAppsEnum.learncardapp) {
                            history.push(`/chats?topicUri=${encodeURIComponent(topicBoost.uri)}`);
                            closeAllModals();
                        } else if (app?.url) {
                            window.location.href = `${app.url}/chats?topicUri=${encodeURIComponent(
                                topicBoost.uri
                            )}&did=${encodeURIComponent(currentLCNUser?.did ?? '')}`;
                        } else {
                            history.push(`/chats?topicUri=${encodeURIComponent(topicBoost.uri)}`);
                            closeAllModals();
                        }
                        return;
                    }

                    // Fallback: proceed with existing flow if no uri is available
                }

                handleChatBotAnswer(
                    ChatBotQuestionsEnum.ResumeTopic,
                    topicBoost?.uri,
                    currentQuestionIndex
                );
            }}
            className="flex items-center justify-between w-full bg-white pb-[12px] pt-[12px] cursor-pointer animate-fade-in-up transition-all duration-500 ease-out min-h-[45px]"
            style={{
                animationDelay: delay,
                animationFillMode: 'forwards',
                willChange: 'opacity, transform',
            }}
        >
            <div className="flex items-center justify-start">
                <div className="w-[45px] flex items-center justify-center mr-1">
                    <div className="h-[45px] w-[45px]">
                        <img
                            className="w-full h-full object-cover bg-white rounded-[12px] overflow-hidden border-[1px] border-solid"
                            alt={`${app?.name} logo`}
                            src={app?.img}
                        />
                    </div>
                </div>
                <p className="text-grayscale-900 text-[17px] font-notoSans font-semibold capitalize ml-2">
                    {topicTitle}
                </p>
            </div>

            <button className="flex items-center justify-end text-grayscale-600 font-poppins text-sm">
                <span>{sessions?.length || 0}</span>
                <SlimCaretRight className="text-grayscale-400 w-[20px] h-auto" />
            </button>
        </div>
    );
};
export default ExistingAiTopicItem;
