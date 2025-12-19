import React from 'react';
import moment from 'moment';
import {
    useUpdateNotification,
    useAcceptConnectionRequestMutation,
    useMarkNotificationRead,
    useGetProfile,
    useGetCurrentLCNUser,
} from 'learn-card-base';
import { NotificationType } from 'packages/plugins/lca-api-plugin/src/types';
import NotificationBoostCard from './NotificationBoostCard';
import ConnectionRequestCard from './ConnectionRequestCard';
import NotificationConsentFlowCard from './NotificationConsentFlowCard';
import NotificationProfileApprovalCard from './NotificationProfileApprovalCard';
import NotificationAppStoreCard from './NotificationAppStoreCard';
import { useQueryClient } from '@tanstack/react-query';
import { useIonAlert } from '@ionic/react';

type NotificationCardProps = {
    className?: string;
    notification: NotificationType;
    queryOptions?: any;
};

export const NOTIFICATION_TYPES = {
    CONNECTION_REQUEST: 'CONNECTION_REQUEST',
    CONNECTION_ACCEPTED: 'CONNECTION_ACCEPTED',
    BOOST_RECEIVED: 'BOOST_RECEIVED',
    BOOST_ACCEPTED: 'BOOST_ACCEPTED',
    CONSENT_FLOW_TRANSACTION: 'CONSENT_FLOW_TRANSACTION',
    CREDENTIAL_RECEIVED: 'CREDENTIAL_RECEIVED',
    PROFILE_PARENT_APPROVED: 'PROFILE_PARENT_APPROVED',
    APP_LISTING_SUBMITTED: 'APP_LISTING_SUBMITTED',
    APP_LISTING_APPROVED: 'APP_LISTING_APPROVED',
    APP_LISTING_REJECTED: 'APP_LISTING_REJECTED',
};

