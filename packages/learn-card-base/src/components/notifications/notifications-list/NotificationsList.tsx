import React, { useState } from 'react';

import { IonItem, IonList, useIonModal, useIonToast } from '@ionic/react';

import { Notification, NotificationProps } from '@learncard/react';
import { VCClaim } from 'learn-card-base/components/vcmodal/VCModal';

import { useWallet, useAcceptCredentialMutation } from 'learn-card-base';

export const NotificationItem: React.FC<{
    notification: NotificationProps;
}> = ({ notification }) => {
    const { addVCtoWallet } = useWallet();
    const { mutate, isLoading } = useAcceptCredentialMutation();

    const [isClaimed, setIsClaimed] = useState<boolean>(false);

    const [presentToast] = useIonToast();

    const [presentModal, dismissModal] = useIonModal(VCClaim, {
        _streamId: notification?.uri,
        dismiss: () => dismissModal(),
        showFooter: false,
    });

    const handleViewOnClick = () => {
        presentModal();
    };

    const handleClaimOnClick = async () => {
        if (isClaimed) return;

        try {
            mutate(
                { uri: notification?.uri },
                {
                    async onSuccess(data, variables, context) {
                        await addVCtoWallet({ uri: notification?.uri });
                        presentToast({
                            message: `Successfully claimed Credential!`,
                            duration: 3000,
                            cssClass: 'toast-custom-class ion-toast-bottom-nav-offset',
                        });

                        setIsClaimed(true);
                        console.log('acceptCredential::success', data);
                    },
                }
            );
        } catch (err) {
            console.log('acceptCredential::error', err?.message);
        }
    };

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
                claimStatus={isClaimed}
                loadingState={isLoading}
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
            className="flex flex-col items-center justify-center px-2 w-[90%] max-w-[600px]"
        >
            {notificationItems}
        </IonList>
    );
};

export default NotificationsList;
