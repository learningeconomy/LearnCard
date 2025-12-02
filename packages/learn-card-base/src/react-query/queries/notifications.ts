import { useQuery, useQueries, useInfiniteQuery } from '@tanstack/react-query';
import { switchedProfileStore, useWallet, VCClaimModalController } from 'learn-card-base';
import {
    PaginatedNotificationsType,
    PaginatedNotificationsOptionsType,
    NotificationQueryFiltersType,
    NotificationsSortEnum,
} from '../../../../plugins/lca-api-plugin/src/types';

/* Some default options/filters for getNotificationForUser query */

export enum NotificationSortEnum {
    ReverseChrono = 'REVERSE_CHRONOLOGICAL',
    Chronological = 'CHRONOLOGICAL',
}

export const DEFAULT_ACTIVE_OPTIONS = {
    limit: 30,
    sort: NotificationSortEnum.ReverseChrono,
};

export const DEFAULT_ACTIVE_FILTER = {
    archived: false,
};

export const DEFAULT_ARCHIVE_OPTIONS = {
    limit: 30,
    sort: NotificationSortEnum.ReverseChrono,
};
export const DEFAULT_ARCHIVE_FILTER = {
    archived: true,
};

/* fetches notifications for a user, returns an array of notifications */
export const useGetUserNotifications = (
    options: PaginatedNotificationsOptionsType,
    filter?: NotificationQueryFiltersType
) => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();

    return useInfiniteQuery<PaginatedNotificationsType>({
        queryKey: ['useGetUserNotifications', switchedDid ?? '', options, filter],
        queryFn: async () => {
            try {
                const wallet = await initWallet();
                const data = await wallet?.invoke.getNotifications(options, filter);
                return data;
            } catch (error) {
                return Promise.reject(new Error(error));
            }
        },
        getNextPageParam: async (lastPage, pages) => {
            // console.log('///getNextPageParam', lastPage, 'pages', pages);
        },
    });
};

/* Get unread user notifications (up to 30) */
export const useGetUnreadUserNotifications = () => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();

    return useQuery({
        queryKey: ['useGetUnreadUserNotifications', switchedDid ?? ''],
        queryFn: async () => {
            const wallet = await initWallet();
            const options = {
                limit: 30,
                sort: NotificationSortEnum.ReverseChrono,
            };
            const filter = {
                read: false,
            };

            const data = await wallet?.invoke.getNotifications(options, filter);

            if (!data) return undefined;

            return data;
        },
    });
};
