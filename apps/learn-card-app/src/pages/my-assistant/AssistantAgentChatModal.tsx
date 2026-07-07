import React, { useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { closeOutline, sendOutline } from 'ionicons/icons';

import AssistantAvatar from './AssistantAvatar';
import {
    runLearnCardAssistantAgent,
    type LearnCardAssistantAgentMessage,
    type LearnCardAssistantAuth,
} from './learnCardAssistant.api';
import type { AssistantAvatarConfig } from './assistantAvatarOptions';

export const AssistantAgentChatModal: React.FC<{
    agentUrl: string;
    avatarConfig: AssistantAvatarConfig;
    auth?: LearnCardAssistantAuth;
    consentFlowContractUri?: string;
    initialPrompt?: string;
    open: boolean;
    title: string;
    onClose: () => void;
}> = ({
    agentUrl,
    avatarConfig,
    auth,
    consentFlowContractUri,
    initialPrompt,
    open,
    title,
    onClose,
}) => {
    const [messages, setMessages] = useState<LearnCardAssistantAgentMessage[]>([]);
    const [input, setInput] = useState('');
    const [error, setError] = useState('');
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!open) return;

        setMessages([]);
        setInput(initialPrompt ?? '');
        setError('');
    }, [initialPrompt, open]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);

    if (!open) return null;

    const sendMessage = async (): Promise<void> => {
        const content = input.trim();
        if (!content || !auth || isSending) return;

        const nextMessages = [...messages, { role: 'user' as const, content }];

        setMessages(nextMessages);
        setInput('');
        setError('');
        setIsSending(true);

        try {
            const response = await runLearnCardAssistantAgent(
                agentUrl,
                auth,
                nextMessages,
                consentFlowContractUri
            );

            setMessages(response.messages);
        } catch (sendError) {
            setMessages(messages);
            setError(
                sendError instanceof Error ? sendError.message : 'The assistant did not respond.'
            );
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] bg-grayscale-900/50 flex items-center justify-center p-4 font-poppins">
            <section className="w-full max-w-[720px] h-[78vh] bg-white rounded-[20px] shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
                <div className="p-5 border-b border-grayscale-200 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <AssistantAvatar config={avatarConfig} size="sm" />

                        <div>
                            <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                                {title}
                            </h2>
                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                Chat with your LearnCard Assistant.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-full text-grayscale-500 hover:text-grayscale-900 hover:bg-grayscale-10 transition-colors"
                        aria-label="Close assistant chat"
                    >
                        <IonIcon icon={closeOutline} className="text-xl" />
                    </button>
                </div>

                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-5 space-y-3 bg-grayscale-10"
                >
                    {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-center px-6">
                            <div>
                                <p className="text-base font-semibold text-grayscale-900 mb-1">
                                    Ask about your next step.
                                </p>
                                <p className="text-sm text-grayscale-600 leading-relaxed">
                                    Your assistant can explain cards, compare options, and help you
                                    decide.
                                </p>
                            </div>
                        </div>
                    ) : (
                        messages.map((message, index) => (
                            <div
                                key={`${message.role}-${index}`}
                                className={`flex ${
                                    message.role === 'user' ? 'justify-end' : 'justify-start'
                                }`}
                            >
                                <div
                                    className={`max-w-[82%] rounded-[20px] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                                        message.role === 'user'
                                            ? 'bg-grayscale-900 text-white'
                                            : 'bg-white border border-grayscale-200 text-grayscale-700'
                                    }`}
                                >
                                    {message.content}
                                </div>
                            </div>
                        ))
                    )}

                    {isSending && (
                        <div className="text-xs text-grayscale-500">Assistant is thinking...</div>
                    )}
                </div>

                {error && (
                    <div className="px-5 pt-4">
                        <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700 leading-relaxed">
                            {error}
                        </div>
                    </div>
                )}

                <div className="p-5 border-t border-grayscale-200 bg-white">
                    <div className="flex items-end gap-3">
                        <textarea
                            value={input}
                            onChange={event => setInput(event.target.value)}
                            onKeyDown={event => {
                                if (event.key === 'Enter' && !event.shiftKey) {
                                    event.preventDefault();
                                    void sendMessage();
                                }
                            }}
                            placeholder={
                                auth
                                    ? 'Message your assistant...'
                                    : 'Sign in with a network profile to chat.'
                            }
                            rows={2}
                            disabled={!auth || isSending}
                            className="flex-1 py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white resize-none disabled:opacity-50"
                        />

                        <button
                            type="button"
                            onClick={() => void sendMessage()}
                            disabled={!auth || !input.trim() || isSending}
                            className="py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Send message"
                        >
                            <IonIcon icon={sendOutline} className="text-lg" />
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AssistantAgentChatModal;
