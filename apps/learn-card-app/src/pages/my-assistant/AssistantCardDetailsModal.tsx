import React from 'react';
import { IonIcon } from '@ionic/react';
import {
    briefcaseOutline,
    chatbubbleEllipsesOutline,
    closeOutline,
    gitNetworkOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

import type { LearnCardAssistantCard, LearnCardAssistantCardType } from './learnCardAssistant.api';
import {
    getLearnCardAssistantCardTypeClasses,
    getLearnCardAssistantCardTypeLabel,
    getLearnCardAssistantCtaAction,
    getLearnCardAssistantRelativeTime,
} from './learnCardAssistant.helpers';

const ACTION_COPY: Record<
    LearnCardAssistantCardType,
    { label: string; description: string; icon: string }
> = {
    message: {
        label: 'Reply to message',
        description: 'Ask a follow-up or get help turning this into next steps.',
        icon: chatbubbleEllipsesOutline,
    },
    'job-suggestion': {
        label: 'Explore job match',
        description: 'Ask why this role matched your profile and what to do next.',
        icon: briefcaseOutline,
    },
    'pathway-update': {
        label: 'View pathway update',
        description: 'Review what changed and what progress unlocked this update.',
        icon: gitNetworkOutline,
    },
    'action-item': {
        label: 'Review action item',
        description: 'Decide whether this task is useful right now.',
        icon: chatbubbleEllipsesOutline,
    },
};

export const AssistantCardDetailsModal: React.FC<{
    card?: LearnCardAssistantCard;
    open: boolean;
    onClose: () => void;
    onOpenChat: (prompt: string) => void;
}> = ({ card, open, onClose, onOpenChat }) => {
    const history = useHistory();

    if (!open || !card) return null;

    const action = ACTION_COPY[card.type];

    const openCta = (): void => {
        if (!card.cta) return;
        if (card.cta.href === '/chats' || card.cta.href === '#assistant-chat') {
            onClose();
            onOpenChat(chatPrompt);
            return;
        }

        const ctaAction = getLearnCardAssistantCtaAction(card.cta.href);
        if (ctaAction.kind === 'internal') {
            history.push(ctaAction.href);
            onClose();
            return;
        }

        window.open(ctaAction.href, '_blank', 'noopener,noreferrer');
    };

    const chatPrompt = [
        `Help me with this ${getLearnCardAssistantCardTypeLabel(card.type).toLowerCase()} card.`,
        `Title: ${card.title}`,
        `Description: ${card.description}`,
        card.detail ? `Details: ${card.detail}` : undefined,
    ]
        .filter(Boolean)
        .join('\n');

    return (
        <div className="fixed inset-0 z-[1000] bg-grayscale-900/50 flex items-center justify-center p-4 font-poppins">
            <section className="w-full max-w-[680px] max-h-[88vh] overflow-hidden bg-white rounded-[20px] shadow-2xl flex flex-col animate-fade-in-up">
                <div className="p-5 border-b border-grayscale-200 flex items-start justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-[6px] border text-xs font-semibold tracking-wide uppercase ${getLearnCardAssistantCardTypeClasses(
                                    card.type
                                )}`}
                            >
                                {getLearnCardAssistantCardTypeLabel(card.type)}
                            </span>
                            <span className="text-xs text-grayscale-400">
                                {getLearnCardAssistantRelativeTime(card.createdAt)}
                            </span>
                        </div>

                        <h2 className="text-xl font-semibold text-grayscale-900">{card.title}</h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-full text-grayscale-500 hover:text-grayscale-900 hover:bg-grayscale-10 transition-colors"
                        aria-label="Close assistant card details"
                    >
                        <IonIcon icon={closeOutline} className="text-xl" />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto space-y-5">
                    <section className="space-y-2">
                        <h3 className="text-xs font-medium text-grayscale-700 uppercase tracking-wide">
                            What happened
                        </h3>
                        <p className="text-sm text-grayscale-700 leading-relaxed">
                            {card.description}
                        </p>
                        <div className="rounded-2xl border border-grayscale-200 bg-grayscale-10 p-4">
                            <p className="text-sm text-grayscale-700 leading-relaxed whitespace-pre-wrap">
                                {card.detail ||
                                    'This card was created by your assistant after reviewing your profile, approved memories, and recent context.'}
                            </p>
                        </div>
                    </section>

                    <section className="space-y-2">
                        <h3 className="text-xs font-medium text-grayscale-700 uppercase tracking-wide">
                            Why this appeared
                        </h3>
                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            Your assistant posts cards when it finds a useful check-in, job match,
                            pathway change, or decision that may help your next step.
                        </p>
                        {card.sourceRunId && (
                            <p className="text-xs text-grayscale-400">
                                Source run: {card.sourceRunId}
                            </p>
                        )}
                    </section>

                    <section className="rounded-[20px] border border-grayscale-200 p-4 space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-grayscale-100 text-grayscale-700 flex items-center justify-center shrink-0">
                                <IonIcon icon={action.icon} className="text-xl" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-grayscale-900">
                                    {action.label}
                                </h3>
                                <p className="text-sm text-grayscale-600 leading-relaxed">
                                    {action.description}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onOpenChat(chatPrompt);
                                }}
                                className="py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                            >
                                Open chat
                            </button>

                            {card.cta && (
                                <button
                                    type="button"
                                    onClick={openCta}
                                    className="py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                                >
                                    {card.cta.label}
                                </button>
                            )}
                        </div>
                    </section>
                </div>
            </section>
        </div>
    );
};

export default AssistantCardDetailsModal;
