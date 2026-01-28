import React from 'react';
import { Badge } from '@capawesome/capacitor-badge';
import { Capacitor } from '@capacitor/core';
import { useHistory } from 'react-router-dom';

import { IonCol, IonGrid, IonRow } from '@ionic/react';
import LeftArrow from 'learn-card-base/svgs/LeftArrow';
import X from 'learn-card-base/svgs/X';

import {
    useGetUserNotifications,
    DEFAULT_ACTIVE_OPTIONS,
    DEFAULT_ACTIVE_FILTER,
    DEFAULT_ARCHIVE_OPTIONS,
    DEFAULT_ARCHIVE_FILTER,
    useMarkAllNotificationsRead,
    useUpdateNotification,
} from 'learn-card-base';

export const NotificationsSubHeader: React.FC<{
    notificationCount: number;
    isEmptyState: boolean;
    setTab: React.Dispatch<React.SetStateAction<string>>;
    tab: string;
}> = ({ notificationCount, isEmptyState, setTab, tab }) => {
    const { data, isLoading } = useGetUserNotifications(
        DEFAULT_ARCHIVE_OPTIONS,
        DEFAULT_ARCHIVE_FILTER
    );
    const { data: activeData } = useGetUserNotifications(
        DEFAULT_ACTIVE_OPTIONS,
        DEFAULT_ACTIVE_FILTER
    );
    const numberArchived = data?.pages[0]?.notifications?.length;
    const history = useHistory();
    const {
        mutate: markAllNotificationsRead,
        isLoading: markAllNotificationsReadLoading,
        isSuccess: markAllNotificationsReadSuccess,
    } = useMarkAllNotificationsRead();
    const { mutateAsync: updateNotification } = useUpdateNotification();

    const handleMarkAllRead = async () => {
        const activeNotifications = activeData?.pages?.flatMap(page => page.notifications) ?? [];

        // Mark notifications read on LCA API
        await markAllNotificationsRead();

        // Archive all active notifications
        await Promise.all(
            activeNotifications.map(notification =>
                updateNotification({
                    notificationId: notification._id,
                    payload: { archived: true, read: true },
                })
            )
        );

        if (Capacitor.isNativePlatform()) {
            // Clear badge count on native as well
            const badgeClear = await Badge?.clear?.();
        }
    };

    return (
        <div>
            <IonGrid className="w-full flex items-center justify-center px-3">
                <IonRow className="w-full max-w-[600px]">
                    <button
                        className="text-grayscale-50 p-0 mr-[2px] flex items-center justify-start"
                        onClick={() => {
                            history.goBack();
                        }}
                        aria-label="Back button"
                    >
                        <LeftArrow className="w-6 mr-[10px] h-auto text-black desktop:hidden" />
                        <span className="text-grayscale-900 text-[25px] font-semibold font-rubik tracking-[0.01rem]">
                            Alerts
                        </span>
                    </button>

                    {/* <IonCol size="6" className="flex justify-end items-center">
                    <button
                        type="button"
                        className="flex justify-center items-center rounded-full text-grayscale-900 bg-grayscale-100 h-11 w-11 mr-1"
                    >
                        <Search className="h-6 w-auto" />
                    </button>
                    <button
                        type="button"
                        className="flex justify-center items-center rounded-full text-grayscale-900 bg-grayscale-100 h-11 w-11"
                    >
                        <Settings className="h-6 w-auto" />
                    </button>
                </IonCol> */}
                    <IonCol size="12">
                        <p className="font-light text-grayscale-600">
                            {/* All Notifications &bull;{' '}
                            <span className="text-indigo-600 text-sm font-bold">
                                {notificationCount} Unclaimed
                            </span> */}
                        </p>
                    </IonCol>
                </IonRow>
                {!isEmptyState && (
                    <button
                        onClick={handleMarkAllRead}
                        className="text-[14px] text-grayscale-800 flex items-center justify-center font-semibold min-w-[140px] rounded-[36px] border-solid border-[1px] border-grayscale-200 py-[7px] px-[20px]"
                    >
                        Archive All <X className="ml-[5px] w-[15px] h-[15px]" />
                    </button>
                )}
            </IonGrid>
            <div className="w-full flex items-center justify-center px-3">
                <IonRow class="w-full max-w-[600px]">
                    <IonCol className="flex items-center justify-start w-full">
                        <button
                            onClick={() => {
                                setTab('active');
                            }}
                            className={`pr-4 text-grayscale-600 text-[14px] font-semibold ${
                                tab === 'active'
                                    ? 'text-indigo-500 text-center rounded-[50px] px-[15px] py-[5px] border-solid border-[1px] border-[rgba(99, 102, 241, 0.40)] mr-[15px]'
                                    : ''
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => {
                                setTab('archived');
                            }}
                            className={`pr-4 text-grayscale-600 text-[14px] font-semibold ${
                                tab === 'archived'
                                    ? 'text-indigo-500 text-center rounded-[50px] px-[15px] py-[5px] border-solid border-[1px] border-[rgba(99, 102, 241, 0.40)] '
                                    : ''
                            }`}
                        >
                            {!isLoading ? numberArchived : ''} Archived
                        </button>
                    </IonCol>
                </IonRow>
            </div>
        </div>
    );
};

export default NotificationsSubHeader;
