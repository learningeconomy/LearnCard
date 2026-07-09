import { useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { switchedProfileStore, useWallet, walletStore } from 'learn-card-base';
import {
    DEFAULT_ACTIVE_OPTIONS,
    DEFAULT_ACTIVE_FILTER,
    DEFAULT_ARCHIVE_OPTIONS,
    DEFAULT_ARCHIVE_FILTER,
} from 'learn-card-base';
import { getLogger } from '../../logging/logger';
const log = getLogger('notifications');

/* Toggle a notification between "archived" state */

type NotificationMeta = {
    archived?: boolean;
    read?: boolean;
};

type UpdateNotificationVariables = {
    notificationId: string;
    payload: NotificationMeta;
};

type NotificationType = {
    _id: string;
    read: boolean;
    archived: boolean;
    sent: string;
    type: string;
    actionStatus?: string;
    [key: string]: any;
};

export type PageType = {
    hasMore: boolean;
    notifications: NotificationType[];
    cursor?: string;
};

type PaginatedNotificationsType = InfiniteData<PageType>;

export const useMarkAllNotificationsRead = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    return useMutation<boolean>({
        mutationFn: async () => {
            try {
                const wallet = await initWallet();
                const markAllRead = await wallet?.invoke?.markAllNotificationsRead();
                return markAllRead;
            } catch (e) {
                return false;
            }
        },
        onSuccess: async res => {
            try {
                // Read the switched DID non-reactively — this callback runs
                // outside a React render, so the `.use.*()` hook accessor would
                // throw here and abort the invalidation below (the alerts-island
                // unread-count then never refetches). Use `.get` in callbacks.
                const switchedDid = switchedProfileStore.get.switchedDid();

                // invalidate queries with consistent keys
                queryClient.invalidateQueries({
                    queryKey: ['useGetUserNotifications', switchedDid ?? ''],
                });
                queryClient.invalidateQueries({
                    queryKey: ['useGetUnreadUserNotifications', switchedDid ?? ''],
                });
                queryClient.refetchQueries({
                    queryKey: ['useGetUnreadUserNotifications', switchedDid ?? ''],
                });
            } catch (e) {
                log.warn('error:OnSuccess:useMarkAllNotificationsRead', e);
                return false;
            }
        },
    });
};

