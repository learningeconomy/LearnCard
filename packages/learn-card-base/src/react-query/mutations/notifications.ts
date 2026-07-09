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

    return useMutation<boolean, Error, { notificationId: string }>({
        mutationFn: async ({ notificationId }) => {
            try {
                const wallet = await initWallet();
                const res = await wallet?.invoke?.updateNotificationMeta(notificationId, {
                    read: true,
                });
                return Boolean(res);
            } catch (error) {
                return Promise.reject(
                    new Error(error instanceof Error ? error.message : String(error))
                );
            }
        },
        // NOTE: react-query passes `(data, variables, context)` here — the first
        // arg is the mutation's return value (a boolean), NOT the variables.
        // The previous code gated on `updatedNotification?.payload?.read`, which
        // was always undefined, so the optimistic cache update below never ran
        // (and referenced an undefined `notification`). Read the id from the
        // `variables` arg instead.
        onSuccess: async (_data, { notificationId }) => {
            const cacheDid = switchedDid ?? '';

            const activeQueryKey = [
                'useGetUserNotifications',
                cacheDid,
                DEFAULT_ACTIVE_OPTIONS,
                DEFAULT_ACTIVE_FILTER,
            ];
            const unreadQueryKey = ['useGetUnreadUserNotifications', cacheDid];

            await queryClient.cancelQueries({ queryKey: activeQueryKey });
            await queryClient.cancelQueries({ queryKey: unreadQueryKey });

            // Optimistically flip `read` on the item in the active list cache.
            const currentActive = queryClient.getQueryData<InfiniteData<PageType>>(activeQueryKey);
            if (currentActive?.pages) {
                queryClient.setQueryData<InfiniteData<PageType>>(activeQueryKey, {
                    ...currentActive,
                    pages: currentActive.pages.map((page: PageType) => ({
                        ...page,
                        notifications: page.notifications.map((n: NotificationType) =>
                            n?._id === notificationId ? { ...n, read: true } : n
                        ),
                    })),
                });
            }

            // Optimistically drop it from the unread cache so the header
            // "alerts island" badge decrements immediately.
            const currentUnread = queryClient.getQueryData<PageType>(unreadQueryKey);
            if (currentUnread?.notifications) {
                queryClient.setQueryData<PageType>(unreadQueryKey, {
                    ...currentUnread,
                    notifications: currentUnread.notifications.filter(
                        (n: NotificationType) => n?._id !== notificationId
                    ),
                });
            }

            queryClient.invalidateQueries({ queryKey: unreadQueryKey });
            queryClient.invalidateQueries({ queryKey: activeQueryKey });
        },
    });
};
