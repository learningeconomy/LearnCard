import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

import { useWallet, useToast, ToastTypeEnum, useIsLoggedIn } from 'learn-card-base';

import { pushUtilities } from '../../utils/pushUtilities';

export const PushNotificationListener = () => {
    const { initWallet } = useWallet();
    const isLoggedIn = useIsLoggedIn();
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
            isLoggedIn,
            handleNotificationRegistrationError
        );
    }, [history, isLoggedIn]);

    return null;
};
