import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet, walletStore } from 'learn-card-base';
import {
    DEFAULT_ACTIVE_OPTIONS,
    DEFAULT_ACTIVE_FILTER,
    DEFAULT_ARCHIVE_OPTIONS,
    DEFAULT_ARCHIVE_FILTER,
} from 'learn-card-base';

/* Toggle a notification between "archived" state */

type NotificationMeta = {
    archived?: boolean;
    read?: boolean;
};

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
                // invalidate queries
                queryClient.invalidateQueries({
                    queryKey: ['useGetUserNotifications'],
                });
                queryClient.invalidateQueries({ queryKey: ['useGetUnreadUserNotifications'] });
                queryClient.refetchQueries({
                    queryKey: ['useGetUnreadUserNotifications'],
                });
            } catch (e) {
                console.warn('error:OnSuccess:useMarkAllNotificationsRead', e);
                return false;
            }
        },
    });
};

/* Todo, probably make separate simpler mutations that wrap same update notification call */
export const useUpdateNotification = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    return useMutation<boolean>({
        mutationFn: async ({ notificationId, payload }) => {
            try {
                const wallet = await initWallet();
                const res = await wallet?.invoke?.updateNotificationMeta(notificationId, payload);
                return res;
            } catch (error) {
                return Promise.reject(new Error(error));
            }
        },
        onMutate: async updatedNotification => {
            // todo pass this in as an argument

            if (updatedNotification?.payload?.read) {
                // Since no ui support for changing the options/filter using these defaults for now, otherwise will need a way to access current associated options and filter
                // for a given query since the cache key for that query depends on those.
                await queryClient.cancelQueries({
                    queryKey: [
                        'useGetUserNotifications',
                        DEFAULT_ACTIVE_OPTIONS,
                        DEFAULT_ACTIVE_FILTER,
                    ],
                });

                const currentQuery = queryClient.getQueryData([
                    'useGetUserNotifications',
                    DEFAULT_ACTIVE_OPTIONS,
                    DEFAULT_ACTIVE_FILTER,
                ]);

                if (currentQuery) {
                    const updatedQueryNotifications = currentQuery?.pages.map(page => {
                        return {
                            hasMore: page?.hasMore,
                            notifications: page?.notifications?.filter(_notification => {
                                if (_notification?._id === updatedNotification?.notificationId) {
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
                        ['useGetUserNotifications', DEFAULT_ACTIVE_OPTIONS, DEFAULT_ACTIVE_FILTER],
                        updatedQuery
                    );
                }

                // Return a context object with the snapshotted value
            }

            // TODO ABSTRACT AND GENERALIZE THIS CACHE UPDATE LOGIC
            // Optimistically update notifications list query
            // 1. find notifcation item in existing query list data
            // 2. update notifications array
            // 3. update cache
            if (updatedNotification?.payload?.archived) {
                // Since no ui support for changing the options/filter using these defaults for now, otherwise will need a way to access current associated options and filter
                // for a given query since the cache key for that query depends on those.
                await queryClient.cancelQueries({
                    queryKey: [
                        'useGetUserNotifications',
                        DEFAULT_ACTIVE_OPTIONS,
                        DEFAULT_ACTIVE_FILTER,
                    ],
                });

                // Get existing active notification query, in order to remove it from the active list
                const prevQuery = queryClient.getQueryData([
                    'useGetUserNotifications',
                    DEFAULT_ACTIVE_OPTIONS,
                    DEFAULT_ACTIVE_FILTER,
                ]);

                // Also get the archived cached query, in order to update the archived list cache
                const prevArchiveQuery = queryClient.getQueryData([
                    'useGetUserNotifications',
                    DEFAULT_ARCHIVE_OPTIONS,
                    DEFAULT_ARCHIVE_FILTER,
                ]);

                //Find existing notification in active query and remove

                // This is to handle the pagination data structure of infinitequery hook
                const filteredNotificationPages = prevQuery?.pages.map(page => {
                    return {
                        hasMore: page?.hasMore,
                        notifications: page?.notifications?.filter(
                            notification =>
                                notification?._id !== updatedNotification?.notificationId
                        ),
                    };
                });

                // const _notifications = prevQuery?.notifications?.filter(
                //     notification => notification?._id !== updatedNotification?.notificationId
                // );

                // prevArchive query data may not exist because of how the notifcation tab component is constructucted
                // eg the query is run within each tab, active or archive, so potentially the archive tab's query has not run
                if (prevArchiveQuery) {
                    // this adds this to the archived notification list cache
                    // however, it does not take into account the sorting
                    // since there is info is unavailable to the client we cannot make this correct atm
                    // NOT IMPLEMENTED at the moment
                }

              

                const updatedQuery = { ...prevQuery, pages: filteredNotificationPages };

              

                // Optimistically update to the new value
                queryClient.setQueryData(
                    ['useGetUserNotifications', DEFAULT_ACTIVE_OPTIONS, DEFAULT_ACTIVE_FILTER],
                    updatedQuery
                );

                // Return a context object with the snapshotted value
                return { prevQuery };
            }

            if (updatedNotification?.payload?.archived === false) {
                // Since no ui support for changing the options/filter using these defaults for now, otherwise will need a way to access current associated options and filter
                // for a given query since the cache key for that query depends on those.
                await queryClient.cancelQueries({
                    queryKey: [
                        'useGetUserNotifications',
                        DEFAULT_ARCHIVE_OPTIONS,
                        DEFAULT_ARCHIVE_FILTER,
                    ],
                });

                // Get existing active notification query, in order to remove it from the active list
                const prevQuery = queryClient.getQueryData([
                    'useGetUserNotifications',
                    DEFAULT_ARCHIVE_OPTIONS,
                    DEFAULT_ARCHIVE_FILTER,
                ]);
                //Find existing notification in query and remove
                // const _notifications = prevQuery?.notifications?.filter(
                //     notification => notification?._id !== updatedNotification?.notificationId
                // );

                // This is to handle the pagination data structure of infinitequery hook
                const filteredNotificationPages = prevQuery?.pages.map(page => {
                    return {
                        hasMore: page?.hasMore,
                        notifications: page?.notifications?.filter(
                            notification =>
                                notification?._id !== updatedNotification?.notificationId
                        ),
                    };
                });

                const updatedQuery = { ...prevQuery, pages: filteredNotificationPages };

                // const updatedQuery = { ...prevQuery, notifications: _notifications };

             

                // Optimistically update to the new value
                queryClient.setQueryData(
                    ['useGetUserNotifications', DEFAULT_ARCHIVE_OPTIONS, DEFAULT_ARCHIVE_FILTER],
                    updatedQuery
                );

                // Return a context object with the snapshotted value
                return { prevQuery };
            }

            return;
        },
        onSuccess: async updatedNotification => {
            queryClient.invalidateQueries({ queryKey: ['useGetUnreadUserNotifications'] });

            // queryClient.invalidateQueries({ queryKey: ['useGetUserNotifications'] });
            // queryClient.invalidateQueries({
            //     queryKey: [
            //         'useGetUserNotifications',
            //         DEFAULT_ARCHIVE_OPTIONS,
            //         DEFAULT_ARCHIVE_FILTER,
            //     ],
            // });
            // queryClient.invalidateQueries({
            //     queryKey: [
            //         'useGetUserNotifications',
            //         DEFAULT_ACTIVE_OPTIONS,
            //         DEFAULT_ACTIVE_FILTER,
            //     ],
            // });
        },
    });
};

export const useMarkNotificationRead = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();
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
                        DEFAULT_ACTIVE_OPTIONS,
                        DEFAULT_ACTIVE_FILTER,
                    ],
                });

                const currentQuery = queryClient.getQueryData([
                    'useGetUserNotifications',
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
                        ['useGetUserNotifications', DEFAULT_ACTIVE_OPTIONS, DEFAULT_ACTIVE_FILTER],
                        updatedQuery
                    );
                }

                // Return a context object with the snapshotted value
            }

            queryClient.invalidateQueries({ queryKey: ['useGetUnreadUserNotifications'] });
        },
    });
};
