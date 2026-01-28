import { useQuery, useInfiniteQuery, InfiniteData } from '@tanstack/react-query';
import { switchedProfileStore, useWallet } from 'learn-card-base';
import {
    PaginatedNotificationsType,
    PaginatedNotificationsOptionsType,
    NotificationQueryFiltersType,
    NotificationsSortEnum,
} from '../../../../plugins/lca-api-plugin/src/types';
import { PageType } from '../mutations/notifications';

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

    return useInfiniteQuery<
        PageType,
        Error,
        InfiniteData<PageType>,
        readonly unknown[],
        string | undefined
    >({
        queryKey: ['useGetUserNotifications', switchedDid ?? '', options, filter],
        initialPageParam: undefined,
        queryFn: async ({ pageParam }) => {
            try {
                const wallet = await initWallet();
                const data = await wallet?.invoke.getNotifications(
                    {
                        ...options,
                        cursor: pageParam ?? undefined,
                    },
                    filter
                );
                return data;
            } catch (error) {
                console.error('Error fetching notifications:', error);
                return Promise.reject(new Error(error));
            }
        },
        getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.cursor : undefined),
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
