import React, { useEffect, useState } from 'react';
import { useToast, ToastTypeEnum } from 'learn-card-base';
import { useNetworkStatus } from './useNetworkStatus';
import * as m from '../../paraglide/messages.js';

export const NetworkListener = () => {
    const isConnected = useNetworkStatus();
    const { presentToast: present, dismissToast: dismiss } = useToast();

    useEffect(() => {
        if (!isConnected && isConnected !== undefined) {
            present(
                m['networkPrompts.toasts.lostConn'](),
                {
                    duration: 3000000,
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                }
            );
        } else if (isConnected) {
            dismiss();
        }
    }, [isConnected]);

    return <></>;
};

export default NetworkListener;
