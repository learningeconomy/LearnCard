import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { IonItem, IonList } from '@ionic/react';

import { Notification, NotificationProps } from '@learncard/react';
import CredentialClaimModal from '../../../pages/launchPad/CredentialClaimModal';

import { usePathQuery, useModal } from 'learn-card-base';

export const NotificationItem: React.FC<{
    notification: NotificationProps;
}> = ({ notification }) => {
    const history = useHistory();
    const query = usePathQuery();

    const _uri = query.get('uri') ?? '';
    const _claim = query.get('claim') ?? '';

    const { newModal, closeModal: dismissModal } = useModal();
    const presentModal = () =>
        newModal(
            <CredentialClaimModal
                credentialUri={notification.uri}
                onDismiss={() => {
                    dismissModal();
                    if (_claim) history.replace('/notifications');
                }}
            />
        );

    const handleViewOnClick = () => {
        presentModal();
    };

    const handleClaimOnClick = () => presentModal();

    useEffect(() => {
        if (_uri === notification?.uri && _claim) {
            presentModal();
        }
    }, []);

    return (
        <IonItem
            lines="none"
            className="w-full max-w-3xl mb-2 mt-2 p-0 shadow-3xl rounded-3xl notificaion-list-item"
        >
            <Notification
                title={notification?.title}
                issuerImage={notification?.issuerImage}
                issueDate={notification?.issueDate}
                notificationType={notification?.notificationType}
                handleViewOnClick={handleViewOnClick}
                handleClaimOnClick={handleClaimOnClick}
                claimStatus={false}
                loadingState={false}
            />
        </IonItem>
    );
};

export const NotificationsList: React.FC<{
    notifications: NotificationProps[];
    refetch: () => void;
}> = ({ notifications }) => {
    const notificationItems = notifications?.map((notification, index) => (
        <NotificationItem key={index} notification={notification} />
    ));

    return (
        <IonList
            lines="none"
            className="flex flex-col items-center justify-center px-2 w-[90%] max-w-[600px] pt-4"
        >
            {notificationItems}
        </IonList>
    );
};

export default NotificationsList;