/* Todo, probably make separate simpler mutations that wrap same update notification call */
export const useUpdateNotification = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();
    const switchedDid = switchedProfileStore.use.switchedDid();

    return useMutation<boolean, Error, UpdateNotificationVariables>({
        mutationFn: async ({ notificationId, payload }) => {
            try {
                const wallet = await initWallet();
                const res = await wallet?.invoke?.updateNotificationMeta(notificationId, payload);
                return res;
            } catch (error) {
                return Promise.reject(
                    new Error(error instanceof Error ? error.message : String(error))
                );
            }
        },
        onMutate: async (updatedNotification: UpdateNotificationVariables) => {
            const cacheDid = switchedDid ?? '';

            // `archived` is a tri-state here: `true` = archive, `false` =
            // unarchive, `undefined` = a metadata-only update (e.g. marking
            // read). Distinguish them explicitly so the read branch below is
            // actually reachable — previously `else if (!isArchiving)` caught
            // every non-archive update and the read branch was dead code.
            const isArchiving = updatedNotification?.payload?.archived === true;
            const isUnarchiving = updatedNotification?.payload?.archived === false;
            const isReadUpdate = Boolean(updatedNotification?.payload?.read);

            // 1. Define both query keys
            const activeQueryKey = [
                'useGetUserNotifications',
                cacheDid,
                DEFAULT_ACTIVE_OPTIONS,
                DEFAULT_ACTIVE_FILTER,
            ];

            const archiveQueryKey = [
                'useGetUserNotifications',
                cacheDid,
                DEFAULT_ARCHIVE_OPTIONS,
                DEFAULT_ARCHIVE_FILTER,
            ];

            // The header "alerts island" badge reads from this separate query.
            const unreadQueryKey = ['useGetUnreadUserNotifications', cacheDid];

            // 2. Cancel any outgoing refetches for the caches we're about to
            // touch so they don't overwrite the optimistic update.
            await queryClient.cancelQueries({
                queryKey: isArchiving ? activeQueryKey : archiveQueryKey,
            });
            if (isReadUpdate) {
                await queryClient.cancelQueries({ queryKey: unreadQueryKey });
            }

            // 3. Get the current data for the active tab
            const currentTabData = queryClient.getQueryData<InfiniteData<PageType>>(activeQueryKey);
            const currentArchiveData =
                queryClient.getQueryData<InfiniteData<PageType>>(archiveQueryKey);
            const notificationToArchive = currentTabData?.pages
                ?.flatMap(page => page.notifications)
                ?.find(notification => notification?._id === updatedNotification.notificationId);
            const notificationToUnarchive = currentArchiveData?.pages
                ?.flatMap(page => page.notifications)
                ?.find(notification => notification?._id === updatedNotification.notificationId);
            if (isArchiving) {
                // Remove from active
                if (currentTabData?.pages?.[0]?.notifications) {
                    const updatedPages = currentTabData.pages.map((page: PageType) => ({
                        ...page,
                        notifications: page.notifications.filter(
                            (n: NotificationType) => n?._id !== updatedNotification.notificationId
                        ),
                    }));

                    queryClient.setQueryData<PaginatedNotificationsType>(activeQueryKey, {
                        ...currentTabData,
                        pages: updatedPages,
                    });
                }

                // Add to archive
                const archiveData =
                    queryClient.getQueryData<PaginatedNotificationsType>(archiveQueryKey);
                if (archiveData?.pages?.[0]?.notifications && notificationToArchive) {
                    const updatedArchivePages = archiveData.pages.map((page: PageType, i: number) =>
                        i === 0
                            ? {
                                  ...page,
                                  notifications: [
                                      {
                                          ...notificationToArchive,
                                          archived: true,
                                          read: true,
                                      },
                                      ...page.notifications,
                                  ],
                              }
                            : page
                    );

                    queryClient.setQueryData<PaginatedNotificationsType>(archiveQueryKey, {
                        ...archiveData,
                        pages: updatedArchivePages,
                    });
                } else if (notificationToArchive) {
                    queryClient.setQueryData<PaginatedNotificationsType>(archiveQueryKey, {
                        pages: [
                            {
                                hasMore: false,
                                notifications: [
                                    {
                                        ...notificationToArchive,
                                        archived: true,
                                        read: true,
                                    },
                                ],
                            },
                        ],
                        pageParams: [undefined],
                    });
                }
            } else if (isUnarchiving) {
                // Remove from archive cache
                const archiveData =
                    queryClient.getQueryData<PaginatedNotificationsType>(archiveQueryKey);
                if (currentArchiveData?.pages?.[0]?.notifications) {
                    const updatedArchivePages = currentArchiveData.pages.map((page: PageType) => ({
                        ...page,
                        notifications: page.notifications.filter(
                            (n: NotificationType) => n?._id !== updatedNotification.notificationId
                        ),
                    }));

                    queryClient.setQueryData<PaginatedNotificationsType>(archiveQueryKey, {
                        ...currentArchiveData,
                        pages: updatedArchivePages,
                    });
                }

                // Add back to active cache
                const activeData =
                    queryClient.getQueryData<PaginatedNotificationsType>(activeQueryKey);
                if (activeData?.pages?.[0]?.notifications && notificationToUnarchive) {
                    const updatedActivePages = activeData.pages.map((page: PageType, i: number) =>
                        i === 0
                            ? {
                                  ...page,
                                  notifications: [
                                      {
                                          ...notificationToUnarchive,
                                          archived: false,
                                          read: true,
                                      },
                                      ...page.notifications,
                                  ],
                              }
                            : page
                    );

                    queryClient.setQueryData<PaginatedNotificationsType>(activeQueryKey, {
                        ...activeData,
                        pages: updatedActivePages,
                    });
                }
            } else if (isReadUpdate) {
                // Handle marking as read: flip `read` on the item in the active
                // list cache so its unread indicator clears immediately.
                if (currentTabData?.pages?.[0]?.notifications) {
                    const updatedPages = currentTabData.pages.map((page: PageType) => ({
                        ...page,
                        notifications: page.notifications.map((notification: NotificationType) =>
                            notification?._id === updatedNotification.notificationId
                                ? { ...notification, read: true }
                                : notification
                        ),
                    }));

                    queryClient.setQueryData<PaginatedNotificationsType>(activeQueryKey, {
                        ...currentTabData,
                        pages: updatedPages,
                    });
                }
            }

            // Optimistically drop the notification from the unread cache so the
            // header "alerts island" badge decrements immediately, without
            // waiting for the onSuccess refetch. The unread query is a plain
            // (non-infinite) `PageType`, not `InfiniteData`.
            let previousUnread: PageType | undefined;
            if (isReadUpdate) {
                previousUnread = queryClient.getQueryData<PageType>(unreadQueryKey);
                if (previousUnread?.notifications) {
                    queryClient.setQueryData<PageType>(unreadQueryKey, {
                        ...previousUnread,
                        notifications: previousUnread.notifications.filter(
                            (n: NotificationType) => n?._id !== updatedNotification.notificationId
                        ),
                    });
                }
            }

            // 4. Return the previous data (for potential rollback)
            return { previousData: currentTabData, previousUnread };
        },

        onSuccess: async () => {
            // Non-reactive read: this callback runs outside a React render, so
            // the `.use.*()` hook accessor would throw and skip invalidation.
            const resolvedDid = switchedProfileStore.get.switchedDid() ?? '';
            queryClient.invalidateQueries({
                queryKey: ['useGetUnreadUserNotifications', resolvedDid],
            });
            queryClient.invalidateQueries({
                queryKey: ['useGetUserNotifications', resolvedDid],
            });
        },
    });
};

