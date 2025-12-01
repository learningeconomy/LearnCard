import { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

import { useWallet, useToast, ToastTypeEnum } from 'learn-card-base';

import { pushUtilities } from '../../utils/pushUtilities';

export const PushNotificationListener = () => {
    const { initWallet } = useWallet();
    const location = useLocation();
    const history = useHistory();

    const { presentToast } = useToast();

    const handleNotificationRegistrationError = (text: string) => {
        presentToast(text, {
            type: ToastTypeEnum.Success,
            hasDismissButton: true,
        });
    };

    useEffect(() => {
        pushUtilities.addBackgroundPushNotificationListeners(
            initWallet,
            history,
            true,
            handleNotificationRegistrationError
        );
    }, [history, location.pathname]);

    return null;
};
