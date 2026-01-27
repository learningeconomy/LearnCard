import React from 'react';

import { ProfilePicture } from 'learn-card-base';
import { AiInsightsIconWithShape } from 'learn-card-base/svgs/wallet/AiInsightsIcon';
import { AiSessionsIconWithShape } from 'learn-card-base/svgs/wallet/AiSessionsIcon';
import MarkdownRenderer from '../../ai-assessment/AiAssessment/helpers/MarkdownRenderer';

import type { ChatMessage } from 'learn-card-base/types/ai-chat';

import { chatBotStore } from '../../../stores/chatBotStore';
import { AiSessionMode } from '../newAiSession.helpers';

interface MessageProps {
    message: ChatMessage;
}

export const MessageWithQuestions: React.FC<MessageProps> = React.memo(
    function MessageWithQuestions({ message }) {
        const mode = chatBotStore.useTracked.mode();

        const assistantBubbleStyles = 'bg-grayscale-100 mr-auto !max-w-full px-4';
        const userBubbleStyles = 'bg-cyan-50 px-4';

        return (
            <div className="w-full flex items-center justify-end">
                {message.role === 'assistant' && (
                    <div className="mr-2 self-stretch flex items-end pb-5">
                        {mode === AiSessionMode.insights ? (
                            <AiInsightsIconWithShape className="text-grayscale-900 h-[35px] w-[35px] min-h-[35px] min-w-[35px] max-h-[35px] max-w-[35px] mt-[0px] mb-0" />
                        ) : (
                            <AiSessionsIconWithShape className="text-grayscale-900 h-[35px] w-[35px] min-h-[35px] min-w-[35px] max-h-[35px] max-w-[35px] mt-[0px] mb-0" />
                        )}
                    </div>
                )}
                <div
                    className={`py-4 ${
                        message.role === 'assistant' ? assistantBubbleStyles : userBubbleStyles
                    } rounded-3xl mb-4 text-grayscale-900 flex-shrink min-w-0 prose prose-h1:mb-2 prose-p:mt-0 prose-li:my-0 prose-li:leading-6 prose-pre:bg-transparent prose-pre:p-0 prose-code:shadow prose-code:rounded prose-code:py-2!`}
                >
                    <MarkdownRenderer>{message.content}</MarkdownRenderer>
                </div>
                {message.role !== 'assistant' && (
                    <div className="ml-2 self-stretch flex items-end pb-5">
                        <ProfilePicture
                            customContainerClass="text-grayscale-900 h-[35px] w-[35px] min-h-[35px] min-w-[35px] max-h-[35px] max-w-[35px] mt-[0px] mb-0"
                            customImageClass="w-full h-full object-cover"
                        />
                    </div>
                )}
            </div>
        );
    },
    (oldProps, newProps) =>
        oldProps.message.role === newProps.message.role &&
        oldProps.message.content === newProps.message.content
);

export default MessageWithQuestions;
