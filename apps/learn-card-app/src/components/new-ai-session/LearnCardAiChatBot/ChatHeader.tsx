import React from 'react';
import { useStore } from '@nanostores/react';

import { LaunchPadAppListItem, useModal } from 'learn-card-base';
import { AiInsightsIconWithShape } from 'learn-card-base/svgs/wallet/AiInsightsIcon';
import { AiSessionsIconWithShape } from 'learn-card-base/svgs/wallet/AiSessionsIcon';

import {
    currentThreadId,
    threads,
    messages,
} from 'learn-card-base/stores/nanoStores/chatStore';

import X from '../../svgs/X';
import { AiSessionMode } from '../newAiSession.helpers';

interface ChatHeaderProps {
    mode: AiSessionMode;
    aiApp?: LaunchPadAppListItem;
    initialTopic?: string;
    onClose?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
    mode,
    aiApp,
    initialTopic,
    onClose,
}) => {
    const { closeModal } = useModal();
    const $currentThreadId = useStore(currentThreadId);
    const $threads = useStore(threads);
    const $messages = useStore(messages);

    const currentThread = $threads.find(t => t.id === $currentThreadId);
    const isInsights = mode === AiSessionMode.insights;

    // Sessions → topic title; Insights → first user question
    const title = isInsights
        ? $messages.find(m => m.role === 'user')?.content ?? initialTopic ?? ''
        : currentThread?.title ?? initialTopic ?? '';

    if (!title) return null;

    const handleClose = onClose ?? closeModal;

    return (
        <div className="sticky top-0 z-10 bg-white flex items-start gap-3 px-4 py-3 border-b-[1px] border-grayscale-100 pt-[calc(12px+env(safe-area-inset-top))] sm:pt-3">
            <div className="flex-shrink-0 mt-[2px]">
                {isInsights ? (
                    <AiInsightsIconWithShape className="h-[28px] w-[28px] text-grayscale-900" />
                ) : aiApp?.img ? (
                    <img
                        src={aiApp.img}
                        alt={`${aiApp.name ?? 'AI'} logo`}
                        className="h-[28px] w-[28px] rounded-full object-cover bg-white border-[1px] border-solid border-grayscale-200"
                    />
                ) : (
                    <AiSessionsIconWithShape className="h-[28px] w-[28px] text-grayscale-900" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <h2 className="text-[17px] font-poppins font-[600] text-grayscale-900 leading-tight line-clamp-2 m-0">
                    {title}
                </h2>
                {!isInsights && currentThread && (
                    <p className="text-[13px] font-poppins text-grayscale-600 mt-[2px] leading-tight">
                        Close to End Session
                    </p>
                )}
            </div>
            <button
                type="button"
                onClick={handleClose}
                className="flex-shrink-0 p-1 -mr-1"
                aria-label="Close"
            >
                <X className="text-grayscale-800 w-[20px] h-auto" strokeWidth="3" />
            </button>
        </div>
    );
};

export default ChatHeader;