export const useMarkNotificationRead = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();
    const switchedDid = switchedProfileStore.use.switchedDid();

    return useMutation<boolean>({
        mutationFn: async ({ notificationId }) => {
            try {
                const wallet = await initWallet();
                const res = await wallet?.invoke?.updateNotificationMeta(notificationId, {
                    read: true,
                });
                return res;
            } catch (error) {
                return Promise.reject(new Error(error));
            }
        },
        onSuccess: async updatedNotification => {
            // TODO ABSTRACT AND GENERALIZE THIS CACHE UPDATE LOGIC
            // Optimistically update notifications list query
            // 1. find notifcation item in existing query list data
            // 2. update notifications array
            // 3. update cache

            if (updatedNotification?.payload?.read) {
                // Since no ui support for changing the options/filter using these defaults for now, otherwise will need a way to access current associated options and filter
                // for a given query since the cache key for that query depends on those.
                await queryClient.cancelQueries({
                    queryKey: [
                        'useGetUserNotifications',
                        switchedDid ?? '',
                        DEFAULT_ACTIVE_OPTIONS,
                        DEFAULT_ACTIVE_FILTER,
                    ],
                });

                const currentQuery = queryClient.getQueryData([
                    'useGetUserNotifications',
                    switchedDid ?? '',
                    DEFAULT_ACTIVE_OPTIONS,
                    DEFAULT_ACTIVE_FILTER,
                ]);

                if (currentQuery) {
                    const updatedQueryNotifications = currentQuery?.pages.map(page => {
                        return {
                            hasMore: page?.hasMore,
                            notifications: page?.notifications?.filter(_notification => {
                                if (_notification?._id === notification?._id) {
                                    _notification.actionStatus = 'COMPLETED';
                                    _notification.read = true;
                                    return _notification;
                                }
                                return _notification;
                            }),
                        };
                    });

                    const updatedQuery = {
                        ...currentQuery,
                        notifications: updatedQueryNotifications,
                    };

                    // update to the new value
                    queryClient.setQueryData(
                        [
                            'useGetUserNotifications',
                            switchedDid ?? '',
                            DEFAULT_ACTIVE_OPTIONS,
                            DEFAULT_ACTIVE_FILTER,
                        ],
                        updatedQuery
                    );
                }

                // Return a context object with the snapshotted value
            }

            queryClient.invalidateQueries({
                queryKey: ['useGetUnreadUserNotifications', switchedDid ?? ''],
            });
        },
    });
};
