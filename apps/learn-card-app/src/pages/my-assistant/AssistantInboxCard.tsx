import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
    briefcaseOutline,
    checkmarkCircleOutline,
    gitNetworkOutline,
    informationCircleOutline,
    thumbsDownOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

import type { LearnCardAssistantCard, LearnCardAssistantCardType } from './learnCardAssistant.api';
import type { AssistantAvatarConfig } from './assistantAvatarOptions';
import {
    getLearnCardAssistantCardTypeClasses,
    getLearnCardAssistantCardTypeLabel,
    getLearnCardAssistantCtaAction,
    getLearnCardAssistantRelativeTime,
    isLearnCardAssistantCardNew,
} from './learnCardAssistant.helpers';

import AssistantAvatar from './AssistantAvatar';
const ICON_BY_TYPE: Record<Exclude<LearnCardAssistantCardType, 'message'>, string> = {
    'job-suggestion': briefcaseOutline,
    'pathway-update': gitNetworkOutline,
    'action-item': checkmarkCircleOutline,
};

const COLOR_BY_TYPE: Record<LearnCardAssistantCardType, string> = {
    message: 'text-grayscale-700 bg-grayscale-100',
    'job-suggestion': 'text-emerald-700 bg-emerald-50',
    'pathway-update': 'text-grayscale-700 bg-grayscale-100',
    'action-item': 'text-red-700 bg-red-50',
};

export const AssistantInboxCard: React.FC<{
    avatarConfig: AssistantAvatarConfig;
    card: LearnCardAssistantCard;
    onMarkRead: (id: string) => Promise<void>;
    onFeedback: (id: string) => Promise<void>;
    onOpenDetails: (card: LearnCardAssistantCard) => void;
    onOpenChat: (prompt?: string) => void;
}> = ({ avatarConfig, card, onMarkRead, onFeedback, onOpenDetails, onOpenChat }) => {
    const history = useHistory();
    const isNew = isLearnCardAssistantCardNew(card);
    const [isMarkingRead, setIsMarkingRead] = useState(false);
    const [feedbackNoted, setFeedbackNoted] = useState(card.feedback?.type === 'thumbs-down');
    const [isSendingFeedback, setIsSendingFeedback] = useState(false);

    const markRead = async (): Promise<void> => {
        if (!isNew || isMarkingRead) return;

        setIsMarkingRead(true);

        try {
            await onMarkRead(card.id);
        } finally {
            setIsMarkingRead(false);
        }
    };

    const openCta = async (): Promise<void> => {
        if (!card.cta) return;

        await markRead();

        if (card.cta.href === '/chats' || card.cta.href === '#assistant-chat') {
            onOpenChat(
                `Help me with this assistant card.\nTitle: ${card.title}\nDescription: ${card.description}`
            );
            return;
        }

        const action = getLearnCardAssistantCtaAction(card.cta.href);
        if (action.kind === 'internal') {
            history.push(action.href);
            return;
        }

        window.open(action.href, '_blank', 'noopener,noreferrer');
    };

    const sendFeedback = async (): Promise<void> => {
        if (feedbackNoted || isSendingFeedback) return;

        setIsSendingFeedback(true);

        try {
            await onFeedback(card.id);
            setFeedbackNoted(true);
        } finally {
            setIsSendingFeedback(false);
        }
    };

    return (
        <article
            className={`bg-white border rounded-[20px] px-6 py-5 text-left shadow-bottom-2-4 ${
                isNew ? 'border-emerald-300 ring-1 ring-emerald-100' : 'border-grayscale-200'
            }`}
        >
            <div className="grid grid-cols-[76px_1fr] gap-4">
                <div className="pt-1">
                    {card.type === 'message' ? (
                        <AssistantAvatar config={avatarConfig} size="sm" />
                    ) : (
                        <div
                            className={`w-[70px] h-[70px] rounded-full flex items-center justify-center ${
                                COLOR_BY_TYPE[card.type]
                            }`}
                        >
                            <IonIcon icon={ICON_BY_TYPE[card.type]} className="text-4xl" />
                        </div>
                    )}
                </div>

                <div className="min-w-0 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                            <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-[6px] border text-xs font-semibold tracking-wide uppercase ${getLearnCardAssistantCardTypeClasses(
                                    card.type
                                )}`}
                            >
                                {getLearnCardAssistantCardTypeLabel(card.type)}
                            </span>

                            {isNew && (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold">
                                    New
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <h3 className="text-base font-semibold text-grayscale-900">{card.title}</h3>

                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            {card.description}
                        </p>

                        {card.detail && (
                            <p className="text-xs text-grayscale-500 leading-relaxed line-clamp-3">
                                {card.detail}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-2 text-xs text-grayscale-500 mr-auto">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            {getLearnCardAssistantRelativeTime(card.createdAt)}
                        </span>

                        <button
                            type="button"
                            onClick={() => onOpenDetails(card)}
                            disabled={isMarkingRead}
                            className="inline-flex items-center justify-center gap-1.5 py-2.5 px-5 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <IonIcon icon={informationCircleOutline} className="text-base" />
                            {isMarkingRead ? 'Loading...' : 'Details'}
                        </button>

                        {card.cta && (
                            <button
                                type="button"
                                onClick={() => void openCta()}
                                disabled={isMarkingRead}
                                className="py-2.5 px-5 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {card.cta.label}
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => void sendFeedback()}
                            disabled={feedbackNoted || isSendingFeedback}
                            className="inline-flex items-center justify-center w-[52px] h-[42px] rounded-[20px] border border-grayscale-300 text-grayscale-600 hover:bg-grayscale-10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label={feedbackNoted ? 'Feedback noted' : 'Mark not useful'}
                        >
                            <IonIcon icon={thumbsDownOutline} className="text-xl" />
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
};

export default AssistantInboxCard;
