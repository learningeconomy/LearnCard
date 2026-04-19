import React from 'react';
import { useStore } from '@nanostores/react';
import { useFlags } from 'launchdarkly-react-client-sdk';

import MarkdownRenderer from '../../ai-assessment/AiAssessment/helpers/LazyMarkdownRenderer';
import { LaunchPadAppListItem, ProfilePicture } from 'learn-card-base';
import MessageWithArtifact from './MessageWithArtifact';
import { AiInsightsIconWithShape } from 'learn-card-base/svgs/wallet/AiInsightsIcon';
import { AiSessionsIconWithShape } from 'learn-card-base/svgs/wallet/AiSessionsIcon';

import type { ChatMessage } from 'learn-card-base/types/ai-chat';
import { isTyping, streamingMessage } from 'learn-card-base/stores/nanoStores/chatStore';

import { chatBotStore } from '../../../stores/chatBotStore';
import { AiSessionMode } from '../newAiSession.helpers';

interface MessageProps {
    message: ChatMessage;
    aiApp?: LaunchPadAppListItem;
}

const AiAvatar: React.FC<{ mode: AiSessionMode; aiApp?: LaunchPadAppListItem }> = ({
    mode,
    aiApp,
}) => {
    const sizeClasses =
        'h-[35px] w-[35px] min-h-[35px] min-w-[35px] max-h-[35px] max-w-[35px] mt-[0px] mb-0';

    if (mode === AiSessionMode.insights) {
        return <AiInsightsIconWithShape className={`text-grayscale-900 ${sizeClasses}`} />;
    }

    if (aiApp?.img) {
        return (
            <img
                src={aiApp.img}
                alt={`${aiApp.name ?? 'AI'} logo`}
                className={`${sizeClasses} rounded-full object-cover bg-white border-[1px] border-solid border-grayscale-200`}
            />
        );
    }

    return <AiSessionsIconWithShape className={`text-grayscale-900 ${sizeClasses}`} />;
};

/**
 * Shared assistant bubble renderer — used by both committed messages and streaming.
 * Not exported; internal to this module.
 */
const AssistantBubble: React.FC<{
    content: React.ReactNode;
    bubbleStyles: string;
    mode: AiSessionMode;
    aiApp?: LaunchPadAppListItem;
}> = ({ content, bubbleStyles, mode, aiApp }) => {
    const flags = useFlags();
    const enableChatBubbles = flags.enableChatBubbles;

    return (
        <div className="w-full flex items-center justify-end">
            {enableChatBubbles && (
                <div className="mr-2 self-stretch flex items-end pb-5">
                    <AiAvatar mode={mode} aiApp={aiApp} />
                </div>
            )}
            <div
                className={`py-4 ${bubbleStyles} rounded-3xl mb-4 text-grayscale-900 flex-shrink min-w-0 prose prose-h1:mb-2 prose-p:mt-0 prose-li:my-0 prose-li:leading-6 prose-pre:p-0 prose-code:shadow prose-code:rounded prose-code:py-2!`}
            >
                {content}
            </div>
        </div>
    );
};

export const MessageWithQuestions: React.FC<MessageProps> = React.memo(
    function MessageWithQuestions({ message, aiApp }) {
        const flags = useFlags();
        const $isTyping = useStore(isTyping);

        const enableChatBubbles = flags.enableChatBubbles;

        const mode = chatBotStore.useTracked.mode();

        let assistantBubbleStyles = enableChatBubbles
            ? 'bg-grayscale-100 mr-auto !max-w-full px-4'
            : 'bg-white mr-auto !max-w-full';
        const userBubbleStyles = enableChatBubbles ? 'bg-cyan-50 px-4' : 'bg-grayscale-100 px-4';

        if (!message.content && !message?.artifact) return null;

        if (message.role === 'assistant') {
            let text = <MarkdownRenderer>{message.content}</MarkdownRenderer>;
            if (message.artifact) {
                assistantBubbleStyles = 'bg-indigo-50 mr-auto !max-w-full px-4';
                text = <MessageWithArtifact message={message} />;
            }
            return (
                <AssistantBubble
                    content={text}
                    bubbleStyles={assistantBubbleStyles}
                    mode={mode}
                    aiApp={aiApp}
                />
            );
        }

        // User message
        return (
            <div className="w-full flex items-center justify-end">
                <div
                    className={`py-4 ${userBubbleStyles} rounded-3xl mb-4 text-grayscale-900 flex-shrink min-w-0 prose prose-h1:mb-2 prose-p:mt-0 prose-li:my-0 prose-li:leading-6 prose-pre:p-0 prose-code:shadow prose-code:rounded prose-code:py-2!`}
                >
                    <MarkdownRenderer>{message.content}</MarkdownRenderer>
                </div>
                {enableChatBubbles && (
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
        oldProps.message.content === newProps.message.content &&
        oldProps.aiApp?.img === newProps.aiApp?.img
);

/**
 * Typing dots indicator — matches the existing bounce animation from LearnCardAiChatBot.
 */
const TypingDots: React.FC<{ mode: AiSessionMode; aiApp?: LaunchPadAppListItem }> = ({
    mode,
    aiApp,
}) => {
    const flags = useFlags();
    const enableChatBubbles = flags.enableChatBubbles;

    return (
        <div className="w-full flex items-center justify-end">
            {enableChatBubbles && (
                <div className="mr-2 self-stretch flex items-end pb-5">
                    <AiAvatar mode={mode} aiApp={aiApp} />
                </div>
            )}
            <div className="py-4 px-2 rounded-lg mb-4 flex items-center gap-2">
                <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                    />
                    <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.4s' }}
                    />
                </div>
            </div>
        </div>
    );
};

interface StreamingMessageProps {
    aiApp?: LaunchPadAppListItem;
}

/**
 * Isolated streaming message bubble. Subscribes only to `streamingMessage` and `isTyping` atoms
 * so committed MessageWithQuestions bubbles never re-render mid-stream.
 */
export const StreamingMessage: React.FC<StreamingMessageProps> = ({ aiApp }) => {
    const msg = useStore(streamingMessage);
    const typing = useStore(isTyping);
    const mode = chatBotStore.useTracked.mode();

    const flags = useFlags();
    const enableChatBubbles = flags.enableChatBubbles;

    if (!msg && !typing) return null;

    // Typing indicator with no content yet — show dots
    if (!msg || !msg.content) {
        return <TypingDots mode={mode} aiApp={aiApp} />;
    }

    // Streaming content — render as assistant bubble
    const bubbleStyles = enableChatBubbles
        ? 'bg-grayscale-100 mr-auto !max-w-full px-4'
        : 'bg-white mr-auto !max-w-full';

    return (
        <AssistantBubble
            content={<MarkdownRenderer>{msg.content}</MarkdownRenderer>}
            bubbleStyles={bubbleStyles}
            mode={mode}
            aiApp={aiApp}
        />
    );
};

export default MessageWithQuestions;
