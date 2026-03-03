import { Notifications } from '.';
import { MongoNotificationType } from '@models';
import { SortDirection, Filter } from 'mongodb';
import {
    NotificationQueryFiltersType,
    NotificationQueryInputType,
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

/**
 * Query notifications with flexible filter criteria.
 * Always scopes to the given DID for security.
 */
export const queryNotifications = async (
    did: string,
    queryInput: NotificationQueryInputType,
    options: PaginatedNotificationsOptionsType
): Promise<PaginatedNotificationsType | false> => {
    try {
        // Build MongoDB query, always enforcing the user's DID
        const mongoQuery: Filter<MongoNotificationType> = {
            'to.did': did,
        };

        // Map query input fields to MongoDB query
        if (queryInput.type) mongoQuery.type = queryInput.type;

        if (queryInput['from.did']) mongoQuery['from.did'] = queryInput['from.did'];

        if (queryInput['from.profileId']) mongoQuery['from.profileId'] = queryInput['from.profileId'];

        if (queryInput['data.vcUris']) {
            // Support both single string and array - find notifications containing any of these URIs
            const vcUris = Array.isArray(queryInput['data.vcUris'])
                ? queryInput['data.vcUris']
                : [queryInput['data.vcUris']];
            mongoQuery['data.vcUris'] = { $in: vcUris };
        }

        if (queryInput['data.vpUris']) {
            const vpUris = Array.isArray(queryInput['data.vpUris'])
                ? queryInput['data.vpUris']
                : [queryInput['data.vpUris']];
            mongoQuery['data.vpUris'] = { $in: vpUris };
        }

        if (queryInput.read !== undefined) mongoQuery.read = queryInput.read;

        if (queryInput.archived !== undefined) mongoQuery.archived = queryInput.archived;

        if (queryInput.actionStatus) mongoQuery.actionStatus = queryInput.actionStatus;

        // Sorting
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
            mongoQuery[cursorField] = isCursorDate
                ? { [cursorComparator]: new Date(options.cursor).toISOString() }
                : { [cursorComparator]: options.cursor };
        }

        const notifications = await Notifications.find(mongoQuery, { limit: options.limit + 1 })
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
