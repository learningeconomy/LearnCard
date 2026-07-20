import type {
    LearnCardAssistantCard,
    LearnCardAssistantCardType,
    LearnCardAssistantDayOfWeek,
} from './learnCardAssistant.api';

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

export const LEARNCARD_ASSISTANT_DAY_LABELS: Record<
    LearnCardAssistantDayOfWeek,
    { short: string; long: string }
> = {
    0: { short: 'Sun', long: 'Sunday' },
    1: { short: 'Mon', long: 'Monday' },
    2: { short: 'Tue', long: 'Tuesday' },
    3: { short: 'Wed', long: 'Wednesday' },
    4: { short: 'Thu', long: 'Thursday' },
    5: { short: 'Fri', long: 'Friday' },
    6: { short: 'Sat', long: 'Saturday' },
};

export const LEARNCARD_ASSISTANT_DAYS: LearnCardAssistantDayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];

export const getLearnCardAssistantDaysSummary = (
    daysOfWeek: LearnCardAssistantDayOfWeek[]
): string => {
    const days = [...new Set(daysOfWeek)].sort((a, b) => a - b);
    const key = days.join(',');

    if (key === '0,1,2,3,4,5,6') return 'Every day';
    if (key === '1,2,3,4,5') return 'Weekdays';
    if (key === '0,6') return 'Weekends';

    return days.map(day => LEARNCARD_ASSISTANT_DAY_LABELS[day].short).join(', ');
};

export const getLearnCardAssistantBrowserTimezone = (): string =>
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export const getLearnCardAssistantTimezoneOptions = (
    browserTimezone = getLearnCardAssistantBrowserTimezone(),
    supportedValuesOf: ((key: 'timeZone') => string[]) | null | undefined = (
        Intl as typeof Intl & {
            supportedValuesOf?: (key: 'timeZone') => string[];
        }
    ).supportedValuesOf
): string[] => {
    const supportedTimezones = supportedValuesOf?.call(Intl, 'timeZone');
    if (!supportedTimezones?.length) return [browserTimezone];

    return supportedTimezones.includes(browserTimezone)
        ? supportedTimezones
        : [browserTimezone, ...supportedTimezones];
};

export const formatLearnCardAssistantNextRun = (nextRunAt: string, timezone?: string): string => {
    const nextRun = new Date(nextRunAt);
    if (Number.isNaN(nextRun.getTime())) return 'Next run unavailable';

    return `Next run ${new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        ...(timezone ? { timeZone: timezone } : {}),
    }).format(nextRun)}`;
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
