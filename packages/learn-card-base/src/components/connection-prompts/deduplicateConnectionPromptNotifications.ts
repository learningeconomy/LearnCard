import { LCNConnectionPromptMetadataValidator } from '@learncard/types';

type ConnectionPromptNotificationCandidate = {
    type: string;
    data?: {
        metadata?: {
            connectionPrompt?: unknown;
        };
    };
};

/**
 * Keeps the first actionable notification for each prompt in the supplied list order.
 * Legacy and malformed notifications are intentionally never deduplicated.
 */
export const deduplicateConnectionPromptNotifications = <
    Notification extends ConnectionPromptNotificationCandidate
>(
    notifications: readonly Notification[]
): Notification[] => {
    const seenPromptIds = new Set<string>();

    return notifications.filter(notification => {
        if (notification.type !== 'BOOST_ACCEPTED') return true;

        const parsedPrompt = LCNConnectionPromptMetadataValidator.safeParse(
            notification.data?.metadata?.connectionPrompt
        );
        if (!parsedPrompt.success) return true;
        if (seenPromptIds.has(parsedPrompt.data.promptId)) return false;

        seenPromptIds.add(parsedPrompt.data.promptId);
        return true;
    });
};
