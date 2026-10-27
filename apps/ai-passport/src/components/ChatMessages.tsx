import { useStore } from '@nanostores/react';
import { messages, isTyping } from '../stores/chatStore';
import { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '@learncard/types';
import MarkdownRenderer from './MarkdownRenderer';
import TypingIndicator from './TypingIndicator';

const ChatMessages: React.FC<{ initialMessages: ChatMessage[] }> = ({ initialMessages = [] }) => {
    const [showInitialMessages, setShowInitialMessages] = useState(true);
    const $messages = useStore(messages);
    const $isTyping = useStore(isTyping);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [$messages]);

    useEffect(() => {
        if (initialMessages?.length > 0) messages.set(initialMessages);
        setShowInitialMessages(false);
    }, [initialMessages]);

    const messagesToShow = (showInitialMessages ? initialMessages : $messages) ?? [];

    return (
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messagesToShow.map((msg, i) => (
                <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                            msg.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-800 text-gray-100'
                        }`}
                    >
                        <div className="mb-1 text-xs opacity-70 capitalize">{msg.role}</div>
                        <div className="prose max-w-none">
                            <MarkdownRenderer>{msg.content}</MarkdownRenderer>
                        </div>
                    </div>
                </div>
            ))}
            {$isTyping && (
                <div className="flex justify-start">
                    <div className="bg-gray-800 rounded-lg p-4 text-gray-400">
                        <TypingIndicator />
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default ChatMessages;
