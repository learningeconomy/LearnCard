import React from 'react';

import MarkdownRenderer from '../../ai-assessment/AiAssessment/helpers/LazyMarkdownRenderer';

import type { ChatMessage } from 'learn-card-base/types/ai-chat';

interface MessageProps {
    message: ChatMessage;
}

export const MessageWithQuestions: React.FC<MessageProps> = React.memo(
    function MessageWithQuestions({ message }) {
        return (
            <div className="w-full flex items-center justify-end">
                <div
                    className={`py-4 ${
                        message.role === 'assistant'
                            ? 'bg-white mr-auto !max-w-full'
                            : 'bg-grayscale-100 px-4'
                    } rounded-3xl mb-4 text-grayscale-900 flex-shrink min-w-0 prose prose-h1:mb-2 prose-p:mt-0 prose-li:my-0 prose-li:leading-6 prose-pre:bg-transparent prose-pre:p-0 prose-code:shadow prose-code:rounded prose-code:py-2!`}
                >
                    <MarkdownRenderer>{message.content}</MarkdownRenderer>
                </div>
            </div>
        );
    },
    (oldProps, newProps) =>
        oldProps.message.role === newProps.message.role &&
        oldProps.message.content === newProps.message.content
);

export default MessageWithQuestions;
