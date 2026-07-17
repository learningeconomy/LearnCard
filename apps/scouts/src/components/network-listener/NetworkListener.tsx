import React, { useEffect } from 'react';
import { useToast, ToastTypeEnum, connectivityStore } from 'learn-card-base';
import { useNetworkStatus } from './useNetworkStatus';

export const NetworkListener = () => {
    const isConnected = useNetworkStatus();
    const { presentToast: present, dismissToast: dismiss } = useToast();

    useEffect(() => {
        if (isConnected !== undefined) {
            connectivityStore.set.report(isConnected);
        }

        if (!isConnected && isConnected !== undefined) {
            present(
                "Oops! It seems you've lost your connection. The app may not function properly and you will not be able to send boosts.",
                {
                    duration: 3000000,
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                }
            );
        } else if (isConnected) {
            dismiss();
        }
    }, [isConnected, present, dismiss]);

    return <></>;
};

export default NetworkListener;
