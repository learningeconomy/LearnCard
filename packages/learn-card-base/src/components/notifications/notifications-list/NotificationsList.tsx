import React, { useState } from 'react';

import { Notification, NotificationProps } from '@learncard/react';
import { VCClaim } from 'learn-card-base/components/vcmodal/VCModal';

import { useWallet, useAcceptCredentialMutation, useToast, ToastTypeEnum } from 'learn-card-base';

import { getLogger } from '../../../logging/logger';
import { AppItem, AppList } from 'learn-card-base/ui/list';
import { useAppOverlayModal } from 'learn-card-base/ui/overlays';
const log = getLogger('notifications-list');

export const NotificationItem: React.FC<{
    notification: NotificationProps;
}> = ({ notification }) => {
    const { addVCtoWallet } = useWallet();
    const { mutate, isLoading } = useAcceptCredentialMutation();

    const [isClaimed, setIsClaimed] = useState<boolean>(false);

    const { presentToast } = useToast();

    const [presentModal, dismissModal] = useAppOverlayModal(VCClaim, {
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
                        presentToast(`Successfully claimed Credential!`, {
                            type: ToastTypeEnum.Success,
                            hasDismissButton: true,
                        });

                        setIsClaimed(true);
                        log.debug('acceptCredential::success', data);
                    },
                }
            );
        } catch (err) {
            log.debug('acceptCredential::error', err?.message);
        }
    };

    return (
        <AppItem
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
        </AppItem>
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
        <AppList
            lines="none"
            className="flex flex-col items-center justify-center px-2 w-[90%] max-w-[600px]"
        >
            {notificationItems}
        </AppList>
    );
};

export default NotificationsList;
