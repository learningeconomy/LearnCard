import { useEffect } from 'react';

import { useNetworkStatus } from './useNetworkStatus';
import { useToast, ToastTypeEnum } from 'learn-card-base';

export const NetworkListener = () => {
    const isConnected = useNetworkStatus();
    const { presentToast, dismissToast } = useToast();

    useEffect(() => {
        if (!isConnected && isConnected !== undefined) {
            presentToast(
                "Oops! It seems you've lost your connection. The app may not function properly and you will not be able to send boosts.",
                {
                    hasDismissButton: true,
                    duration: 300000,
                    type: ToastTypeEnum.Error,
                }
            );
        } else if (isConnected) {
            dismissToast();
        }
    }, [isConnected]);

    return <></>;
};

export default NetworkListener;
