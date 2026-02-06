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
    useWallet,
} from 'learn-card-base';
import { NotificationType } from 'packages/plugins/lca-api-plugin/src/types';

import useTheme from '../../../theme/hooks/useTheme';
import { ColorSetEnum } from '../../../theme/colors/index';
import { StyleSetEnum } from '../../../theme/styles/index';

export const NotificationsSubHeader: React.FC<{
    notificationCount: number;
    isEmptyState: boolean;
    setTab: React.Dispatch<React.SetStateAction<string>>;
    tab: string;
}> = ({ notificationCount, isEmptyState, setTab, tab }) => {
    const { getColorSet, getStyleSet } = useTheme();
    const styleSet = getStyleSet(StyleSetEnum.defaults);
    const colorSet = getColorSet(ColorSetEnum.defaults);

    const borderRadius = styleSet.tabs.borderRadius;
    const primaryColor = colorSet.primaryColor;

    const { data, isLoading } = useGetUserNotifications(
        DEFAULT_ARCHIVE_OPTIONS,
        DEFAULT_ARCHIVE_FILTER
    );
    const numberArchived = data?.pages[0]?.notifications?.length;

    const history = useHistory();
    const { initWallet } = useWallet();
    const {
        mutate: markAllNotificationsRead,
        isLoading: markAllNotificationsReadLoading,
        isSuccess: markAllNotificationsReadSuccess,
    } = useMarkAllNotificationsRead();
    const { mutateAsync: updateNotification } = useUpdateNotification();

    const fetchAllActiveNotifications = async () => {
        const wallet = await initWallet();
        if (!wallet) return [];

        const allNotifications: NotificationType[] = [];
        let cursor: string | undefined;
        let hasMore = true;

        while (hasMore) {
            const page = await wallet.invoke.getNotifications(
                {
                    ...DEFAULT_ACTIVE_OPTIONS,
                    cursor,
                },
                DEFAULT_ACTIVE_FILTER
            );

            if (!page) break;

            allNotifications.push(...(page.notifications ?? []));
            hasMore = page.hasMore;
            cursor = page.cursor;
        }

        return allNotifications;
    };

    const handleMarkAllRead = async () => {
        const activeNotifications = await fetchAllActiveNotifications();

        // Mark notifications read on LCA API
        await markAllNotificationsRead();

        // Archive all active notifications
        const notificationsWithIds = activeNotifications.filter(
            (notification): notification is NotificationType & { _id: string } =>
                Boolean(notification._id)
        );

        await Promise.all(
            notificationsWithIds.map(notification =>
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
        <div className="backdrop-blur-[5px] border-b-[1px] border-solid border-white">
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
                        <span className="text-grayscale-900 font-poppins font-semibold text-[25px] tracking-[0.01rem]">
                            Alerts
                        </span>
                    </button>
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
                            className={`pr-4  text-[14px] font-semibold ${
                                tab === 'active'
                                    ? `text-${primaryColor} text-center ${borderRadius} px-[15px] py-[5px] border-solid border-[1px] border-${primaryColor} mr-[15px]`
                                    : 'text-grayscale-600'
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => {
                                setTab('archived');
                            }}
                            className={`pr-4  text-[14px] font-semibold ${
                                tab === 'archived'
                                    ? `text-${primaryColor} text-center ${borderRadius} px-[15px] py-[5px] border-solid border-[1px] border-${primaryColor}`
                                    : 'text-grayscale-600'
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
