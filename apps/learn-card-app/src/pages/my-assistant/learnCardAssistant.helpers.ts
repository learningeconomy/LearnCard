import type { LearnCardAssistantCard, LearnCardAssistantCardType } from './learnCardAssistant.api';

const LEARNCARD_ASSISTANT_CARD_TYPE_LABELS: Record<LearnCardAssistantCardType, string> = {
    message: 'Message',
    'job-suggestion': 'Job suggestion',
    'pathway-update': 'Pathway update',
    'action-item': 'Action item',
};

const LEARNCARD_ASSISTANT_CARD_TYPE_CLASSES: Record<LearnCardAssistantCardType, string> = {
    message: 'bg-grayscale-100 border-grayscale-200 text-grayscale-700',
    'job-suggestion': 'bg-emerald-50 border-emerald-100 text-emerald-700',
    'pathway-update': 'bg-amber-50 border-amber-100 text-amber-700',
    'action-item': 'bg-red-50 border-red-100 text-red-700',
};

const newestFirst = (cards: LearnCardAssistantCard[]): LearnCardAssistantCard[] =>
    [...cards].sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt));

export const getLearnCardAssistantCardTypeLabel = (type: LearnCardAssistantCardType): string =>
    LEARNCARD_ASSISTANT_CARD_TYPE_LABELS[type];

export const getLearnCardAssistantCardTypeClasses = (type: LearnCardAssistantCardType): string =>
    LEARNCARD_ASSISTANT_CARD_TYPE_CLASSES[type];

export const getLearnCardAssistantCtaAction = (
    href: string
): { kind: 'internal' | 'external'; href: string } => ({
    kind: href.startsWith('/') ? 'internal' : 'external',
    href,
});

export const isLearnCardAssistantCardNew = (card: LearnCardAssistantCard): boolean => !card.readAt;

export const getInboxCards = (cards: LearnCardAssistantCard[]): LearnCardAssistantCard[] =>
    newestFirst(cards).filter(isLearnCardAssistantCardNew);

export const getActivityCards = (cards: LearnCardAssistantCard[]): LearnCardAssistantCard[] =>
    newestFirst(cards);

export const getLearnCardAssistantRelativeTime = (createdAt: string, now = Date.now()): string => {
    const elapsedMs = Math.max(0, now - Date.parse(createdAt));
    const elapsedMinutes = Math.floor(elapsedMs / 60_000);

    if (elapsedMinutes < 1) return 'Just now';
    if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;

    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours < 24) return `${elapsedHours}h ago`;

    return `${Math.floor(elapsedHours / 24)}d ago`;
};
