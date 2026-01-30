import React from 'react';
import { useStore } from '@nanostores/react';
import { useFlags } from 'launchdarkly-react-client-sdk';

import { ProfilePicture } from 'learn-card-base';
import MessageWithArtifact from './MessageWithArtifact';
import { AiInsightsIconWithShape } from 'learn-card-base/svgs/wallet/AiInsightsIcon';
import { AiSessionsIconWithShape } from 'learn-card-base/svgs/wallet/AiSessionsIcon';
import MarkdownRenderer from '../../ai-assessment/AiAssessment/helpers/MarkdownRenderer';

import type { ChatMessage } from 'learn-card-base/types/ai-chat';
import { isTyping } from 'learn-card-base/stores/nanoStores/chatStore';

import { chatBotStore } from '../../../stores/chatBotStore';
import { AiSessionMode } from '../newAiSession.helpers';

interface MessageProps {
    message: ChatMessage;
}

export const MessageWithQuestions: React.FC<MessageProps> = React.memo(
    function MessageWithQuestions({ message }) {
        const flags = useFlags();
        const $isTyping = useStore(isTyping);

        const enableChatBubbles = flags.enableChatBubbles;

        const mode = chatBotStore.useTracked.mode();

        let assistantBubbleStyles = enableChatBubbles
            ? 'bg-grayscale-100 mr-auto !max-w-full px-4'
            : 'bg-white mr-auto !max-w-full';
        const userBubbleStyles = enableChatBubbles ? 'bg-cyan-50 px-4' : 'bg-grayscale-100 px-4';

        if (!message.content && !message?.artifact) return null;

        let text = <MarkdownRenderer>{message.content}</MarkdownRenderer>;

        if (message.artifact) {
            assistantBubbleStyles = 'bg-indigo-50 mr-auto !max-w-full px-4';
            text = <MessageWithArtifact message={message} />;
        }

        return (
            <div className="w-full flex items-center justify-end">
                {message.role === 'assistant' && !$isTyping && enableChatBubbles && (
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
                    {text}
                </div>
                {message.role !== 'assistant' && !$isTyping && enableChatBubbles && (
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
