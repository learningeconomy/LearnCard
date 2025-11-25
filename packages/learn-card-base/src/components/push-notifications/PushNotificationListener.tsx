import { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

import { useIonToast } from '@ionic/react';
import { useWallet } from 'learn-card-base';

import { pushUtilities } from '../../utils/pushUtilities';

export const PushNotificationListener = () => {
    const { initWallet } = useWallet();
    const location = useLocation();
    const history = useHistory();

    const [presentToast] = useIonToast();

    const handleNotificationRegistrationError = (text: string) => {
        presentToast({
            message: text,
            duration: 3000,
            cssClass: 'toast-custom-class ion-toast-bottom-nav-offset',
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
