import React, { useEffect } from 'react';
import { useToast, ToastTypeEnum, connectivityStore } from 'learn-card-base';
import { useNetworkStatus } from './useNetworkStatus';
import * as m from '../../paraglide/messages.js';

export const NetworkListener = () => {
    const isConnected = useNetworkStatus();
    const { presentToast: present, dismissToast: dismiss } = useToast();

    useEffect(() => {
        if (isConnected !== undefined) {
            connectivityStore.set.report(isConnected);
        }

        if (!isConnected && isConnected !== undefined) {
            present(m['networkPrompts.toasts.lostConn'](), {
                duration: 3000000,
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        } else if (isConnected) {
            dismiss();
        }
    }, [isConnected, present, dismiss]);

    return <></>;
};

export default NetworkListener;
