import moment from 'moment';
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

export const getTransactionDate = (notification: NotificationType): string =>
    (notification?.data as any)?.transaction?.date ?? notification?.sent;

export const getActionLabel = (notification: NotificationType): string => {
    const body = notification?.message?.body ?? '';
    if (/has synced/i.test(body)) return 'Shared credentials';
    if (/reconsented/i.test(body)) return 'Reconnected';
    if (/consented/i.test(body)) return 'Connected';
    if (/updated their terms/i.test(body)) return 'Updated sharing';
    if (/withdrawn/i.test(body)) return 'Stopped sharing';
    return 'Update';
};

export type ConsentActivityBucket = {
    dateStr: string;
    actions: Record<string, number>;
};

export const bucketNotifications = (notifications: NotificationType[]): ConsentActivityBucket[] => {
    const buckets: Record<string, ConsentActivityBucket> = {};
    const order: string[] = [];

    for (const notification of notifications) {
        const date = moment(getTransactionDate(notification)).format('MMM D, YYYY');
        const action = getActionLabel(notification);

        if (!buckets[date]) {
            buckets[date] = { dateStr: date, actions: {} };
            order.push(date);
        }

        buckets[date].actions[action] = (buckets[date].actions[action] || 0) + 1;
    }

    return order.map(date => buckets[date]);
};

export const formatActionsText = (actions: Record<string, number>): string =>
    Object.entries(actions)
        .map(([action, count]) => (count > 1 ? `${action} ×${count}` : action))
        .join(' · ');

const parseSyncedCredentialCount = (body?: string): number => {
    const match = body?.match(/synced\s+(\d+)\s+credential\(s\)/i);
    return match ? Number(match[1]) : 0;
};

export type ConsentActivityStats = {
    totalUpdates: number;
    totalCredentialsShared: number;
    firstDate: string;
    lastDate: string;
    actionCounts: Record<string, number>;
};

export const getConsentActivityStats = (
    notifications: NotificationType[]
): ConsentActivityStats => {
    const actionCounts: Record<string, number> = {};
    let totalCredentialsShared = 0;
    let earliest = Number.POSITIVE_INFINITY;
    let latest = Number.NEGATIVE_INFINITY;

    for (const notification of notifications) {
        const action = getActionLabel(notification);
        actionCounts[action] = (actionCounts[action] || 0) + 1;
        totalCredentialsShared += parseSyncedCredentialCount(notification?.message?.body);

        const time = moment(getTransactionDate(notification)).valueOf();
        if (Number.isFinite(time)) {
            earliest = Math.min(earliest, time);
            latest = Math.max(latest, time);
        }
    }

    return {
        totalUpdates: notifications.length,
        totalCredentialsShared,
        firstDate: Number.isFinite(earliest) ? moment(earliest).format('MMM D, YYYY') : '',
        lastDate: Number.isFinite(latest) ? moment(latest).format('MMM D, YYYY') : '',
        actionCounts,
    };
};
