import { NotificationType } from 'packages/plugins/lca-api-plugin/src/types';
import { NOTIFICATION_TYPES } from './NotificationCardContainer';

// AI Insights consent notifications carry metadata.type and stay actionable
// (View Request / Accept via AiInsightsNotification), so they are not grouped.
export const isGroupableConsentFlowNotification = (notification: NotificationType): boolean =>
    notification?.type === NOTIFICATION_TYPES.CONSENT_FLOW_TRANSACTION &&
    !(notification?.data as any)?.metadata?.type;

// The backend sends no structured contractUri for sync transactions, so the
// contract name must be parsed from the trailing "... to <Contract>!" of the body.
export const parseContractName = (body?: string): string => {
    if (!body) return '';
    const match = body.match(/\bto\s+([^!]+?)!?\s*$/i);
    return match?.[1]?.trim() ?? '';
};

export const getConsentFlowGroupKey = (notification: NotificationType): string => {
    const actorId = notification?.from?.profileId ?? notification?.from?.did ?? 'unknown';
    const contractName = parseContractName(notification?.message?.body).toLowerCase();
    return `${actorId}::${contractName}`;
};

export type NotificationListItem =
    | { kind: 'single'; notification: NotificationType }
    | { kind: 'consentGroup'; key: string; notifications: NotificationType[] };

/**
 * Flatten paginated notifications (already reverse-chronological) into a render
 * list, collapsing groupable consent-flow receipts by actor + contract. A group
 * is positioned at the slot of its most-recent member; other notifications keep
 * their original order.
 */
export const buildNotificationListItems = (
    notifications: NotificationType[]
): NotificationListItem[] => {
    const items: NotificationListItem[] = [];
    const groupIndexByKey = new Map<string, number>();

    for (const notification of notifications) {
        if (!notification) continue;

        if (isGroupableConsentFlowNotification(notification)) {
            const key = getConsentFlowGroupKey(notification);
            const existingIndex = groupIndexByKey.get(key);

            if (existingIndex !== undefined) {
                const group = items[existingIndex];
                if (group.kind === 'consentGroup') group.notifications.push(notification);
                continue;
            }

            groupIndexByKey.set(key, items.length);
            items.push({ kind: 'consentGroup', key, notifications: [notification] });
        } else {
            items.push({ kind: 'single', notification });
        }
    }

    return items;
};
