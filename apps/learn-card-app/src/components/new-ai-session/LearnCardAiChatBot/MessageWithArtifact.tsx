import React from 'react';

import MarkdownRenderer from '../../ai-assessment/AiAssessment/helpers/MarkdownRenderer';

import type { ChatMessage } from 'learn-card-base/types/ai-chat';

interface MessageProps {
    message: ChatMessage;
}

export const MessageWithArtifact: React.FC<MessageProps> = ({ message }) => {
    return (
        <>
            <MarkdownRenderer>{message?.artifact?.question}</MarkdownRenderer>
            <button className="w-full bg-indigo-500 text-white px-4 py-2 font-semibold rounded-full">
                Yes
            </button>
        </>
    );
};

export default MessageWithArtifact;
