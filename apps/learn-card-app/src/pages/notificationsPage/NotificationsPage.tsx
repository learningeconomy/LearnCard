import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Badge } from '@capawesome/capacitor-badge';

import { IonContent, IonPage, IonCol } from '@ionic/react';
import MainHeader from '../../components/main-header/MainHeader';
import NewNotificationsList from '../../components/notifications/notificationsV2/NewNotificationsList';
import NotificationsSubHeader from '../../components/notifications/notifications-subheader/NotificationsSubheader';
import GenericErrorBoundary from '../../components/generic/GenericErrorBoundary';

import {
    DEFAULT_ACTIVE_OPTIONS,
    DEFAULT_ACTIVE_FILTER,
    DEFAULT_ARCHIVE_OPTIONS,
    DEFAULT_ARCHIVE_FILTER,
    getNotificationsEndpoint,
    useWallet,
    useMarkAllNotificationsRead,
} from 'learn-card-base';

const NotificationNavTabsContainer: React.FC<{
    isEmptyState: boolean;
    setIsEmptyState: React.Dispatch<React.SetStateAction<boolean>>;
    tab: string;
}> = ({ isEmptyState, setIsEmptyState, tab }) => {
    const location = useLocation();
    const { initWallet } = useWallet();

    const { mutate: markAllNotificationsRead } = useMarkAllNotificationsRead();

    const checkUserNotificationsEndpoint = async () => {
        // Check a users' profile to see if their notifications webhook endpoint is set
        // If not, then attempt to update the user's notifications webhook endpoint value
        try {
            const wallet = await initWallet();
            const myProfile = await wallet.invoke.getProfile();

            if (
                !myProfile?.notificationsWebhook ||
                myProfile?.notificationsWebhook?.trim?.() === ''
            ) {
                const notificationsEndpoint = getNotificationsEndpoint();
                await wallet.invoke.updateProfile({
                    notificationsWebhook: notificationsEndpoint,
                });
            }
        } catch (e) {
            console.warn('Error checking user notifications endpoint', e);
        }
    };

    const clearBadgeCount = async () => {
        const badgeClear = await Badge?.clear?.();
    };

    const handleMarkAllRead = async () => {
        // Mark notifications read on LCA API
        await markAllNotificationsRead();
        if (Capacitor.isNativePlatform()) {
            // Clear badge count on native as well
            clearBadgeCount();
        }
    };

    useEffect(() => {
        checkUserNotificationsEndpoint();
        if (Capacitor?.isNativePlatform()) {
            // Clear badge count on native as well
            clearBadgeCount();
        }
    }, []);

    useEffect(() => {
        return () => {
            handleMarkAllRead();
        };
    }, [location]);

    return (
        <section className="w-full h-full min-w-[300px] bg-white pb-7">
            {tab === 'active' && (
                <NewNotificationsList
                    options={DEFAULT_ACTIVE_OPTIONS}
                    filter={DEFAULT_ACTIVE_FILTER}
                    isEmptyState={isEmptyState}
                    setIsEmptyState={setIsEmptyState}
                />
            )}

            {tab === 'archived' && (
                <NewNotificationsList
                    options={DEFAULT_ARCHIVE_OPTIONS}
                    filter={DEFAULT_ARCHIVE_FILTER}
                    isEmptyState={isEmptyState}
                    setIsEmptyState={setIsEmptyState}
                />
            )}
        </section>
    );
};

const NotificationsPage: React.FC = () => {
    const [isEmptyState, setIsEmptyState] = useState<boolean>(false);
    const [tab, setTab] = useState('active');
    const notificationCount = 0;

    return (
        <IonPage className="bg-white h-full">
            <MainHeader customClassName="bg-white">
                <NotificationsSubHeader
                    isEmptyState={isEmptyState}
                    notificationCount={notificationCount}
                    tab={tab}
                    setTab={setTab}
                />
            </MainHeader>
            <GenericErrorBoundary>
                <IonContent fullscreen className="bg-white h-full w-full">
                    <IonCol className="flex mx-auto relative items-start flex-wrap w-full h-auto min-h-[100%] notifications-list-container bg-white px-[20px]">
                        <NotificationNavTabsContainer
                            isEmptyState={isEmptyState}
                            setIsEmptyState={setIsEmptyState}
                            tab={tab}
                        />
                    </IonCol>
                </IonContent>
            </GenericErrorBoundary>
        </IonPage>
    );
};

export default NotificationsPage;
