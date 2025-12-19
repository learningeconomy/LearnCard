import { Notifications } from '.';
import { MongoNotificationType } from '@models';
import { SortDirection } from 'mongodb';
import {
    NotificationQueryFiltersType,
    PaginatedNotificationsOptionsType,
    PaginatedNotificationsType,
    NotificationsSortEnumValidator,
} from 'types/notifications';

export const getNotificationById = async (
    _id: string
): Promise<MongoNotificationType | null | false> => {
    try {
        return Notifications.findOne({ _id });
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const getPaginatedNotificationsForDid = async (
    did: string,
    options: PaginatedNotificationsOptionsType,
    filters: NotificationQueryFiltersType = {}
): Promise<PaginatedNotificationsType | false> => {
    try {
        let query = { ...filters, ...{ 'to.did': did } };

        let sortingMethod = {} as { sent: SortDirection; _id: SortDirection };

        let cursorField = 'sent';
        let cursorComparator = '$lt';
        let isCursorDate = true;
        switch (options.sort) {
            case NotificationsSortEnumValidator.enum.CHRONOLOGICAL:
                sortingMethod = { sent: 1, _id: 1 };
                cursorComparator = '$gte';
                cursorField = 'sent';
                isCursorDate = true;
                break;
            case NotificationsSortEnumValidator.enum.REVERSE_CHRONOLOGICAL:
            default:
                sortingMethod = { sent: -1, _id: 1 };
                cursorComparator = '$lte';
                cursorField = 'sent';
                isCursorDate = true;
                break;
        }
        if (options.cursor) {
            query = {
                ...query,
                [cursorField]: isCursorDate
                    ? { [cursorComparator]: new Date(options.cursor).toISOString() }
                    : { [cursorComparator]: options.cursor },
            };
        }
        const notifications = await Notifications.find(query, { limit: options.limit + 1 })
            .sort(sortingMethod)
            .toArray();
        if (!Array.isArray(notifications)) return false;
        const cursor = notifications.slice(-1)[0]?.sent;
        const hasMore = notifications.length > options.limit;
        return {
            notifications: hasMore
                ? notifications.slice(0, notifications.length - 1)
                : notifications,
            cursor,
            hasMore,
        };
    } catch (e) {
        console.error(e);
        return false;
    }
};
