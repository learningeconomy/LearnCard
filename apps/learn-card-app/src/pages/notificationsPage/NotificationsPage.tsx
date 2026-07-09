import React, { useState } from 'react';

import { IonContent, IonPage, IonCol } from '@ionic/react';
import MainHeader from '../../components/main-header/MainHeader';
import NotificationsListView from '../../components/notifications/NotificationsListView';
import NotificationsSubHeader from '../../components/notifications/notifications-subheader/NotificationsSubheader';
import GenericErrorBoundary from '../../components/generic/GenericErrorBoundary';

import useHeaderScrollSync from '../../hooks/useHeaderScrollSync';

const NotificationsPage: React.FC = () => {
    const [isEmptyState, setIsEmptyState] = useState<boolean>(false);
    const [tab, setTab] = useState('active');
    const notificationCount = 0;

    const onHeaderScroll = useHeaderScrollSync();

    return (
        <IonPage className="bg-white h-full">
            <MainHeader
                showBackButton={false}
                customClassName="bg-gradient-to-b from-white to-white/70 border-b border-white backdrop-blur-[5px] md:bg-white md:border-none md:bg-none md:backdrop-blur-none"
            >
                <NotificationsSubHeader
                    isEmptyState={isEmptyState}
                    notificationCount={notificationCount}
                    tab={tab}
                    setTab={setTab}
                />
            </MainHeader>
            <GenericErrorBoundary>
                <IonContent
                    fullscreen
                    className="bg-white h-full w-full"
                    scrollEvents
                    onIonScroll={onHeaderScroll}
                >
                    <IonCol className="flex mx-auto relative items-start flex-wrap w-full h-auto min-h-[100%] notifications-list-container bg-white px-[20px]">
                        <NotificationsListView
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
