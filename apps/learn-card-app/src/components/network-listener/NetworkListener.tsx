import React, { useEffect, useState } from 'react';
import { useIonToast } from '@ionic/react';
import { useNetworkStatus } from './useNetworkStatus';

export const NetworkListener = () => {
    const isConnected = useNetworkStatus();
    const [present, dismiss] = useIonToast();

    useEffect(() => {
        if (!isConnected && isConnected !== undefined) {
            present({
                message:
                    "Oops! It seems you've lost your connection. The app may not function properly and you will not be able to send boosts.",
                duration: 3000000,
                position: 'top',
                cssClass: 'network-offline-toast',
            });
        } else if (isConnected) {
            dismiss();
        }
    }, [isConnected]);

    return <></>;
};

export default NetworkListener;