export const NotificationCardContainer: React.FC<NotificationCardProps> = ({
    className,
    notification: _notification,
    queryOptions,
}) => {
    const { data, isLoading } = useGetProfile(_notification.from.profileId);

    const notification = data ? { ..._notification, from: data, message: {} } : _notification;

    if (data && _notification.message) {
        if (_notification.message.title) {
            notification!.message!.title = _notification.message.title.replace(
                _notification.from.displayName,
                data.displayName
            );
        }

        if (_notification.message.body) {
            notification!.message!.body = _notification.message.body.replace(
                _notification.from.displayName,
                data.displayName
            );
        }
    }

    const { type, message, from, to, sent } = notification;
    const [presentAlert, dismissAlert] = useIonAlert();
    const displayDate = moment(sent).format('MMMM Do, YYYY');

    const queryClient = useQueryClient();
    const { mutate: acceptConnectionRequest, isPending: acceptConnectionLoading } =
        useAcceptConnectionRequestMutation();
    const { mutate: updateNotification } = useUpdateNotification();

    const { mutate: markNotificationAsRead } = useMarkNotificationRead();
    const { refetch: refetchCurrentLCNUser } = useGetCurrentLCNUser();

    const handleArchiveNotification = async () => {
        await updateNotification({
            notificationId: notification?._id,
            payload: { archived: !notification?.archived, read: true },
        });
    };

    const handleMarkAsRead = async () => {
        await markNotificationAsRead({
            notificationId: notification?._id,
        });
    };

    const handleConnectionRequest = async () => {
        await acceptConnectionRequest(
            { profileId: notification?.from?.profileId },
            {
                async onSuccess(data, variables, context) {
                    await updateNotification({
                        notificationId: notification?._id,
                        payload: { actionStatus: 'COMPLETED', read: true },
                    });

                    //update query cache
                    const currentQuery = queryClient.getQueryData([
                        'useGetUserNotifications',
                        queryOptions?.options,
                        queryOptions?.filter,
                    ]);

                    if (currentQuery) {
                        // find notification in query cache
                        // const updatedQueryNotifications = currentQuery?.notifications?.map(
                        //     _notification => {
                        //         if (_notification?._id === notification?._id) {
                        //             _notification.actionStatus = 'COMPLETED';
                        //             return _notification;
                        //         }
                        //         return _notification;
                        //     }
                        // );
                        // Note the below is for infiniteQuery hook, above commented out is normal....todo, handle this better.
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
                                queryOptions?.options,
                                queryOptions?.filter,
                            ],
                            updatedQuery
                        );
                    }

                    return true;
                },
                async onError(err, variables, context) {
                    console.log('///ON ERROR CONNECTION REQUEST', err);
                    if (err?.toString()?.includes('Profiles are already connected')) {
                        console.log('//profiles already connected mutation firing');
                        await updateNotification({
                            notificationId: notification?._id,
                            payload: { actionStatus: 'COMPLETED', read: true },
                        });
                        const currentQuery = queryClient.getQueryData([
                            'useGetUserNotifications',
                            queryOptions?.options,
                            queryOptions?.filter,
                        ]);

                        presentAlert({
                            backdropDismiss: false,
                            cssClass: 'boost-confirmation-alert',
                            header: 'You are already connected.',
                            buttons: [
                                {
                                    text: 'Okay',
                                    role: 'confirm',
                                    handler: async () => {
                                        //extract to helper function....
                                        if (currentQuery) {
                                            // find notification in query cache
                                            // Note the below is for infiniteQuery hook, above commented out is normal....todo, handle this better.
                                            const updatedQueryNotifications =
                                                currentQuery?.pages.map(page => {
                                                    return {
                                                        hasMore: page?.hasMore,
                                                        notifications: page?.notifications?.filter(
                                                            _notification => {
                                                                if (
                                                                    _notification?._id ===
                                                                    notification?._id
                                                                ) {
                                                                    _notification.actionStatus =
                                                                        'COMPLETED';
                                                                    _notification.read = true;
                                                                    return _notification;
                                                                }
                                                                return _notification;
                                                            }
                                                        ),
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
                                                    queryOptions?.options,
                                                    queryOptions?.filter,
                                                ],
                                                updatedQuery
                                            );
                                            dismissAlert();
                                        }
                                    },
                                },
                            ],
                        });

                        console.log('//profiles already connected mutation firing complete');
                        return true;
                    }
                    return false;
                },
            }
        );
    };

    /* Someone has sent you a connection request to accept */
    if (type === NOTIFICATION_TYPES.CONNECTION_REQUEST) {
        const actionStatus = notification?.actionStatus === 'COMPLETED' ? true : false;
        return (
            <ConnectionRequestCard
                title={message?.body}
                from={from}
                acceptStatus={actionStatus}
                notification={notification}
                handleRead={handleMarkAsRead}
                handleCancelClick={handleArchiveNotification}
                isLoading={acceptConnectionLoading}
                handleButtonClick={handleConnectionRequest}
                issueDate={displayDate}
                cardLoading={isLoading}
            />
        );
    }
    /* If someone has accepted your request */
    if (type === NOTIFICATION_TYPES.CONNECTION_ACCEPTED) {
        return (
            <ConnectionRequestCard
                title={message?.body}
                handleRead={handleMarkAsRead}
                acceptStatus={true}
                notification={notification}
                handleCancelClick={handleArchiveNotification}
                issueDate={displayDate}
                cardLoading={isLoading}
            />
        );
    }
    /* Parent/Guardian approval notification */
    if (type === NOTIFICATION_TYPES.PROFILE_PARENT_APPROVED) {
        return (
            <NotificationProfileApprovalCard
                notification={notification}
                onRead={async () => {
                    await handleMarkAsRead();
                    await refetchCurrentLCNUser();
                }}
            />
        );
    }
    /* If someone has accepted your boost*/
    if (type === NOTIFICATION_TYPES.BOOST_ACCEPTED) {
        const claimStatus = true;
        return (
            <NotificationBoostCard
                notification={notification}
                handleRead={handleMarkAsRead}
                claimStatus={claimStatus}
                handleArchive={handleArchiveNotification}
                issueDate={displayDate}
                cardLoading={isLoading}
            />
        );
    }
    /* Someone has sent you a boost to accept */
    if (type === NOTIFICATION_TYPES.BOOST_RECEIVED) {
        // Assumption made here, we are only checking the first uri in the vcUris array
        const claimStatus = notification?.actionStatus === 'COMPLETED' ? true : false;
        return (
            <NotificationBoostCard
                notification={notification}
                handleRead={handleMarkAsRead}
                claimStatus={claimStatus}
                handleArchive={handleArchiveNotification}
                issueDate={displayDate}
                cardLoading={isLoading}
            />
        );
    }
    /*Someone has sent you a credential to accept */
    if (type === NOTIFICATION_TYPES.CREDENTIAL_RECEIVED) {
        const claimStatus = notification?.actionStatus === 'COMPLETED' ? true : false;
        return (
            <NotificationBoostCard
                notification={notification}
                handleRead={handleMarkAsRead}
                claimStatus={claimStatus}
                handleArchive={handleArchiveNotification}
                issueDate={displayDate}
                cardLoading={isLoading}
            />
        );
    }
    /* Someone made a transaction on your ConsentFlow contract (e.g. Accepted / updated) */
    if (type === NOTIFICATION_TYPES.CONSENT_FLOW_TRANSACTION) {
        const claimStatus = notification?.actionStatus === 'COMPLETED' ? true : false;
        return (
            <NotificationConsentFlowCard
                notification={notification}
                handleRead={handleMarkAsRead}
                claimStatus={claimStatus}
                handleArchive={handleArchiveNotification}
                cardLoading={isLoading}
            />
        );
    }

    /* App Store: A new listing was submitted for review (admin notification) */
    if (type === NOTIFICATION_TYPES.APP_LISTING_SUBMITTED) {
        return (
            <NotificationAppStoreCard
                notification={notification}
                onRead={handleMarkAsRead}
                variant="submitted"
            />
        );
    }

    /* App Store: Your listing was approved */
    if (type === NOTIFICATION_TYPES.APP_LISTING_APPROVED) {
        return (
            <NotificationAppStoreCard
                notification={notification}
                onRead={handleMarkAsRead}
                variant="approved"
            />
        );
    }

    /* App Store: Your listing was rejected / needs changes */
    if (type === NOTIFICATION_TYPES.APP_LISTING_REJECTED) {
        return (
            <NotificationAppStoreCard
                notification={notification}
                onRead={handleMarkAsRead}
                variant="rejected"
            />
        );
    }

    return (
        <div
            className={`flex justify-start max-w-[600px] items-start relative w-full rounded-3xl shadow-bottom py-[10px] px-[10px] bg-white ${className}`}
        >
            Notification
        </div>
    );
};

export default NotificationCardContainer;
