import React, { useRef } from 'react';

import { Capacitor } from '@capacitor/core';
import { useLocation, useNavigate } from 'react-router';

import { useModal, ModalTypes } from 'learn-card-base';

import NotificationsModal from './NotificationsModal';

/**
 * Opens the notifications ("Alerts") list.
 *
 * On desktop/web it presents in a right-loading modal (matching the "My
 * LearnCard" profile modal pattern — see `useOpenMyLearnCard`). On native
 * platforms it navigates to the full-page `/notifications` route instead:
 * the right modal sits under the status bar/notch on notched devices and had
 * other overlay quirks on native, and routing sidesteps both while giving
 * notification actions (e.g. claiming a boost) a real page to route from.
 *
 * The `/notifications` route is also the deep-link / push-notification target.
 */
export const useOpenNotifications = () => {
    const navigate = useNavigate();
    // A ref, so a handler captured before a navigation still reads the current path.
    const pathnameRef = useRef('');
    pathnameRef.current = useLocation().pathname;

    const { newModal: openNotificationsModal } = useModal({
        desktop: ModalTypes.Right,
        mobile: ModalTypes.Right,
    });

    return () => {
        if (Capacitor.isNativePlatform()) {
            // Guard against pushing a duplicate entry when already on the page.
            if (pathnameRef.current !== '/notifications') {
                navigate('/notifications');
            }
            return;
        }

        openNotificationsModal(<NotificationsModal />);
    };
};

export default useOpenNotifications;
