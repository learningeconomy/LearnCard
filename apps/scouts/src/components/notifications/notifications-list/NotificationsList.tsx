import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { IonItem, IonList } from '@ionic/react';

import { Notification, NotificationProps } from '@learncard/react';
import { VCClaim } from 'learn-card-base/components/vcmodal/VCModal';

import {
    useAcceptCredentialMutation,
    usePathQuery,
    useToast,
    ToastTypeEnum,
    useModal,
    ModalTypes,
} from 'learn-card-base';
import { useAddCredentialToWallet } from '../../boost/mutations';

export const NotificationItem: React.FC<{
    notification: NotificationProps;
}> = ({ notification }) => {
    const history = useHistory();
    const query = usePathQuery();

    const _uri = query.get('uri') ?? '';
    const _claim = query.get('claim') ?? '';

    const { mutate: addCredentialToWallet } = useAddCredentialToWallet();
    const { mutate, isLoading } = useAcceptCredentialMutation();

    const [isClaimed, setIsClaimed] = useState<boolean>(false);

    const { presentToast } = useToast();

    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    const handleViewOnClick = () => {
        presentClaimModal();
    };

    const handleClaimOnClick = async () => {
        if (isClaimed) return;

        try {
            mutate(
                { uri: notification?.uri },
                {
                    async onSuccess() {
                        await addCredentialToWallet({ uri: notification?.uri });
                        presentToast(`Successfully claimed Credential!`, {
                            type: ToastTypeEnum.Success,
                            hasDismissButton: true,
                        });
                        closeModal();

                        setIsClaimed(true);
                    },
                }
            );
        } catch (err: any) {
            console.log('acceptCredential::error', err?.message);
        }
    };

    const presentClaimModal = () => {
        newModal(
            <VCClaim
                _streamId={notification?.uri}
                dismiss={() => closeModal()}
                showFooter={false}
                showBoostFooter={true}
                handleClaimBoostCredential={handleClaimOnClick}
                isLoading={isLoading}
            />
        );
    };

    useEffect(() => {
        if (_uri === notification?.uri && _claim) {
            presentClaimModal();
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
            className="flex flex-col items-center justify-center px-2 w-[90%] max-w-[600px] pt-4"
        >
            {notificationItems}
        </IonList>
    );
};

export default NotificationsList;
